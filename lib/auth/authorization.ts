import type { Principal } from "./types";

export class AuthorizationError extends Error {}

export function requireAuthorization(
  principal: Principal,
  requirement: {
    roles: string[];
    scope: string;
    tenantId: string;
  },
): void {
  if (principal.tenantId !== requirement.tenantId) {
    throw new AuthorizationError("Cross-tenant access is not allowed");
  }

  if (!principal.scopes.includes(requirement.scope)) {
    throw new AuthorizationError(`Missing scope: ${requirement.scope}`);
  }

  if (!requirement.roles.some((role) => principal.roles.includes(role))) {
    throw new AuthorizationError("The operator role is not authorized");
  }
}
