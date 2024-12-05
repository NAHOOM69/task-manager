// src/components/Navigation.tsx
'use client';

import { Briefcase, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b z-10 shadow-sm">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between h-14 items-center">
          {/* לוגו המערכת */}
          <Link
            href="/"
            className="flex items-center px-2 text-lg font-semibold text-gray-800 hover:text-gray-900"
          >
            מערכת ניהול משפטית
          </Link>

          {/* קישורים לניווט */}
          <div className="flex space-x-4 items-center">

          {/* קישור לכפתור גיבוי */}
          <Link
              href="/backup"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-500 hover:bg-gray-50"
            >
              <span>גיבוי ושחזור</span>
            </Link>


            {/* קישור לעמוד התיקים */}
            <Link
              href="/cases"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive('/cases')
                  ? 'bg-blue-100 text-blue-900 font-bold'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <Briefcase width={18} height={18} />
              <span>תיקים</span>
            </Link>

             

            {/* קישור לעמוד המשימות */}
            <Link
              href="/tasks"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive('/tasks')
                  ? 'bg-blue-100 text-blue-900 font-bold'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'
              }`}
            >
              <ListTodo width={18} height={18} />
              <span>משימות</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
