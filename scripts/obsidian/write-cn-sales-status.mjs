#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_NAME = "CN Sales";
const PROJECT_SLUG = "cn-sales";
const PROJECT_DIR = join("00_projects", PROJECT_SLUG);
const PROJECT_FILES = [
  "README.md",
  "CN_SALES_STATUS.md",
  "CN_SALES_HANDOVER.md",
  "CN_SALES_DECISIONS.md",
  "CN_SALES_DB_NOTES.md",
  "CN_SALES_PHASE_LOG.md",
  "CN_SALES_NEXT_ACTIONS.md",
];

const FORBIDDEN_OUTPUT_TERMS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "service role key",
  "publishable key",
  ".env.local",
];

export async function runCnSalesObsidianStatus({
  argv = process.argv.slice(2),
  cwd = process.cwd(),
  env = process.env,
  now = new Date(),
  writeOutput = (line) => console.log(line),
} = {}) {
  const options = parseArgs(argv);
  const vaultPath = normalizeOptionalPath(env.OBSIDIAN_VAULT_PATH);

  if (!vaultPath) {
    const reason = "OBSIDIAN_VAULT_PATH is not set; skipped without writing files.";
    writeOutput(`CN_SALES_OBSIDIAN_SKIPPED: ${reason}`);
    return { status: "skipped", reason, filesWritten: [] };
  }

  if (!existsSync(vaultPath) || !statSync(vaultPath).isDirectory()) {
    const reason = `OBSIDIAN_VAULT_PATH does not exist or is not a directory: ${vaultPath}`;
    writeOutput(`CN_SALES_OBSIDIAN_BLOCKED: ${reason}`);
    return { status: "blocked", reason, filesWritten: [] };
  }

  const snapshot = buildSnapshot({ cwd, env, now, options });
  const filesWritten = [];
  const projectRoot = join(vaultPath, PROJECT_DIR);
  const hasProjectFolder = existsSync(projectRoot);
  const hasMinzStructure = detectMinzStructure(vaultPath);

  if (!hasProjectFolder && !options.initProjectFolder && !hasMinzStructure) {
    const reason = [
      "CN_SALES_PROJECT_FOLDER_INIT_REQUIRED",
      `Missing ${PROJECT_DIR}. Re-run with --init-project-folder after approval.`,
    ].join(": ");
    writeOutput(`CN_SALES_OBSIDIAN_BLOCKED: ${reason}`);
    return { status: "blocked", reason, filesWritten: [] };
  }

  if (hasProjectFolder || options.initProjectFolder) {
    ensureDirectory(projectRoot);
    filesWritten.push(...writeProjectFolderNotes(projectRoot, snapshot));
  }

  if (hasMinzStructure) {
    filesWritten.push(...writeMinzNotes(vaultPath, snapshot));
  }

  const uniqueFiles = [...new Set(filesWritten)].sort();
  if (uniqueFiles.length === 0) {
    const reason = "No writable cn-sales Obsidian target was detected.";
    writeOutput(`CN_SALES_OBSIDIAN_BLOCKED: ${reason}`);
    return { status: "blocked", reason, filesWritten: [] };
  }

  writeOutput(`CN_SALES_OBSIDIAN_UPDATED: ${uniqueFiles.length} file(s) updated.`);
  for (const filePath of uniqueFiles) {
    writeOutput(`- ${filePath}`);
  }

  return { status: "updated", filesWritten: uniqueFiles };
}

export function ensureDirectory(directoryPath) {
  mkdirSync(directoryPath, { recursive: true });
}

