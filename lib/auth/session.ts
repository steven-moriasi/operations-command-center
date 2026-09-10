import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { z } from "zod";

import type { Principal } from "./types";

export const sessionCookieName = "command_center_session";

const principalSchema = z.object({
  clientId: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email().nullable(),
  roles: z.array(z.string()),
  scopes: z.array(z.string()),
  subject: z.string().min(1),
  tenantId: z.string().min(1),
});

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  principal: Principal,
  secret: string,
): Promise<string> {
  const payload: JWTPayload = {
    clientId: principal.clientId,
    displayName: principal.displayName,
    email: principal.email,
    roles: principal.roles,
    scopes: principal.scopes,
    subject: principal.subject,
    tenantId: principal.tenantId,
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer("operations-command-center")
    .setAudience("operations-command-center-session")
    .setExpirationTime("8h")
    .sign(secretKey(secret));
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<Principal> {
  const { payload } = await jwtVerify(token, secretKey(secret), {
    audience: "operations-command-center-session",
    issuer: "operations-command-center",
  });

  return principalSchema.parse(payload);
}
