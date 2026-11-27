import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventList } from "./event-list";
import type { EventRowData } from "./event-row";

function row(overrides: Partial<EventRowData> = {}): EventRowData {
  return {
    id: "e1",
    title: "M 6.8 - Hualien",
    simulated: false,
    time: "27 Nov 2026, 13:42 UTC",
    sourceName: "U.S. Geological Survey",
    categoryLabel: "Natural disasters",
    credit: "U.S. Geological Survey",
    severity: "high",
    ...overrides,
  };
}

describe("EventList", () => {
  it("shows title, time, source, category, credit and severity", () => {
    render(<EventList rows={[row()]} />);
    expect(screen.getByText("M 6.8 - Hualien")).toBeInTheDocument();
    expect(screen.getByText("27 Nov 2026, 13:42 UTC")).toBeInTheDocument();
    expect(screen.getAllByText("U.S. Geological Survey")).toHaveLength(2);
    expect(screen.getByText("Natural disasters")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.queryByText("Simulated")).not.toBeInTheDocument();
  });

  it("marks a simulated event and shows no credit", () => {
    render(
      <EventList
        rows={[
          row({
            simulated: true,
            sourceName: "Simulated",
            credit: null,
          }),
        ]}
      />,
    );
    expect(screen.getAllByText("Simulated")).toHaveLength(2);
    expect(screen.queryByText(/Source:|Powered by/)).not.toBeInTheDocument();
  });
});
