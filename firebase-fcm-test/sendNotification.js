// טוען את Firebase Admin SDK
const admin = require("firebase-admin");

// טוען את המפתח שהורדת
const serviceAccount = require("./path/to/your-service-account-file.json"); // עדכן את הנתיב למפתח

// אתחול Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// הודעה לדוגמה לשליחה
const message = {
  notification: {
    title: "Hello from Firebase!",
    body: "This is a test notification from Node.js",
  },
  token: "YOUR_DEVICE_FCM_TOKEN", // טוקן המכשיר שהתקבל מהאפליקציה שלך
};

// שליחת ההודעה
admin
  .messaging()
  .send(message)
  .then((response) => {
    console.log("Successfully sent message:", response);
  })
  .catch((error) => {
    console.error("Error sending message:", error);
  });
