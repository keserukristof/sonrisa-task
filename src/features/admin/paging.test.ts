import { describe, expect, it } from "vitest";
import { fetchPageOrFirst, PAGE_SIZE, parsePage } from "./paging";

describe("parsePage", () => {
  it.each([
    [undefined, 1],
    ["3", 3],
    ["0", 1],
    ["-2", 1],
    ["2.5", 1],
    ["abc", 1],
    ["12345678", 1],
    [["2", "3"], 1],
  ])("reads %j as page %i", (input, expected) => {
    expect(parsePage(input)).toBe(expected);
  });
});

describe("PAGE_SIZE", () => {
  it("is 25", () => {
    expect(PAGE_SIZE).toBe(25);
  });
});

describe("fetchPageOrFirst", () => {
  const pages: Record<number, string[]> = { 1: ["a"], 2: [] };
  const fetcher = async (page: number) => ({
    data: pages[page] ?? [],
    error: null,
  });

  it("returns the requested page when it has rows", async () => {
    const { page, result } = await fetchPageOrFirst(1, fetcher);
    expect(page).toBe(1);
    expect(result.data).toEqual(["a"]);
  });

  it("falls back to the first page when a later page is empty", async () => {
    const { page, result } = await fetchPageOrFirst(2, fetcher);
    expect(page).toBe(1);
    expect(result.data).toEqual(["a"]);
  });

  it("does not fall back when the first page is empty", async () => {
    const calls: number[] = [];
    const { page } = await fetchPageOrFirst(1, async (p) => {
      calls.push(p);
      return { data: [], error: null };
    });
    expect(page).toBe(1);
    expect(calls).toEqual([1]);
  });

  it("does not fall back on an error", async () => {
    const calls: number[] = [];
    const { result } = await fetchPageOrFirst(3, async (p) => {
      calls.push(p);
      return { data: null, error: new Error("x") };
    });
    expect(result.error).toBeInstanceOf(Error);
    expect(calls).toEqual([3]);
  });
});
