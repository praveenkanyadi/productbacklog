/**
 * Eligibility activities
 *
 * OWNS:
 * - Loading assignment qualifications (AssignmentQualification)
 * - Loading employee profile/certs for eligibility rules
 * - Evaluating deterministic business rules (conflicts, certs, rank)
 * - Persisting EligibilityEvaluation to DB
 *
 * Called by: RequestWorkflow
 */

import type { RequestWorkflowInput } from "../lib/types.js";

export async function evaluateEligibility(input: RequestWorkflowInput): Promise<boolean> {
  // Placeholder: will query Prisma for AssignmentQualifications and User,
  // apply conflict checks, cert checks, then upsert EligibilityEvaluation
  return true;
}
