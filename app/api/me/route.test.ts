import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/me", () => {
  it("returns the fixture principal", async () => {
    const response = await GET(new NextRequest("http://localhost/api/me"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      clientId: "command-center",
      tenantId: "astra-demo",
    });
  });
});
