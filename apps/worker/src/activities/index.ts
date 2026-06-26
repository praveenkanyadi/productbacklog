/**
 * EDM activity exports.
 * All activities are aggregated here for the worker.
 */

import * as audit from "./audit.js";
import * as config from "./config.js";
import * as eligibility from "./eligibility.js";
import * as approvals from "./approvals.js";
import * as notifications from "./notifications.js";
import * as requests from "./requests.js";
import * as exports from "./exports.js";

export const activities = {
  // Audit
  recordAuditEvent: audit.recordAuditEvent,

  // Config
  getReminderThresholdMs: config.getReminderThresholdMs,

  // Eligibility
  evaluateEligibility: eligibility.evaluateEligibility,

  // Approvals
  createApprovalInstancesFromTemplate: approvals.createApprovalInstancesFromTemplate,
  loadApprovalContext: approvals.loadApprovalContext,
  resolveApprover: approvals.resolveApprover,
  persistApprovalDecision: approvals.persistApprovalDecision,
  delegateApproval: approvals.delegateApproval,
  getNextApprover: approvals.getNextApprover,
  recordApprovalStep: approvals.recordApprovalStep,

  // Notifications
  sendNotification: notifications.sendNotification,

  // Requests & assignments
  getRequestContext: requests.getRequestContext,
  updateAssignmentStatus: requests.updateAssignmentStatus,
  updateRequestStatus: requests.updateRequestStatus,
  persistRequestState: requests.persistRequestState,
  createWorkedRecordPlaceholder: requests.createWorkedRecordPlaceholder,

  // Exports
  collectWorkedRecords: exports.collectWorkedRecords,
  generateExportBatch: exports.generateExportBatch,
  markRecordsExported: exports.markRecordsExported,
};
