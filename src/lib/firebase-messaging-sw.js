// קובץ זה חייב להיות בתיקיית public
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC6tF1s_LZojVTH7R9F1eE8dINA3pDR1vU",
  authDomain: "taskmanager-new.firebaseapp.com",
  databaseURL: "https://taskmanager-new-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "taskmanager-new",
  storageBucket: "taskmanager-new.firebasestorage.app",
  messagingSenderId: "601027888354",
  appId: "1:601027888354:web:5f388a5257ac59a5be8abb"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

self.addEventListener('install', event => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) {
          clientList[0].focus();
        } else {
          clients.openWindow('/');
        }
      })
    );
  }
});

messaging.onBackgroundMessage(payload => {
  const { notification } = payload;
  if (!notification) return;

  const notificationOptions = {
    ...notification,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-144x144.png'
  };

  return self.registration.showNotification(notification.title, notificationOptions);
});