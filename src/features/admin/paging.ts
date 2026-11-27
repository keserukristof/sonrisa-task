export const PAGE_SIZE = 25;

/** One page of an admin list, or a failure. `page` is the page shown, from 1. */
export type Page<Row> =
  { ok: true; rows: Row[]; page: number; hasNext: boolean } | { ok: false };

/** `?page=` as a positive whole number; anything else is the first page. */
export function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string" || !/^[1-9]\d{0,6}$/.test(value)) return 1;
  return Number(value);
}

/**
 * Fetches the requested page. A page past the end (no rows, no error) shows
 * the first page instead. Returns the page that was actually fetched.
 */
export async function fetchPageOrFirst<
  R extends { data: readonly unknown[] | null; error: unknown },
>(
  requested: number,
  fetchPage: (page: number) => PromiseLike<R>,
): Promise<{ page: number; result: R }> {
  const result = await fetchPage(requested);
  if (!result.error && result.data?.length === 0 && requested > 1) {
    return { page: 1, result: await fetchPage(1) };
  }
  return { page: requested, result };
}