function parseArgs(argv) {
  const options = {
    initProjectFolder: false,
    phase: "CN Sales local status update",
    summary: "Captured current cn-sales development status for handoff.",
    verification: "not run by this script",
    migration: "not applied by this script",
    seed: "not applied by this script",
    storage: "not checked by this script",
    pr: "no PR recorded",
    next: "continue with the next approved PR unit",
    blocker: "none recorded",
    notTested: "runtime DB apply, seed apply, storage bucket creation, production deploy",
    changed: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--init-project-folder") {
      options.initProjectFolder = true;
      continue;
    }

    const nextValue = argv[index + 1];
    if (nextValue === undefined) continue;

    if (arg === "--phase") options.phase = nextValue;
    if (arg === "--summary") options.summary = nextValue;
    if (arg === "--verification") options.verification = nextValue;
    if (arg === "--migration") options.migration = nextValue;
    if (arg === "--seed") options.seed = nextValue;
    if (arg === "--storage") options.storage = nextValue;
    if (arg === "--pr") options.pr = nextValue;
    if (arg === "--next") options.next = nextValue;
    if (arg === "--blocker") options.blocker = nextValue;
    if (arg === "--not-tested") options.notTested = nextValue;
    if (arg === "--changed") options.changed.push(nextValue);

    index += 1;
  }

  return options;
}

function buildSnapshot({ cwd, env, now, options }) {
  const redactor = createRedactor(env);
  const branch = git(["branch", "--show-current"], cwd) || "unknown";
  const latestCommit = git(["log", "-1", "--oneline"], cwd) || "unknown";
  const gitStatus = git(["status", "--short"], cwd) || "clean";
  const gitChangedFiles = gitStatus === "clean"
    ? ["clean"]
    : gitStatus.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const changedFiles = options.changed.length > 0 ? options.changed : gitChangedFiles;

  return sanitizeSnapshot({
    now: formatKst(now),
    date: formatKstDate(now),
    phase: options.phase,
    summary: options.summary,
    verification: options.verification,
    migration: options.migration,
    seed: options.seed,
    storage: options.storage,
    pr: options.pr,
    next: options.next,
    blocker: options.blocker,
    notTested: options.notTested,
    repoPath: cwd,
    branch,
    latestCommit,
    changedFiles,
    safety: [
      "No secret values are recorded.",
      "No raw ledger personal data is recorded.",
      "No customer-sensitive raw rows are recorded.",
      "No DB write, migration apply, seed apply, storage bucket creation, deploy, stage, commit, or push is performed by this script.",
    ],
  }, redactor);
}

function sanitizeSnapshot(snapshot, redactor) {
  return {
    ...snapshot,
    phase: redactor(snapshot.phase),
    summary: redactor(snapshot.summary),
    verification: redactor(snapshot.verification),
    migration: redactor(snapshot.migration),
    seed: redactor(snapshot.seed),
    storage: redactor(snapshot.storage),
    pr: redactor(snapshot.pr),
    next: redactor(snapshot.next),
    blocker: redactor(snapshot.blocker),
    notTested: redactor(snapshot.notTested),
    changedFiles: snapshot.changedFiles.map((item) => redactor(item)),
    safety: snapshot.safety.map((item) => redactor(item)),
  };
}

function createRedactor(env) {
  const sensitiveValues = Object.entries(env)
    .filter(([key, value]) => /KEY|SECRET|TOKEN|PASSWORD|PUBLISHABLE/i.test(key) && typeof value === "string" && value.length >= 8)
    .map(([, value]) => value);

  return (input) => {
    let output = String(input ?? "");

    for (const value of sensitiveValues) {
      output = output.split(value).join("[REDACTED]");
    }

    for (const term of FORBIDDEN_OUTPUT_TERMS) {
      output = output.replaceAll(term, "[REDACTED]");
    }

    output = output.replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]");
    output = output.replace(/\bsb_[A-Za-z0-9_=-]{8,}\b/g, "[REDACTED]");
    output = output.replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED]");

    return output;
  };
}

