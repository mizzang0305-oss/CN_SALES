import type { StoredUploadFile, UploadStorageAdapter } from "@/lib/storage/types";

export class MemoryStorageAdapter implements UploadStorageAdapter {
  readonly files = new Map<string, ArrayBuffer>();

  async save(file: File): Promise<StoredUploadFile> {
    const path = `memory://${crypto.randomUUID()}-${file.name}`;
    this.files.set(path, await file.arrayBuffer());
    return { path, fileName: file.name, size: file.size };
  }
}
