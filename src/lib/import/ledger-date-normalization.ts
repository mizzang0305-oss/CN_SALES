export type LedgerDateFormatCategory =
  | "yyyy-mm-dd"
  | "yyyy.m.d"
  | "yyyy/mm/dd"
  | "m/d/yyyy"
  | "excel-serial"
  | "korean-date"
  | "datetime"
  | "unknown";

export type LedgerDateIssue = "missing" | "invalid" | "out-of-scope";

export interface LedgerDateScope {
  periodStart?: string;
  periodEnd?: string;
}

export type LedgerDateNormalizationResult =
  | {
      ok: true;
      isoDate: string;
      formatCategory: LedgerDateFormatCategory;
      changedToIso: boolean;
      reason: null;
    }
  | {
      ok: false;
      isoDate: null;
      formatCategory: LedgerDateFormatCategory;
      changedToIso: false;
      reason: LedgerDateIssue;
    };

export const ledgerDateFormatCategories: LedgerDateFormatCategory[] = [
  "yyyy-mm-dd",
  "yyyy.m.d",
  "yyyy/mm/dd",
  "m/d/yyyy",
  "excel-serial",
  "korean-date",
  "datetime",
  "unknown",
];

export function createEmptyLedgerDateFormatCounts(): Record<LedgerDateFormatCategory, number> {
  return Object.fromEntries(ledgerDateFormatCategories.map((category) => [category, 0])) as Record<
    LedgerDateFormatCategory,
    number
  >;
}

export function normalizeLedgerDate(value: unknown, scope: LedgerDateScope = {}): LedgerDateNormalizationResult {
  const parsed = parseLedgerDate(value, scope);
  if (!parsed) {
    return {
      ok: false,
      isoDate: null,
      formatCategory: isMissing(value) ? "unknown" : categorizeInvalidDate(value),
      changedToIso: false,
      reason: isMissing(value) ? "missing" : "invalid",
    };
  }

  if (isOutsideScope(parsed.isoDate, scope)) {
    return {
      ok: false,
      isoDate: null,
      formatCategory: parsed.formatCategory,
      changedToIso: false,
      reason: "out-of-scope",
    };
  }

  return {
    ok: true,
    isoDate: parsed.isoDate,
    formatCategory: parsed.formatCategory,
    changedToIso: parsed.changedToIso,
    reason: null,
  };
}

export function isCanonicalLedgerDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && makeIsoDate(...splitDateParts(value)) === value;
}

function parseLedgerDate(
  value: unknown,
  scope: LedgerDateScope,
): { isoDate: string; formatCategory: LedgerDateFormatCategory; changedToIso: boolean } | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return {
      isoDate: formatIsoDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate()),
      formatCategory: "datetime",
      changedToIso: true,
    };
  }

  if (typeof value === "number") {
    return parseExcelSerialDate(value);
  }

  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;

  const canonical = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (canonical) return fromDateParts(canonical, "yyyy-mm-dd", false);

  const dotDate = text.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (dotDate) return fromDateParts(dotDate, "yyyy.m.d", true);

  const slashDate = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slashDate) return fromDateParts(slashDate, "yyyy/mm/dd", true);

  const usSlashDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usSlashDate) return fromMonthDayYearParts(usSlashDate, "m/d/yyyy");

  const koreanDate = text.match(/^(\d{4})\s*\uB144\s*(\d{1,2})\s*\uC6D4\s*(\d{1,2})\s*\uC77C$/);
  if (koreanDate) return fromDateParts(koreanDate, "korean-date", true);

  const scopedKoreanDay = text.match(/^[\[\u3010\s]*(\d{1,2})\s*\uC77C[\]\u3011\s]*$/);
  if (scopedKoreanDay) return fromScopedDayPart(scopedKoreanDay, scope);

  const dateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].+)$/);
  if (dateTime) return fromDateParts(dateTime, "datetime", true);

  return null;
}

function parseExcelSerialDate(value: number) {
  if (!Number.isFinite(value) || value < 1) return null;
  const wholeDays = Math.floor(value);
  const date = new Date(Date.UTC(1899, 11, 30) + wholeDays * 86_400_000);
  return {
    isoDate: formatIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()),
    formatCategory: "excel-serial" as const,
    changedToIso: true,
  };
}

function fromDateParts(
  match: RegExpMatchArray,
  formatCategory: LedgerDateFormatCategory,
  changedToIso: boolean,
) {
  const isoDate = makeIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
  if (!isoDate) return null;
  return { isoDate, formatCategory, changedToIso };
}

function fromMonthDayYearParts(match: RegExpMatchArray, formatCategory: LedgerDateFormatCategory) {
  const isoDate = makeIsoDate(Number(match[3]), Number(match[1]), Number(match[2]));
  if (!isoDate) return null;
  return { isoDate, formatCategory, changedToIso: true };
}

function fromScopedDayPart(match: RegExpMatchArray, scope: LedgerDateScope) {
  const scopeMonth = getSingleMonthScope(scope);
  if (!scopeMonth) return null;
  const isoDate = makeIsoDate(scopeMonth.year, scopeMonth.month, Number(match[1]));
  if (!isoDate) return null;
  return { isoDate, formatCategory: "korean-date" as const, changedToIso: true };
}

function getSingleMonthScope(scope: LedgerDateScope) {
  if (!scope.periodStart || !scope.periodEnd) return null;
  if (!isCanonicalLedgerDate(scope.periodStart) || !isCanonicalLedgerDate(scope.periodEnd)) return null;
  if (scope.periodStart.slice(0, 7) !== scope.periodEnd.slice(0, 7)) return null;
  const [year, month] = scope.periodStart.split("-").map(Number);
  return { year, month };
}

function makeIsoDate(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return formatIsoDate(year, month, day);
}

function formatIsoDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function isOutsideScope(isoDate: string, scope: LedgerDateScope) {
  const periodStart = scope.periodStart && isCanonicalLedgerDate(scope.periodStart) ? scope.periodStart : null;
  const periodEnd = scope.periodEnd && isCanonicalLedgerDate(scope.periodEnd) ? scope.periodEnd : null;
  return Boolean((periodStart && isoDate < periodStart) || (periodEnd && isoDate > periodEnd));
}

function splitDateParts(value: string): [number, number, number] {
  const [year, month, day] = value.split("-").map(Number);
  return [year, month, day];
}

function isMissing(value: unknown) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function categorizeInvalidDate(value: unknown): LedgerDateFormatCategory {
  if (typeof value === "number") return "excel-serial";
  if (value instanceof Date) return "datetime";
  if (typeof value !== "string") return "unknown";
  const text = value.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) return "yyyy-mm-dd";
  if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(text)) return "yyyy.m.d";
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(text)) return "yyyy/mm/dd";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) return "m/d/yyyy";
  if (/^\d{4}.+\uB144.+\uC6D4.+\uC77C$/.test(text)) return "korean-date";
  if (/^[\[\u3010\s]*\d{1,2}\s*\uC77C[\]\u3011\s]*$/.test(text)) return "korean-date";
  if (/^\d{4}-\d{1,2}-\d{1,2}(?:[T\s].+)$/.test(text)) return "datetime";
  return "unknown";
}
