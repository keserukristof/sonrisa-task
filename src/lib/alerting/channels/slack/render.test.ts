import { describe, expect, it } from "vitest";
import type { OutgoingNotification } from "@/lib/alerting/types";
import { renderAlertMessage, renderTestMessage } from "./render";

const APP_URL = "https://heads-up.example";

function notification(
  overrides: Partial<OutgoingNotification["event"]> = {},
  alertName: string | null = "Crypto swings",
): OutgoingNotification {
  return {
    event: {
      title: "Bitcoin (BTC) up 4.2% in the past hour",
      summary: "Price $64,210. 24-hour change −1.8%.",
      url: "https://www.coingecko.com/en/coins/bitcoin",
      category: "markets",
      severity: "moderate",
      occurredAt: new Date("2026-11-27T13:42:00Z"),
      source: "coingecko",
      simulated: false,
      ...overrides,
    },
    alertName,
  };
}

describe("renderAlertMessage", () => {
  it("renders a linked title, severity and summary, and a context line with the credit", () => {
    expect(renderAlertMessage(notification())).toEqual({
      text: "[Moderate] Bitcoin (BTC) up 4.2% in the past hour · Crypto swings",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*<https://www.coingecko.com/en/coins/bitcoin|Bitcoin (BTC) up 4.2% in the past hour>*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Moderate* · Price $64,210. 24-hour change −1.8%.",
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "Alert: Crypto swings · Powered by CoinGecko",
            },
          ],
        },
      ],
    });
  });

  it("bolds the title without a link when there is no URL", () => {
    const { blocks } = renderAlertMessage(notification({ url: null }));
    expect(blocks[0]).toMatchObject({
      text: { text: "*Bitcoin (BTC) up 4.2% in the past hour*" },
    });
  });

  it("shows only the severity when there is no summary", () => {
    const { blocks } = renderAlertMessage(notification({ summary: null }));
    expect(blocks[1]).toMatchObject({ text: { text: "*Moderate*" } });
  });

  it("escapes &, < and > in event text and the alert name", () => {
    const { blocks, text } = renderAlertMessage(
      notification(
        { title: "A & B <script>", summary: "x > y <!channel>" },
        "Tom & <Jerry>",
      ),
    );
    expect(blocks[0]).toMatchObject({
      text: {
        text: "*<https://www.coingecko.com/en/coins/bitcoin|A &amp; B &lt;script&gt;>*",
      },
    });
    expect(blocks[1]).toMatchObject({
      text: { text: "*Moderate* · x &gt; y &lt;!channel&gt;" },
    });
    expect(blocks[2]).toMatchObject({
      elements: [
        { text: "Alert: Tom &amp; &lt;Jerry&gt; · Powered by CoinGecko" },
      ],
    });
    expect(text).toBe(
      "[Moderate] A &amp; B &lt;script&gt; · Tom &amp; &lt;Jerry&gt;",
    );
  });

  it("keeps a URL with Slack's link characters from breaking the link", () => {
    const { blocks } = renderAlertMessage(
      notification({ url: "https://x.example/a|b>c" }),
    );
    expect(blocks[0]).toMatchObject({
      text: {
        text: "*<https://x.example/a%7Cb%3Ec|Bitcoin (BTC) up 4.2% in the past hour>*",
      },
    });
  });

  it("marks a simulated event, adds the banner and credits the admin", () => {
    const { blocks, text } = renderAlertMessage(
      notification({
        simulated: true,
        source: "simulated",
        title: "Test quake near Tokyo",
        url: null,
        summary: "Magnitude 7.1.",
      }),
    );
    expect(text).toBe(
      "[SIMULATED] [Moderate] Test quake near Tokyo · Crypto swings",
    );
    expect(blocks).toEqual([
      {
        type: "section",
        text: { type: "mrkdwn", text: "*[SIMULATED] Test quake near Tokyo*" },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "_This is a simulated event created by an admin. Nothing happened._",
        },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Moderate* · Magnitude 7.1." },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Alert: Crypto swings · Simulated by an admin",
          },
        ],
      },
    ]);
  });

  it("leaves out the alert name and credit when they are unknown", () => {
    const { blocks, text } = renderAlertMessage(
      notification({ source: "unknown" }, null),
    );
    expect(text).toBe("[Moderate] Bitcoin (BTC) up 4.2% in the past hour");
    expect(blocks[2]).toEqual({
      type: "context",
      elements: [{ type: "mrkdwn", text: "Alert deleted" }],
    });
  });
});

describe("renderTestMessage", () => {
  it("says the destination works and links to the destinations page", () => {
    const message = renderTestMessage(
      new Date("2026-11-27T18:12:00Z"),
      APP_URL,
    );
    expect(message.text).toBe("This destination works");
    expect(message.blocks).toEqual([
      {
        type: "section",
        text: { type: "mrkdwn", text: "_This destination works_" },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "You sent this test from your destinations page on 27 Nov 2026, 18:12 UTC. Notifications from your alerts arrive in this channel.",
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Heads-up · <https://heads-up.example/destinations|Manage your destinations>",
          },
        ],
      },
    ]);
  });
});
