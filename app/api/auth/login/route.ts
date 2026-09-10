import { NextResponse } from "next/server";

import { createAuthorizationRequest } from "../../../../lib/auth/oidc";
import { loadConfig } from "../../../../lib/config";

export const runtime = "nodejs";

export function GET(): NextResponse {
  const configuration = loadConfig();
  if (configuration.authMode === "fixture") {
    return NextResponse.redirect(new URL("/?auth=fixture", configuration.baseUrl));
  }

  const authorization = createAuthorizationRequest(configuration);
  const response = NextResponse.redirect(authorization.url);
  const secure = configuration.baseUrl.startsWith("https://");
  const cookieOptions = {
    httpOnly: true,
    maxAge: 600,
    path: "/api/auth/callback",
    sameSite: "lax" as const,
    secure,
  };

  response.cookies.set("command_center_oidc_state", authorization.state, cookieOptions);
  response.cookies.set("command_center_oidc_nonce", authorization.nonce, cookieOptions);
  response.cookies.set(
    "command_center_oidc_verifier",
    authorization.verifier,
    cookieOptions,
  );

  return response;
}
