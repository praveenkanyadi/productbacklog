/**
 * Notification activities
 *
 * OWNS:
 * - Sending email (primary)
 * - SMS adapter (placeholder)
 * - Writing NotificationLog for audit
 *
 * Called by: RequestWorkflow, ApprovalWorkflow
 */

import { notificationService } from "../lib/notification.js";

export interface SendNotificationInput {
  userId: string;
  orgId: string;
  type: string;
  channel: "email" | "sms";
  summary: string;
  requestId?: string;
  assignmentId?: string;
}

export async function sendNotification(input: SendNotificationInput): Promise<void> {
  let status: "sent" | "failed" | "pending" = "sent";
  try {
    if (input.channel === "email") {
      await notificationService.sendEmail({
        toUserId: input.userId,
        orgId: input.orgId,
        subject: input.summary,
        body: input.summary,
        type: input.type,
        requestId: input.requestId,
        assignmentId: input.assignmentId,
        summary: input.summary,
      });
    }
    // sms: placeholder, treat as logged only
  } catch (e) {
    status = "failed";
    // eslint-disable-next-line no-console
    console.error("[sendNotification] failed:", e);
  }

  await notificationService.logNotification({
    userId: input.userId,
    orgId: input.orgId,
    type: input.type,
    channel: input.channel,
    status,
    requestId: input.requestId,
    assignmentId: input.assignmentId,
    summary: input.summary,
  });
}
