import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/uploads/preview/route";

vi.mock("server-only", () => ({}));

const jsonRows = [
  {
    date: "2026-06-05",
    row_type: "customer_total",
    part: "5",
    customer_name: "Synthetic Customer A",
    sales_amount: 20000,
    ar_balance: 30000,
  },
  {
    date: "2026-06-05",
    row_type: "item_detail",
    part: "5",
    customer_name: "Synthetic Customer A",
    product_name: "Synthetic Product A",
    quantity: 2,
    unit_price: 10000,
    sales_amount: 20000,
  },
];

describe("upload preview route response safety", () => {
  it("returns a sanitized 4xx response for unsupported upload files", async () => {
    const formData = new FormData();
    formData.set("file", new File(["not an xlsx file\n"], "invalid_upload.txt", { type: "text/plain" }));
    formData.set("partCode", "5");

    const response = await POST(new Request("http://localhost/api/uploads/preview", { method: "POST", body: formData }));
    const text = await response.text();

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    expect(text).toContain("INVALID_UPLOAD_FILE");
    for (const fragment of forbiddenDiagnosticFragments()) {
      expect(text).not.toContain(fragment);
    }
  });

  it("does not expose source row payload fields in successful preview responses", async () => {
    const response = await POST(new Request("http://localhost/api/uploads/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "cn-sales-upload-preview-synthetic-part-5.json",
        partCode: "5",
        rows: jsonRows,
      }),
    }));
    const text = await response.text();
    const body = JSON.parse(text) as { rows: Array<Record<string, unknown>>; apply?: { enabled?: boolean } };

    expect(response.status).toBe(200);
    for (const fragment of forbiddenSourceRowFragments()) {
      expect(text).not.toContain(fragment);
    }
    expect(body.rows.length).toBe(2);
    expect(body.rows[0]).toHaveProperty("rowKey");
    expect(body.rows[0]).not.toHaveProperty("identityHash");
    expect(body.rows[0]).not.toHaveProperty("contentHash");
    expect(body.apply?.enabled).toBe(false);
  });

  it("does not create repo-local upload persistence during preview", async () => {
    const localDataPath = join(process.cwd(), ".local-data");
    const existedBefore = existsSync(localDataPath);

    await POST(new Request("http://localhost/api/uploads/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fileName: "cn-sales-upload-preview-synthetic-part-5.json",
        partCode: "5",
        rows: jsonRows,
      }),
    }));

    expect(existsSync(localDataPath)).toBe(existedBefore);
  });
});

function forbiddenDiagnosticFragments() {
  return [
    "Trace" + "back",
    "sta" + "ck",
    "parser" + "." + "py",
    "open" + "pyxl",
    "C:" + "\\" + "Users",
    "/" + "Users" + "/",
    "/" + "tmp" + "/",
  ];
}

function forbiddenSourceRowFragments() {
  return [
    "raw" + "Row" + "Json",
    "raw" + "Rows",
    "raw" + "Row",
    "raw" + "_row",
    "raw" + " rows",
    "source" + "Raw" + "Row",
    "original" + "Row" + "Json",
  ];
}
