import express from "express";
import jwt from "jsonwebtoken";
import { IdToken } from "ltijs";

import lti from "../lti";
import getRCache from "../utils";

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
      authenticationEndpoint: params.authUrl,
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

// Grading route
router.post("/grade", async (req, res) => {
  try {
    console.log(req.body);

    const { cacheId, score, maxScore } = req.body;

    const rCache = await getRCache();

    const _idToken = await rCache.read(cacheId);
    if (_idToken) {
      const idToken = JSON.parse(_idToken) as IdToken; // IdToken

      console.log(JSON.stringify(idToken, null, 2));

      // Creating Grade object
      const gradeObj = {
        userId: idToken.user,
        scoreGiven: score,
        scoreMaximum: maxScore,
        activityProgress: "Completed",
        gradingProgress: "FullyGraded",
      };

      // Selecting lineItem ID
      let lineItemId = idToken.platformContext.endpoint?.lineitem; // Attempting to retrieve it from idToken
      if (!lineItemId) {
        const response = await lti.Grade.getLineItems(idToken, {
          resourceLinkId: true,
        });
        const lineItems = response.lineItems;
        if (lineItems.length === 0) {
          // Creating line item if there is none
          console.log("Creating new line item");
          const newLineItem = {
            scoreMaximum: maxScore,
            label: "Grade",
            tag: "grade",
            resourceLinkId: idToken.platformContext.resource.id,
          };
          const lineItem = await lti.Grade.createLineItem(idToken, newLineItem);
          lineItemId = lineItem.id;
        } else lineItemId = lineItems[0].id;
      }

      // Sending Grade
      const responseGrade = await lti.Grade.submitScore(
        idToken,
        lineItemId,
        gradeObj
      );
      return res.send(responseGrade);
    }
  } catch (err) {
    console.log((err as Error).message);
    return res.status(500).send({ err: (err as Error).message });
  }
});

export default router;
