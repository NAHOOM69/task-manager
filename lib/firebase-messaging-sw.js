importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.17.2/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyDW-osvniH7Q5qG-DnH69TJHE_kdzHDfjA",
  authDomain: "task-manager211124.firebaseapp.com",
  projectId: "task-manager211124",
  storageBucket: "task-manager211124.firebasestorage.app",
  messagingSenderId: "1090043201443",
  appId: "1:1090043201443:web:478e66399f3dbcf0ab3c16",
  measurementId: "G-8J9LQ6ZRGD"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
