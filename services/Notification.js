const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const serviceAccount = require("../voyago-21981-firebase-adminsdk-l8yyy-57e787793b.json");

let appInitialized = false;

module.exports.notify = async (
  receivedtoken,
  title,
  body,
  res,
  next,
  w = false
) => {
  if (!appInitialized) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: "voyago-21981", // Ensure this matches your actual project ID
    });
    appInitialized = true;
  }

  const receivedToken = receivedtoken;

  if (!receivedToken) {
    return res.status(400).json({ error: "FCM token is required" });
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: receivedToken,
  };

  try {
    const response = await getMessaging().send(message);
    if (!w)
      res.status(200).json({
        message: "Successfully sent message",
        token: receivedToken,
      });
    console.log("Successfully sent message:", response);
  } catch (error) {
    if (!w)
      res.status(400).json({ error: "Error sending message", details: error });
    console.log("Error sending message:", error);
  }
};
