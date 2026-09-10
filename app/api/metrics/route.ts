import { renderMetrics } from "../../../lib/observability/metrics";

export const runtime = "nodejs";

export function GET(): Response {
  return new Response(renderMetrics(), {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
