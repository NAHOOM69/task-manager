'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// טעינה דינמית של רכיב CaseManager
const CaseManager = dynamic(() => import('@/components/CaseManager'), {
  ssr: false, // ביטול Server Side Rendering עבור רכיב זה
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      <p className="text-gray-500 text-lg font-medium">טוען תיקים...</p>
    </div>
  ),
});

// עמוד ניהול תיקים
export default function CasesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* כותרת העמוד */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ניהול תיקים</h1>
      
      {/* רכיב ניהול תיקים */}
      <CaseManager />
    </div>
  );
}
