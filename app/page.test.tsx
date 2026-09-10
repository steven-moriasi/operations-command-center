import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OverviewPage from "./page";

describe("OverviewPage", () => {
  it("labels fixture data and exposes the dashboard structure", () => {
    render(<OverviewPage />);

    expect(
      screen.getByRole("heading", {
        name: "Automation operations, one clear view.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/local fixture data/i)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Operational metrics" }),
    ).toBeInTheDocument();

    const executions = screen.getByRole("heading", {
      name: "Recent executions",
    }).closest("section");
    expect(executions).not.toBeNull();
    expect(
      within(executions as HTMLElement).getAllByRole("listitem"),
    ).toHaveLength(4);
  });
});
