#!/usr/bin/env node
// PreToolUse hook for Bash.
// `main` is what is deployed and changes only through reviewed pull requests,
// so an agent may not commit on it or push to it. Exit code 2 refuses the
// command and sends the reason back to the agent.
//
// Allowed on main: reading, switching away, and `git pull --ff-only` /
// `git merge --ff-only` to bring it up to date after a pull request merges.
// The user can still do anything in their own terminal; this guards agents.

import { execFileSync } from "node:child_process";

const PROTECTED = new Set(["main", "master"]);

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

function refuse(reason) {
  console.error(
    `${reason}\n\n\`main\` changes only through pull requests (see Branches in CLAUDE.md). Create a branch first, for example \`git switch -c chore/<topic>\`, commit there and open a pull request.`,
  );
  process.exit(2);
}

function currentBranch(cwd) {
  try {
    return execFileSync("git", ["symbolic-ref", "--short", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const input = JSON.parse((await readStdin()) || "{}");
const command = input.tool_input?.command;
if (typeof command !== "string" || !/\bgit\b/.test(command)) process.exit(0);

// Look at each simple command separately: `a && b; c | d`.
const parts = command.split(/&&|\|\||;|\||\n/).map((part) => part.trim());
const branch = currentBranch(input.cwd ?? process.cwd());
const onMain = branch !== null && PROTECTED.has(branch);

for (const part of parts) {
  // Drop `git -C <dir>` and `-c key=value` options to find the subcommand.
  const words = part.split(/\s+/);
  const gitIndex = words.indexOf("git");
  if (gitIndex === -1) continue;
  let i = gitIndex + 1;
  while (words[i]?.startsWith("-"))
    i += words[i] === "-C" || words[i] === "-c" ? 2 : 1;
  const subcommand = words[i];
  const args = words.slice(i + 1);

  if (subcommand === "push") {
    const refspecs = args.filter((arg) => !arg.startsWith("-")).slice(1);
    // The branch a refspec writes to: the part after ":", or the ref itself.
    const target = (ref) => {
      const name = (ref.split(":").at(-1) ?? "")
        .replace(/^\+/, "")
        .replace(/^refs\/heads\//, "");
      return name === "HEAD" || name === "@" ? branch : name;
    };
    const targetsMain =
      args.includes("--all") ||
      args.includes("--mirror") ||
      refspecs.some((ref) => PROTECTED.has(target(ref) ?? "")) ||
      (refspecs.length === 0 && onMain);
    if (targetsMain) refuse(`Refused: \`${part}\` would push to main.`);
  }

  if (!onMain) continue;

  if (["commit", "cherry-pick", "revert", "am"].includes(subcommand)) {
    refuse(`Refused: \`${part}\` would commit on main.`);
  }
  if (
    subcommand === "merge" &&
    !args.includes("--ff-only") &&
    !args.includes("--abort")
  ) {
    refuse(
      `Refused: \`${part}\` would create a merge commit on main. Use \`git pull --ff-only\` to update main.`,
    );
  }
}
