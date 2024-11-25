importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging.js');

// הגדרות Firebase
firebase.initializeApp({
  apiKey: "AIzaSyAPB7BtGlY2-7m5TaIpoz4duC1Yv7IEGNU",
  authDomain: "task-manager181124.firebaseapp.com",
  databaseURL: "https://task-manager181124-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "task-manager181124",
  storageBucket: "task-manager181124.firebaseapp.com",
  messagingSenderId: "212734040741",
  appId: "1:212734040741:web:fc416a1ff480bb255d0b4c",
  measurementId: "G-ED32K3SGXQ"
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
