import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type ObsidianWriter = typeof import("../scripts/obsidian/write-cn-sales-status.mjs");

const writerUrl = pathToFileURL(join(process.cwd(), "scripts", "obsidian", "write-cn-sales-status.mjs")).href;

let tempRoots: string[] = [];

beforeEach(() => {
  tempRoots = [];
});

afterEach(() => {
  for (const root of tempRoots) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe("cn-sales Obsidian status writer", () => {
  it("safe-skips when OBSIDIAN_VAULT_PATH is not set", async () => {
    const writer = await importWriter();

    const result = await writer.runCnSalesObsidianStatus({
      argv: [],
      cwd: process.cwd(),
      env: {},
      now: fixedNow(),
      writeOutput: () => undefined,
    });

    expect(result.status).toBe("skipped");
    expect(result.filesWritten).toEqual([]);
  });

  it("safe-blocks when OBSIDIAN_VAULT_PATH does not exist and does not create it", async () => {
    const writer = await importWriter();
    const missingVault = join(tmpdir(), `cn-sales-missing-vault-${Date.now()}`);

    const result = await writer.runCnSalesObsidianStatus({
      argv: [],
      cwd: process.cwd(),
      env: { OBSIDIAN_VAULT_PATH: missingVault },
      now: fixedNow(),
      writeOutput: () => undefined,
    });

    expect(result.status).toBe("blocked");
    expect(existsSync(missingVault)).toBe(false);
    expect(result.filesWritten).toEqual([]);
  });

  it("requires explicit project-folder init before creating the cn-sales folder", async () => {
    const writer = await importWriter();
    const vaultRoot = makeTempVault();

    const result = await writer.runCnSalesObsidianStatus({
      argv: ["--phase", "PR 1 Obsidian local logging"],
      cwd: process.cwd(),
      env: { OBSIDIAN_VAULT_PATH: vaultRoot },
      now: fixedNow(),
      writeOutput: () => undefined,
    });

    expect(result.status).toBe("blocked");
    expect(result.reason).toContain("CN_SALES_PROJECT_FOLDER_INIT_REQUIRED");
    expect(existsSync(join(vaultRoot, "00_projects", "cn-sales"))).toBe(false);
  });

  it("creates sanitized cn-sales project notes only when init is explicit", async () => {
    const writer = await importWriter();
    const vaultRoot = makeTempVault();
    const secretValue = "dummy-secret-value-that-must-not-be-written";

    const result = await writer.runCnSalesObsidianStatus({
      argv: [
        "--init-project-folder",
        "--phase",
        "PR 1 Obsidian local logging",
        "--summary",
        `Added local handover logger. Secret sample ${secretValue}`,
        "--verification",
        "npm run test -- tests/obsidian-writer.test.ts: PASS",
        "--migration",
        "not applied",
        "--seed",
        "not applied",
        "--storage",
        "not checked",
        "--next",
        "Prepare Phase 4-A schema PR",
      ],
      cwd: process.cwd(),
      env: {
        OBSIDIAN_VAULT_PATH: vaultRoot,
        SUPABASE_SERVICE_ROLE_KEY: secretValue,
      },
      now: fixedNow(),
      writeOutput: () => undefined,
    });

    expect(result.status).toBe("updated");

    const projectRoot = join(vaultRoot, "00_projects", "cn-sales");
    const expectedFiles = [
      "README.md",
      "CN_SALES_STATUS.md",
      "CN_SALES_HANDOVER.md",
      "CN_SALES_DECISIONS.md",
      "CN_SALES_DB_NOTES.md",
      "CN_SALES_PHASE_LOG.md",
      "CN_SALES_NEXT_ACTIONS.md",
    ];

    for (const fileName of expectedFiles) {
      const filePath = join(projectRoot, fileName);
      expect(existsSync(filePath)).toBe(true);
      const content = readFileSync(filePath, "utf8");
      expect(content).not.toContain(secretValue);
      expect(content).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(content).not.toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    }
  });

  it("preserves existing note content and appends to Update Log", async () => {
    const writer = await importWriter();
    const vaultRoot = makeTempVault();
    const handoverPath = join(vaultRoot, "00_projects", "cn-sales", "CN_SALES_HANDOVER.md");
    writer.ensureDirectory(join(vaultRoot, "00_projects", "cn-sales"));
    writeFileSync(handoverPath, "# Existing Handover\n\nKeep this section.\n\n## Update Log\n\n", "utf8");

    await writer.runCnSalesObsidianStatus({
      argv: [
        "--phase",
        "PR 1 Obsidian local logging",
        "--summary",
        "Append test",
      ],
      cwd: process.cwd(),
      env: { OBSIDIAN_VAULT_PATH: vaultRoot },
      now: fixedNow(),
      writeOutput: () => undefined,
    });

    const content = readFileSync(handoverPath, "utf8");
    expect(content).toContain("Keep this section.");
    expect(content).toContain("### 2026-06-09 10:00 KST - PR 1 Obsidian local logging");
    expect(content).toContain("- Work summary: Append test");
  });

  it("updates an existing Minz-OS vault without rewriting prior sanitized-or-legacy rows", async () => {
    const writer = await importWriter();
    const vaultRoot = makeTempVault();
    writer.ensureDirectory(join(vaultRoot, "01_Project_Handovers"));
    writer.ensureDirectory(join(vaultRoot, "02_Project_Status"));
    writeFileSync(
      join(vaultRoot, "PROJECT_STATUS.md"),
      [
        "# Project Status",
        "",
        "| Project | Status | Local Repo / Source | Current Focus | Next Action | Last Evidence | Safety Notes |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| Existing | active | `C:\\repo` | mentions SUPABASE_SERVICE_ROLE_KEY from old docs | next | evidence | safety |",
        "",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(join(vaultRoot, "02_Project_Status", "AUTO_CHANGE_EVENTS.md"), "# Events\n", "utf8");

    const result = await writer.runCnSalesObsidianStatus({
      argv: ["--phase", "PR 1 Obsidian local logging", "--summary", "Minz update"],
      cwd: process.cwd(),
      env: { OBSIDIAN_VAULT_PATH: vaultRoot },
      now: fixedNow(),
      writeOutput: () => undefined,
    });

    expect(result.status).toBe("updated");
    const statusContent = readFileSync(join(vaultRoot, "PROJECT_STATUS.md"), "utf8");
    expect(statusContent).toContain("mentions SUPABASE_SERVICE_ROLE_KEY from old docs");
    expect(statusContent).toContain("| CN Sales | active |");
    expect(existsSync(join(vaultRoot, "01_Project_Handovers", "09_CN_Sales_HANDOVER.md"))).toBe(true);
  });
});

async function importWriter(): Promise<ObsidianWriter> {
  return import(writerUrl);
}

function fixedNow() {
  return new Date("2026-06-09T10:00:00+09:00");
}

function makeTempVault() {
  const root = mkdtempSync(join(tmpdir(), "cn-sales-obsidian-"));
  tempRoots.push(root);
  return root;
}
