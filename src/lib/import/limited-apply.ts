import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createEmptyLedgerDateFormatCounts,
  isCanonicalLedgerDate,
  normalizeLedgerDate,
  type LedgerDateFormatCategory,
} from "@/lib/import/ledger-date-normalization";
import { stableHash } from "@/lib/ledger/hash";
import type { LedgerSyncDiffPlan, LedgerSyncScope } from "@/lib/import/sync-diff";
import type { LedgerSyncRow } from "@/lib/import/sync-key";
import type { ParsedLedgerRow } from "@/lib/types";

export const G6B_EXPECTED_SOURCE_FILE_HASH =
  "sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0";
export const H2_EXPECTED_SOURCE_FILE_HASH =
  "sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42";
export const I2_EXPECTED_SOURCE_FILE_HASH =
  "sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd";
export const J2_EXPECTED_SOURCE_FILE_HASH =
  "sha256:5acf018ec065195bc8c122d43d9ed16eaa4e068f7182798c135fa9fc814ca8e9";
export const K2_EXPECTED_SOURCE_FILE_HASH =
  "sha256:a5c5ecf67009a83d2bb5639229462e9231ccff1e81291e0cecc365263597217a";
export const L2_EXPECTED_SOURCE_FILE_HASH =
  "sha256:0e4f909e5fe2d43e924e99352a6bdfa6f673357b5b2c41974b1981471ef2ad6a";
export const M2_EXPECTED_SOURCE_FILE_HASH =
  "sha256:3a99de5405c01e1e9eba7ca7e3c0ddeaf3f61947ace3bb0c6897bdedffb3700f";
export const N2_EXPECTED_SOURCE_FILE_HASH =
  "sha256:e18fd014bcffebb4df73839d6b70df4493709a303f6ec17fb2dd17405e1d6f3c";

const H2_FINAL_REMAINDER_WORKFLOW_GATE = "H-2F";
const H2_FINAL_REMAINDER_EXPECTED = {
  maxRows: 473,
  primaryScopeRows: 2473,
  existingScopedRows: 2000,
  insertCandidates: 473,
  updateCandidates: 0,
  deleteCandidates: 0,
  noChangeRows: 2000,
  expectedInsertedRows: 473,
};
const H2_STANDARD_WORKFLOW_GATES = new Set(["H-2B", "H-2C", "H-2D", "H-2E"]);

type ISeriesLimitedApplyStage = "I-2" | "I-3" | "I-4" | "I-5";
type JSeriesLimitedApplyStage = "J-2" | "J-3" | "J-4";
type KSeriesLimitedApplyStage = "K-2" | "K-3" | "K-4";
type LSeriesLimitedApplyStage = "L-2" | "L-3" | "L-4" | "L-5";
type MSeriesLimitedApplyStage = "M-2" | "M-3" | "M-4";
type NSeriesLimitedApplyStage = "N-2" | "N-3" | "N-4" | "N-5";

const I_SERIES_EXPECTED: Record<ISeriesLimitedApplyStage, {
  workflowGate: ISeriesLimitedApplyStage;
  approvalFileName: string;
  maxRows: number;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  deleteCandidates: number;
  noChangeRows: number;
  expectedInsertedRows: number;
}> = {
  "I-2": {
    workflowGate: "I-2",
    approvalFileName: "i2_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1528,
    existingScopedRows: 0,
    insertCandidates: 1528,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 0,
    expectedInsertedRows: 500,
  },
  "I-3": {
    workflowGate: "I-3",
    approvalFileName: "i3_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1528,
    existingScopedRows: 500,
    insertCandidates: 1028,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 500,
    expectedInsertedRows: 500,
  },
  "I-4": {
    workflowGate: "I-4",
    approvalFileName: "i4_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1528,
    existingScopedRows: 1000,
    insertCandidates: 528,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1000,
    expectedInsertedRows: 500,
  },
  "I-5": {
    workflowGate: "I-5",
    approvalFileName: "i5_limited_apply_approval.json",
    maxRows: 28,
    primaryScopeRows: 1528,
    existingScopedRows: 1500,
    insertCandidates: 28,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1500,
    expectedInsertedRows: 28,
  },
};

const J_SERIES_EXPECTED: Record<JSeriesLimitedApplyStage, {
  workflowGate: JSeriesLimitedApplyStage;
  approvalFileName: string;
  maxRows: number;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  deleteCandidates: number;
  noChangeRows: number;
  expectedInsertedRows: number;
}> = {
  "J-2": {
    workflowGate: "J-2",
    approvalFileName: "j2_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1295,
    existingScopedRows: 0,
    insertCandidates: 1295,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 0,
    expectedInsertedRows: 500,
  },
  "J-3": {
    workflowGate: "J-3",
    approvalFileName: "j3_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1295,
    existingScopedRows: 500,
    insertCandidates: 795,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 500,
    expectedInsertedRows: 500,
  },
  "J-4": {
    workflowGate: "J-4",
    approvalFileName: "j4_limited_apply_approval.json",
    maxRows: 295,
    primaryScopeRows: 1295,
    existingScopedRows: 1000,
    insertCandidates: 295,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1000,
    expectedInsertedRows: 295,
  },
};

const K_SERIES_EXPECTED: Record<KSeriesLimitedApplyStage, {
  workflowGate: KSeriesLimitedApplyStage;
  approvalFileName: string;
  maxRows: number;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  deleteCandidates: number;
  noChangeRows: number;
  expectedInsertedRows: number;
}> = {
  "K-2": {
    workflowGate: "K-2",
    approvalFileName: "k2_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1338,
    existingScopedRows: 0,
    insertCandidates: 1338,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 0,
    expectedInsertedRows: 500,
  },
  "K-3": {
    workflowGate: "K-3",
    approvalFileName: "k3_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1338,
    existingScopedRows: 500,
    insertCandidates: 838,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 500,
    expectedInsertedRows: 500,
  },
  "K-4": {
    workflowGate: "K-4",
    approvalFileName: "k4_limited_apply_approval.json",
    maxRows: 338,
    primaryScopeRows: 1338,
    existingScopedRows: 1000,
    insertCandidates: 338,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1000,
    expectedInsertedRows: 338,
  },
};

const L_SERIES_EXPECTED: Record<LSeriesLimitedApplyStage, {
  workflowGate: LSeriesLimitedApplyStage;
  approvalFileName: string;
  maxRows: number;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  deleteCandidates: number;
  noChangeRows: number;
  expectedInsertedRows: number;
}> = {
  "L-2": {
    workflowGate: "L-2",
    approvalFileName: "l2_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1546,
    existingScopedRows: 0,
    insertCandidates: 1546,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 0,
    expectedInsertedRows: 500,
  },
  "L-3": {
    workflowGate: "L-3",
    approvalFileName: "l3_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1546,
    existingScopedRows: 500,
    insertCandidates: 1046,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 500,
    expectedInsertedRows: 500,
  },
  "L-4": {
    workflowGate: "L-4",
    approvalFileName: "l4_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1546,
    existingScopedRows: 1000,
    insertCandidates: 546,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1000,
    expectedInsertedRows: 500,
  },
  "L-5": {
    workflowGate: "L-5",
    approvalFileName: "l5_limited_apply_approval.json",
    maxRows: 46,
    primaryScopeRows: 1546,
    existingScopedRows: 1500,
    insertCandidates: 46,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1500,
    expectedInsertedRows: 46,
  },
};

