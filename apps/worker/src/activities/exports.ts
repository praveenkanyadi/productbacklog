/**
 * Export activities
 *
 * OWNS:
 * - Querying WorkedRecord by org + date range
 * - Generating export file/batch (CSV, payroll format)
 * - Marking records as exported (exportedAt)
 *
 * Called by: ExportWorkflow
 */

import type { ExportWorkflowInput } from "../lib/types.js";

export interface WorkedRecordSummary {
  id: string;
}

export async function collectWorkedRecords(
  input: ExportWorkflowInput
): Promise<WorkedRecordSummary[]> {
  // Placeholder: will query WorkedRecord where workedAt in range, not yet exported
  return [];
}

export async function generateExportBatch(
  recordIds: string[],
  exportId: string
): Promise<string> {
  // Placeholder: will generate file, return path or URL
  return `export/${exportId}.csv`;
}

export async function markRecordsExported(
  recordIds: string[],
  exportId: string
): Promise<void> {
  // Placeholder: will set WorkedRecord.exportedAt
}
