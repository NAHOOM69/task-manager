// src/components/Navigation.tsx
'use client';

import { Briefcase, ListTodo } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b z-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between h-14">
          <div className="flex">
            <Link
              href="/"
              className="flex items-center px-2 text-lg font-semibold"
            >
              מערכת ניהול משפטית
            </Link>
          </div>

          <div className="flex space-x-4 items-center">
            <Link
              href="/cases"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                isActive('/cases')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Briefcase width={18} height={18} />
              <span>תיקים</span>
            </Link>
            <Link
              href="/tasks"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                isActive('/tasks')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50'
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
