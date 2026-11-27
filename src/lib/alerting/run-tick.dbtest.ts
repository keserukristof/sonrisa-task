import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/tick/route";
import { runTick } from "./run-tick";
import {
  addSlackDestination,
  baseConfig,
  createAccount,
  createAlert,
  deleteAccount,
  fakeChannel,
  fakeClock,
  insertEvent,
  notificationsFor,
  testDb,
  windowAt,
  type FakeChannel,
  type TestAccount,
} from "./testing/fixtures";
import type { Source } from "./types";

const db = testDb();
const accounts: string[] = [];
const eventIds: string[] = [];

afterAll(async () => {
  await db.from("events").delete().in("id", eventIds);
  await db.from("source_polls").delete().like("source", "fake-%");
  for (const id of accounts) await deleteAccount(db, id);
});

function at(value: string | undefined): number {
  return new Date(value ?? "").getTime();
}

function tagOf() {
  return randomUUID().slice(0, 8);
}

async function account(): Promise<TestAccount> {
  const created = await createAccount(db);
  accounts.push(created.id);
  return created;
}

async function event(options: Parameters<typeof insertEvent>[1]) {
  const id = await insertEvent(db, options);
  eventIds.push(id);
  return id;
}

/** One tick with the given channels (email and slack both answer `sent` by default). */
function tick(
  clock: ReturnType<typeof fakeClock>,
  email: FakeChannel,
  extra: Partial<Parameters<typeof runTick>[0]> = {},
) {
  return runTick({
    db,
    sources: [],
    channels: [email, fakeChannel("slack", "\u0000")],
    clock,
    config: baseConfig,
    ...extra,
  });
}

