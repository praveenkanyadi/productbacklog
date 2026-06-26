import { z } from "zod";

export const createRequestSchema = z.object({
  body: z.object({
    orgId: z.string().min(1),
    employeeId: z.string().min(1),
    assignmentId: z.string().min(1),
    requestType: z.enum(["EXTRA_DUTY", "COVERAGE", "OTHER"]).default("EXTRA_DUTY"),
    note: z.string().optional(),
  }),
});

export const submitRequestParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    approvalTemplateId: z.string().min(1),
  }),
});

export const getRequestParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const withdrawRequestParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>["body"];
export type SubmitRequestParams = z.infer<typeof submitRequestParamsSchema>["params"];
export type SubmitRequestBody = z.infer<typeof submitRequestParamsSchema>["body"];
export type GetRequestParams = z.infer<typeof getRequestParamsSchema>["params"];
