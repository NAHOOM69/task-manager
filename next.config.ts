/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true, // ודא שזוהי הגדרת ברירת המחדל אם אתה משתמש ב-App Router
  },
};

module.exports = nextConfig;
