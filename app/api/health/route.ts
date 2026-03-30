import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "TOEIC API server is running",
    timestamp: new Date().toISOString(),
  });
}
