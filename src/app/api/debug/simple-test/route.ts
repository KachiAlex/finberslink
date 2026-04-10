import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/debug/simple-test
 * Simple test without any dependencies
 */
export const GET = async (request: NextRequest) => {
  try {
    console.log("=== SIMPLE TEST ===");
    
    // Test database connection
    let dbConnected = false;
    let courseCount = 0;
    let userCount = 0;
    
    try {
      const count = await prisma.course.count();
      courseCount = count;
      dbConnected = true;
      
      const users = await prisma.user.count();
      userCount = users;
    } catch (dbError) {
      console.error("Database error:", dbError);
    }
    
    return NextResponse.json({
      success: true,
      message: "Simple test completed",
      data: {
        timestamp: new Date().toISOString(),
        database: {
          connected: dbConnected,
          coursesCount: courseCount,
          usersCount: userCount,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
        },
        debug: {
          message: "Basic connectivity test",
        }
      }
    });
  } catch (error) {
    console.error("Simple test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Simple test failed",
        message: error.message,
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
};
