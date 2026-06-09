export interface StoredUploadFile {
  path: string;
  fileName: string;
  size: number;
}

export interface UploadStorageAdapter {
  save(file: File): Promise<StoredUploadFile>;
}
