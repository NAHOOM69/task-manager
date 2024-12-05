importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging.js');

// הגדרות Firebase
firebase.initializeApp({
  apiKey: "AIzaSyB2SJKGRQCkbW81Lz0tYs0UKZM513FBKCA",
  authDomain: "task-casemanager-8f46a.firebaseapp.com",
  databaseURL: "https://casemanager-8f46a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "casemanager-8f46a",
  storageBucket: "casemanager-8f46a.firebasestorage.app",
  messagingSenderId: "815557692421",
  appId: "1:815557692421:web:85c9b8cd6f3623e43e206c",
  measurementId: "G-1G4FYK8M86"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // הצגת התראה מותאמת אישית
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
