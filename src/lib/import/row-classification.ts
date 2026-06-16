import type { ImportAction, ParsedLedgerRow, RowIssueReason, RowIssueReasonCounts, RowIssueSeverity } from "@/lib/types";

type ParsedPreviewRow = ParsedLedgerRow & { action?: ImportAction };

export type RowIssue = {
  severity: RowIssueSeverity;
  reason: RowIssueReason;
};

export type RowIssueSummary = {
  excludedRows: number;
  warningRows: number;
  errorRows: number;
  excludedByReason: RowIssueReasonCounts;
  warningByReason: RowIssueReasonCounts;
  errorByReason: RowIssueReasonCounts;
};

const headerPattern = /\b(date|ledger|customer|product|quantity|unit|price|amount|row[_\s-]?type|header)\b/i;
const subtotalPattern = /\b(total|subtotal|summary|footer|grand|daily|opening|carry[ -]?forward)\b/i;

export function classifyRowIssue(row: ParsedPreviewRow): RowIssue | null {
  if (row.errors.length === 0) return null;

  if (row.rowType === "unknown") {
    return {
      severity: "excluded",
      reason: classifyExcludedReason(row),
    };
  }

  if (row.errors.includes("MISSING_LEDGER_DATE")) {
    return { severity: "error", reason: "MISSING_LEDGER_DATE" };
  }
  if (row.errors.includes("INVALID_LEDGER_DATE")) {
    return { severity: "error", reason: "INVALID_LEDGER_DATE" };
  }
  if (row.errors.includes("LEDGER_DATE_OUT_OF_SCOPE")) {
    return { severity: "error", reason: "LEDGER_DATE_OUT_OF_SCOPE" };
  }

  if ((row.rowType === "item_detail" || row.rowType === "customer_total" || row.rowType === "receipt") && !row.customerName) {
    return { severity: "error", reason: "MISSING_CUSTOMER" };
  }

  if (row.rowType === "item_detail" && !row.productName) {
    return { severity: "error", reason: "MISSING_PRODUCT" };
  }

  return { severity: "error", reason: "INVALID_REQUIRED_FIELD" };
}

export function summarizeRowIssues(rows: ParsedPreviewRow[]): RowIssueSummary {
  const summary: RowIssueSummary = {
    excludedRows: 0,
    warningRows: 0,
    errorRows: 0,
    excludedByReason: {},
    warningByReason: {},
    errorByReason: {},
  };

  for (const row of rows) {
    const issue = classifyRowIssue(row);
    if (!issue) continue;

    if (issue.severity === "excluded") {
      summary.excludedRows += 1;
      incrementReason(summary.excludedByReason, issue.reason);
    } else if (issue.severity === "warning") {
      summary.warningRows += 1;
      incrementReason(summary.warningByReason, issue.reason);
    } else {
      summary.errorRows += 1;
      incrementReason(summary.errorByReason, issue.reason);
    }
  }

  return {
    ...summary,
    excludedByReason: sortReasonCounts(summary.excludedByReason),
    warningByReason: sortReasonCounts(summary.warningByReason),
    errorByReason: sortReasonCounts(summary.errorByReason),
  };
}

export function isCommittablePreviewRow(row: ParsedPreviewRow) {
  return row.action !== "error";
}

function classifyExcludedReason(row: ParsedPreviewRow): RowIssueReason {
  const values = rawValues(row);
  if (values.length === 0) return "BLANK_ROW";

  const joined = values.join(" ");
  if (headerPattern.test(joined)) return "REPEATED_HEADER";
  if (subtotalPattern.test(joined)) return "SUBTOTAL_ROW";
  return "NON_TRANSACTION_ROW";
}

function rawValues(row: ParsedPreviewRow) {
  return Object.values(row.rawRowJson)
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function incrementReason(counts: RowIssueReasonCounts, reason: RowIssueReason) {
  counts[reason] = (counts[reason] ?? 0) + 1;
}

function sortReasonCounts(counts: RowIssueReasonCounts): RowIssueReasonCounts {
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}