function writeProjectFolderNotes(projectRoot, snapshot) {
  const filesWritten = [];

  const fileWriters = {
    "README.md": () => writeIfMissing(join(projectRoot, "README.md"), renderReadme(snapshot)),
    "CN_SALES_STATUS.md": () => writeFile(join(projectRoot, "CN_SALES_STATUS.md"), renderStatus(snapshot)),
    "CN_SALES_HANDOVER.md": () => appendUpdateLog(join(projectRoot, "CN_SALES_HANDOVER.md"), renderHandoverBase(), renderUpdateEntry(snapshot)),
    "CN_SALES_DECISIONS.md": () => writeIfMissing(join(projectRoot, "CN_SALES_DECISIONS.md"), renderDecisions(snapshot)),
    "CN_SALES_DB_NOTES.md": () => writeIfMissing(join(projectRoot, "CN_SALES_DB_NOTES.md"), renderDbNotes(snapshot)),
    "CN_SALES_PHASE_LOG.md": () => appendUpdateLog(join(projectRoot, "CN_SALES_PHASE_LOG.md"), renderPhaseLogBase(), renderPhaseEntry(snapshot)),
    "CN_SALES_NEXT_ACTIONS.md": () => writeFile(join(projectRoot, "CN_SALES_NEXT_ACTIONS.md"), renderNextActions(snapshot)),
  };

  for (const fileName of PROJECT_FILES) {
    const filePath = fileWriters[fileName]();
    filesWritten.push(filePath);
  }

  return filesWritten;
}

function writeMinzNotes(vaultRoot, snapshot) {
  const filesWritten = [];
  const projectStatusPath = join(vaultRoot, "PROJECT_STATUS.md");
  const handoverPath = join(vaultRoot, "01_Project_Handovers", "09_CN_Sales_HANDOVER.md");
  const eventsPath = join(vaultRoot, "02_Project_Status", "AUTO_CHANGE_EVENTS.md");

  if (existsSync(projectStatusPath)) {
    writeRawFile(projectStatusPath, upsertProjectStatusRow(readFile(projectStatusPath), snapshot));
    filesWritten.push(projectStatusPath);
  }

  if (existsSync(dirname(handoverPath))) {
    appendUpdateLog(handoverPath, renderMinzHandoverBase(), renderUpdateEntry(snapshot));
    filesWritten.push(handoverPath);
  }

  if (existsSync(eventsPath)) {
    appendFileSync(eventsPath, `\n${renderAutoChangeEvent(snapshot)}`, "utf8");
    filesWritten.push(eventsPath);
  }

  return filesWritten;
}

function detectMinzStructure(vaultRoot) {
  return existsSync(join(vaultRoot, "PROJECT_STATUS.md"))
    && existsSync(join(vaultRoot, "01_Project_Handovers"))
    && existsSync(join(vaultRoot, "02_Project_Status", "AUTO_CHANGE_EVENTS.md"));
}

function renderReadme(snapshot) {
  return `# CN Sales\n\n## Overview\n\nCN Sales is the cn_sales-schema operating database and app workspace for ledger-based sales operations.\n\n## Repo\n\n- Path: \`${snapshot.repoPath}\`\n- Branch: \`${snapshot.branch}\`\n- Latest commit: \`${snapshot.latestCommit}\`\n\n## Local Commands\n\n\`\`\`powershell\nnpm run lint\nnpm run test\nnpm run test:worker\nnpm run build\nnpm run obsidian:cn-sales\n\`\`\`\n\n## Safety\n\n${markdownList(snapshot.safety)}\n`;
}

function renderStatus(snapshot) {
  return `# CN Sales Status\n\n## Current Status\n\n| Field | Value |\n| --- | --- |\n| Updated | ${snapshot.now} |\n| Repo | \`${snapshot.repoPath}\` |\n| Branch | \`${snapshot.branch}\` |\n| Latest commit | \`${snapshot.latestCommit}\` |\n| Phase | ${snapshot.phase} |\n| Migration | ${snapshot.migration} |\n| Seed | ${snapshot.seed} |\n| Storage bucket | ${snapshot.storage} |\n| GitHub PR | ${snapshot.pr} |\n| Blocker | ${snapshot.blocker} |\n\n## Changed Files\n\n${markdownList(snapshot.changedFiles)}\n\n## Verification\n\n- ${snapshot.verification}\n\n## Not Tested\n\n- ${snapshot.notTested}\n\n## Safety\n\n${markdownList(snapshot.safety)}\n\n## Update Log\n\n${renderUpdateEntry(snapshot)}\n`;
}

