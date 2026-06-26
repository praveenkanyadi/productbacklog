/**
 * Notification service - swappable provider for v1.
 * Logs to NotificationLog, sends via adapter (console/placeholder for v1).
 */

import { prisma } from "./prisma.js";

export interface SendEmailPayload {
  toUserId: string;
  orgId: string;
  subject: string;
  body: string;
  type: string;
  requestId?: string;
  assignmentId?: string;
  summary?: string;
}

export interface SendInAppPayload {
  userId: string;
  orgId: string;
  type: string;
  title: string;
  body?: string;
  requestId?: string;
  assignmentId?: string;
}

export interface LogNotificationPayload {
  userId: string;
  orgId: string;
  type: string;
  channel: "email" | "sms" | "in_app";
  status: "sent" | "failed" | "pending";
  requestId?: string;
  assignmentId?: string;
  summary?: string;
}

const notificationService = {
  async sendEmail(payload: SendEmailPayload): Promise<void> {
    // v1: console log; swap for real adapter later
    // eslint-disable-next-line no-console
    console.log("[Notification] sendEmail:", {
      to: payload.toUserId,
      subject: payload.subject,
      type: payload.type,
      requestId: payload.requestId,
    });
  },

  sendInApp(_payload: SendInAppPayload): void {
    // v1: placeholder
  },

  async logNotification(payload: LogNotificationPayload): Promise<void> {
    await prisma.notificationLog.create({
      data: {
        orgId: payload.orgId,
        userId: payload.userId,
        type: payload.type,
        channel: payload.channel,
        status: payload.status,
        requestId: payload.requestId,
        assignmentId: payload.assignmentId,
        summary: payload.summary,
      },
    });
  },
};

export { notificationService };
