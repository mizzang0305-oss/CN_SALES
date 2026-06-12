import { ImportService } from "@/lib/import/import-service";
import { getLocalImportRepository } from "@/lib/import/local-singleton";
import { SupabaseImportRepository } from "@/lib/import/supabase-repository";
import { parseWithPythonWorker } from "@/lib/import/python-parser";
import { getRuntimeEnvStatus } from "@/lib/env";
import { dashboardParts, getDashboardSummary } from "@/lib/data/mock";
import { LocalUploadStorageAdapter } from "@/lib/storage/local-storage";
import { SupabaseUploadStorageAdapter } from "@/lib/storage/supabase-storage";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { DashboardTotals, ImportRepository } from "@/lib/import/types";
import type { LedgerRawRow } from "@/lib/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createImportService(parseRows = parseWithPythonWorker) {
  const status = getRuntimeEnvStatus();
  if (!status.canWrite) {
    return {
      status,
      service: new ImportService({
        repository: getLocalImportRepository(),
        storage: new LocalUploadStorageAdapter(),
        parseRows,
        blockedReasons: [],
      }),
      repository: getLocalImportRepository(),
    };
  }

  const sessionClient = await createSupabaseServerClient();
  const serviceRoleClient = createServiceRoleClient();
  if (!sessionClient || !serviceRoleClient) {
    const blockedReasons = ["Supabase service role client could not be created."];
    return {
      status: { ...status, mode: "fixture" as const, canWrite: false, blockedReasons },
      service: new ImportService({
        repository: getLocalImportRepository(),
        storage: new LocalUploadStorageAdapter(),
        parseRows,
        blockedReasons,
      }),
      repository: getLocalImportRepository(),
    };
  }

  const contextPromise = SupabaseImportRepository.loadContext(sessionClient).catch((error) => {
    const adminProfileId = process.env.CN_SALES_ADMIN_AUTH_USER_ID;
    const canUseLocalAdminFallback =
      process.env.NODE_ENV !== "production" &&
      error instanceof Error &&
      error.message === "Supabase session is missing." &&
      Boolean(adminProfileId && uuidPattern.test(adminProfileId));

    if (canUseLocalAdminFallback) {
      return SupabaseImportRepository.loadContextForProfile(serviceRoleClient, adminProfileId as string);
    }

    throw error;
  });
  const repository = new SupabaseImportRepository(serviceRoleClient, contextPromise);
  return {
    status,
    service: new ImportService({
      repository,
      storage: new SupabaseUploadStorageAdapter(serviceRoleClient),
      parseRows,
      blockedReasons: [],
    }),
    repository,
  };
}

export async function createDashboardRepository(): Promise<{ status: ReturnType<typeof getRuntimeEnvStatus>; repository: ImportRepository | null }> {
  const status = getRuntimeEnvStatus();
  if (!status.canWrite) return { status, repository: null };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: { ...status, mode: "fixture", canWrite: false, blockedReasons: ["Supabase session client could not be created."] }, repository: null };
  return { status, repository: new SupabaseImportRepository(supabase) };
}

export async function getDashboardData(): Promise<DashboardTotals> {
  const { status, repository } = await createDashboardRepository();
  if (!repository) {
    const fixture = getDashboardSummary();
    return {
      ...fixture,
      parts: fixture.parts.length ? fixture.parts : dashboardParts,
      mode: "fixture",
      blockedReasons: status.blockedReasons,
    };
  }

  try {
    return await repository.getDashboardTotals();
  } catch (error) {
    const fixture = getDashboardSummary();
    return {
      ...fixture,
      parts: fixture.parts.length ? fixture.parts : dashboardParts,
      mode: "fixture",
      blockedReasons: [error instanceof Error ? error.message : "Supabase dashboard query failed."],
    };
  }
}

export function parseRowsFromJson(rows: LedgerRawRow[]) {
  return async () => rows;
}
