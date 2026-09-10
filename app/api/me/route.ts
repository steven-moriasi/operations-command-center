import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  AuthenticationError,
  getPrincipal,
} from "../../../lib/auth/principal";
import { loadConfig } from "../../../lib/config";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json(await getPrincipal(request, loadConfig()));
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "authentication_required" },
        { status: 401 },
      );
    }
    throw error;
  }
}
