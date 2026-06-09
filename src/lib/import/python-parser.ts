import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { LedgerRawRow } from "@/lib/types";

const execFileAsync = promisify(execFile);

export async function parseWithPythonWorker(input: { file: File; partCode: string; periodEnd: string }): Promise<LedgerRawRow[]> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "cn-sales-upload-"));
  const filePath = path.join(tempDir, input.file.name.replace(/[^\w가-힣().,@=+$!;& -]/g, "_"));
  await writeFile(filePath, Buffer.from(await input.file.arrayBuffer()));

  if (input.file.name.toLowerCase().endsWith(".json")) {
    return JSON.parse(Buffer.from(await input.file.arrayBuffer()).toString("utf8")) as LedgerRawRow[];
  }

  const { stdout } = await execFileAsync("python", [
    path.join(process.cwd(), "worker", "parser.py"),
    filePath,
    "--part-code",
    input.partCode,
    "--period-end",
    input.periodEnd,
  ]);
  const parsed = JSON.parse(stdout) as Array<{ raw_row_json: LedgerRawRow }>;
  return parsed.map((row) => row.raw_row_json);
}
