// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging"; // הוספת Messaging
import { getDatabase } from "firebase/database"; // הוספת Database (אם צריך)

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDW-osvniH7Q5qG-DnH69TJHE_kdzHDfjA",
  authDomain: "task-manager211124.firebaseapp.com",
  projectId: "task-manager211124",
  storageBucket: "task-manager211124.firebasestorage.app",
  messagingSenderId: "1090043201443",
  appId: "1:1090043201443:web:478e66399f3dbcf0ab3c16",
  measurementId: "G-8J9LQ6ZRGD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Analytics (אם תרצה להשתמש בזה)
const messaging = getMessaging(app); // Cloud Messaging
const database = getDatabase(app); // Real-time Database

// פונקציה לבקשת הרשאות וקבלת טוקן של Firebase Cloud Messaging
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const token = await getMessaging().getToken({
      vapidKey: "BAi6iS6NtZopagHTG5wa0AQVDIcWxlM6ph28Y_PeRxP_rVqij3mNGqsdr3VAaApRvo3JZSNyjziBEaEt2uKrORs" // החלף ב-VAPID Key שקיבלת ב-Firebase Console
    });
    console.log("FCM Token:", token);
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

export { app, messaging, database, analytics };
