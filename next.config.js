/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // השבתת PWA במצב פיתוח
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!workbox-*.js', '!sw.js'], // וידוא שלא מוחקים קבצי SW
});

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // הפניה מדף הבית לנתיב /cases
  async redirects() {
    return [
      {
        source: '/',
        destination: '/cases',
        permanent: true, // הפניה קבועה
      },
    ];
  },

  // הגדרות כותרות HTTP עבור SW ומטמון
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/workbox-:hash.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },

  // פתרון לבעיות חבילות בקוד לקוח
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
