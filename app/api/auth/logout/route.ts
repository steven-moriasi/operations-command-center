import { NextResponse } from "next/server";

import { sessionCookieName } from "../../../../lib/auth/session";
import { loadConfig } from "../../../../lib/config";

export function POST(): NextResponse {
  const configuration = loadConfig();
  const response = NextResponse.redirect(
    new URL("/", configuration.baseUrl),
    { status: 303 },
  );
  response.cookies.delete(sessionCookieName);
  return response;
}
