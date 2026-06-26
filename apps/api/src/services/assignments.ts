import { assignmentRepository } from "../repositories/assignment.js";

export const assignmentService = {
  async listOpen(orgId: string) {
    return assignmentRepository.findOpenOrPublished(orgId);
  },

  async getById(id: string) {
    return assignmentRepository.findById(id);
  },
};
