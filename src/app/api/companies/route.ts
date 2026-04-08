import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

const CompanyQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = CompanyQuerySchema.parse(Object.fromEntries(searchParams));

    const { search, page, limit } = filters;

    // TODO: Implement company listing once Company model is migrated to Firestore
    // For now, return empty list
    const companies: any[] = [];
    const total = 0;

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      message: "Company listing will be available after database migration",
    });
  } catch (error) {
    console.error("Get companies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
