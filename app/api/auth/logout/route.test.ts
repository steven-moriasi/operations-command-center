import { describe, expect, it } from "vitest";

import { sessionCookieName } from "../../../../lib/auth/session";
import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  it("clears the local session", () => {
    const response = POST();

    expect(response.status).toBe(303);
    expect(response.cookies.get(sessionCookieName)?.value).toBe("");
  });
});