function renderHandoverBase() {
  return `# CN Sales Handover\n\n## Current Handoff\n\nUse the latest entry under Update Log first. Keep this file sanitized and summary-focused.\n\n## Update Log\n\n`;
}

function renderDecisions(snapshot) {
  return `# CN Sales Decisions\n\n## Active Decisions\n\n- Use the \`cn_sales\` schema for new CN Sales tables.\n- Keep privileged database writes on server-only paths.\n- Preserve ledger raw rows; do not auto-delete imported source evidence.\n- Avoid seed-only master data for ledger-derived codes; prefer import-driven upsert plus admin correction.\n- Keep claim media in private storage when storage is enabled.\n\n## Last Reviewed\n\n- ${snapshot.now}\n`;
}

function renderDbNotes(snapshot) {
  return `# CN Sales DB Notes\n\n## Current Snapshot\n\n| Area | Status |\n| --- | --- |\n| Migration | ${snapshot.migration} |\n| Seed | ${snapshot.seed} |\n| Storage bucket | ${snapshot.storage} |\n\n## Guardrails\n\n- Do not change existing public or cn_wms_dev tables from this workflow.\n- Do not run migration apply, seed apply, bucket creation, or DB writes without separate approval.\n- Record only schema/state summaries here; do not record secrets or raw customer data.\n`;
}

function renderPhaseLogBase() {
  return `# CN Sales Phase Log\n\n## Update Log\n\n`;
}

function renderPhaseEntry(snapshot) {
  return `### ${snapshot.now} - ${snapshot.phase}\n\n- Summary: ${snapshot.summary}\n- Changed files: ${inlineList(snapshot.changedFiles)}\n- Verification: ${snapshot.verification}\n- Migration: ${snapshot.migration}\n- Seed: ${snapshot.seed}\n- Storage bucket: ${snapshot.storage}\n- PR: ${snapshot.pr}\n- Next: ${snapshot.next}\n`;
}

function renderNextActions(snapshot) {
  return `# CN Sales Next Actions\n\n## Immediate Next\n\n- [ ] ${snapshot.next}\n\n## Approval Needed Before These Actions\n\n- [ ] migration apply\n- [ ] seed apply\n- [ ] storage bucket creation\n- [ ] DB write against Supabase\n- [ ] stage, commit, push, or PR creation\n- [ ] production deploy\n\n## Suggested Next Codex Prompt\n\n\`\`\`text\nContinue cn-sales from ${snapshot.phase}. Re-check repo status, preserve unrelated changes, run the approved validation commands, and keep Obsidian notes sanitized.\n\`\`\`\n`;
}

function renderMinzHandoverBase() {
  return `# CN Sales Handover\n\n## Update Log\n\n`;
}

function renderUpdateEntry(snapshot) {
  return `### ${snapshot.now} - ${snapshot.phase}\n\n- Repo: \`${snapshot.repoPath}\`\n- Branch: \`${snapshot.branch}\`\n- Work summary: ${snapshot.summary}\n- Changed files: ${inlineList(snapshot.changedFiles)}\n- Commit: \`${snapshot.latestCommit}\`\n- PR: ${snapshot.pr}\n- Push: no push by this script.\n- Deploy: no deploy by this script.\n- Verification: ${snapshot.verification}\n- Migration: ${snapshot.migration}\n- Seed: ${snapshot.seed}\n- Storage bucket: ${snapshot.storage}\n- Not tested: ${snapshot.notTested}\n- Blockers: ${snapshot.blocker}\n- Safety: ${inlineList(snapshot.safety)}\n- Next: ${snapshot.next}\n`;
}

