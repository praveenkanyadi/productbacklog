/**
 * AssignmentWorkflow - Assignment lifecycle state machine
 *
 * OWNS:
 * - Driving Assignment status transitions: DRAFT → PUBLISHED → OPEN → FILLED → CLOSED | COMPLETED | CANCELED
 * - Reacting to external signals (publish, open, fill, close, cancel)
 * - Coordinating notifications when assignment becomes OPEN
 *
 * Delegates to activities:
 * - requests.updateAssignmentStatus
 * - notifications.send (assignment published, opened)
 *
 * Must remain deterministic.
 */

import { proxyActivities } from "@temporalio/workflow";
import type { activities } from "../activities/index.js";
import type { AssignmentWorkflowInput, AssignmentWorkflowResult } from "../lib/types.js";

const { updateAssignmentStatus } = proxyActivities<
  Pick<typeof activities, "updateAssignmentStatus">
>({
  startToCloseTimeout: "1 minute",
});

export async function AssignmentWorkflow(
  input: AssignmentWorkflowInput
): Promise<AssignmentWorkflowResult> {
  // Placeholder: will react to signals to transition status
  await updateAssignmentStatus(input.assignmentId, "OPEN");
  // TODO: Handle publish, open, fill, close, cancel signals
  return { assignmentId: input.assignmentId, status: "OPEN" };
}
