const config = {
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
} as const;

export default config;
