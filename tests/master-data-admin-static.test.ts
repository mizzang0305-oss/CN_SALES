import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const masterDataPageTsx = readFileSync(join(process.cwd(), "src", "app", "(pc)", "admin", "master-data", "page.tsx"), "utf8");
const erpMappingPageTsx = readFileSync(join(process.cwd(), "src", "app", "(pc)", "admin", "master-data", "erp-mapping", "page.tsx"), "utf8");

describe("master-data admin shell static checks", () => {
  it("exposes the requested master-data tabs", () => {
    for (const label of ["파트", "영업사원", "거래처", "상품", "상품군", "ERP 거래처 매칭", "ERP 상품 매칭", "중복/병합 후보"]) {
      expect(masterDataPageTsx).toContain(label);
    }
    expect(masterDataPageTsx).toContain("/admin/master-data/erp-mapping");
  });

  it("exposes the ERP mapping review columns without runtime write handlers", () => {
    for (const label of ["ERP 후보 코드", "ERP 후보명", "매칭 사유", "신뢰도", "상태", "승인", "거절", "수동 선택"]) {
      expect(erpMappingPageTsx).toContain(label);
    }
    expect(erpMappingPageTsx).not.toContain("onClick=");
    expect(erpMappingPageTsx).toContain("disabled");
  });
});
