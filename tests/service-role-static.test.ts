import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getRuntimeEnvStatus } from "@/lib/env";

const browserClient = readFileSync(join(process.cwd(), "src", "lib", "supabase", "client.ts"), "utf8");
const serviceFactory = readFileSync(join(process.cwd(), "src", "lib", "import", "service-factory.ts"), "utf8");
const serviceRoleClient = readFileSync(join(process.cwd(), "src", "lib", "supabase", "service-role.ts"), "utf8");

describe("Phase 3-B server-only service role guards", () => {
  it("requires service role key presence for Supabase write mode", () => {
    const previous = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      publishable: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      backend: process.env.CN_SALES_IMPORT_BACKEND,
      allowWrites: process.env.CN_SALES_ALLOW_DB_WRITES,
      serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
    };

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable";
    process.env.CN_SALES_IMPORT_BACKEND = "supabase";
    process.env.CN_SALES_ALLOW_DB_WRITES = "true";
    process.env.NODE_ENV = "development";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(getRuntimeEnvStatus()).toMatchObject({
      mode: "fixture",
      canWrite: false,
    });
    expect(getRuntimeEnvStatus().blockedReasons).toContain("SUPABASE_SERVICE_ROLE_KEY is missing.");

    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only";
    expect(getRuntimeEnvStatus()).toMatchObject({
      mode: "supabase",
      canWrite: true,
    });

    restoreEnv(previous);
  });

  it("does not reference service role env in browser client code", () => {
    expect(browserClient).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(browserClient).not.toContain("service_role");
  });

  it("service factory uses server-only service role client for import writes", () => {
    expect(serviceFactory).toContain("createServiceRoleClient");
    expect(serviceRoleClient).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serviceRoleClient).toContain("server-only");
  });
});

function restoreEnv(previous: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}
