import { Inter } from 'next/font/google'
import { Metadata, Viewport } from 'next'
import Navigation from '@/components/Navigation'
import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Case Manager',
  description: 'מערכת לניהול תיקים ומשימות',
  manifest: '/manifest.json',
  icons: {
    apple: '/icons/icon-192x192.png',
  },
  themeColor: '#3b82f6'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={inter.className}>
        <Navigation /> {/* הוספת רכיב הניווט */}
        <main className="pt-16 pb-16"> {/* מרווחים לניווט העליון והתחתון */}
          {children}
        </main>
      </body>
    </html>
  )
}