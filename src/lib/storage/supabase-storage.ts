import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoredUploadFile, UploadStorageAdapter } from "@/lib/storage/types";

export class SupabaseUploadStorageAdapter implements UploadStorageAdapter {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly bucket = "cn-sales-ledgers",
  ) {}

  async save(file: File): Promise<StoredUploadFile> {
    const safeName = file.name.replace(/[^\w가-힣().,@=+$!;& -]/g, "_");
    const storagePath = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await this.supabase.storage.from(this.bucket).upload(storagePath, file, {
      contentType: file.type || "application/vnd.ms-excel",
      upsert: false,
    });

    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`);
    }

    return { path: `${this.bucket}/${storagePath}`, fileName: file.name, size: file.size };
  }
}
