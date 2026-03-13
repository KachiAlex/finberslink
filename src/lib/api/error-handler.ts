import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class APIError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof APIError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation error",
        details: error.issues,
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      error: "Internal server error",
    },
    { status: 500 }
  );
}

export const ErrorMessages = {
  UNAUTHORIZED: "Unauthorized - please log in",
  FORBIDDEN: "Forbidden - you don't have permission to access this resource",
  NOT_FOUND: "Resource not found",
  INVALID_INPUT: "Invalid input provided",
  DUPLICATE_APPLICATION: "You have already applied for this job",
  JOB_NOT_FOUND: "Job not found",
  RESUME_NOT_FOUND: "Resume not found",
  APPLICATION_NOT_FOUND: "Application not found",
  INTERNAL_ERROR: "Internal server error",
};
