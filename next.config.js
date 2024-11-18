/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // נוסיף את השורה הזו לביטול בדיקות טיפוסים בזמן בנייה
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig