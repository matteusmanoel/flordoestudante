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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
