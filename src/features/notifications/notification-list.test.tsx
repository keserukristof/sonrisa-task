import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationList } from "./notification-list";
import type { NotificationRowData } from "./notification-row";

function row(
  overrides: Partial<NotificationRowData> = {},
): NotificationRowData {
  return {
    id: "n1",
    title: "M 6.8 - Hualien",
    simulated: false,
    eventTime: "27 Nov 2026, 13:42 UTC",
    alertName: "Quakes",
    destinationName: "Account email",
    severity: "high",
    status: "sent",
    detail: "13:43 UTC",
    ...overrides,
  };
}

describe("NotificationList", () => {
  it("shows a pending notification with its next attempt", () => {
    render(
      <NotificationList
        rows={[
          row({
            status: "pending",
            detail: "Next attempt at 13:56 UTC",
          }),
        ]}
      />,
    );
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Next attempt at 13:56 UTC")).toBeInTheDocument();
  });

  it("shows Deleted alert when the alert is gone", () => {
    render(<NotificationList rows={[row({ alertName: null })]} />);
    expect(screen.getAllByText("Deleted alert").length).toBeGreaterThan(0);
  });

  it("marks a simulated event", () => {
    render(<NotificationList rows={[row({ simulated: true })]} />);
    expect(screen.getByText("Simulated")).toBeInTheDocument();
  });

  it("does not mark a real event as simulated", () => {
    render(<NotificationList rows={[row()]} />);
    expect(screen.queryByText("Simulated")).not.toBeInTheDocument();
  });
});
