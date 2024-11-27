export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta name="theme-color" content="#3b82f6"/>
        <meta name="background-color" content="#ffffff"/>
        <meta name="description" content="Task Management Application"/>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="apple-mobile-web-app-title" content="Task Manager"/>
        <meta name="mobile-web-app-capable" content="yes"/>
      </head>
      <body>{children}</body>
    </html>
  )
}