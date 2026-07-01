/* eslint-disable @typescript-eslint/no-explicit-any */
// Temporal disabled — not used by the Product Backlog app
export const getTemporalClient = async (): Promise<any> => { throw new Error("Temporal not configured"); };
export const workflows: any = {};
export const signals: any = {};
export const TASK_QUEUE = "main";