describe("matching", () => {
  it("matches on category, severity and whole-word keywords, case-insensitively", async () => {
    const now = windowAt(2101);
    const clock = fakeClock(now);
    const tag = tagOf();
    const user = await account();
    const created = new Date(now.getTime() - 3_600_000);
    const high = await createAlert(db, user, {
      category: "natural_disasters",
      minSeverity: "high",
      keywords: [tag],
      createdAt: created,
    });
    const word = await createAlert(db, user, {
      category: "natural_disasters",
      keywords: [`quake${tag}`],
      createdAt: created,
    });
    const wrongCategory = await createAlert(db, user, {
      category: "markets",
      keywords: [tag],
      createdAt: created,
    });
    const ingestedAt = new Date(now.getTime() - 60_000);
    const e = await event({
      category: "natural_disasters",
      severity: "moderate",
      title: `Big QUAKE${tag} near the coast`,
      summary: `${tag} reported`,
      ingestedAt,
    });
    const substring = await event({
      category: "natural_disasters",
      severity: "critical",
      title: `Preshock${tag}x`,
      ingestedAt,
    });
    const channel = fakeChannel("email", tag);

    await tick(clock, channel);

    const rows = await notificationsFor(db, user.id);
    const forAlert = (alertId: string, eventId: string) =>
      rows.filter((r) => r.alert_id === alertId && r.event_id === eventId);
    expect(forAlert(word, e)).toHaveLength(1);
    expect(forAlert(high, e)).toHaveLength(0); // moderate is below high
    expect(forAlert(wrongCategory, e)).toHaveLength(0);
    expect(forAlert(word, substring)).toHaveLength(0); // not a whole word
    expect(forAlert(high, substring)).toHaveLength(0); // keyword absent
  });

  it("matches news without a severity", async () => {
    const now = windowAt(2102);
    const tag = tagOf();
    const user = await account();
    const alert = await createAlert(db, user, {
      category: "news",
      keywords: [tag],
      createdAt: new Date(now.getTime() - 3_600_000),
    });
    await event({
      category: "news",
      title: `Headline ${tag}`,
      ingestedAt: new Date(now.getTime() - 60_000),
    });

    await tick(fakeClock(now), fakeChannel("email", tag));

    const rows = await notificationsFor(db, user.id);
    expect(rows.map((r) => r.alert_id)).toEqual([alert]);
  });

  it("does not match an event ingested before the alert was created", async () => {
    const now = windowAt(2103);
    const tag = tagOf();
    const user = await account();
    await event({
      category: "markets",
      title: `Early ${tag}`,
      ingestedAt: new Date(now.getTime() - 7_200_000),
    });
    await createAlert(db, user, {
      category: "markets",
      keywords: [tag],
      createdAt: new Date(now.getTime() - 3_600_000),
    });

    await tick(fakeClock(now), fakeChannel("email", tag));

    expect(await notificationsFor(db, user.id)).toHaveLength(0);
  });

  it("never matches a paused alert", async () => {
    const now = windowAt(2104);
    const tag = tagOf();
    const user = await account();
    await createAlert(db, user, {
      category: "markets",
      keywords: [tag],
      active: false,
      createdAt: new Date(now.getTime() - 3_600_000),
    });
    await event({
      category: "markets",
      title: `Paused ${tag}`,
      ingestedAt: new Date(now.getTime() - 60_000),
    });

    await tick(fakeClock(now), fakeChannel("email", tag));

    expect(await notificationsFor(db, user.id)).toHaveLength(0);
  });

  it("creates one notification per event and destination", async () => {
    const now = windowAt(2105);
    const tag = tagOf();
    const user = await account();
    const slack = await addSlackDestination(db, user.id);
    const created = new Date(now.getTime() - 3_600_000);
    // Two alerts share the email destination; one of them also has Slack.
    await createAlert(db, user, {
      category: "markets",
      keywords: [tag],
      createdAt: created,
      destinationIds: [user.emailDestinationId, slack],
    });
    await createAlert(db, user, {
      category: "markets",
      keywords: [tag],
      createdAt: created,
    });
    await event({
      category: "markets",
      title: `Once ${tag}`,
      ingestedAt: new Date(now.getTime() - 60_000),
    });

    const clock = fakeClock(now);
    const channel = fakeChannel("email", tag);
    await tick(clock, channel);
    await tick(clock, channel);

    const rows = await notificationsFor(db, user.id);
    expect(rows.map((r) => r.channel_type).sort()).toEqual(["email", "slack"]);
    expect(channel.calls).toHaveLength(1);
  });

  it("takes simulated events down the same path", async () => {
    const now = windowAt(2106);
    const tag = tagOf();
    const user = await account();
    await createAlert(db, user, {
      category: "news",
      keywords: [tag],
      createdAt: new Date(now.getTime() - 3_600_000),
    });
    await event({
      category: "news",
      title: `Drill ${tag}`,
      ingestedAt: new Date(now.getTime() - 60_000),
      source: "simulated",
    });
    const channel = fakeChannel("email", tag);

    await tick(fakeClock(now), channel);

    expect(channel.calls).toHaveLength(1);
    expect(channel.calls[0]?.event.simulated).toBe(true);
    const rows = await notificationsFor(db, user.id);
    expect(rows[0]?.status).toBe("sent");
  });
});

