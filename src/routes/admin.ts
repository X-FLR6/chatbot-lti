import express from "express";
import jwt from "jsonwebtoken";

import lti from "../lti";
const router = express.Router();
const AUTH_HEADER = "authorization" as const;

router.use(async (req, res, next) => {
  const header = req.headers[AUTH_HEADER];
  if (header) {
    const [_, token] = header.match(/CustomBearer\s+(\S+)/) ?? [];
    if (token && jwt.verify(token, process.env.LTI_KEY as string)) {
      return next();
    }
  }
  res.sendStatus(401);
});

/**
 * Register platform
 */
router.post("/register_platform", async (req, res) => {
  try {
    const params = req.body;

    const config = {
      name: params.name,
      url: params.url,
      clientId: params.clientId,
      authenticationEndpoint: params.authRequestUrl,
      accesstokenEndpoint: params.accessTokenUrl,
      authConfig: {
        method: params.authConfigMethod ?? "JWK_SET",
        key: params.authConfigKey,
      },
    };

    const platform = await lti.registerPlatform(config);

    if (platform) return res.send(await platform.platformJSON());

    return res.sendStatus(500);
  } catch (err) {
    console.log((err as Error).message);
    return res.status(500).send((err as Error).message);
  }
});

/**
 * Unregister platform
 */
router.post("/unregister_platform", async (req, res) => {
  try {
    const platformIds = req.body as string[];
    const success = (
      await Promise.all(
        platformIds.map(async (platformId) => {
          const platform = await lti.getPlatformById(platformId);
          return platform !== false ? await platform.delete() : true;
        })
      )
    ).every((b) => b);

    if (success) return res.sendStatus(200);

    return res.sendStatus(500);
  } catch (err) {
    console.log((err as Error).message);
    return res.status(500).send((err as Error).message);
  }
});

export default router;
