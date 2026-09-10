import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AuthorizationError,
  requireAuthorization,
} from "../../../lib/auth/authorization";
import {
  AuthenticationError,
  getPrincipal,
} from "../../../lib/auth/principal";
import { loadConfig } from "../../../lib/config";
import { getOperationsRepository } from "../../../lib/repositories/factory";

export const runtime = "nodejs";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const principal = await getPrincipal(request, loadConfig());
    requireAuthorization(principal, {
      roles: ["auditor", "operations-admin", "operations-operator"],
      scope: "audit:read",
      tenantId: principal.tenantId,
    });
    const query = querySchema.parse({
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    return NextResponse.json(
      await getOperationsRepository().listAuditEvents(
        principal.tenantId,
        query.limit,
      ),
    );
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "invalid_query" }, { status: 400 });
    }
    throw error;
  }
}
