import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

/**
 * POST /api/admin/run-migration
 * Run database migration to add missing enrollment fields
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Starting enrollment table migration...");
    
    // Check if totalStudyTime column exists
    const totalStudyTimeCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enrollment' 
      AND column_name = 'totalStudyTime'
    `;
    
    if (Array.isArray(totalStudyTimeCheck) && totalStudyTimeCheck.length === 0) {
      console.log("Adding totalStudyTime column...");
      await prisma.$executeRaw`ALTER TABLE "enrollment" ADD COLUMN "totalStudyTime" INTEGER DEFAULT 0`;
    }
    
    // Check if streakDays column exists
    const streakDaysCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enrollment' 
      AND column_name = 'streakDays'
    `;
    
    if (Array.isArray(streakDaysCheck) && streakDaysCheck.length === 0) {
      console.log("Adding streakDays column...");
      await prisma.$executeRaw`ALTER TABLE "enrollment" ADD COLUMN "streakDays" INTEGER DEFAULT 0`;
    }
    
    // Check if averageScore column exists
    const averageScoreCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enrollment' 
      AND column_name = 'averageScore'
    `;
    
    if (Array.isArray(averageScoreCheck) && averageScoreCheck.length === 0) {
      console.log("Adding averageScore column...");
      await prisma.$executeRaw`ALTER TABLE "enrollment" ADD COLUMN "averageScore" DOUBLE PRECISION`;
    }
    
    // Check if engagementScore column exists
    const engagementScoreCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enrollment' 
      AND column_name = 'engagementScore'
    `;
    
    if (Array.isArray(engagementScoreCheck) && engagementScoreCheck.length === 0) {
      console.log("Adding engagementScore column...");
      await prisma.$executeRaw`ALTER TABLE "enrollment" ADD COLUMN "engagementScore" DOUBLE PRECISION DEFAULT 0`;
    }
    
    // Check if lastStreakDate column exists
    const lastStreakDateCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enrollment' 
      AND column_name = 'lastStreakDate'
    `;
    
    if (Array.isArray(lastStreakDateCheck) && lastStreakDateCheck.length === 0) {
      console.log("Adding lastStreakDate column...");
      await prisma.$executeRaw`ALTER TABLE "enrollment" ADD COLUMN "lastStreakDate" TIMESTAMP(3)`;
    }
    
    // Check if progressPercentage column exists
    const progressPercentageCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enrollment' 
      AND column_name = 'progressPercentage'
    `;
    
    if (Array.isArray(progressPercentageCheck) && progressPercentageCheck.length === 0) {
      console.log("Adding progressPercentage column...");
      await prisma.$executeRaw`ALTER TABLE "enrollment" ADD COLUMN "progressPercentage" INTEGER DEFAULT 0`;
    }
    
    console.log("Enrollment table migration completed successfully!");
    
    return NextResponse.json({
      success: true,
      message: "Enrollment table migration completed successfully",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Migration failed",
        details: error
      },
      { status: 500 }
    );
  }
}
