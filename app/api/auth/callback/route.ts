import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { exchangeAuthorizationCode } from "../../../../lib/auth/oidc";
import {
  createSessionToken,
  sessionCookieName,
} from "../../../../lib/auth/session";
import { loadConfig } from "../../../../lib/config";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const configuration = loadConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("command_center_oidc_state")?.value;
  const expectedNonce = request.cookies.get("command_center_oidc_nonce")?.value;
  const verifier = request.cookies.get("command_center_oidc_verifier")?.value;

  if (
    configuration.authMode !== "oidc" ||
    configuration.sessionSecret === undefined ||
    code === null ||
    state === null ||
    expectedState === undefined ||
    expectedNonce === undefined ||
    verifier === undefined ||
    state !== expectedState
  ) {
    return NextResponse.redirect(
      new URL("/?auth=invalid_callback", configuration.baseUrl),
    );
  }

  try {
    const principal = await exchangeAuthorizationCode({
      code,
      configuration,
      expectedNonce,
      verifier,
    });
    const response = NextResponse.redirect(
      new URL("/", configuration.baseUrl),
    );
    response.cookies.set(
      sessionCookieName,
      await createSessionToken(principal, configuration.sessionSecret),
      {
        httpOnly: true,
        maxAge: 8 * 60 * 60,
        path: "/",
        sameSite: "lax",
        secure: configuration.baseUrl.startsWith("https://"),
      },
    );
    response.cookies.delete("command_center_oidc_state");
    response.cookies.delete("command_center_oidc_nonce");
    response.cookies.delete("command_center_oidc_verifier");
    return response;
  } catch {
    return NextResponse.redirect(
      new URL("/?auth=failed", configuration.baseUrl),
    );
  }
}
