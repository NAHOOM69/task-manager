'use client';

import { useEffect } from 'react';
import TaskManager from '@/components/TaskManager';
import { requestNotificationPermission } from '@/lib/firebase';

export default function Home() {
  useEffect(() => {
    const initNotifications = async () => {
      if (typeof window !== 'undefined') {
        try {
          const token = await requestNotificationPermission();
          if (token) {
            console.log("Notification token received:", token);
          } else {
            console.error("Failed to get notification token.");
          }
        } catch (error) {
          console.error("Error initializing notifications:", error);
        }
      }
    };

    initNotifications();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">מנהל משימות</h1>
        <TaskManager />
      </div>
    </main>
  );
}
