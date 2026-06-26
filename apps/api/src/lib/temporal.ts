import { Client, Connection } from "@temporalio/client";
import {
  RequestWorkflow,
  requestWithdrawSignal,
  ApprovalWorkflow,
  approvalApproveSignal,
  approvalRejectSignal,
  approvalDelegateSignal,
} from "worker/workflows";

const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";
const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE ?? "edm";

let client: Client | null = null;

async function getConnection(): Promise<Connection> {
  return Connection.connect({
    address: TEMPORAL_ADDRESS,
  });
}

export async function getTemporalClient(): Promise<Client> {
  if (client) return client;
  const connection = await getConnection();
  client = new Client({
    connection,
    namespace: "default",
  });
  return client;
}

export const workflows = {
  RequestWorkflow,
  ApprovalWorkflow,
};

export const signals = {
  requestWithdraw: requestWithdrawSignal,
  approvalApprove: approvalApproveSignal,
  approvalReject: approvalRejectSignal,
  approvalDelegate: approvalDelegateSignal,
};

export { TASK_QUEUE };
