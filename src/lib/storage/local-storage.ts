import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StoredUploadFile, UploadStorageAdapter } from "@/lib/storage/types";

export class LocalUploadStorageAdapter implements UploadStorageAdapter {
  constructor(private readonly rootDir = path.join(process.cwd(), ".local-data", "uploads")) {}

  async save(file: File): Promise<StoredUploadFile> {
    await mkdir(this.rootDir, { recursive: true });
    const safeName = file.name.replace(/[^\w가-힣().,@=+$!;& -]/g, "_");
    const relativePath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    const fullPath = path.join(this.rootDir, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
    return { path: fullPath, fileName: file.name, size: file.size };
  }
}
