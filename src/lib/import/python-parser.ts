import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { LedgerRawRow } from "@/lib/types";

const execFileAsync = promisify(execFile);
const supportedWorkerExtensions = new Set([".xls", ".xlsx", ".json"]);
const workerStdoutMaxBuffer = 64 * 1024 * 1024;

export async function parseWithPythonWorker(input: { file: File; partCode: string; periodEnd: string }): Promise<LedgerRawRow[]> {
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());

  if (input.file.name.toLowerCase().endsWith(".json")) {
    return JSON.parse(fileBuffer.toString("utf8")) as LedgerRawRow[];
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "cn-sales-upload-"));
  const filePath = path.join(tempDir, getSafeWorkerFileName(input.file.name));
  await writeFile(filePath, fileBuffer);

  const { stdout } = await execFileAsync("python", [
    path.join(process.cwd(), "worker", "parser.py"),
    filePath,
    "--part-code",
    input.partCode,
    "--period-end",
    input.periodEnd,
  ], { maxBuffer: workerStdoutMaxBuffer });
  const parsed = JSON.parse(stdout) as Array<{ raw_row_json: LedgerRawRow }>;
  return parsed.map((row) => row.raw_row_json);
}

function getSafeWorkerFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const safeExtension = supportedWorkerExtensions.has(extension) ? extension : ".upload";
  return `upload-${randomUUID()}${safeExtension}`;
}
