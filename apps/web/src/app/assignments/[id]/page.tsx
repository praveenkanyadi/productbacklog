"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type Assignment } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import { ActionFeedback } from "@/components/action-feedback";
import { assignmentStatusVariant } from "@/lib/status";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function formatPay(payType: string, payAmount: string) {
  if (payType === "HOURLY") return `$${payAmount}/hr`;
  if (payType === "FLAT_RATE") return `$${payAmount} flat`;
  return `$${payAmount}`;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { orgId, id: userId } = getCurrentUser();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [approvalTemplateId, setApprovalTemplateId] = useState("");
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);

  const fetchAssignment = useCallback(() => {
    setLoading(true);
    setError(null);
    api.assignments
      .get(id)
      .then(setAssignment)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  useEffect(() => {
    api.approvalTemplates
      .list(orgId)
      .then(setTemplates)
      .catch(() => {});
  }, [orgId]);

  async function handleCreateAndSubmit() {
    if (!assignment) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const request = await api.requests.create({
        orgId,
        employeeId: userId,
        assignmentId: assignment.id,
        note: note || undefined,
      });
      if (approvalTemplateId) {
        await api.requests.submit(request.id, approvalTemplateId);
      }
      router.push(`/requests/${request.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Loading assignment…" />;
  if (error || !assignment)
    return (
      <div className="space-y-6">
        <InlineError
          message={error ?? "Assignment not found"}
          onRetry={fetchAssignment}
          onDismiss={() => setError(null)}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold">{assignment.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formatPay(assignment.payType, assignment.payAmount)}
              </p>
            </div>
            <StatusBadge status={assignment.status} style={assignmentStatusVariant(assignment.status)} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {assignment.description && <p>{assignment.description}</p>}
          {assignment.location && <p>Location: {assignment.location}</p>}
          <p>Start: {formatDate(assignment.scheduledAt)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Submit Request</h2>
          <p className="text-sm text-muted-foreground">
            Create a request and submit for approval.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitError && (
            <ActionFeedback
              type="error"
              message={submitError}
              onDismiss={() => setSubmitError(null)}
            />
          )}
          <div>
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
            />
          </div>
          {templates.length > 0 ? (
            <div>
              <Label htmlFor="template">Approval template</Label>
              <select
                id="template"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={approvalTemplateId}
                onChange={(e) => setApprovalTemplateId(e.target.value)}
              >
                <option value="">Select template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <Label htmlFor="templateId">Approval Template ID</Label>
              <Input
                id="templateId"
                value={approvalTemplateId}
                onChange={(e) => setApprovalTemplateId(e.target.value)}
                placeholder="Enter approval template ID"
              />
            </div>
          )}
          <Button
            onClick={handleCreateAndSubmit}
            disabled={submitting || !approvalTemplateId}
          >
            {submitting ? "Submitting…" : "Create & Submit Request"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