const M_SERIES_EXPECTED: Record<MSeriesLimitedApplyStage, {
  workflowGate: MSeriesLimitedApplyStage;
  approvalFileName: string;
  maxRows: number;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  deleteCandidates: number;
  noChangeRows: number;
  expectedInsertedRows: number;
}> = {
  "M-2": {
    workflowGate: "M-2",
    approvalFileName: "m2_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1359,
    existingScopedRows: 0,
    insertCandidates: 1359,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 0,
    expectedInsertedRows: 500,
  },
  "M-3": {
    workflowGate: "M-3",
    approvalFileName: "m3_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1359,
    existingScopedRows: 500,
    insertCandidates: 859,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 500,
    expectedInsertedRows: 500,
  },
  "M-4": {
    workflowGate: "M-4",
    approvalFileName: "m4_limited_apply_approval.json",
    maxRows: 359,
    primaryScopeRows: 1359,
    existingScopedRows: 1000,
    insertCandidates: 359,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1000,
    expectedInsertedRows: 359,
  },
};

const N_SERIES_EXPECTED: Record<NSeriesLimitedApplyStage, {
  workflowGate: NSeriesLimitedApplyStage;
  approvalFileName: string;
  maxRows: number;
  primaryScopeRows: number;
  existingScopedRows: number;
  insertCandidates: number;
  updateCandidates: number;
  deleteCandidates: number;
  noChangeRows: number;
  expectedInsertedRows: number;
}> = {
  "N-2": {
    workflowGate: "N-2",
    approvalFileName: "n2_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1920,
    existingScopedRows: 0,
    insertCandidates: 1920,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 0,
    expectedInsertedRows: 500,
  },
  "N-3": {
    workflowGate: "N-3",
    approvalFileName: "n3_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1920,
    existingScopedRows: 500,
    insertCandidates: 1420,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 500,
    expectedInsertedRows: 500,
  },
  "N-4": {
    workflowGate: "N-4",
    approvalFileName: "n4_limited_apply_approval.json",
    maxRows: 500,
    primaryScopeRows: 1920,
    existingScopedRows: 1000,
    insertCandidates: 920,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1000,
    expectedInsertedRows: 500,
  },
  "N-5": {
    workflowGate: "N-5",
    approvalFileName: "n5_limited_apply_approval.json",
    maxRows: 420,
    primaryScopeRows: 1920,
    existingScopedRows: 1500,
    insertCandidates: 420,
    updateCandidates: 0,
    deleteCandidates: 0,
    noChangeRows: 1500,
    expectedInsertedRows: 420,
  },
};

export type LimitedApplyStage =
  | "G-6B"
  | "G-6D"
  | "G-6E"
  | "G-6F"
  | "G-6G"
  | "G-6H"
  | "G-6I"
  | "H-2"
  | ISeriesLimitedApplyStage
  | JSeriesLimitedApplyStage
  | KSeriesLimitedApplyStage
  | LSeriesLimitedApplyStage
  | MSeriesLimitedApplyStage
  | NSeriesLimitedApplyStage;

export interface LimitedApplyStageConfig {
  stage: LimitedApplyStage;
  expectedTargetPartCode: string;
  expectedWorkflowGate?: string;
  approvalFileName: string;
  expectedMaxRows: number;
  expectedExistingScopedRows: number;
  expectedInsertCandidates: number;
  expectedNoChangeRows: number;
  requiresExplicitPeriod: boolean;
  expectedSourceFileHash: string;
  expectedDateFrom: string;
  expectedDateTo: string;
}

