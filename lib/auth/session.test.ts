import { describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "./session";
import type { Principal } from "./types";

const principal: Principal = {
  clientId: "command-center",
  displayName: "Platform operator",
  email: "operator@example.test",
  roles: ["operations-operator"],
  scopes: ["resources:read", "operations:write"],
  subject: "operator-1",
  tenantId: "astra-demo",
};

describe("session tokens", () => {
  it("round-trips a principal through a signed token", async () => {
    const token = await createSessionToken(principal, "a".repeat(32));

    await expect(
      verifySessionToken(token, "a".repeat(32)),
    ).resolves.toEqual(principal);
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await createSessionToken(principal, "a".repeat(32));

    await expect(
      verifySessionToken(token, "b".repeat(32)),
    ).rejects.toThrow();
  });
});
