import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ 
    message: "Duplicate detection fix is deployed!",
    timestamp: new Date().toISOString(),
    version: "2.0"
  });
}
