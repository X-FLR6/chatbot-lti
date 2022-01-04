import express from "express";
import * as path from "path";

import adminRouter from "./admin";

const router = express.Router();

// Requiring Ltijs
import { Provider as lti } from "ltijs";

interface UserInfo {
  name?: string;
  email?: string;
  roles?: string[];
  context?: unknown;
}

// Grading route
router.post("/grade", async (req, res) => {
  try {
    const idToken = res.locals.token; // IdToken
    const score = req.body.grade; // User numeric score sent in the body
    // Creating Grade object
    const gradeObj = {
      userId: idToken.user,
      scoreGiven: score,
      scoreMaximum: 100,
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
    };

    // Selecting lineItem ID
    let lineItemId = idToken.platformContext.endpoint.lineitem; // Attempting to retrieve it from idToken
    if (!lineItemId) {
      const response = await lti.Grade.getLineItems(idToken, {
        resourceLinkId: true,
      });
      const lineItems = response.lineItems;
      if (lineItems.length === 0) {
        // Creating line item if there is none
        console.log("Creating new line item");
        const newLineItem = {
          scoreMaximum: 100,
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
  } catch (err) {
    console.log((err as Error).message);
    return res.status(500).send({ err: (err as Error).message });
  }
});

// Names and Roles route
router.get("/members", async (req, res) => {
  try {
    const result = await lti.NamesAndRoles.getMembers(res.locals.token);
    if (result) return res.send(result.members);
    return res.sendStatus(500);
  } catch (err) {
    console.log((err as Error).message);
    return res.status(500).send((err as Error).message);
  }
});

// Deep linking route
router.post("/deeplink", async (req, res) => {
  try {
    const resource = req.body;

    const items = {
      type: "ltiResourceLink",
      title: resource.name,
      custom: resource,
    };

    const form = await lti.DeepLinking.createDeepLinkingForm(
      res.locals.token,
      items,
      { message: "Successfully Registered" }
    );
    console.log(form);
    if (form) return res.send(form);
    return res.sendStatus(500);
  } catch (err) {
    console.log((err as Error).message);
    return res.status(500).send((err as Error).message);
  }
});

// Get user and context information
router.get("/info", async (req, res) => {
  const token = res.locals.token;
  const context = res.locals.context;

  const info: UserInfo = {};
  if (token.userInfo) {
    if (token.userInfo.name) info.name = token.userInfo.name;
    if (token.userInfo.email) info.email = token.userInfo.email;
  }

  if (context.roles) info.roles = context.roles;
  if (context.context) info.context = context.context;

  return res.send(info);
});

router.use("/admin", adminRouter);

// Wildcard route to deal with redirecting to React routes
router.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);

export default router;
