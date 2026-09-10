import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import type { CommandCenterConfig } from "../config";
import { createSessionToken, sessionCookieName } from "./session";
import {
  AuthenticationError,
  getFixturePrincipal,
  getPrincipal,
} from "./principal";

const fixtureConfiguration: CommandCenterConfig = {
  authMode: "fixture",
  baseUrl: "http://localhost:3000",
  databaseMaxConnections: 10,
  dataMode: "fixture",
  fixtureTenantId: "astra-demo",
};

describe("getPrincipal", () => {
  it("provides a scoped fixture principal", async () => {
    const request = new NextRequest("http://localhost/api/dashboard");

    await expect(
      getPrincipal(request, fixtureConfiguration),
    ).resolves.toEqual(getFixturePrincipal("astra-demo"));
  });

  it("verifies the signed OIDC session", async () => {
    const principal = getFixturePrincipal("astra-demo");
    const sessionSecret = "a".repeat(32);
    const token = await createSessionToken(principal, sessionSecret);
    const request = new NextRequest("http://localhost/api/dashboard", {
      headers: { cookie: `${sessionCookieName}=${token}` },
    });

    await expect(
      getPrincipal(request, {
        ...fixtureConfiguration,
        authMode: "oidc",
        oidcAudience: "identity-gateway",
        oidcClientId: "command-center",
        oidcIssuer: "http://identity.test/realms/enterprise",
        sessionSecret,
      }),
    ).resolves.toEqual(principal);
  });

  it("rejects a missing or invalid OIDC session", async () => {
    const configuration: CommandCenterConfig = {
      ...fixtureConfiguration,
      authMode: "oidc",
      oidcAudience: "identity-gateway",
      oidcClientId: "command-center",
      oidcIssuer: "http://identity.test/realms/enterprise",
      sessionSecret: "a".repeat(32),
    };

    await expect(
      getPrincipal(
        new NextRequest("http://localhost/api/dashboard"),
        configuration,
      ),
    ).rejects.toBeInstanceOf(AuthenticationError);

    await expect(
      getPrincipal(
        new NextRequest("http://localhost/api/dashboard", {
          headers: { cookie: `${sessionCookieName}=invalid` },
        }),
        configuration,
      ),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });
});
