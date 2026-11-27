import { describe, expect, it } from "vitest";
import type { OutgoingNotification } from "@/lib/alerting/types";
import { renderAlertEmail, renderTestEmail } from "./render";

const APP_URL = "https://heads-up.example";

function notification(
  overrides: Partial<OutgoingNotification["event"]> = {},
  alertName: string | null = "Pacific rim quakes",
): OutgoingNotification {
  return {
    event: {
      title: "M 6.8 - 40 km S of Hualien, Taiwan",
      summary: "A strong quake struck off the coast.",
      url: "https://earthquake.usgs.gov/event/1",
      category: "natural_disasters",
      severity: "high",
      occurredAt: new Date("2026-11-27T13:42:00Z"),
      source: "usgs",
      simulated: false,
      ...overrides,
    },
    alertName,
  };
}

describe("renderAlertEmail", () => {
  it("puts the severity, event title and alert name in the subject", () => {
    expect(renderAlertEmail(notification(), APP_URL).subject).toBe(
      "[High] M 6.8 - 40 km S of Hualien, Taiwan · Pacific rim quakes",
    );
  });

  it("prefixes a simulated event's subject and shows the banner and no data credit", () => {
    const email = renderAlertEmail(
      notification({
        simulated: true,
        source: "simulated",
        title: "Test quake near Tokyo",
        url: null,
      }),
      APP_URL,
    );
    expect(email.subject).toBe(
      "[SIMULATED] [High] Test quake near Tokyo · Pacific rim quakes",
    );
    const banner =
      "This is a simulated event created by an admin. Nothing happened.";
    expect(email.html).toContain(banner);
    expect(email.text.split("\n")[0]).toBe(banner);
    expect(email.html).not.toContain("U.S. Geological Survey");
    expect(email.text).not.toContain("U.S. Geological Survey");
    expect(email.html).not.toContain("View at source");
  });

  it.each([
    ["usgs", "U.S. Geological Survey."],
    ["guardian", "Source: The Guardian."],
    ["coingecko", "Powered by CoinGecko."],
  ])("starts the footer with the %s credit", (source, credit) => {
    const email = renderAlertEmail(notification({ source }), APP_URL);
    expect(email.html).toContain(`${credit} You get this email`);
    expect(email.text).toContain(`${credit} You get this email`);
    expect(email.html).not.toContain("Data:");
  });

  it("links to the source and to the alerts page", () => {
    const email = renderAlertEmail(notification(), APP_URL);
    expect(email.html).toContain('href="https://earthquake.usgs.gov/event/1"');
    expect(email.html).toContain("View at source");
    expect(email.html).toContain('href="https://heads-up.example/alerts"');
    expect(email.text).toContain(
      "View at source: https://earthquake.usgs.gov/event/1",
    );
    expect(email.text).toContain("https://heads-up.example/alerts");
  });

  it("keeps a line break in the title out of the subject", () => {
    const email = renderAlertEmail(
      notification({ title: "M 6.8\r\nBcc: x@evil.example" }),
      APP_URL,
    );
    expect(email.subject).not.toMatch(/[\r\n]/);
  });

  it("leaves out the button when the event has no url", () => {
    const email = renderAlertEmail(notification({ url: null }), APP_URL);
    expect(email.html).not.toContain("View at source");
  });

  it("has a plain-text alternative with the four facts", () => {
    const { text } = renderAlertEmail(notification(), APP_URL);
    expect(text).toContain("M 6.8 - 40 km S of Hualien, Taiwan");
    expect(text).toContain("A strong quake struck off the coast.");
    expect(text).toContain("Category: Natural disasters");
    expect(text).toContain("Severity: High");
    expect(text).toContain("When: 27 Nov 2026, 13:42 UTC");
    expect(text).toContain("Alert: Pacific rim quakes");
    expect(text).toContain(
      'You get this email because your alert "Pacific rim quakes" matched.',
    );
  });

  it("escapes markup in the event's text", () => {
    const email = renderAlertEmail(
      notification({ title: "<script>x</script> & more" }),
      APP_URL,
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;x&lt;/script&gt; &amp; more");
  });

  it("copes with a deleted alert", () => {
    const email = renderAlertEmail(notification({}, null), APP_URL);
    expect(email.subject).toBe("[High] M 6.8 - 40 km S of Hualien, Taiwan");
  });
});

describe("renderTestEmail", () => {
  it("states when the test was sent and links to the destinations page", () => {
    const email = renderTestEmail(new Date("2026-11-27T13:55:00Z"), APP_URL);
    expect(email.subject).toBe("Test from Heads-up");
    expect(email.html).toContain("This destination works");
    expect(email.html).toContain("27 Nov 2026 at 13:55 UTC");
    expect(email.html).toContain(
      'href="https://heads-up.example/destinations"',
    );
    expect(email.text).toContain("27 Nov 2026 at 13:55 UTC");
    expect(email.text).toContain("https://heads-up.example/destinations");
  });
});
