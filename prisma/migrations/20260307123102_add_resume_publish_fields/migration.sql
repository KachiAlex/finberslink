-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "location" TEXT,
ADD COLUMN     "notableAchievements" TEXT,
ADD COLUMN     "personaName" TEXT,
ADD COLUMN     "targetIndustry" TEXT,
ADD COLUMN     "targetRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "topSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "yearsExperience" INTEGER;
