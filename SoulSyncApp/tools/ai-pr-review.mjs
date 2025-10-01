/**
 * Minimal PR reviewer using OpenAI (optional).
 * - Requires OPENAI_API_KEY and GITHUB_TOKEN secrets.
 * - Fetches changed files and posts a summary comment.
 * Skips gracefully if not in PR context.
 */
import { Octokit } from "octokit"
import process from "node:process"
import fs from "node:fs"

const { GITHUB_REPOSITORY, GITHUB_REF, GITHUB_TOKEN, OPENAI_API_KEY, GITHUB_EVENT_PATH } = process.env
if (!GITHUB_EVENT_PATH || !fs.existsSync(GITHUB_EVENT_PATH)) {
  console.log("No GitHub event context; skipping.")
  process.exit(0)
}
const event = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, "utf8"))
if (!event.pull_request) {
  console.log("Not a PR; skipping.")
  process.exit(0)
}
if (!OPENAI_API_KEY || !GITHUB_TOKEN){
  console.log("Missing OPENAI_API_KEY or GITHUB_TOKEN; skipping.")
  process.exit(0)
}

const [owner, repo] = GITHUB_REPOSITORY.split("/")
const prNumber = event.pull_request.number
const octo = new Octokit({ auth: GITHUB_TOKEN })

const files = await octo.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
  owner, repo, pull_number: prNumber
})
const diffs = files.data.map(f => `# ${f.filename}\n\n${f.patch || ''}`).join("\n\n")

// Simple summarization prompt (LLM call pseudocode placeholder)
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_CHARS = 12000;
const diffText = diffs.slice(0, MAX_CHARS);
const payload = {
  model: OPENAI_MODEL,
  messages: [
    { role: "system", content: "You are a senior full-stack reviewer. Be concise, factual, and actionable." },
    { role: "user", content: "Review this PR diff. List: 1) risks, 2) bugs, 3) security issues, 4) tests to add, 5) performance concerns. Diff:\n\n" + diffText }
  ],
  temperature: 0.2
};
const resp = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify(payload)
});
let text = "AI PR review (fallback).";
try {
  const j = await resp.json();
  text = j.choices?.[0]?.message?.content || text;
} catch(e) { /* ignore parse errors */ }
const body = [
  "AI PR review summary (placeholder):",
  "- Review the diff, flag potential issues, suggest tests.",
  "- This step is a scaffold; implement actual LLM call as needed."
].join("\n")

await octo.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
  owner, repo, issue_number: prNumber, body
})

console.log("Posted AI PR review placeholder comment.")
