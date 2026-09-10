import type { NextRequest } from "next/server";

import type { CommandCenterConfig } from "../config";
import { sessionCookieName, verifySessionToken } from "./session";
import type { Principal } from "./types";

export class AuthenticationError extends Error {}

export function getFixturePrincipal(tenantId: string): Principal {
  return {
    clientId: "command-center",
    displayName: "Platform operator",
    email: "operator@fixture.invalid",
    roles: ["operations-operator"],
    scopes: ["audit:read", "operations:write", "resources:read"],
    subject: "fixture-platform-operator",
    tenantId,
  };
}

export async function getPrincipal(
  request: NextRequest,
  configuration: CommandCenterConfig,
): Promise<Principal> {
  if (configuration.authMode === "fixture") {
    return getFixturePrincipal(configuration.fixtureTenantId);
  }

  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  if (
    sessionToken === undefined ||
    configuration.sessionSecret === undefined
  ) {
    throw new AuthenticationError("Authentication is required");
  }

  try {
    return await verifySessionToken(sessionToken, configuration.sessionSecret);
  } catch {
    throw new AuthenticationError("The session is invalid or expired");
  }
}
