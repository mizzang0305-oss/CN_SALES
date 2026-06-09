export interface RuntimeEnvStatus {
  mode: "fixture" | "supabase";
  canWrite: boolean;
  blockedReasons: string[];
}

export function getRuntimeEnvStatus(): RuntimeEnvStatus {
  const blockedReasons: string[] = [];
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const wantsSupabase = process.env.CN_SALES_IMPORT_BACKEND === "supabase";
  const allowWrites = process.env.CN_SALES_ALLOW_DB_WRITES === "true";
  const nodeEnv = process.env.NODE_ENV;

  if (!hasUrl) blockedReasons.push("NEXT_PUBLIC_SUPABASE_URL is missing.");
  if (!hasKey) blockedReasons.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.");
  if (!hasServiceRoleKey) blockedReasons.push("SUPABASE_SERVICE_ROLE_KEY is missing.");
  if (!wantsSupabase) blockedReasons.push("CN_SALES_IMPORT_BACKEND is not set to supabase.");
  if (!allowWrites) blockedReasons.push("CN_SALES_ALLOW_DB_WRITES is not true.");
  if (nodeEnv === "production") blockedReasons.push("DB writes are disabled in production.");

  const canWrite = hasUrl && hasKey && hasServiceRoleKey && wantsSupabase && allowWrites && nodeEnv !== "production";

  return {
    mode: canWrite ? "supabase" : "fixture",
    canWrite,
    blockedReasons: canWrite ? [] : blockedReasons,
  };
}
