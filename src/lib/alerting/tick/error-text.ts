/** A short description of anything thrown or returned as an error. */
export function errorText(error: unknown): string {
  const text =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error);
  return text.slice(0, 500);
}
