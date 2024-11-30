'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // רישום Service Worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // טיפול בשגיאות גלובליות
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // כאן אפשר להוסיף לוגיקה נוספת לטיפול בשגיאות
    };

    // טיפול בדחיות של Promise
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    // טיפול באובדן חיבור
    const handleOffline = () => {
      console.log('Lost network connection');
      // אפשר להציג הודעה למשתמש שאין חיבור
    };

    // טיפול בחזרת חיבור
    const handleOnline = () => {
      console.log('Network connection restored');
      // טעינה מחדש רק אם המשתמש מאשר
      if (window.confirm('החיבור לאינטרנט חזר. האם לטעון את העמוד מחדש?')) {
        window.location.reload();
      }
    };

    // התקנת כל מאזיני האירועים
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // רישום Service Worker
    registerServiceWorker();

    // ניקוי בעת פירוק הקומפוננטה
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        
        {/* PWA meta tags */}
        <meta name="application-name" content="מנהל משימות משפטיות" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="משימות" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#3b82f6" />

        {/* PWA icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`bg-gray-50 ${inter.className}`}>
        <div className="min-h-screen">
          {children}
        </div>

        {/* נוסיף סקריפט לבדיקת התקנת PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // בדיקה אם האפליקציה כבר מותקנת
              if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('Application is running in standalone mode');
              }

              // בדיקת תמיכה ב-beforeinstallprompt
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                // שמירת האירוע לשימוש מאוחר יותר
                window.deferredPrompt = e;
                console.log('Ready to install PWA');
              });

              // אירוע לאחר התקנה
              window.addEventListener('appinstalled', () => {
                window.deferredPrompt = null;
                console.log('PWA was installed');
              });
            `
          }}
        />
      </body>
    </html>
  );
}