describe("email limits", () => {
  async function userWithEvents(year: number, count: number, tag: string) {
    const now = windowAt(year);
    const user = await account();
    await createAlert(db, user, {
      category: "markets",
      keywords: [tag],
      createdAt: new Date(now.getTime() - 3_600_000),
    });
    for (let i = 0; i < count; i += 1) {
      await event({
        category: "markets",
        title: `Move ${i} ${tag}`,
        ingestedAt: new Date(now.getTime() - 60_000),
      });
    }
    return { now, user };
  }

  it("skips the 11th email in an hour with its reason", async () => {
    const tag = tagOf();
    const { now, user } = await userWithEvents(2107, 11, tag);
    const channel = fakeChannel("email", tag);

    await tick(fakeClock(now), channel);

    const rows = await notificationsFor(db, user.id);
    expect(rows.filter((r) => r.status === "sent")).toHaveLength(10);
    const skipped = rows.filter((r) => r.status === "skipped");
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.skip_reason).toBe("Hourly limit (10) reached");
    expect(channel.calls).toHaveLength(10);
  });

  it("skips emails over the system's daily limit", async () => {
    const tag = tagOf();
    const { now, user } = await userWithEvents(2108, 4, tag);
    const channel = fakeChannel("email", tag);

    await tick(fakeClock(now), channel, {
      config: { ...baseConfig, emailsPerSystemPerDay: 3 },
    });

    const rows = await notificationsFor(db, user.id);
    expect(rows.filter((r) => r.status === "sent")).toHaveLength(3);
    expect(rows.find((r) => r.status === "skipped")?.skip_reason).toBe(
      "Daily system limit (3) reached",
    );
  });

  it("counts the user's test sends toward the hour", async () => {
    const tag = tagOf();
    const { now, user } = await userWithEvents(2109, 1, tag);
    const { error } = await db.from("test_sends").insert(
      Array.from({ length: 10 }, () => ({
        user_id: user.id,
        destination_id: user.emailDestinationId,
        channel_type: "email",
        created_at: new Date(now.getTime() - 120_000).toISOString(),
      })),
    );
    expect(error).toBeNull();

    await tick(fakeClock(now), fakeChannel("email", tag));

    const rows = await notificationsFor(db, user.id);
    expect(rows.map((r) => r.status)).toEqual(["skipped"]);
  });
});

describe("delivery", () => {
  async function oneEvent(year: number) {
    const now = windowAt(year);
    const tag = tagOf();
    const user = await account();
    await createAlert(db, user, {
      category: "markets",
      keywords: [tag],
      createdAt: new Date(now.getTime() - 3_600_000),
    });
    await event({
      category: "markets",
      title: `Deliver ${tag}`,
      ingestedAt: new Date(now.getTime() - 60_000),
    });
    return { now, tag, user };
  }

  it("retries at 1, 5 and 15 minutes, then fails with the last error", async () => {
    const { now, tag, user } = await oneEvent(2110);
    const clock = fakeClock(now);
    let n = 0;
    const channel = fakeChannel("email", tag, () => {
      n += 1;
      return { kind: "retry", error: `down ${n}` };
    });

    await tick(clock, channel);
    clock.advance(30); // not due yet
    await tick(clock, channel);
    expect(channel.calls).toHaveLength(1);
    let row = (await notificationsFor(db, user.id))[0];
    expect(row?.status).toBe("pending");
    expect(row?.attempts).toBe(1);
    expect(at(row?.next_attempt_at)).toBe(now.getTime() + 60_000);

    clock.set(new Date(now.getTime() + 60_000));
    await tick(clock, channel);
    row = (await notificationsFor(db, user.id))[0];
    expect(row?.attempts).toBe(2);
    expect(at(row?.next_attempt_at)).toBe(now.getTime() + 360_000);

    clock.set(new Date(now.getTime() + 360_000));
    await tick(clock, channel);
    row = (await notificationsFor(db, user.id))[0];
    expect(row?.attempts).toBe(3);
    expect(row?.status).toBe("pending");

    clock.set(new Date(now.getTime() + 360_000 + 900_000));
    await tick(clock, channel);
    row = (await notificationsFor(db, user.id))[0];
    expect(row?.status).toBe("failed");
    expect(row?.attempts).toBe(4);
    expect(row?.last_error).toBe("down 4");

    clock.advance(86_400);
    await tick(clock, channel);
    expect(channel.calls).toHaveLength(4);
  });

  it("fails the notification at once on a permanent error and leaves the email destination working", async () => {
    const { now, tag, user } = await oneEvent(2111);
    const channel = fakeChannel("email", tag, () => ({
      kind: "broken",
      error: "address rejected",
    }));

    await tick(fakeClock(now), channel);

    const row = (await notificationsFor(db, user.id))[0];
    expect(row?.status).toBe("failed");
    expect(row?.last_error).toBe("address rejected");
    const { data } = await db
      .from("destinations")
      .select("status, broken_reason")
      .eq("id", user.emailDestinationId)
      .single();
    expect(data).toEqual({ status: "active", broken_reason: null });
  });

  it("sends once when two ticks run back to back", async () => {
    const { now, tag, user } = await oneEvent(2112);
    const clock = fakeClock(now);
    const channel = fakeChannel("email", tag);

    await tick(clock, channel);
    await tick(clock, channel);

    expect(channel.calls).toHaveLength(1);
    expect((await notificationsFor(db, user.id))[0]?.status).toBe("sent");
  });

  it("sends once when two ticks run at the same time", async () => {
    const { now, tag, user } = await oneEvent(2113);
    const clock = fakeClock(now);
    const channel = fakeChannel("email", tag);

    await Promise.all([tick(clock, channel), tick(clock, channel)]);

    expect(channel.calls).toHaveLength(1);
    expect((await notificationsFor(db, user.id))[0]?.status).toBe("sent");
  });
});

