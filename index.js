require("dotenv").config();

const path = require("path");
const routes = require("./src/routes");

const lti = require("ltijs").Provider;
const Database = require("ltijs-sequelize");

const db = new Database(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
  }
);

// Setup
lti.setup(
  process.env.LTI_KEY,
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

// When receiving successful LTI launch redirects to app
lti.onConnect(async (token, req, res) => {
  const context = res.locals.context;
  const id = context.custom.id;
  const type = context.custom.type;
  const identifier = `lti_moodle_${context.user}`;
  return res.redirect(
    `${process.env.CONTENT_DOMAIN}/${type}s/${id}/${identifier}`
  );
});

// When receiving deep linking request redirects to deep screen
lti.onDeepLinking(async (token, req, res) => {
  return lti.redirect(res, process.env.DEEPLINK_URL, {
    newResource: true,
  });
});

// Setting up routes
lti.app.use(routes);

// Setup function
const setup = async () => {
  await lti.deploy({ port: process.env.PORT });

  /**
   * Register platform
   */
  await lti.registerPlatform({
    url: "https://humbleschool.moodlecloud.com",
    name: "HumbleSchool Moodle",
    clientId: "t8NTZY9X8xAsKzl",
    authenticationEndpoint:
      "https://humbleschool.moodlecloud.com/mod/lti/auth.php",
    accesstokenEndpoint:
      "https://humbleschool.moodlecloud.com/mod/lti/token.php",
    authConfig: {
      method: "JWK_SET",
      key: "https://humbleschool.moodlecloud.com/mod/lti/certs.php",
    },
  });
};

setup();
