'use client';

import { useEffect } from 'react';
import TaskManager from '@/components/TaskManager';
import { requestNotificationPermission } from '@/lib/firebase';

export default function Home() {
  useEffect(() => {
    // רישום ה-Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    // בקשת הרשאות להתראות
    const getPermission = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        console.log('FCM Token acquired:', token);
        // תוכל לשמור את הטוקן בשרת אם צריך
      }
    };

    getPermission();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <TaskManager />
      </div>
    </main>
  );
}
