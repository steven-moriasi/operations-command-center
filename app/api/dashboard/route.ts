import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  AuthenticationError,
  getPrincipal,
} from "../../../lib/auth/principal";
import {
  AuthorizationError,
  requireAuthorization,
} from "../../../lib/auth/authorization";
import { loadConfig } from "../../../lib/config";
import { getOperationsRepository } from "../../../lib/repositories/factory";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const configuration = loadConfig();
  try {
    const principal = await getPrincipal(request, configuration);
    requireAuthorization(principal, {
      roles: ["auditor", "operations-admin", "operations-operator"],
      scope: "resources:read",
      tenantId: principal.tenantId,
    });
    const dashboard = await getOperationsRepository().getDashboard(
      principal.tenantId,
    );

    return NextResponse.json(dashboard);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: "authentication_required" },
        { status: 401 },
      );
    }
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    throw error;
  }
}
