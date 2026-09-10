import { createHash, randomBytes } from "node:crypto";

import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { z } from "zod";

import type { CommandCenterConfig } from "../config";
import type { Principal } from "./types";

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  id_token: z.string().min(1),
});

const identityClaimsSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  nonce: z.string().min(1),
  sub: z.string().min(1),
});

const accessClaimsSchema = z.object({
  azp: z.string().min(1),
  realm_access: z.object({ roles: z.array(z.string()) }),
  scope: z.string(),
  sub: z.string().min(1),
  tenant: z.string().min(1),
  typ: z.string(),
});

export interface AuthorizationRequest {
  nonce: string;
  state: string;
  url: URL;
  verifier: string;
}

function requiredOidcConfiguration(configuration: CommandCenterConfig) {
  if (
    configuration.oidcAudience === undefined ||
    configuration.oidcClientId === undefined ||
    configuration.oidcIssuer === undefined
  ) {
    throw new Error("OIDC configuration is incomplete");
  }

  return {
    audience: configuration.oidcAudience,
    clientId: configuration.oidcClientId,
    issuer: configuration.oidcIssuer.replace(/\/$/, ""),
  };
}

function base64Url(value: Buffer): string {
  return value.toString("base64url");
}

function callbackUrl(configuration: CommandCenterConfig): string {
  return new URL("/api/auth/callback", configuration.baseUrl).toString();
}

export function createAuthorizationRequest(
  configuration: CommandCenterConfig,
): AuthorizationRequest {
  const oidc = requiredOidcConfiguration(configuration);
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const nonce = base64Url(randomBytes(24));
  const state = base64Url(randomBytes(24));
  const url = new URL(`${oidc.issuer}/protocol/openid-connect/auth`);

  url.search = new URLSearchParams({
    client_id: oidc.clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    nonce,
    redirect_uri: callbackUrl(configuration),
    response_type: "code",
    scope: "openid profile email resources:read audit:read operations:write",
    state,
  }).toString();

  return { nonce, state, url, verifier };
}

async function verifiedPayload(
  token: string,
  issuer: string,
  audience: string,
): Promise<JWTPayload> {
  const jwks = createRemoteJWKSet(
    new URL(`${issuer}/protocol/openid-connect/certs`),
  );
  const { payload } = await jwtVerify(token, jwks, { audience, issuer });
  return payload;
}

export async function exchangeAuthorizationCode(input: {
  code: string;
  configuration: CommandCenterConfig;
  expectedNonce: string;
  verifier: string;
}): Promise<Principal> {
  const oidc = requiredOidcConfiguration(input.configuration);
  const tokenEndpoint = `${oidc.issuer}/protocol/openid-connect/token`;
  const response = await fetch(tokenEndpoint, {
    body: new URLSearchParams({
      client_id: oidc.clientId,
      code: input.code,
      code_verifier: input.verifier,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl(input.configuration),
    }),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`OIDC token exchange failed with status ${response.status}`);
  }

  const tokens = tokenResponseSchema.parse(await response.json());
  const [identityPayload, accessPayload] = await Promise.all([
    verifiedPayload(tokens.id_token, oidc.issuer, oidc.clientId),
    verifiedPayload(tokens.access_token, oidc.issuer, oidc.audience),
  ]);
  const identity = identityClaimsSchema.parse(identityPayload);
  const access = accessClaimsSchema.parse(accessPayload);

  if (identity.nonce !== input.expectedNonce) {
    throw new Error("OIDC nonce validation failed");
  }
  if (access.azp !== oidc.clientId || identity.sub !== access.sub) {
    throw new Error("OIDC client or subject validation failed");
  }

  if (access.typ !== "Bearer") {
    throw new Error("OIDC access token type must be Bearer");
  }

  return {
    clientId: access.azp,
    displayName: identity.name ?? identity.email ?? identity.sub,
    email: identity.email ?? null,
    roles: access.realm_access.roles,
    scopes: access.scope.split(" ").filter(Boolean),
    subject: identity.sub,
    tenantId: access.tenant,
  };
}
