import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jwtVerify = vi.hoisted(() => vi.fn());

vi.mock("jose", async () => {
  const actual = await vi.importActual<typeof import("jose")>("jose");
  return {
    ...actual,
    createRemoteJWKSet: vi.fn(() => vi.fn()),
    jwtVerify,
  };
});

import type { CommandCenterConfig } from "../config";
import {
  createAuthorizationRequest,
  exchangeAuthorizationCode,
} from "./oidc";

const configuration: CommandCenterConfig = {
  authMode: "oidc",
  baseUrl: "http://localhost:3000",
  databaseMaxConnections: 10,
  dataMode: "fixture",
  fixtureTenantId: "astra-demo",
  oidcAudience: "identity-gateway",
  oidcClientId: "command-center",
  oidcIssuer: "http://identity.test/realms/enterprise/",
  sessionSecret: "a".repeat(32),
};

describe("createAuthorizationRequest", () => {
  it("creates a Keycloak authorization request with PKCE", () => {
    const authorization = createAuthorizationRequest(configuration);

    expect(authorization.url.origin).toBe("http://identity.test");
    expect(authorization.url.pathname).toBe(
      "/realms/enterprise/protocol/openid-connect/auth",
    );
    expect(authorization.url.searchParams.get("client_id")).toBe(
      "command-center",
    );
    expect(authorization.url.searchParams.get("code_challenge_method")).toBe(
      "S256",
    );
    expect(authorization.url.searchParams.get("state")).toBe(
      authorization.state,
    );
    expect(authorization.verifier.length).toBeGreaterThan(32);
  });

  it("rejects incomplete OIDC configuration", () => {
    expect(() =>
      createAuthorizationRequest({
        ...configuration,
        oidcAudience: undefined,
      }),
    ).toThrow("OIDC configuration is incomplete");
  });
});

describe("exchangeAuthorizationCode", () => {
  beforeEach(() => {
    jwtVerify.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              access_token: "access-token",
              id_token: "identity-token",
            }),
            {
              headers: { "content-type": "application/json" },
              status: 200,
            },
          ),
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds a principal from verified identity and access tokens", async () => {
    jwtVerify
      .mockResolvedValueOnce({
        payload: {
          email: "operator@example.test",
          name: "Platform operator",
          nonce: "expected-nonce",
          sub: "operator-1",
        },
      })
      .mockResolvedValueOnce({
        payload: {
          azp: "command-center",
          realm_access: { roles: ["operations-operator"] },
          scope: "resources:read operations:write",
          sub: "operator-1",
          tenant: "astra-demo",
          typ: "Bearer",
        },
      });

    await expect(
      exchangeAuthorizationCode({
        code: "authorization-code",
        configuration,
        expectedNonce: "expected-nonce",
        verifier: "pkce-verifier",
      }),
    ).resolves.toEqual({
      clientId: "command-center",
      displayName: "Platform operator",
      email: "operator@example.test",
      roles: ["operations-operator"],
      scopes: ["resources:read", "operations:write"],
      subject: "operator-1",
      tenantId: "astra-demo",
    });
  });

  it("rejects failed token exchanges", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    await expect(
      exchangeAuthorizationCode({
        code: "rejected-code",
        configuration,
        expectedNonce: "expected-nonce",
        verifier: "pkce-verifier",
      }),
    ).rejects.toThrow("status 401");
  });

  it("rejects nonce, client, subject, and token-type violations", async () => {
    const identity = {
      email: undefined,
      name: undefined,
      nonce: "wrong-nonce",
      sub: "operator-1",
    };
    const access = {
      azp: "command-center",
      realm_access: { roles: [] },
      scope: "",
      sub: "operator-1",
      tenant: "astra-demo",
      typ: "Bearer",
    };
    jwtVerify
      .mockResolvedValueOnce({ payload: identity })
      .mockResolvedValueOnce({ payload: access });

    await expect(
      exchangeAuthorizationCode({
        code: "authorization-code",
        configuration,
        expectedNonce: "expected-nonce",
        verifier: "pkce-verifier",
      }),
    ).rejects.toThrow("nonce");

    jwtVerify
      .mockResolvedValueOnce({
        payload: { ...identity, nonce: "expected-nonce" },
      })
      .mockResolvedValueOnce({
        payload: { ...access, azp: "other-client" },
      });
    await expect(
      exchangeAuthorizationCode({
        code: "authorization-code",
        configuration,
        expectedNonce: "expected-nonce",
        verifier: "pkce-verifier",
      }),
    ).rejects.toThrow("client or subject");

    jwtVerify
      .mockResolvedValueOnce({
        payload: { ...identity, nonce: "expected-nonce" },
      })
      .mockResolvedValueOnce({
        payload: { ...access, typ: "JWT" },
      });
    await expect(
      exchangeAuthorizationCode({
        code: "authorization-code",
        configuration,
        expectedNonce: "expected-nonce",
        verifier: "pkce-verifier",
      }),
    ).rejects.toThrow("must be Bearer");
  });
});
