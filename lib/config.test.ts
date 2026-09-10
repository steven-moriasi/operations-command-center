import { describe, expect, it } from "vitest";

import { loadConfig } from "./config";

describe("loadConfig", () => {
  it("uses fixture-safe defaults", () => {
    expect(loadConfig({})).toMatchObject({
      authMode: "fixture",
      dataMode: "fixture",
      fixtureTenantId: "astra-demo",
    });
  });

  it("requires a database URL in postgres mode", () => {
    expect(() =>
      loadConfig({ COMMAND_CENTER_DATA_MODE: "postgres" }),
    ).toThrow("COMMAND_CENTER_DATABASE_URL");
  });

  it("requires identity settings in OIDC mode", () => {
    expect(() =>
      loadConfig({ COMMAND_CENTER_AUTH_MODE: "oidc" }),
    ).toThrow("oidcAudience");
  });

  it("accepts complete OIDC settings", () => {
    expect(
      loadConfig({
        COMMAND_CENTER_AUTH_MODE: "oidc",
        COMMAND_CENTER_OIDC_AUDIENCE: "identity-gateway",
        COMMAND_CENTER_OIDC_CLIENT_ID: "command-center",
        COMMAND_CENTER_OIDC_ISSUER:
          "http://identity.test/realms/enterprise",
        COMMAND_CENTER_SESSION_SECRET: "a".repeat(32),
      }),
    ).toMatchObject({
      authMode: "oidc",
      oidcClientId: "command-center",
    });
  });
});
