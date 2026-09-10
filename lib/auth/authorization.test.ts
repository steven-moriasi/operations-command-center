import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  requireAuthorization,
} from "./authorization";
import { getFixturePrincipal } from "./principal";

describe("requireAuthorization", () => {
  const requirement = {
    roles: ["operations-admin", "operations-operator"],
    scope: "operations:write",
    tenantId: "astra-demo",
  };

  it("allows a tenant-scoped operator with the required scope", () => {
    expect(() =>
      requireAuthorization(getFixturePrincipal("astra-demo"), requirement),
    ).not.toThrow();
  });

  it("rejects tenant, scope, and role boundary violations", () => {
    const principal = getFixturePrincipal("astra-demo");

    expect(() =>
      requireAuthorization(principal, {
        ...requirement,
        tenantId: "other-tenant",
      }),
    ).toThrow(AuthorizationError);
    expect(() =>
      requireAuthorization(
        { ...principal, scopes: [] },
        requirement,
      ),
    ).toThrow("Missing scope");
    expect(() =>
      requireAuthorization(
        { ...principal, roles: ["auditor"] },
        requirement,
      ),
    ).toThrow("operator role");
  });
});
