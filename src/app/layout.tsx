'use client';

import { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import './globals.css';


//import AlertCircle from 'lucide-react/lib/icons/alert-circle';
//import Download from 'lucide-react/lib/icons/download';
//import Loader2 from 'lucide-react/lib/icons/loader-2';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => console.error('Service Worker registration failed:', error))
        .finally(() => setIsLoading(false));
    }

    // Event listeners for online/offline state
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      setInstallPrompt(null);
    } catch (error) {
      console.error('Installation error:', error);
    }
  };

  const handleUpdateClick = () => {
    if (window.confirm('קיימת גרסה חדשה. האם לרענן את העמוד?')) {
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-gray-600 mt-4">טוען את האפליקציה...</p>
      </div>
    );
  }

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="application-name" content="מנהל משימות משפטיות" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
      </head>
      <body className={`bg-gray-50 ${inter.className}`}>
        <div className="min-h-screen">
          <div className="fixed top-0 left-0 right-0 z-50 space-y-2 p-4">
            {!isOnline && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  אין חיבור לאינטרנט. חלק מהתכונות עלולות לא לעבוד כראוי.
                </AlertDescription>
              </Alert>
            )}

            {isUpdateAvailable && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="flex items-center justify-between">
                  <span>גרסה חדשה זמינה</span>
                  <Button variant="outline" size="sm" onClick={handleUpdateClick}>
                    עדכן עכשיו
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Navigation />

          <main className="mt-16 pb-20">
            {children}
          </main>

          {installPrompt && (
            <Button
              onClick={handleInstallClick}
              className="fixed bottom-4 right-4 shadow-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              התקן את האפליקציה
            </Button>
          )}
        </div>
      </body>
    </html>
  );
}
