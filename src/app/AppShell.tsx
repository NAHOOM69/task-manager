'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    } else {
      setIsLoading(false);
    }

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
    if (window.confirm('גרסה חדשה זמינה. לרענן את הדף?')) {
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-gray-600 mr-4">טוען את האפליקציה...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 space-y-2 p-4">
        {!isOnline && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              אין חיבור לאינטרנט. חלק מהתכונות לא יעבדו.
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

      <main className="mt-16 pb-20 flex-grow">{children}</main>

      {installPrompt && (
        <Button
          onClick={handleInstallClick}
          className="fixed bottom-4 right-4 shadow-lg"
        >
          <Download className="ml-2 h-4 w-4" />
          התקן אפליקציה
        </Button>
      )}
    </div>
  );
}