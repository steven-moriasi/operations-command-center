import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  AuthorizationError,
  requireAuthorization,
} from "../../../../../lib/auth/authorization";
import {
  AuthenticationError,
  getPrincipal,
} from "../../../../../lib/auth/principal";
import { loadConfig } from "../../../../../lib/config";
import { logOperation } from "../../../../../lib/observability/logging";
import { recordExecutionAction } from "../../../../../lib/observability/metrics";
import {
  ExecutionNotFoundError,
  IdempotencyConflictError,
  InvalidTransitionError,
  VersionConflictError,
} from "../../../../../lib/repositories/errors";
import { getOperationsRepository } from "../../../../../lib/repositories/factory";

export const runtime = "nodejs";

const actionSchema = z.object({
  action: z.enum(["cancel", "retry"]),
  expectedVersion: z.number().int().positive(),
});

function errorResponse(
  error: unknown,
  correlationId: string,
): NextResponse {
  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { error: "authentication_required" },
      { headers: { "x-correlation-id": correlationId }, status: 401 },
    );
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { error: "forbidden" },
      { headers: { "x-correlation-id": correlationId }, status: 403 },
    );
  }
  if (error instanceof ExecutionNotFoundError) {
    return NextResponse.json(
      { error: "execution_not_found" },
      { headers: { "x-correlation-id": correlationId }, status: 404 },
    );
  }
  if (
    error instanceof IdempotencyConflictError ||
    error instanceof VersionConflictError ||
    error instanceof InvalidTransitionError
  ) {
    return NextResponse.json(
      { error: "conflict", message: error.message },
      { headers: { "x-correlation-id": correlationId }, status: 409 },
    );
  }
  if (error instanceof SyntaxError || error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "invalid_request" },
      { headers: { "x-correlation-id": correlationId }, status: 400 },
    );
  }
  throw error;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const suppliedCorrelationId = request.headers.get("x-correlation-id");
  const correlationId =
    suppliedCorrelationId !== null && suppliedCorrelationId.length <= 128
      ? suppliedCorrelationId
      : randomUUID();
  const idempotencyKey = request.headers.get("idempotency-key");

  try {
    if (
      idempotencyKey === null ||
      idempotencyKey.trim().length < 1 ||
      idempotencyKey.length > 128
    ) {
      throw new z.ZodError([]);
    }
    const configuration = loadConfig();
    const principal = await getPrincipal(request, configuration);
    requireAuthorization(principal, {
      roles: ["operations-admin", "operations-operator"],
      scope: "operations:write",
      tenantId: principal.tenantId,
    });
    const { id } = await context.params;
    const body = actionSchema.parse(await request.json());
    const result = await getOperationsRepository().actOnExecution({
      ...body,
      actorSubject: principal.subject,
      correlationId,
      executionId: id,
      idempotencyKey,
      tenantId: principal.tenantId,
    });
    logOperation("info", {
      action: body.action,
      correlationId,
      executionId: id,
      outcome: result.replayed ? "replayed" : "applied",
      subject: principal.subject,
      tenantId: principal.tenantId,
    });
    recordExecutionAction(
      body.action,
      result.replayed ? "replayed" : "applied",
    );
    return NextResponse.json(result, {
      headers: { "x-correlation-id": correlationId },
    });
  } catch (error) {
    recordExecutionAction("request", "rejected");
    logOperation("error", {
      correlationId,
      outcome: error instanceof Error ? error.name : "unknown_error",
    });
    return errorResponse(error, correlationId);
  }
}
