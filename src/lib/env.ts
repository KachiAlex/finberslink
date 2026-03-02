const requiredEnv = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET", 
  "JWT_REFRESH_SECRET"
] as const;

type RequiredEnvKey = (typeof requiredEnv)[number];

type EnvShape = Record<RequiredEnvKey, string> & {
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
  NEXT_PUBLIC_DEMO_STUDENT_ID?: string;
  OPENAI_API_KEY?: string;
  SENDGRID_API_KEY?: string;
};

function loadEnv(): EnvShape {
  const env: Partial<EnvShape> = {};

  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-server";

  for (const key of requiredEnv) {
    const value = process.env[key];
    if (!value) {
      if (isBuildTime || process.env.NODE_ENV !== "production") {
        env[key] = `placeholder_${key}`;
      } else {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    } else {
      env[key] = value;
    }
  }

  env.NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
  env.NEXT_PUBLIC_DEMO_STUDENT_ID = process.env.NEXT_PUBLIC_DEMO_STUDENT_ID;
  env.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  env.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

  return env as EnvShape;
}

export const env = loadEnv();