export const limitedApplyStageConfigs: Record<LimitedApplyStage, LimitedApplyStageConfig> = {
  "G-6B": {
    stage: "G-6B",
    expectedTargetPartCode: "11",
    approvalFileName: "g6b_limited_apply_approval.json",
    expectedMaxRows: 3,
    expectedExistingScopedRows: 0,
    expectedInsertCandidates: 2119,
    expectedNoChangeRows: 0,
    requiresExplicitPeriod: false,
    expectedSourceFileHash: G6B_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "G-6D": {
    stage: "G-6D",
    expectedTargetPartCode: "11",
    approvalFileName: "g6d_limited_apply_approval.json",
    expectedMaxRows: 30,
    expectedExistingScopedRows: 3,
    expectedInsertCandidates: 2116,
    expectedNoChangeRows: 3,
    requiresExplicitPeriod: false,
    expectedSourceFileHash: G6B_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "G-6E": {
    stage: "G-6E",
    expectedTargetPartCode: "11",
    approvalFileName: "g6e_limited_apply_approval.json",
    expectedMaxRows: 100,
    expectedExistingScopedRows: 33,
    expectedInsertCandidates: 2086,
    expectedNoChangeRows: 33,
    requiresExplicitPeriod: false,
    expectedSourceFileHash: G6B_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "G-6F": {
    stage: "G-6F",
    expectedTargetPartCode: "11",
    approvalFileName: "g6f_limited_apply_approval.json",
    expectedMaxRows: 500,
    expectedExistingScopedRows: 133,
    expectedInsertCandidates: 1986,
    expectedNoChangeRows: 133,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: G6B_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "G-6G": {
    stage: "G-6G",
    expectedTargetPartCode: "11",
    approvalFileName: "g6g_limited_apply_approval.json",
    expectedMaxRows: 500,
    expectedExistingScopedRows: 633,
    expectedInsertCandidates: 1486,
    expectedNoChangeRows: 633,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: G6B_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "G-6H": {
    stage: "G-6H",
    expectedTargetPartCode: "11",
    approvalFileName: "g6h_limited_apply_approval.json",
    expectedMaxRows: 500,
    expectedExistingScopedRows: 1133,
    expectedInsertCandidates: 986,
    expectedNoChangeRows: 1133,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: G6B_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "G-6I": {
    stage: "G-6I",
    expectedTargetPartCode: "11",
    approvalFileName: "g6i_limited_apply_approval.json",
    expectedMaxRows: 486,
    expectedExistingScopedRows: 1633,
    expectedInsertCandidates: 486,
    expectedNoChangeRows: 1633,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: G6B_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "H-2": {
    stage: "H-2",
    expectedTargetPartCode: "11",
    approvalFileName: "h2_limited_apply_approval.json",
    expectedMaxRows: 500,
    expectedExistingScopedRows: 0,
    expectedInsertCandidates: 2473,
    expectedNoChangeRows: 0,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: H2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-07",
    expectedDateTo: "2026-06-12",
  },
  "I-2": {
    stage: "I-2",
    expectedTargetPartCode: "1",
    expectedWorkflowGate: I_SERIES_EXPECTED["I-2"].workflowGate,
    approvalFileName: I_SERIES_EXPECTED["I-2"].approvalFileName,
    expectedMaxRows: I_SERIES_EXPECTED["I-2"].maxRows,
    expectedExistingScopedRows: I_SERIES_EXPECTED["I-2"].existingScopedRows,
    expectedInsertCandidates: I_SERIES_EXPECTED["I-2"].insertCandidates,
    expectedNoChangeRows: I_SERIES_EXPECTED["I-2"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "I-3": {
    stage: "I-3",
    expectedTargetPartCode: "1",
    expectedWorkflowGate: I_SERIES_EXPECTED["I-3"].workflowGate,
    approvalFileName: I_SERIES_EXPECTED["I-3"].approvalFileName,
    expectedMaxRows: I_SERIES_EXPECTED["I-3"].maxRows,
    expectedExistingScopedRows: I_SERIES_EXPECTED["I-3"].existingScopedRows,
    expectedInsertCandidates: I_SERIES_EXPECTED["I-3"].insertCandidates,
    expectedNoChangeRows: I_SERIES_EXPECTED["I-3"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "I-4": {
    stage: "I-4",
    expectedTargetPartCode: "1",
    expectedWorkflowGate: I_SERIES_EXPECTED["I-4"].workflowGate,
    approvalFileName: I_SERIES_EXPECTED["I-4"].approvalFileName,
    expectedMaxRows: I_SERIES_EXPECTED["I-4"].maxRows,
    expectedExistingScopedRows: I_SERIES_EXPECTED["I-4"].existingScopedRows,
    expectedInsertCandidates: I_SERIES_EXPECTED["I-4"].insertCandidates,
    expectedNoChangeRows: I_SERIES_EXPECTED["I-4"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "I-5": {
    stage: "I-5",
    expectedTargetPartCode: "1",
    expectedWorkflowGate: I_SERIES_EXPECTED["I-5"].workflowGate,
    approvalFileName: I_SERIES_EXPECTED["I-5"].approvalFileName,
    expectedMaxRows: I_SERIES_EXPECTED["I-5"].maxRows,
    expectedExistingScopedRows: I_SERIES_EXPECTED["I-5"].existingScopedRows,
    expectedInsertCandidates: I_SERIES_EXPECTED["I-5"].insertCandidates,
    expectedNoChangeRows: I_SERIES_EXPECTED["I-5"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: I2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "J-2": {
    stage: "J-2",
    expectedTargetPartCode: "4",
    expectedWorkflowGate: J_SERIES_EXPECTED["J-2"].workflowGate,
    approvalFileName: J_SERIES_EXPECTED["J-2"].approvalFileName,
    expectedMaxRows: J_SERIES_EXPECTED["J-2"].maxRows,
    expectedExistingScopedRows: J_SERIES_EXPECTED["J-2"].existingScopedRows,
    expectedInsertCandidates: J_SERIES_EXPECTED["J-2"].insertCandidates,
    expectedNoChangeRows: J_SERIES_EXPECTED["J-2"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: J2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "J-3": {
    stage: "J-3",
    expectedTargetPartCode: "4",
    expectedWorkflowGate: J_SERIES_EXPECTED["J-3"].workflowGate,
    approvalFileName: J_SERIES_EXPECTED["J-3"].approvalFileName,
    expectedMaxRows: J_SERIES_EXPECTED["J-3"].maxRows,
    expectedExistingScopedRows: J_SERIES_EXPECTED["J-3"].existingScopedRows,
    expectedInsertCandidates: J_SERIES_EXPECTED["J-3"].insertCandidates,
    expectedNoChangeRows: J_SERIES_EXPECTED["J-3"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: J2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "J-4": {
    stage: "J-4",
    expectedTargetPartCode: "4",
    expectedWorkflowGate: J_SERIES_EXPECTED["J-4"].workflowGate,
    approvalFileName: J_SERIES_EXPECTED["J-4"].approvalFileName,
    expectedMaxRows: J_SERIES_EXPECTED["J-4"].maxRows,
    expectedExistingScopedRows: J_SERIES_EXPECTED["J-4"].existingScopedRows,
    expectedInsertCandidates: J_SERIES_EXPECTED["J-4"].insertCandidates,
    expectedNoChangeRows: J_SERIES_EXPECTED["J-4"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: J2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "K-2": {
    stage: "K-2",
    expectedTargetPartCode: "4",
    expectedWorkflowGate: K_SERIES_EXPECTED["K-2"].workflowGate,
    approvalFileName: K_SERIES_EXPECTED["K-2"].approvalFileName,
    expectedMaxRows: K_SERIES_EXPECTED["K-2"].maxRows,
    expectedExistingScopedRows: K_SERIES_EXPECTED["K-2"].existingScopedRows,
    expectedInsertCandidates: K_SERIES_EXPECTED["K-2"].insertCandidates,
    expectedNoChangeRows: K_SERIES_EXPECTED["K-2"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: K2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-07",
    expectedDateTo: "2026-06-12",
  },
  "K-3": {
    stage: "K-3",
    expectedTargetPartCode: "4",
    expectedWorkflowGate: K_SERIES_EXPECTED["K-3"].workflowGate,
    approvalFileName: K_SERIES_EXPECTED["K-3"].approvalFileName,
    expectedMaxRows: K_SERIES_EXPECTED["K-3"].maxRows,
    expectedExistingScopedRows: K_SERIES_EXPECTED["K-3"].existingScopedRows,
    expectedInsertCandidates: K_SERIES_EXPECTED["K-3"].insertCandidates,
    expectedNoChangeRows: K_SERIES_EXPECTED["K-3"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: K2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-07",
    expectedDateTo: "2026-06-12",
  },
  "K-4": {
    stage: "K-4",
    expectedTargetPartCode: "4",
    expectedWorkflowGate: K_SERIES_EXPECTED["K-4"].workflowGate,
    approvalFileName: K_SERIES_EXPECTED["K-4"].approvalFileName,
    expectedMaxRows: K_SERIES_EXPECTED["K-4"].maxRows,
    expectedExistingScopedRows: K_SERIES_EXPECTED["K-4"].existingScopedRows,
    expectedInsertCandidates: K_SERIES_EXPECTED["K-4"].insertCandidates,
    expectedNoChangeRows: K_SERIES_EXPECTED["K-4"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: K2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-07",
    expectedDateTo: "2026-06-12",
  },
  "L-2": {
    stage: "L-2",
    expectedTargetPartCode: "5",
    expectedWorkflowGate: L_SERIES_EXPECTED["L-2"].workflowGate,
    approvalFileName: L_SERIES_EXPECTED["L-2"].approvalFileName,
    expectedMaxRows: L_SERIES_EXPECTED["L-2"].maxRows,
    expectedExistingScopedRows: L_SERIES_EXPECTED["L-2"].existingScopedRows,
    expectedInsertCandidates: L_SERIES_EXPECTED["L-2"].insertCandidates,
    expectedNoChangeRows: L_SERIES_EXPECTED["L-2"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: L2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "L-3": {
    stage: "L-3",
    expectedTargetPartCode: "5",
    expectedWorkflowGate: L_SERIES_EXPECTED["L-3"].workflowGate,
    approvalFileName: L_SERIES_EXPECTED["L-3"].approvalFileName,
    expectedMaxRows: L_SERIES_EXPECTED["L-3"].maxRows,
    expectedExistingScopedRows: L_SERIES_EXPECTED["L-3"].existingScopedRows,
    expectedInsertCandidates: L_SERIES_EXPECTED["L-3"].insertCandidates,
    expectedNoChangeRows: L_SERIES_EXPECTED["L-3"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: L2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "L-4": {
    stage: "L-4",
    expectedTargetPartCode: "5",
    expectedWorkflowGate: L_SERIES_EXPECTED["L-4"].workflowGate,
    approvalFileName: L_SERIES_EXPECTED["L-4"].approvalFileName,
    expectedMaxRows: L_SERIES_EXPECTED["L-4"].maxRows,
    expectedExistingScopedRows: L_SERIES_EXPECTED["L-4"].existingScopedRows,
    expectedInsertCandidates: L_SERIES_EXPECTED["L-4"].insertCandidates,
    expectedNoChangeRows: L_SERIES_EXPECTED["L-4"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: L2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "L-5": {
    stage: "L-5",
    expectedTargetPartCode: "5",
    expectedWorkflowGate: L_SERIES_EXPECTED["L-5"].workflowGate,
    approvalFileName: L_SERIES_EXPECTED["L-5"].approvalFileName,
    expectedMaxRows: L_SERIES_EXPECTED["L-5"].maxRows,
    expectedExistingScopedRows: L_SERIES_EXPECTED["L-5"].existingScopedRows,
    expectedInsertCandidates: L_SERIES_EXPECTED["L-5"].insertCandidates,
    expectedNoChangeRows: L_SERIES_EXPECTED["L-5"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: L2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "M-2": {
    stage: "M-2",
    expectedTargetPartCode: "6",
    expectedWorkflowGate: M_SERIES_EXPECTED["M-2"].workflowGate,
    approvalFileName: M_SERIES_EXPECTED["M-2"].approvalFileName,
    expectedMaxRows: M_SERIES_EXPECTED["M-2"].maxRows,
    expectedExistingScopedRows: M_SERIES_EXPECTED["M-2"].existingScopedRows,
    expectedInsertCandidates: M_SERIES_EXPECTED["M-2"].insertCandidates,
    expectedNoChangeRows: M_SERIES_EXPECTED["M-2"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: M2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "M-3": {
    stage: "M-3",
    expectedTargetPartCode: "6",
    expectedWorkflowGate: M_SERIES_EXPECTED["M-3"].workflowGate,
    approvalFileName: M_SERIES_EXPECTED["M-3"].approvalFileName,
    expectedMaxRows: M_SERIES_EXPECTED["M-3"].maxRows,
    expectedExistingScopedRows: M_SERIES_EXPECTED["M-3"].existingScopedRows,
    expectedInsertCandidates: M_SERIES_EXPECTED["M-3"].insertCandidates,
    expectedNoChangeRows: M_SERIES_EXPECTED["M-3"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: M2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "M-4": {
    stage: "M-4",
    expectedTargetPartCode: "6",
    expectedWorkflowGate: M_SERIES_EXPECTED["M-4"].workflowGate,
    approvalFileName: M_SERIES_EXPECTED["M-4"].approvalFileName,
    expectedMaxRows: M_SERIES_EXPECTED["M-4"].maxRows,
    expectedExistingScopedRows: M_SERIES_EXPECTED["M-4"].existingScopedRows,
    expectedInsertCandidates: M_SERIES_EXPECTED["M-4"].insertCandidates,
    expectedNoChangeRows: M_SERIES_EXPECTED["M-4"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: M2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "N-2": {
    stage: "N-2",
    expectedTargetPartCode: "7",
    expectedWorkflowGate: N_SERIES_EXPECTED["N-2"].workflowGate,
    approvalFileName: N_SERIES_EXPECTED["N-2"].approvalFileName,
    expectedMaxRows: N_SERIES_EXPECTED["N-2"].maxRows,
    expectedExistingScopedRows: N_SERIES_EXPECTED["N-2"].existingScopedRows,
    expectedInsertCandidates: N_SERIES_EXPECTED["N-2"].insertCandidates,
    expectedNoChangeRows: N_SERIES_EXPECTED["N-2"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: N2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "N-3": {
    stage: "N-3",
    expectedTargetPartCode: "7",
    expectedWorkflowGate: N_SERIES_EXPECTED["N-3"].workflowGate,
    approvalFileName: N_SERIES_EXPECTED["N-3"].approvalFileName,
    expectedMaxRows: N_SERIES_EXPECTED["N-3"].maxRows,
    expectedExistingScopedRows: N_SERIES_EXPECTED["N-3"].existingScopedRows,
    expectedInsertCandidates: N_SERIES_EXPECTED["N-3"].insertCandidates,
    expectedNoChangeRows: N_SERIES_EXPECTED["N-3"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: N2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "N-4": {
    stage: "N-4",
    expectedTargetPartCode: "7",
    expectedWorkflowGate: N_SERIES_EXPECTED["N-4"].workflowGate,
    approvalFileName: N_SERIES_EXPECTED["N-4"].approvalFileName,
    expectedMaxRows: N_SERIES_EXPECTED["N-4"].maxRows,
    expectedExistingScopedRows: N_SERIES_EXPECTED["N-4"].existingScopedRows,
    expectedInsertCandidates: N_SERIES_EXPECTED["N-4"].insertCandidates,
    expectedNoChangeRows: N_SERIES_EXPECTED["N-4"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: N2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
  "N-5": {
    stage: "N-5",
    expectedTargetPartCode: "7",
    expectedWorkflowGate: N_SERIES_EXPECTED["N-5"].workflowGate,
    approvalFileName: N_SERIES_EXPECTED["N-5"].approvalFileName,
    expectedMaxRows: N_SERIES_EXPECTED["N-5"].maxRows,
    expectedExistingScopedRows: N_SERIES_EXPECTED["N-5"].existingScopedRows,
    expectedInsertCandidates: N_SERIES_EXPECTED["N-5"].insertCandidates,
    expectedNoChangeRows: N_SERIES_EXPECTED["N-5"].noChangeRows,
    requiresExplicitPeriod: true,
    expectedSourceFileHash: N2_EXPECTED_SOURCE_FILE_HASH,
    expectedDateFrom: "2026-06-01",
    expectedDateTo: "2026-06-06",
  },
};

export const LIMITED_APPLY_STAGE_POLICIES = Object.fromEntries(
  Object.entries(limitedApplyStageConfigs).map(([stage, config]) => [
    stage,
    {
      maxRows: config.expectedMaxRows,
      requiresExplicitPeriod: config.requiresExplicitPeriod,
    },
  ]),
) as Record<LimitedApplyStage, { maxRows: number; requiresExplicitPeriod: boolean }>;

export interface LimitedApplyApproval {
  workflowGate?: string;
  stage: LimitedApplyStage;
  target_part: string | number;
  test_file_hash: string;
  date_from: string;
  date_to: string;
  max_rows: number;
  apply_mode: "limited-apply";
  allowed_operations: string[];
  blocked_operations: string[];
  operator: string;
  rollback_owner: string;
  confirm_db_apply_approved: boolean;
  production_post_approved: boolean;
  migration_seed_storage_approved: boolean;
  delete_approved: boolean;
  update_approved: boolean;
  full_apply_approved?: boolean;
  expectedInsertedRows?: number;
  source_preview?: {
    primaryScopeRows?: number;
    existingScopedRows?: number;
    insertCandidates?: number;
    updateCandidates?: number;
    deleteCandidates?: number;
    noChangeRows?: number;
  };
}

export interface LimitedApplyApprovalValidation {
  ok: boolean;
  blockedReasons: string[];
  approval?: LimitedApplyApproval;
}

export interface LimitedApplyRowSelection {
  row: ParsedLedgerRow;
  syncRow: LedgerSyncRow;
  identityHash: string;
  contentHash: string;
}

export interface LimitedApplySelectionDiagnostics {
  stage: LimitedApplyStage;
  insertCandidates: number;
  maxRows: number;
  candidateRows: number;
  selectedRowsDryRunEquivalent: number;
  candidateDigestMatchesSelector: boolean;
  orderDigestMatchesSelector: boolean;
  candidateIdentityDigest: string;
  selectorIdentityDigest: string;
  candidateOrderDigest: string;
  selectorOrderDigest: string;
  rawRowsReturned: false;
}

export interface LimitedApplyDateDiagnostics {
  checkedRows: number;
  canonicalIsoLedgerDateCount: number;
  nonIsoLedgerDateCandidates: number;
  invalidLedgerDateCandidates: number;
  missingLedgerDateCandidates: number;
  dateOutsideScopeCandidates: number;
  parseableNonIsoCount: number;
  normalizedToIsoCount: number;
  formatCategories: Record<LedgerDateFormatCategory, number>;
  rawRowsReturned: false;
}

export async function loadLimitedApplyApproval(
  stage: LimitedApplyStage = "G-6B",
): Promise<LimitedApplyApprovalValidation> {
  const approvalPath = join(process.cwd(), ".local-approval", limitedApplyStageConfigs[stage].approvalFileName);
  try {
    const contents = (await readFile(approvalPath, "utf8")).replace(/^\uFEFF/, "");
    return validateLimitedApplyApproval(JSON.parse(contents));
  } catch {
    return {
      ok: false,
      blockedReasons: ["APPROVAL_FILE_MISSING_OR_UNREADABLE"],
    };
  }
}

export function validateLimitedApplyApproval(input: unknown): LimitedApplyApprovalValidation {
  if (!isRecord(input)) {
    return { ok: false, blockedReasons: ["APPROVAL_INVALID_JSON"] };
  }

  const approval = input as unknown as LimitedApplyApproval;
  const blockedReasons: string[] = [];
  const targetPart = String(approval.target_part ?? "").trim();
  const workflowGate = getApprovalWorkflowGate(approval);
  const config = getLimitedApplyStageConfig(approval.stage);
  const h2FinalRemainderApproval = approval.stage === "H-2" && workflowGate === H2_FINAL_REMAINDER_WORKFLOW_GATE;
  const iSeriesExpected = getISeriesExpected(approval.stage);
  const jSeriesExpected = getJSeriesExpected(approval.stage);
  const kSeriesExpected = getKSeriesExpected(approval.stage);
  const lSeriesExpected = getLSeriesExpected(approval.stage);
  const mSeriesExpected = getMSeriesExpected(approval.stage);
  const nSeriesExpected = getNSeriesExpected(approval.stage);

  if (!config) blockedReasons.push("APPROVAL_STAGE_MISMATCH");
  if (!config || targetPart !== config.expectedTargetPartCode) blockedReasons.push("APPROVAL_TARGET_PART_MISMATCH");
  if (config && approval.test_file_hash !== config.expectedSourceFileHash) blockedReasons.push("APPROVAL_FILE_HASH_MISMATCH");
  if (config && (approval.date_from !== config.expectedDateFrom || approval.date_to !== config.expectedDateTo)) {
    blockedReasons.push("APPROVAL_DATE_RANGE_MISMATCH");
  }
  if (config?.expectedWorkflowGate && workflowGate !== config.expectedWorkflowGate) {
    blockedReasons.push("APPROVAL_WORKFLOW_GATE_UNSUPPORTED");
  }
  if (approval.stage === "H-2" && workflowGate && !H2_STANDARD_WORKFLOW_GATES.has(workflowGate) && workflowGate !== H2_FINAL_REMAINDER_WORKFLOW_GATE) {
    blockedReasons.push("APPROVAL_WORKFLOW_GATE_UNSUPPORTED");
  }
  if (h2FinalRemainderApproval) {
    validateH2FinalRemainderApprovalShape(approval, blockedReasons);
  } else if (iSeriesExpected) {
    validateISeriesApprovalShape(approval, blockedReasons, iSeriesExpected);
  } else if (jSeriesExpected) {
    validateJSeriesApprovalShape(approval, blockedReasons, jSeriesExpected);
  } else if (kSeriesExpected) {
    validateKSeriesApprovalShape(approval, blockedReasons, kSeriesExpected);
  } else if (lSeriesExpected) {
    validateLSeriesApprovalShape(approval, blockedReasons, lSeriesExpected);
  } else if (mSeriesExpected) {
    validateMSeriesApprovalShape(approval, blockedReasons, mSeriesExpected);
  } else if (nSeriesExpected) {
    validateNSeriesApprovalShape(approval, blockedReasons, nSeriesExpected);
  } else if (!config || approval.max_rows !== config.expectedMaxRows) {
    blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  }
  if (approval.apply_mode !== "limited-apply") blockedReasons.push("APPROVAL_MODE_MISMATCH");
  if (!isInsertOnly(approval.allowed_operations)) blockedReasons.push("APPROVAL_ALLOWED_OPERATIONS_NOT_INSERT_ONLY");
  if (!hasBlockedOperations(approval.blocked_operations)) blockedReasons.push("APPROVAL_BLOCKED_OPERATIONS_INCOMPLETE");
  if (!approval.operator) blockedReasons.push("APPROVAL_OPERATOR_MISSING");
  if (!approval.rollback_owner) blockedReasons.push("APPROVAL_ROLLBACK_OWNER_MISSING");
  if (approval.confirm_db_apply_approved !== true) blockedReasons.push("APPROVAL_DB_APPLY_NOT_CONFIRMED");
  if (approval.production_post_approved !== false) blockedReasons.push("APPROVAL_PRODUCTION_POST_ENABLED");
  if (approval.migration_seed_storage_approved !== false) blockedReasons.push("APPROVAL_MIGRATION_SEED_STORAGE_ENABLED");
  if (approval.delete_approved !== false) blockedReasons.push("APPROVAL_DELETE_ENABLED");
  if (approval.update_approved !== false) blockedReasons.push("APPROVAL_UPDATE_ENABLED");
  if (approval.full_apply_approved === true) blockedReasons.push("APPROVAL_FULL_APPLY_ENABLED");

  return {
    ok: blockedReasons.length === 0,
    blockedReasons,
    approval: blockedReasons.length === 0 ? approval : undefined,
  };
}

function getApprovalWorkflowGate(approval: LimitedApplyApproval) {
  return typeof approval.workflowGate === "string" ? approval.workflowGate.trim() : "";
}

function getISeriesExpected(stage: unknown) {
  if (stage === "I-2" || stage === "I-3" || stage === "I-4" || stage === "I-5") {
    return I_SERIES_EXPECTED[stage];
  }
  return null;
}

function getJSeriesExpected(stage: unknown) {
  if (stage === "J-2" || stage === "J-3" || stage === "J-4") {
    return J_SERIES_EXPECTED[stage];
  }
  return null;
}

function getKSeriesExpected(stage: unknown) {
  if (stage === "K-2" || stage === "K-3" || stage === "K-4") {
    return K_SERIES_EXPECTED[stage];
  }
  return null;
}

function getLSeriesExpected(stage: unknown) {
  if (stage === "L-2" || stage === "L-3" || stage === "L-4" || stage === "L-5") {
    return L_SERIES_EXPECTED[stage];
  }
  return null;
}

function getMSeriesExpected(stage: unknown) {
  if (stage === "M-2" || stage === "M-3" || stage === "M-4") {
    return M_SERIES_EXPECTED[stage];
  }
  return null;
}

function getNSeriesExpected(stage: unknown) {
  if (stage === "N-2" || stage === "N-3" || stage === "N-4" || stage === "N-5") {
    return N_SERIES_EXPECTED[stage];
  }
  return null;
}

function validateISeriesApprovalShape(
  approval: LimitedApplyApproval,
  blockedReasons: string[],
  expected: (typeof I_SERIES_EXPECTED)[ISeriesLimitedApplyStage],
) {
  const sourcePreview = approval.source_preview ?? {};
  if (approval.max_rows !== expected.maxRows) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  if (approval.expectedInsertedRows !== expected.expectedInsertedRows) {
    blockedReasons.push("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
  }
  if (sourcePreview.primaryScopeRows !== expected.primaryScopeRows) {
    blockedReasons.push("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
  }
  if (sourcePreview.existingScopedRows !== expected.existingScopedRows) {
    blockedReasons.push("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (sourcePreview.insertCandidates !== expected.insertCandidates) {
    blockedReasons.push("APPROVAL_INSERT_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.updateCandidates !== expected.updateCandidates) {
    blockedReasons.push("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.deleteCandidates !== expected.deleteCandidates) {
    blockedReasons.push("APPROVAL_DELETE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.noChangeRows !== expected.noChangeRows) {
    blockedReasons.push("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
  }
}

function validateJSeriesApprovalShape(
  approval: LimitedApplyApproval,
  blockedReasons: string[],
  expected: (typeof J_SERIES_EXPECTED)[JSeriesLimitedApplyStage],
) {
  const sourcePreview = approval.source_preview ?? {};
  if (approval.max_rows !== expected.maxRows) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  if (approval.expectedInsertedRows !== expected.expectedInsertedRows) {
    blockedReasons.push("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
  }
  if (sourcePreview.primaryScopeRows !== expected.primaryScopeRows) {
    blockedReasons.push("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
  }
  if (sourcePreview.existingScopedRows !== expected.existingScopedRows) {
    blockedReasons.push("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (sourcePreview.insertCandidates !== expected.insertCandidates) {
    blockedReasons.push("APPROVAL_INSERT_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.updateCandidates !== expected.updateCandidates) {
    blockedReasons.push("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.deleteCandidates !== expected.deleteCandidates) {
    blockedReasons.push("APPROVAL_DELETE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.noChangeRows !== expected.noChangeRows) {
    blockedReasons.push("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
  }
}

function validateKSeriesApprovalShape(
  approval: LimitedApplyApproval,
  blockedReasons: string[],
  expected: (typeof K_SERIES_EXPECTED)[KSeriesLimitedApplyStage],
) {
  const sourcePreview = approval.source_preview ?? {};
  if (approval.max_rows !== expected.maxRows) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  if (approval.expectedInsertedRows !== expected.expectedInsertedRows) {
    blockedReasons.push("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
  }
  if (sourcePreview.primaryScopeRows !== expected.primaryScopeRows) {
    blockedReasons.push("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
  }
  if (sourcePreview.existingScopedRows !== expected.existingScopedRows) {
    blockedReasons.push("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (sourcePreview.insertCandidates !== expected.insertCandidates) {
    blockedReasons.push("APPROVAL_INSERT_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.updateCandidates !== expected.updateCandidates) {
    blockedReasons.push("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.deleteCandidates !== expected.deleteCandidates) {
    blockedReasons.push("APPROVAL_DELETE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.noChangeRows !== expected.noChangeRows) {
    blockedReasons.push("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
  }
}

function validateLSeriesApprovalShape(
  approval: LimitedApplyApproval,
  blockedReasons: string[],
  expected: (typeof L_SERIES_EXPECTED)[LSeriesLimitedApplyStage],
) {
  const sourcePreview = approval.source_preview ?? {};
  if (approval.max_rows !== expected.maxRows) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  if (approval.expectedInsertedRows !== expected.expectedInsertedRows) {
    blockedReasons.push("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
  }
  if (sourcePreview.primaryScopeRows !== expected.primaryScopeRows) {
    blockedReasons.push("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
  }
  if (sourcePreview.existingScopedRows !== expected.existingScopedRows) {
    blockedReasons.push("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (sourcePreview.insertCandidates !== expected.insertCandidates) {
    blockedReasons.push("APPROVAL_INSERT_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.updateCandidates !== expected.updateCandidates) {
    blockedReasons.push("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.deleteCandidates !== expected.deleteCandidates) {
    blockedReasons.push("APPROVAL_DELETE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.noChangeRows !== expected.noChangeRows) {
    blockedReasons.push("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
  }
}

function validateMSeriesApprovalShape(
  approval: LimitedApplyApproval,
  blockedReasons: string[],
  expected: (typeof M_SERIES_EXPECTED)[MSeriesLimitedApplyStage],
) {
  const sourcePreview = approval.source_preview ?? {};
  if (approval.max_rows !== expected.maxRows) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  if (approval.expectedInsertedRows !== expected.expectedInsertedRows) {
    blockedReasons.push("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
  }
  if (sourcePreview.primaryScopeRows !== expected.primaryScopeRows) {
    blockedReasons.push("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
  }
  if (sourcePreview.existingScopedRows !== expected.existingScopedRows) {
    blockedReasons.push("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (sourcePreview.insertCandidates !== expected.insertCandidates) {
    blockedReasons.push("APPROVAL_INSERT_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.updateCandidates !== expected.updateCandidates) {
    blockedReasons.push("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.deleteCandidates !== expected.deleteCandidates) {
    blockedReasons.push("APPROVAL_DELETE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.noChangeRows !== expected.noChangeRows) {
    blockedReasons.push("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
  }
}

function validateNSeriesApprovalShape(
  approval: LimitedApplyApproval,
  blockedReasons: string[],
  expected: (typeof N_SERIES_EXPECTED)[NSeriesLimitedApplyStage],
) {
  const sourcePreview = approval.source_preview ?? {};
  if (approval.max_rows !== expected.maxRows) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  if (approval.expectedInsertedRows !== expected.expectedInsertedRows) {
    blockedReasons.push("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
  }
  if (sourcePreview.primaryScopeRows !== expected.primaryScopeRows) {
    blockedReasons.push("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
  }
  if (sourcePreview.existingScopedRows !== expected.existingScopedRows) {
    blockedReasons.push("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (sourcePreview.insertCandidates !== expected.insertCandidates) {
    blockedReasons.push("APPROVAL_INSERT_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.updateCandidates !== expected.updateCandidates) {
    blockedReasons.push("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.deleteCandidates !== expected.deleteCandidates) {
    blockedReasons.push("APPROVAL_DELETE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.noChangeRows !== expected.noChangeRows) {
    blockedReasons.push("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
  }
}

function validateH2FinalRemainderApprovalShape(approval: LimitedApplyApproval, blockedReasons: string[]) {
  const sourcePreview = approval.source_preview ?? {};
  if (approval.max_rows !== H2_FINAL_REMAINDER_EXPECTED.maxRows) blockedReasons.push("APPROVAL_MAX_ROWS_EXCEEDS_LIMIT");
  if (approval.expectedInsertedRows !== H2_FINAL_REMAINDER_EXPECTED.expectedInsertedRows) {
    blockedReasons.push("APPROVAL_EXPECTED_INSERTED_ROWS_MISMATCH");
  }
  if (sourcePreview.primaryScopeRows !== H2_FINAL_REMAINDER_EXPECTED.primaryScopeRows) {
    blockedReasons.push("APPROVAL_PRIMARY_SCOPE_ROWS_MISMATCH");
  }
  if (sourcePreview.existingScopedRows !== H2_FINAL_REMAINDER_EXPECTED.existingScopedRows) {
    blockedReasons.push("APPROVAL_EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (sourcePreview.insertCandidates !== H2_FINAL_REMAINDER_EXPECTED.insertCandidates) {
    blockedReasons.push("APPROVAL_INSERT_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.updateCandidates !== H2_FINAL_REMAINDER_EXPECTED.updateCandidates) {
    blockedReasons.push("APPROVAL_UPDATE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.deleteCandidates !== H2_FINAL_REMAINDER_EXPECTED.deleteCandidates) {
    blockedReasons.push("APPROVAL_DELETE_CANDIDATES_MISMATCH");
  }
  if (sourcePreview.noChangeRows !== H2_FINAL_REMAINDER_EXPECTED.noChangeRows) {
    blockedReasons.push("APPROVAL_NO_CHANGE_ROWS_MISMATCH");
  }
}

export function selectLimitedApplyRows(input: {
  rows: ParsedLedgerRow[];
  syncRows: LedgerSyncRow[];
  existingRows: LedgerSyncRow[];
  maxRows: number;
}): LimitedApplyRowSelection[] {
  return getLimitedApplyCandidateRows(input).slice(0, Math.max(0, input.maxRows));
}

export function getLimitedApplyCandidateRows(input: {
  rows: ParsedLedgerRow[];
  syncRows: LedgerSyncRow[];
  existingRows: LedgerSyncRow[];
}): LimitedApplyRowSelection[] {
  const existingBySyncKey = new Set(input.existingRows.map((row) => row.syncKey));

  return input.rows
    .map((row, index) => ({ row, syncRow: input.syncRows[index] }))
    .filter((item): item is { row: ParsedLedgerRow; syncRow: LedgerSyncRow } => Boolean(item.syncRow))
    .filter((item) => !existingBySyncKey.has(item.syncRow.syncKey))
    .sort(compareLimitedApplyCandidates)
    .map((item) => ({
      row: item.row,
      syncRow: item.syncRow,
      identityHash: item.syncRow.syncKey,
      contentHash: item.syncRow.syncContentHash,
    }));
}

export function createLimitedApplySelectionDiagnostics(input: {
  stage: LimitedApplyStage;
  rows: ParsedLedgerRow[];
  syncRows: LedgerSyncRow[];
  existingRows: LedgerSyncRow[];
  maxRows: number;
  insertCandidates: number;
}): LimitedApplySelectionDiagnostics {
  const candidateRows = getLimitedApplyCandidateRows(input);
  const selectedRows = selectLimitedApplyRows(input);
  const candidateWindow = candidateRows.slice(0, Math.max(0, input.maxRows));
  const candidateIdentityDigest = digestSelection(candidateWindow, "identity");
  const selectorIdentityDigest = digestSelection(selectedRows, "identity");
  const candidateOrderDigest = digestSelection(candidateWindow, "order");
  const selectorOrderDigest = digestSelection(selectedRows, "order");

  return {
    stage: input.stage,
    insertCandidates: input.insertCandidates,
    maxRows: input.maxRows,
    candidateRows: candidateRows.length,
    selectedRowsDryRunEquivalent: selectedRows.length,
    candidateDigestMatchesSelector: candidateIdentityDigest === selectorIdentityDigest,
    orderDigestMatchesSelector: candidateOrderDigest === selectorOrderDigest,
    candidateIdentityDigest,
    selectorIdentityDigest,
    candidateOrderDigest,
    selectorOrderDigest,
    rawRowsReturned: false,
  };
}

export function inferLimitedApplyDiagnosticStage(syncDiff: LedgerSyncDiffPlan): LimitedApplyStage | null {
  const match = Object.values(limitedApplyStageConfigs).find((config) => (
    syncDiff.existing.scopedRows === config.expectedExistingScopedRows &&
    syncDiff.diff.insertCandidates === config.expectedInsertCandidates &&
    syncDiff.diff.noChangeRows === config.expectedNoChangeRows &&
    syncDiff.diff.updateCandidates === 0 &&
    syncDiff.diff.deleteCandidates === 0
  ));
  return match?.stage ?? null;
}

export function summarizeLimitedApplyDateGuard(selectedRows: LimitedApplyRowSelection[]) {
  return selectedRows.reduce(
    (summary, selection) => {
      summary.checkedRows += 1;
      if (!selection.row.ledgerDate) summary.missingLedgerDateRows += 1;
      if (!isIsoDate(selection.row.ledgerDate)) summary.nonIsoLedgerDateRows += 1;
      return summary;
    },
    {
      checkedRows: 0,
      nonIsoLedgerDateRows: 0,
      missingLedgerDateRows: 0,
    },
  );
}

export function summarizeLimitedApplyDateDiagnostics(
  selectedRows: LimitedApplyRowSelection[],
  scope: { periodStart?: string; periodEnd?: string } = {},
): LimitedApplyDateDiagnostics {
  const summary: LimitedApplyDateDiagnostics = {
    checkedRows: 0,
    canonicalIsoLedgerDateCount: 0,
    nonIsoLedgerDateCandidates: 0,
    invalidLedgerDateCandidates: 0,
    missingLedgerDateCandidates: 0,
    dateOutsideScopeCandidates: 0,
    parseableNonIsoCount: 0,
    normalizedToIsoCount: 0,
    formatCategories: createEmptyLedgerDateFormatCounts(),
    rawRowsReturned: false,
  };

  for (const selection of selectedRows) {
    const row = selection.row;
    const normalized = normalizeLedgerDate(row.ledgerDate, scope);
    const issue = row.ledgerDateIssue ?? (normalized.ok ? null : normalized.reason);
    const category = knownFormatCategory(row.ledgerDateFormatCategory) ? row.ledgerDateFormatCategory : normalized.formatCategory;
    const rowDateIsCanonical = Boolean(row.ledgerDate && isCanonicalLedgerDate(row.ledgerDate));
    const syncDateIsCanonical = isCanonicalLedgerDate(selection.syncRow.ledgerDate);

    summary.checkedRows += 1;
    summary.formatCategories[category] += 1;

    if (!row.ledgerDate) {
      summary.missingLedgerDateCandidates += 1;
    } else if (!rowDateIsCanonical) {
      summary.nonIsoLedgerDateCandidates += 1;
    }

    const syncDateInvalid = !syncDateIsCanonical || (rowDateIsCanonical && row.ledgerDate !== selection.syncRow.ledgerDate);
    if (issue === "missing") summary.missingLedgerDateCandidates += row.ledgerDate ? 1 : 0;
    if (issue === "invalid" || syncDateInvalid) {
      summary.invalidLedgerDateCandidates += 1;
    }
    if (issue === "out-of-scope") summary.dateOutsideScopeCandidates += 1;
    if (rowDateIsCanonical && syncDateIsCanonical && row.ledgerDate === selection.syncRow.ledgerDate && !issue) {
      summary.canonicalIsoLedgerDateCount += 1;
    }
    if (row.ledgerDateWasNormalized) {
      summary.parseableNonIsoCount += 1;
      if (rowDateIsCanonical && !issue) summary.normalizedToIsoCount += 1;
    }
  }

  return summary;
}

export function validateLimitedApplyPreconditions(input: {
  approval: LimitedApplyApproval;
  sourceFileHash: string;
  selectedPartCode: string;
  syncDiff: LedgerSyncDiffPlan;
  requestScope?: LedgerSyncScope;
  requireExplicitRequestScope?: boolean;
}): { ok: boolean; blockedReasons: string[] } {
  const approvalValidation = validateLimitedApplyApproval(input.approval);
  const blockedReasons = [...approvalValidation.blockedReasons];
  const targetPart = String(input.approval.target_part).trim();
  const config = getLimitedApplyStageConfig(input.approval.stage);
  const expectedPrimaryScopeRows = input.approval.source_preview?.primaryScopeRows;
  const expectedExistingScopedRows = input.approval.source_preview?.existingScopedRows ?? config?.expectedExistingScopedRows;
  const expectedInsertCandidates = input.approval.source_preview?.insertCandidates ?? config?.expectedInsertCandidates;
  const expectedUpdateCandidates = input.approval.source_preview?.updateCandidates;
  const expectedDeleteCandidates = input.approval.source_preview?.deleteCandidates;
  const expectedNoChangeRows = input.approval.source_preview?.noChangeRows ?? config?.expectedNoChangeRows;

  if (input.sourceFileHash !== input.approval.test_file_hash) blockedReasons.push("SOURCE_FILE_HASH_MISMATCH");
  if (input.selectedPartCode !== targetPart) blockedReasons.push("TARGET_PART_MISMATCH");
  if (input.requireExplicitRequestScope && input.requestScope?.scopeSource !== "explicit-request") {
    blockedReasons.push("REQUEST_PERIOD_SCOPE_REQUIRED");
  }
  if (
    input.requestScope &&
    (input.requestScope.dateFrom !== input.approval.date_from || input.requestScope.dateTo !== input.approval.date_to)
  ) {
    blockedReasons.push("REQUEST_SCOPE_DATE_MISMATCH");
  }
  if (input.syncDiff.scope.partCode !== targetPart) blockedReasons.push("SYNC_SCOPE_PART_MISMATCH");
  if (input.syncDiff.scope.dateFrom !== input.approval.date_from || input.syncDiff.scope.dateTo !== input.approval.date_to) {
    blockedReasons.push("SYNC_SCOPE_DATE_MISMATCH");
  }
  if (!input.syncDiff.planReady) blockedReasons.push("SYNC_PLAN_NOT_READY");
  if (!input.syncDiff.readOnlyEvidence.readExecuted || input.syncDiff.readOnlyEvidence.readBlockedReason) {
    blockedReasons.push("SYNC_DIFF_READ_BLOCKED");
  }
  if (input.syncDiff.incoming.warningRows > 0) blockedReasons.push("WARNING_ROWS_PRESENT");
  if (input.syncDiff.incoming.errorRows > 0) blockedReasons.push("ERROR_ROWS_PRESENT");
  if (expectedPrimaryScopeRows !== undefined && input.syncDiff.incoming.normalRows !== expectedPrimaryScopeRows) {
    blockedReasons.push("PRIMARY_SCOPE_ROWS_MISMATCH");
  }
  if (expectedExistingScopedRows === undefined || input.syncDiff.existing.scopedRows !== expectedExistingScopedRows) {
    blockedReasons.push("EXISTING_SCOPED_ROWS_MISMATCH");
  }
  if (expectedInsertCandidates === undefined || input.syncDiff.diff.insertCandidates !== expectedInsertCandidates) {
    blockedReasons.push("INSERT_CANDIDATES_MISMATCH");
  }
  if (expectedUpdateCandidates !== undefined && input.syncDiff.diff.updateCandidates !== expectedUpdateCandidates) {
    blockedReasons.push("UPDATE_CANDIDATES_MISMATCH");
  }
  if (expectedDeleteCandidates !== undefined && input.syncDiff.diff.deleteCandidates !== expectedDeleteCandidates) {
    blockedReasons.push("DELETE_CANDIDATES_MISMATCH");
  }
  if (input.syncDiff.diff.updateCandidates > 0) blockedReasons.push("UPDATE_CANDIDATE_PRESENT");
  if (input.syncDiff.diff.deleteCandidates > 0) blockedReasons.push("DELETE_CANDIDATE_PRESENT");
  if (expectedNoChangeRows === undefined || input.syncDiff.diff.noChangeRows !== expectedNoChangeRows) {
    blockedReasons.push("NO_CHANGE_ROWS_MISMATCH");
  }
  if (input.syncDiff.diff.duplicateIncomingIdentityHashes > 0) {
    blockedReasons.push("DUPLICATE_INCOMING_IDENTITY_HASHES_PRESENT");
  }
  if (input.syncDiff.diff.duplicateExistingIdentityHashes > 0) {
    blockedReasons.push("DUPLICATE_EXISTING_IDENTITY_HASHES_PRESENT");
  }
  if (input.syncDiff.diff.insertCandidates < input.approval.max_rows) blockedReasons.push("INSERT_CANDIDATES_BELOW_LIMIT");

  return {
    ok: blockedReasons.length === 0,
    blockedReasons,
  };
}

function compareLimitedApplyCandidates(
  left: { row: ParsedLedgerRow; syncRow: LedgerSyncRow },
  right: { row: ParsedLedgerRow; syncRow: LedgerSyncRow },
) {
  return (
    left.row.ledgerDate.localeCompare(right.row.ledgerDate) ||
    left.row.rowIndex - right.row.rowIndex ||
    left.syncRow.naturalKey.localeCompare(right.syncRow.naturalKey) ||
    left.syncRow.occurrenceIndexWithinNaturalKey - right.syncRow.occurrenceIndexWithinNaturalKey ||
    left.syncRow.syncKey.localeCompare(right.syncRow.syncKey)
  );
}

function digestSelection(rows: LimitedApplyRowSelection[], mode: "identity" | "order") {
  return stableHash(rows.map((item, index) => ({
    index,
    identityHash: item.identityHash,
    contentHash: mode === "identity" ? item.contentHash : undefined,
    ledgerDate: mode === "order" ? item.row.ledgerDate : undefined,
    rowIndex: mode === "order" ? item.row.rowIndex : undefined,
    occurrenceIndexWithinNaturalKey: mode === "order" ? item.syncRow.occurrenceIndexWithinNaturalKey : undefined,
  })));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function knownFormatCategory(value: unknown): value is LedgerDateFormatCategory {
  return (
    value === "yyyy-mm-dd" ||
    value === "yyyy.m.d" ||
    value === "yyyy/mm/dd" ||
    value === "m/d/yyyy" ||
    value === "excel-serial" ||
    value === "korean-date" ||
    value === "datetime" ||
    value === "unknown"
  );
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isLimitedApplyStage(value: string): value is LimitedApplyStage {
  return value in limitedApplyStageConfigs;
}

export function getLimitedApplyStageConfig(stage: unknown): LimitedApplyStageConfig | null {
  return typeof stage === "string" && isLimitedApplyStage(stage) ? limitedApplyStageConfigs[stage] : null;
}

function isInsertOnly(value: unknown) {
  return Array.isArray(value) && value.length === 1 && value[0] === "insert";
}

function hasBlockedOperations(value: unknown) {
  if (!Array.isArray(value)) return false;
  const blocked = new Set(value);
  return ["update", "delete", "hard_delete", "full_apply"].every((operation) => blocked.has(operation));
}
