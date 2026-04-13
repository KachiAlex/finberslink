const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Explicit paths for Vercel build
  experimental: {
    ...{},
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
    ],
  },
  reactStrictMode: true,
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
    optimizePackageImports: [
      '@mui/material',
      '@mui/icons-material',
      'lucide-react',
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  onDemandEntries: {
    maxInactiveAge: 1000,
    pagesBufferLength: 2,
  },
  webpack: (config, { isServer }) => {
    // Configure webpack to resolve @/ alias - ensure it matches tsconfig.json
    const srcPath = path.resolve(__dirname, 'src');
    
    // Force alias configuration - override existing completely
    config.resolve.alias = {
      '@': srcPath,
      '@/lib': path.join(srcPath, 'lib'),
      '@/components': path.join(srcPath, 'components'),
      '@/app': path.join(srcPath, 'app'),
      '@/features': path.join(srcPath, 'features'),
      '@/hooks': path.join(srcPath, 'hooks'),
      '@/types': path.join(srcPath, 'types'),
      '@/utils': path.join(srcPath, 'lib/utils'),
    };

    // Add explicit module resolution for Vercel
    config.resolve.modules = [
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];

    // Ensure proper extension resolution
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

    // Add custom resolver for Vercel
    config.resolve.plugins = [
      ...(config.resolve.plugins || []),
      {
        apply: (resolver) => {
          resolver.hooks.resolve.tapAsync('CustomAliasResolver', async (request) => {
            if (request.request.startsWith('@/')) {
              const newPath = request.request.replace('@/', '');
              const fullPath = path.join(srcPath, newPath);
              return { path: fullPath };
            }
            return resolver.hooks.resolve.callAsync(request);
          });
        },
      },
    ];

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
