#!/usr/bin/env node
// A stand-in for Slack's incoming webhooks, for local development and e2e.
// The app accepts http://127.0.0.1:<port>/slack/… as a webhook URL outside
// production only (allowsLocalSlackStub in src/lib/env.server.ts).
//
//   POST /slack/<token>          a webhook: records the JSON body, answers
//                                with the answer set for <token> (default 200 "ok")
//   POST /__answer/<token>       sets that answer: {"status":404,"body":"channel_not_found","retryAfter":30}
//   GET  /__messages/<token>     the bodies received for <token>, oldest first
//   GET  /__health               200
//
// Each test uses its own token, so parallel tests never see each other.
// Playwright starts it (playwright.config.ts) on SLACK_STUB_PORT.

import { createServer } from "node:http";
import process from "node:process";

const port = Number(process.env.SLACK_STUB_PORT ?? 4100);
const messages = new Map();
const answers = new Map();

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error("body too large"));
    });
    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "content-type": "text/plain", ...headers });
  response.end(body);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
    const [, kind, ...rest] = url.pathname.split("/");
    const token = rest.join("/");

    if (request.method === "GET" && kind === "__health") {
      return send(response, 200, "ok");
    }
    if (request.method === "GET" && kind === "__messages") {
      response.writeHead(200, { "content-type": "application/json" });
      return response.end(JSON.stringify(messages.get(token) ?? []));
    }
    if (request.method === "POST" && kind === "__answer") {
      answers.set(token, JSON.parse((await readBody(request)) || "{}"));
      return send(response, 204, "");
    }
    if (request.method === "POST" && kind === "slack" && token) {
      const body = await readBody(request);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return send(response, 400, "invalid_payload");
      }
      const answer = answers.get(token) ?? { status: 200, body: "ok" };
      if ((answer.status ?? 200) === 200) {
        messages.set(token, [...(messages.get(token) ?? []), parsed]);
      }
      return send(
        response,
        answer.status ?? 200,
        answer.body ?? "ok",
        answer.retryAfter ? { "retry-after": String(answer.retryAfter) } : {},
      );
    }
    return send(response, 404, "no_service");
  } catch (error) {
    return send(response, 500, String(error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Slack stub listening on http://127.0.0.1:${port}`);
});
