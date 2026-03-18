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
};

export default nextConfig;
