import { approvalRepository } from "../repositories/approval.js";
import { getTemporalClient, signals } from "../lib/temporal.js";

export const approvalService = {
  async getPending(orgId: string, userId?: string) {
    return approvalRepository.findPendingForOrg(orgId, userId);
  },

  async getById(id: string) {
    return approvalRepository.findById(id);
  },

  async approve(approvalInstanceId: string, _actorId: string, note?: string) {
    const approval = await approvalRepository.findById(approvalInstanceId);
    if (!approval) return null;

    const workflowId = `approval-${approvalInstanceId}`;
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);

    await handle.signal(signals.approvalApprove, { note });
    return { approvalInstanceId };
  },

  async reject(approvalInstanceId: string, _actorId: string, note?: string) {
    const approval = await approvalRepository.findById(approvalInstanceId);
    if (!approval) return null;

    const workflowId = `approval-${approvalInstanceId}`;
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);

    await handle.signal(signals.approvalReject, { note });
    return { approvalInstanceId };
  },

  async delegate(
    approvalInstanceId: string,
    _actorId: string,
    delegatedToUserId: string
  ) {
    const approval = await approvalRepository.findById(approvalInstanceId);
    if (!approval) return null;

    const workflowId = `approval-${approvalInstanceId}`;
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);

    await handle.signal(signals.approvalDelegate, { delegatedToUserId });
    return { approvalInstanceId };
  },
};
