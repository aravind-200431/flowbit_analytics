/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@flowbit/api'],
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;

