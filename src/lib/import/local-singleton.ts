import { MemoryImportRepository } from "@/lib/import/memory-repository";

const globalForImport = globalThis as typeof globalThis & {
  cnSalesMemoryImportRepository?: MemoryImportRepository;
};

export function getLocalImportRepository() {
  globalForImport.cnSalesMemoryImportRepository ??= new MemoryImportRepository();
  return globalForImport.cnSalesMemoryImportRepository;
}
