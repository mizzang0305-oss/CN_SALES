export interface LimitedApplyReadBackRow {
  id: string;
  upload_id: string;
  part_id: string;
  row_index: number;
  ledger_date: string;
  row_type: string;
  identity_hash: string;
  content_hash: string;
}

export interface LimitedApplyReadBackVerification {
  ok: boolean;
  executed: true;
  readBackRows: number;
  identityHashCount: number;
  matchesRequestedRows: boolean;
  identityHashMatch: boolean;
  partDateMatch: boolean;
  auditStatusPresent: boolean;
  contentHashPresent: boolean;
  selectedColumnsOnly: true;
  selectStarUsed: false;
  normalizedTableWriteRequired: false;
  blockedReasons: string[];
}

export function verifyLimitedApplyReadBack(input: {
  requestedRows: number;
  readBackRows: LimitedApplyReadBackRow[];
  expectedIdentityHashes: Iterable<string>;
  expectedPartId?: string;
  periodStart?: string;
  periodEnd?: string;
  auditStatusPresent?: boolean;
  normalizedTableWrite?: boolean;
}): LimitedApplyReadBackVerification {
  const expectedIdentityHashes = new Set(input.expectedIdentityHashes);
  const readBackIdentityHashes = new Set(input.readBackRows.map((row) => row.identity_hash));
  const matchesRequestedRows = input.readBackRows.length === input.requestedRows;
  const identityHashMatch =
    readBackIdentityHashes.size === expectedIdentityHashes.size &&
    [...expectedIdentityHashes].every((hash) => readBackIdentityHashes.has(hash));
  const partDateMatch = input.readBackRows.every((row) => {
    const partMatches = input.expectedPartId ? row.part_id === input.expectedPartId : true;
    const dateAfterStart = input.periodStart ? row.ledger_date >= input.periodStart : true;
    const dateBeforeEnd = input.periodEnd ? row.ledger_date <= input.periodEnd : true;
    return partMatches && dateAfterStart && dateBeforeEnd;
  });
  const contentHashPresent = input.readBackRows.every((row) => Boolean(row.content_hash));
  const auditStatusPresent = input.auditStatusPresent ?? true;

  const blockedReasons: string[] = [];
  if (!matchesRequestedRows) blockedReasons.push("READBACK_ROW_COUNT_MISMATCH");
  if (!identityHashMatch) blockedReasons.push("READBACK_IDENTITY_HASH_MISMATCH");
  if (!partDateMatch) blockedReasons.push("READBACK_PART_DATE_MISMATCH");
  if (!contentHashPresent) blockedReasons.push("READBACK_CONTENT_HASH_MISSING");
  if (!auditStatusPresent) blockedReasons.push("READBACK_AUDIT_STATUS_MISSING");

  return {
    ok: blockedReasons.length === 0,
    executed: true,
    readBackRows: input.readBackRows.length,
    identityHashCount: readBackIdentityHashes.size,
    matchesRequestedRows,
    identityHashMatch,
    partDateMatch,
    auditStatusPresent,
    contentHashPresent,
    selectedColumnsOnly: true,
    selectStarUsed: false,
    normalizedTableWriteRequired: false,
    blockedReasons,
  };
}
