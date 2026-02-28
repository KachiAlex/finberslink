const requiredEnv = ["JWT_SECRET"] as const;

type RequiredEnvKey = (typeof requiredEnv)[number];

type EnvShape = Record<RequiredEnvKey, string> & {
  NEXT_PUBLIC_DEMO_STUDENT_ID?: string;
};

function loadEnv(): EnvShape {
  const missing: string[] = [];
  const env: Partial<EnvShape> = {};

  for (const key of requiredEnv) {
    const value = process.env[key];
    if (!value) {
      missing.push(key);
    } else {
      env[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  env.NEXT_PUBLIC_DEMO_STUDENT_ID = process.env.NEXT_PUBLIC_DEMO_STUDENT_ID;

  return env as EnvShape;
}

export const env = loadEnv();
