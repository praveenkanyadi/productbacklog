import { approvalTemplateRepository } from "../repositories/approval-template.js";

export const approvalTemplateService = {
  async list(orgId: string) {
    return approvalTemplateRepository.list(orgId);
  },
};
