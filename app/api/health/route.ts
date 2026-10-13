import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
      commit: process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || "unknown",
    },
    { status: 200 }
  );
}
