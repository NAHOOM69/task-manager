'use client';

import { useEffect } from 'react';
import TaskManager from '@/components/TaskManager';

export default function Home() {
  useEffect(() => {
    // רישום Service Worker רק בסביבת production
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('PWA - Service Worker registered successfully:', registration.scope);
          })
          .catch((error) => {
            console.log('PWA - Service Worker registration failed:', error);
          });
      });
    }
  }, []);

  // מאפשר לבקש הרשאות התראות
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted!');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  useEffect(() => {
    // בקשת הרשאות התראות בטעינה ראשונית
    requestNotificationPermission();
  }, []);

  // מוסיף prompt להתקנת האפליקציה
  useEffect(() => {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      // מונע את הופעת ההודעה האוטומטית
      e.preventDefault();
      // שומר את האירוע כדי להשתמש בו מאוחר יותר
      deferredPrompt = e;
    });

    // אם נרצה להוסיף כפתור התקנה מותאם אישית
    // const installApp = async () => {
    //   if (deferredPrompt) {
    //     deferredPrompt.prompt();
    //     const { outcome } = await deferredPrompt.userChoice;
    //     console.log(`User response to the install prompt: ${outcome}`);
    //     deferredPrompt = null;
    //   }
    // };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <TaskManager />
      </div>
    </main>
  );
}