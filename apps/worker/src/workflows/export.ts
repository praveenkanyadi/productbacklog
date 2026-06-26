/**
 * ExportWorkflow - Payroll export batch for worked records
 *
 * OWNS:
 * - Collecting WorkedRecord rows for date range
 * - Generating export file/batch
 * - Marking records as exported (exportedAt)
 *
 * Delegates to activities:
 * - exports.collectWorkedRecords
 * - exports.generateExportBatch
 * - exports.markRecordsExported
 *
 * Must remain deterministic.
 */

import { proxyActivities } from "@temporalio/workflow";
import type { activities } from "../activities/index.js";
import type { ExportWorkflowInput, ExportWorkflowResult } from "../lib/types.js";

const { collectWorkedRecords } = proxyActivities<
  Pick<typeof activities, "collectWorkedRecords">
>({
  startToCloseTimeout: "5 minutes",
});

export async function ExportWorkflow(
  input: ExportWorkflowInput
): Promise<ExportWorkflowResult> {
  // Placeholder: will collect, generate, mark exported
  const records = await collectWorkedRecords(input);
  return {
    exportId: `export-${input.startDate}-${input.endDate}`,
    recordCount: records.length,
  };
}
