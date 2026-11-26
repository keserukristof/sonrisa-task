#!/usr/bin/env node
// Stop and SubagentStop hook.
// An agent may not finish its turn while lint, typecheck or unit tests fail on
// code it has changed. This makes "done" a fact the tooling checked, not a claim.
//
// It stays out of the way when there is nothing to check: no uncommitted code
// changes (planning, spec and review turns), or the same changes already passed.
// The production build and e2e suite are deliberately not run here; they belong
// to `pnpm verify:full` and CI.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CODE = /\.(ts|tsx|mts|mjs|js|jsx|css|sql)$|(^|\/)package\.json$/;

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

function git(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

const input = JSON.parse((await readStdin()) || "{}");

// Already blocked once in this turn: let the agent stop and report the failure
// instead of looping forever.
if (input.stop_hook_active) process.exit(0);

// Use the agent's own working directory: in a worktree it differs from the main checkout.
const cwd = input.cwd ?? process.cwd();

let root;
try {
  root = git(cwd, ["rev-parse", "--show-toplevel"]).trim();
} catch {
  process.exit(0);
}

if (
  !existsSync(join(root, "node_modules")) ||
  !existsSync(join(root, "package.json"))
) {
  process.exit(0);
}

const changed = git(root, ["status", "--porcelain", "--untracked-files=all"])
  .split("\n")
  .map((line) => line.slice(3).trim())
  .filter((file) => CODE.test(file));

if (changed.length === 0) process.exit(0);

// Skip when exactly these changes have already passed.
const fingerprint = createHash("sha256")
  .update(git(root, ["rev-parse", "HEAD"]))
  .update(git(root, ["diff", "HEAD"]))
  .update(
    changed
      .map((file) => {
        try {
          return file + readFileSync(join(root, file), "utf8");
        } catch {
          return file;
        }
      })
      .join("\n"),
  )
  .digest("hex");

const stampDir = join(tmpdir(), "claude-stop-verify");
const stampFile = join(
  stampDir,
  createHash("sha256").update(root).digest("hex"),
);
if (existsSync(stampFile) && readFileSync(stampFile, "utf8") === fingerprint) {
  process.exit(0);
}

const gates = [
  ["lint", ["lint"]],
  ["typecheck", ["typecheck"]],
  ["unit tests", ["test"]],
];

for (const [name, args] of gates) {
  try {
    execFileSync("pnpm", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 240_000,
    });
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    console.error(
      `The ${name} gate fails on your changes. Fix it before finishing, or report clearly why you cannot.\n\n${output.slice(-4000)}`,
    );
    process.exit(2);
  }
}

mkdirSync(stampDir, { recursive: true });
writeFileSync(stampFile, fingerprint);
