import { prisma } from "@/lib/prisma";

type UpsertProfileInput = {
  userId: string;
  headline?: string;
  bio?: string;
  location?: string;
  phone?: string;
  address?: string;
  certifications?: string[];
  education?: any;
};

function normalizeOptionalText(value?: string, maxLength = 500) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

// Fixed: Removed phone and address fields to match database schema
export async function getStudentProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
    select: {
      headline: true,
      bio: true,
      location: true,
      certifications: true,
      education: true,
      skills: true,
      interests: true,
      updatedAt: true,
    },
  });
}

export async function upsertStudentProfile(input: UpsertProfileInput) {
  const headline = normalizeOptionalText(input.headline, 140);
  const bio = normalizeOptionalText(input.bio, 2000);
  const location = normalizeOptionalText(input.location, 140);
  const certifications = Array.isArray(input.certifications) ? input.certifications : undefined;
  const education = input.education !== undefined ? input.education : undefined;

  return prisma.profile.upsert({
    where: { userId: input.userId },
    update: {
      headline,
      bio,
      location,
      certifications,
      education,
    },
    create: {
      userId: input.userId,
      headline,
      bio,
      location,
      certifications,
      education,
    },
    select: {
      headline: true,
      bio: true,
      location: true,
      certifications: true,
      education: true,
      skills: true,
      interests: true,
      updatedAt: true,
    },
  });
}