function renderAutoChangeEvent(snapshot) {
  return `## ${snapshot.now} - CN Sales - updated\n\n- Project: ${PROJECT_NAME}\n- Repo path: \`${snapshot.repoPath}\`\n- Branch: \`${snapshot.branch}\`\n- Changed paths: ${inlineList(snapshot.changedFiles)}\n- User problem: Keep cn-sales progress durable across Codex threads and local handoffs.\n- Technical cause: Project work needs a sanitized local Markdown handoff outside the app runtime.\n- Action summary: ${snapshot.summary}\n- Data asset: sanitized status, decisions, DB notes, phase log, and next-action notes.\n- Validation commands and result: ${snapshot.verification}\n- Not tested: ${snapshot.notTested}\n- Side effects: local Markdown documentation only.\n- Commit/PR/deploy evidence: commit \`${snapshot.latestCommit}\`; PR ${snapshot.pr}; deploy no deploy by this script.\n- Safety boundaries preserved: ${inlineList(snapshot.safety)}\n- Production remaining work: ${snapshot.next}\n`;
}

function upsertProjectStatusRow(content, snapshot) {
  const row = `| CN Sales | active | \`${snapshot.repoPath}\` | ${snapshot.phase}: ${snapshot.summary} | ${snapshot.next} | ${snapshot.date}: branch \`${snapshot.branch}\`, commit \`${snapshot.latestCommit}\`; verification: ${snapshot.verification}; migration: ${snapshot.migration}; seed: ${snapshot.seed}; storage: ${snapshot.storage} | ${inlineList(snapshot.safety)} |`;
  const lines = content.split(/\r?\n/);
  const existingIndex = lines.findIndex((line) => /^\|\s*CN Sales\s*\|/.test(line));

  if (existingIndex >= 0) {
    lines[existingIndex] = row;
    return `${lines.join("\n").trimEnd()}\n`;
  }

  const lastTableRow = findLastProjectStatusTableRow(lines);
  if (lastTableRow >= 0) {
    lines.splice(lastTableRow + 1, 0, row);
    return `${lines.join("\n").trimEnd()}\n`;
  }

  return `${content.trimEnd()}\n${row}\n`;
}

function findLastProjectStatusTableRow(lines) {
  let lastIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\|.*\|$/.test(lines[index])) lastIndex = index;
  }
  return lastIndex;
}

function appendUpdateLog(filePath, baseContent, entry) {
  const safeEntry = enforceOutputSafety(entry);

  if (!existsSync(filePath)) {
    writeFile(filePath, `${baseContent.trimEnd()}\n\n${safeEntry.trimEnd()}\n`);
    return filePath;
  }

  const content = readFile(filePath);
  const nextContent = content.includes("## Update Log")
    ? `${content.trimEnd()}\n\n${safeEntry.trimEnd()}\n`
    : `${content.trimEnd()}\n\n## Update Log\n\n${safeEntry.trimEnd()}\n`;
  writeRawFile(filePath, nextContent);
  return filePath;
}

function writeIfMissing(filePath, content) {
  if (!existsSync(filePath)) {
    writeFile(filePath, content);
  }
  return filePath;
}

function writeFile(filePath, content) {
  ensureDirectory(dirname(filePath));
  const sanitizedContent = enforceOutputSafety(content);
  writeFileSync(filePath, `${sanitizedContent.trimEnd()}\n`, "utf8");
  return filePath;
}

function writeRawFile(filePath, content) {
  ensureDirectory(dirname(filePath));
  writeFileSync(filePath, `${content.trimEnd()}\n`, "utf8");
  return filePath;
}

function enforceOutputSafety(content) {
  let output = content;
  for (const term of FORBIDDEN_OUTPUT_TERMS) {
    output = output.replaceAll(term, "[REDACTED]");
  }
  return output;
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function git(args, cwd) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function formatKst(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formatter.format(date).replace(",", "")} KST`;
}

function formatKstDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function markdownList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function inlineList(items) {
  return items.length === 0 ? "none" : items.join("; ");
}

function normalizeOptionalPath(value) {
  if (!value) return "";
  return String(value).trim();
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isCli) {
  runCnSalesObsidianStatus().catch((error) => {
    console.error(`CN_SALES_OBSIDIAN_ERROR: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 0;
  });
}
