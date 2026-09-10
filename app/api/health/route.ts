import { NextResponse } from "next/server";

export function GET(): NextResponse {
  return NextResponse.json({
    service: "operations-command-center",
    status: "healthy",
  });
}
