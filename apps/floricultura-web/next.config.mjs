/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@flordoestudante/ui',
    '@flordoestudante/core',
    '@flordoestudante/utils',
    '@flordoestudante/supabase',
    '@flordoestudante/payments',
    '@flordoestudante/notifications',
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
