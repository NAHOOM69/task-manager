'use client';

import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // רישום Service Worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('Service Worker registered successfully:', registration);
          
          // בדיקת עדכונים לService Worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (window.confirm('גרסה חדשה זמינה! האם לרענן את העמוד?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // טיפול בהתקנת PWA
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowInstallPrompt(true);
      console.log('Ready to install PWA');
    };

    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    // טיפול בשגיאות גלובליות
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      // TODO: הוסף הצגת הודעת שגיאה למשתמש
    };

    // טיפול בדחיות של Promise
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    // טיפול באובדן חיבור
    const handleOffline = () => {
      console.log('Lost network connection');
      // TODO: הצג הודעת Offline למשתמש
    };

    // טיפול בחזרת חיבור
    const handleOnline = () => {
      console.log('Network connection restored');
      if (window.confirm('החיבור לאינטרנט חזר. האם לטעון את העמוד מחדש?')) {
        window.location.reload();
      }
    };

    // התקנת כל מאזיני האירועים
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    window.addEventListener('appinstalled', handleAppInstalled);

    // רישום Service Worker והפעלת בדיקות PWA
    registerServiceWorker();
    checkPWAStatus();

    // ניקוי בעת פירוק הקומפוננטה
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // בדיקת סטטוס PWA
  const checkPWAStatus = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Application is running in standalone mode');
    }
  };

  // פונקציה להתקנת PWA
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await (deferredPrompt as any).prompt();
      const choiceResult = await (deferredPrompt as any).userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

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
        <meta name="description" content="מערכת לניהול משימות משפטיות" />
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

        {/* כפתור התקנת PWA */}
        {showInstallPrompt && (
          <div className="fixed bottom-4 right-4 z-50">
            <button
              onClick={handleInstallClick}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
            >
              <span>התקן את האפליקציה</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </body>
    </html>
  );
}