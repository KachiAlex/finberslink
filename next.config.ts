/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    turbopack: false,
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
