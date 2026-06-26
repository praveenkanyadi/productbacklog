import { z } from "zod";

export const approveBodySchema = z.object({
  body: z.object({
    note: z.string().optional(),
  }),
});

export const rejectBodySchema = z.object({
  body: z.object({
    note: z.string().optional(),
  }),
});

export const delegateBodySchema = z.object({
  body: z.object({
    delegatedToUserId: z.string().min(1),
  }),
});

export const approvalParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export type ApproveInput = z.infer<typeof approveBodySchema>["body"];
export type RejectInput = z.infer<typeof rejectBodySchema>["body"];
export type DelegateInput = z.infer<typeof delegateBodySchema>["body"];
export type ApprovalParams = z.infer<typeof approvalParamsSchema>["params"];
