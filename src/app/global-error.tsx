"use client";

// Replaces the root layout when it fails, so it renders its own document
// and cannot rely on global styles or fonts.
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: "4rem auto",
          maxWidth: "32rem",
          padding: "0 1.5rem",
        }}
      >
        <title>Something went wrong</title>
        <h1>Something went wrong</h1>
        <p>The application could not be loaded. You can try again.</p>
        <button type="button" onClick={() => retry()}>
          Try again
        </button>
      </body>
    </html>
  );
}
