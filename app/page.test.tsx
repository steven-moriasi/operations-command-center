// @vitest-environment jsdom

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getFixtureDashboard } from "../lib/services/dashboard";
import OverviewPage from "./page";

const principal = {
  clientId: "command-center",
  displayName: "Platform Operator",
  email: "operator@example.test",
  roles: ["operations-operator"],
  scopes: ["operations:write", "resources:read"],
  subject: "fixture-platform-operator",
  tenantId: "astra-demo",
};

function response(body: object, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

describe("OverviewPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the accessible dashboard and applies a workflow action", async () => {
    const dashboard = getFixtureDashboard();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(dashboard))
      .mockResolvedValueOnce(response(principal))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(
        response({
          action: "retry",
          auditEventId: "audit-1",
          execution: {
            ...dashboard.executions[2],
            failureReason: null,
            status: "queued",
            version: 4,
          },
          replayed: false,
        }),
      );
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("crypto", { randomUUID: () => "idempotency-1" });

    render(<OverviewPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Automation operations, one clear view.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/local fixture data/i)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Operational metrics" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Audit trail" }),
    ).toBeInTheDocument();

    const executions = screen
      .getByRole("heading", { name: "Recent executions" })
      .closest("section");
    expect(executions).not.toBeNull();
    expect(
      within(executions as HTMLElement).getAllByRole("listitem"),
    ).toHaveLength(4);

    await userEvent.click(
      screen.getByRole("button", {
        name: "retry Supplier document intake",
      }),
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/executions/run-01J7YN/actions",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(await screen.findByText("Queued")).toBeInTheDocument();
    expect(await screen.findByText("execution.retry")).toBeInTheDocument();
  });

  it("offers Identity Gateway sign-in for unauthenticated operators", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ error: "authentication_required" }, 401),
        ),
    );

    render(<OverviewPage />);

    expect(
      await screen.findByRole("link", {
        name: "Sign in with Identity Gateway",
      }),
    ).toHaveAttribute("href", "/api/auth/login");
  });
});
