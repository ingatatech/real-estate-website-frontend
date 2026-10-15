/** @type {import('next').NextConfig} */
const path = require('path');
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

const nextConfig = (phase) => ({
  reactStrictMode: true,
  distDir:
    phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
  },
});

module.exports = nextConfig;
