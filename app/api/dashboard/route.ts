import { NextResponse } from "next/server";

import { getFixtureDashboard } from "../../../lib/services/dashboard";

export function GET(): NextResponse {
  return NextResponse.json(getFixtureDashboard());
}
