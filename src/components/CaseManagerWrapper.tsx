'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// טעינה דינמית של CaseManager
const CaseManager = dynamic(() => import('@/components/CaseManager'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      <p className="text-gray-500 text-lg font-medium">טוען תיקים...</p>
    </div>
  ),
});

export default function CaseManagerWrapper() {
  return <CaseManager />;
}
