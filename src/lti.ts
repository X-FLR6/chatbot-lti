import { Provider as lti } from "ltijs";
import Database from "ltijs-sequelize";
import * as path from "path";
import superagent from "superagent";

import routes from "./routes";
import getRCache from "./utils";

console.log({
  DATABASE_URL: process.env.DATABASE_URL,
  B: process.env.DATABASE_URL == null,
});

const db =
  process.env.DATABASE_URL == null
    ? new Database(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASS,
        {
          host: process.env.DB_HOST,
          dialect: "postgres",
          logging: false,
        }
      )
    : new Database(process.env.DATABASE_URL, {
        dialect: "postgres",
        dialectOptions: {
          // `ssl` access needed for Heroku paid DB plan.
          ssl: {
            // Without this line, connection seems to fail.
            // See https://github.com/sequelize/sequelize/issues/12083.
            rejectUnauthorized: false,
          },
        },
      });

const integrationDataUpdateURL =
  `${process.env.SERVER_DOMAIN}/integrations/lti/data` as const;

// Setup
lti.setup(
  process.env.LTI_KEY as string,
  {
    plugin: db, // Passing db object to plugin field
  },
  {
    staticPath: path.join(__dirname, "./public"), // Path to static files
    cookies: {
      secure: true, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: "None", // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: false, // Set DevMode to true if the testing platform is in a different domain and https is not being used
  }
);

lti.whitelist(new RegExp(/^\/admin/));

// When receiving successful LTI launch redirects to app
lti.onConnect(async (token, req, res, next) => {
  if (req.originalUrl.startsWith("admin")) return next();

  const rCache = await getRCache();

  const context = res.locals.context;
  const id = context.custom.id;
  const type = context.custom.type;
  const identifier = `lti_moodle_${context.user}`;

  console.log({ token: res.locals.token });

  const cacheId = await rCache.cache(JSON.stringify(res.locals.token));

  const serverPayload = {
    recordId: id,
    recordType: type == "chat" ? "flow" : "flowSequence",
    identifier: identifier,
    cacheId,
  };

  try {
    await superagent
      .post(integrationDataUpdateURL)
      .set("Accept", "application/json")
      .send(serverPayload);
  } catch {
    // fail silently
    console.log("Could not send cacheId to server.");
  }
  return res.redirect(
    `${process.env.CONTENT_DOMAIN}/${type}s/${id}/${identifier}`
  );
});

// When receiving deep linking request redirects to deep screen
lti.onDeepLinking(async (token, req, res) => {
  return lti.redirect(res, process.env.DEEPLINK_URL as string, {
    newResource: true,
  });
});

// Setting up routes
lti.app.use(routes);

export default lti;
