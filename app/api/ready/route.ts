import { NextResponse } from "next/server";

import { getOperationsRepository } from "../../../lib/repositories/factory";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try {
    await getOperationsRepository().ready();
    return NextResponse.json({ status: "ready" });
  } catch {
    return NextResponse.json({ status: "not_ready" }, { status: 503 });
  }
}
