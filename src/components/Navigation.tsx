'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, ListTodo, Home } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  // מערך של כל הקישורים בניווט
  const navigationLinks = [
    {
      href: '/',
      label: 'דף הבית',
      icon: Home,
      mobileShow: false
    },
    {
      href: '/tasks',
      label: 'משימות',
      icon: ListTodo,
      mobileShow: true
    },
    {
      href: '/cases',
      label: 'תיקים',
      icon: Briefcase,
      mobileShow: true
    }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo/Home link */}
            <Link href="/" className="text-xl font-bold text-gray-800">
              ניהול משפטי
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4 space-x-reverse">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <link.icon className="h-5 w-5 ml-2" />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="grid grid-cols-2 gap-1">
          {navigationLinks
            .filter(link => link.mobileShow)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center py-3 ${
                  pathname === link.href
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <link.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{link.label}</span>
              </Link>
            ))}
        </div>
      </nav>
    </>
  );
}