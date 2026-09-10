import { NextResponse } from "next/server";

import { loadConfig } from "../../../lib/config";
import { getOperationsRepository } from "../../../lib/repositories/factory";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const configuration = loadConfig();
  const dashboard = await getOperationsRepository().getDashboard(
    configuration.fixtureTenantId,
  );

  return NextResponse.json(dashboard);
}
