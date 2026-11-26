#!/usr/bin/env node
// PostToolUse hook for Edit and Write.
// Formats the file that was just changed and lints it, so style never reaches
// review and lint errors are fixed while the change is still in context.
// Exit code 2 sends stderr back to the agent as feedback.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const FORMATTABLE = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".mjs",
  ".js",
  ".jsx",
  ".css",
  ".json",
  ".jsonc",
  ".md",
  ".yml",
  ".yaml",
  ".sql",
]);
const LINTABLE = new Set([".ts", ".tsx", ".mts", ".mjs", ".js", ".jsx"]);

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

// The file may live in a git worktree, so resolve the project from the file
// itself instead of trusting CLAUDE_PROJECT_DIR (which stays at the main checkout).
function findProjectRoot(filePath) {
  let dir = dirname(filePath);
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  return null;
}

function run(root, args) {
  return execFileSync("pnpm", ["exec", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 45_000,
  });
}

const input = JSON.parse((await readStdin()) || "{}");
const filePath = input.tool_input?.file_path;

if (!filePath || !existsSync(filePath)) process.exit(0);

const extension = extname(filePath);
const root = findProjectRoot(filePath);

// Skip files outside a project, generated files, and worktrees without dependencies yet.
if (
  !root ||
  !existsSync(join(root, "node_modules")) ||
  filePath.includes("/node_modules/") ||
  filePath.endsWith("database.types.ts") ||
  filePath.endsWith("pnpm-lock.yaml")
) {
  process.exit(0);
}

if (extension === ".sql") process.exit(0);

if (FORMATTABLE.has(extension)) {
  try {
    run(root, ["prettier", "--write", "--log-level", "warn", filePath]);
  } catch {
    // A file Prettier cannot parse is reported by the typecheck or lint step instead.
  }
}

if (LINTABLE.has(extension)) {
  try {
    run(root, ["eslint", "--max-warnings", "0", filePath]);
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim();
    console.error(`ESLint reported problems in ${filePath}:\n${output}`);
    process.exit(2);
  }
}
