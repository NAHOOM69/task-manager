<meta name="theme-color" content="#3b82f6"/>
<meta name="background-color" content="#ffffff"/>
<meta name="description" content="Task Management Application"/>
<link rel="manifest" href="/manifest.json"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="default"/>
<meta name="apple-mobile-web-app-title" content="Task Manager"/>
<meta name="mobile-web-app-capable" content="yes"/>

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDW-osvniH7Q5qG-DnH69TJHE_kdzHDfjA",
  authDomain: "task-manager211124.firebaseapp.com",
  projectId: "task-manager211124",
  storageBucket: "task-manager211124.appspot.com",
  messagingSenderId: "1090043201443",
  appId: "1:1090043201443:web:478e66399f3dbcf0ab3c16"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'משימה חדשה';
  const notificationOptions = {
    body: payload.notification?.body || 'יש לך משימה לבצע',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.taskId,
    data: payload.data
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});