describe("polling", () => {
  function source(
    id: string,
    fetch: Source["fetch"],
    intervalSeconds = 600,
  ): Source {
    return { id, category: "markets", intervalSeconds, fetch };
  }

  const candidate = (externalId: string, title: string) => ({
    externalId,
    title,
    summary: null,
    url: null,
    occurredAt: new Date(),
    severity: "low" as const,
    raw: { externalId },
  });

  async function pollsOf(id: string) {
    const { data } = await db
      .from("source_polls")
      .select("outcome, error, events_stored")
      .eq("source", id)
      .order("polled_at");
    return data ?? [];
  }

  it("records a failing source and still polls the others", async () => {
    const now = windowAt(2114);
    const tag = tagOf();
    const bad = `fake-bad-${tag}`;
    const good = `fake-good-${tag}`;
    const sources = [
      source(bad, async () => {
        throw new Error("feed is down");
      }),
      source(good, async () => [candidate("a", `Fresh ${tag}`)]),
    ];

    const summary = await tick(fakeClock(now), fakeChannel("email", tag), {
      sources,
      config: { ...baseConfig, realPolling: true },
    });

    expect(summary.sourcesFailed).toBe(1);
    expect(await pollsOf(bad)).toEqual([
      { outcome: "error", error: "feed is down", events_stored: 0 },
    ]);
    expect(await pollsOf(good)).toEqual([
      { outcome: "ok", error: null, events_stored: 1 },
    ]);
    const { data } = await db.from("events").select("id").eq("source", good);
    expect(data).toHaveLength(1);
    await db.from("events").delete().eq("source", good);
  });

  it("polls only once the interval has passed, and stores each event once", async () => {
    const now = windowAt(2115);
    const tag = tagOf();
    const id = `fake-interval-${tag}`;
    let fetches = 0;
    const sources = [
      source(id, async () => {
        fetches += 1;
        return [candidate("same", `Same ${tag}`)];
      }),
    ];
    const clock = fakeClock(now);
    const config = { ...baseConfig, realPolling: true };
    const channel = fakeChannel("email", tag);

    await tick(clock, channel, { sources, config });
    clock.advance(599);
    await tick(clock, channel, { sources, config });
    expect(fetches).toBe(1);

    clock.advance(1);
    await tick(clock, channel, { sources, config });
    expect(fetches).toBe(2);
    expect((await pollsOf(id)).map((p) => p.events_stored)).toEqual([1, 0]);
    await db.from("events").delete().eq("source", id);
  });

  it("does not poll while real polling is off", async () => {
    const tag = tagOf();
    const id = `fake-off-${tag}`;
    let fetches = 0;
    const sources = [
      source(id, async () => {
        fetches += 1;
        return [];
      }),
    ];

    await tick(fakeClock(windowAt(2116)), fakeChannel("email", tag), {
      sources,
    });

    expect(fetches).toBe(0);
    expect(await pollsOf(id)).toEqual([]);
  });
});

describe("POST /api/tick", () => {
  it("answers 401 without the tick secret", async () => {
    const none = await POST(
      new Request("http://localhost/api/tick", { method: "POST" }),
    );
    const wrong = await POST(
      new Request("http://localhost/api/tick", {
        method: "POST",
        headers: { authorization: "Bearer not-the-secret" },
      }),
    );
    expect(none.status).toBe(401);
    expect(wrong.status).toBe(401);
  });
});
