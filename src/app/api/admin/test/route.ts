import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ 
    message: "Admin test endpoint is working!",
    timestamp: new Date().toISOString(),
    deployedAt: new Date().toISOString()
  });
}
