export type FeatureFlagDefinition = {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
};

const blueprint: FeatureFlagDefinition[] = [
  {
    key: "aiCourseQa",
    label: "AI Course QA",
    description: "Use AI to run pre-flight checks on new syllabi before publish.",
    defaultEnabled: process.env.NEXT_PUBLIC_AI_COURSE_QA === "true",
  },
  {
    key: "jobAutoSync",
    label: "Job board auto-sync",
    description: "Mirror approved jobs to partner marketplaces automatically.",
    defaultEnabled: process.env.NEXT_PUBLIC_JOB_AUTO_SYNC === "true",
  },
  {
    key: "guardianMode",
    label: "Guardian monitoring",
    description: "Extra fraud detection for tutor payouts and employer invites.",
    defaultEnabled: process.env.NEXT_PUBLIC_GUARDIAN_MODE === "true",
  },
];

const overrides: Record<string, boolean> = {};

type FeatureFlagState = FeatureFlagDefinition & {
  enabled: boolean;
  source: "env" | "override";
};

export function listFeatureFlags(): FeatureFlagState[] {
  return blueprint.map((flag) => {
    const hasOverride = typeof overrides[flag.key] === "boolean";
    const enabled = hasOverride ? overrides[flag.key]! : flag.defaultEnabled;

    return {
      ...flag,
      enabled,
      source: hasOverride ? "override" : "env",
    };
  });
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  const exists = blueprint.some((flag) => flag.key === key);
  if (!exists) {
    throw new Error(`Unknown feature flag: ${key}`);
  }

  overrides[key] = enabled;
}
