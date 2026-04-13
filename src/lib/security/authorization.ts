/**
 * Authorization Middleware for Resume Features
 * Verifies user ownership before allowing access to sensitive operations
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Logger } from "@/lib/logger";

const logger = new Logger("AuthorizationMiddleware");

export class AuthorizationError extends Error {
  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Verify that the user owns the resume
 */
export async function verifyResumeOwnership(
  resumeId: string,
  userId: string
): Promise<boolean> {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { userId: true },
    });

    if (!resume) {
      logger.warn(`Resume not found: ${resumeId}`);
      return false;
    }

    const isOwner = resume.userId === userId;
    if (!isOwner) {
      logger.warn(
        `Unauthorized access attempt to resume ${resumeId} by user ${userId}`
      );
    }

    return isOwner;
  } catch (error) {
    logger.error("Error verifying resume ownership", error);
    throw new AuthorizationError("Failed to verify ownership");
  }
}

/**
 * Verify that the user can access analytics for a resume
 */
export async function verifyAnalyticsAccess(
  resumeId: string,
  userId: string
): Promise<boolean> {
  return verifyResumeOwnership(resumeId, userId);
}

/**
 * Verify that the user can publish a resume
 */
export async function verifyPublishAccess(
  resumeId: string,
  userId: string
): Promise<boolean> {
  return verifyResumeOwnership(resumeId, userId);
}

/**
 * Verify that the user can export a resume
 */
export async function verifyExportAccess(
  resumeId: string,
  userId: string
): Promise<boolean> {
  return verifyResumeOwnership(resumeId, userId);
}

/**
 * Middleware to verify resume ownership
 */
export function createOwnershipVerificationMiddleware(
  getResourceId: (request: NextRequest) => string | null
) {
  return async (
    request: NextRequest,
    userId: string
  ): Promise<NextResponse | null> => {
    const resourceId = getResourceId(request);

    if (!resourceId) {
      return NextResponse.json(
        { error: "Resource ID not found" },
        { status: 400 }
      );
    }

    try {
      const isOwner = await verifyResumeOwnership(resourceId, userId);

      if (!isOwner) {
        logger.warn(
          `Unauthorized access attempt: user ${userId} tried to access resource ${resourceId}`
        );
        return NextResponse.json(
          { error: "Forbidden: You do not have access to this resource" },
          { status: 403 }
        );
      }

      return null; // Allow request to proceed
    } catch (error) {
      logger.error("Error in ownership verification middleware", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/**
 * Extract user ID from request
 */
export function extractUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  // Extract from Bearer token or custom header
  const token = authHeader.replace("Bearer ", "");
  // In production, decode JWT and extract user ID
  // For now, return token as placeholder
  return token;
}

/**
 * Verify user has required role
 */
export async function verifyUserRole(
  userId: string,
  requiredRole: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return false;
    }

    return user.role === requiredRole;
  } catch (error) {
    logger.error("Error verifying user role", error);
    return false;
  }
}

/**
 * Verify user has admin access
 */
export async function verifyAdminAccess(userId: string): Promise<boolean> {
  return verifyUserRole(userId, "ADMIN");
}

/**
 * Verify user has superadmin access
 */
export async function verifySuperAdminAccess(userId: string): Promise<boolean> {
  return verifyUserRole(userId, "SUPER_ADMIN");
}
