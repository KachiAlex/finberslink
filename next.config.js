const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/**': [
      './node_modules/.prisma/client/**',
      './node_modules/@prisma/client/**',
      './node_modules/prisma/libquery_engine*',
      './node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/**',
    ],
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  generateEtags: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  trailingSlash: false,
  experimental: {
    // Keep @prisma/client external so native binary loads from node_modules at runtime
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
    ],
  },
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  onDemandEntries: {
    maxInactiveAge: 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { isServer }) => {
    const srcPath = path.resolve(__dirname, 'src');
    
    // Ensure resolve object exists
    if (!config.resolve) {
      config.resolve = {};
    }
    
    // Set up alias mappings for @/ imports
    const aliases = {
      '@': srcPath,
      '@/components': path.join(srcPath, 'components'),
      '@/lib': path.join(srcPath, 'lib'),
      '@/features': path.join(srcPath, 'features'),
      '@/app': path.join(srcPath, 'app'),
      '@/services': path.join(srcPath, 'services'),
      '@/config': path.join(srcPath, 'config'),
      '@/hooks': path.join(srcPath, 'hooks'),
      '@/types': path.join(srcPath, 'types'),
      '@/utils': path.join(srcPath, 'utils'),
      '@/styles': path.join(srcPath, 'styles'),
    };
    
    config.resolve.alias = {
      ...config.resolve.alias,
      ...aliases,
    };

    // Ensure symlinks are resolved (important for Vercel)
    config.resolve.symlinks = true;

    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ],
    };
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
