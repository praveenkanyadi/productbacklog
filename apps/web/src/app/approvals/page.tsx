"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type ApprovalInstance } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import { ActionFeedback } from "@/components/action-feedback";

export default function ApprovalsPage() {
  const { orgId } = getCurrentUser();
  const [approvals, setApprovals] = useState<ApprovalInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [delegateId, setDelegateId] = useState<string | null>(null);
  const [delegateUserId, setDelegateUserId] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchApprovals = useCallback(() => {
    setLoading(true);
    setError(null);
    api.approvals
      .listPending(orgId)
      .then(setApprovals)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  async function handleApprove(id: string) {
    setFeedback(null);
    setActing(id);
    try {
      await api.approvals.approve(id);
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: "success", message: "Request approved." });
    } catch (e) {
      setFeedback({
        type: "error",
        message: e instanceof Error ? e.message : "Failed to approve",
      });
    } finally {
      setActing(null);
    }
  }

  async function handleReject(id: string) {
    setFeedback(null);
    setActing(id);
    try {
      await api.approvals.reject(id);
      setApprovals((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: "success", message: "Request rejected." });
    } catch (e) {
      setFeedback({
        type: "error",
        message: e instanceof Error ? e.message : "Failed to reject",
      });
    } finally {
      setActing(null);
    }
  }

  async function handleDelegate(id: string) {
    if (!delegateUserId.trim()) return;
    setFeedback(null);
    setActing(id);
    try {
      await api.approvals.delegate(id, delegateUserId.trim());
      setDelegateId(null);
      setDelegateUserId("");
      fetchApprovals();
      setFeedback({ type: "success", message: "Delegated successfully." });
    } catch (e) {
      setFeedback({
        type: "error",
        message: e instanceof Error ? e.message : "Failed to delegate",
      });
    } finally {
      setActing(null);
    }
  }

  if (loading) return <LoadingState message="Loading pending approvals…" />;
  if (error)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Pending Approvals</h1>
        <InlineError
          message={error}
          onRetry={fetchApprovals}
          onDismiss={() => setError(null)}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pending Approvals</h1>
      <p className="text-muted-foreground">
        Approve, reject, or delegate requests assigned to you.
      </p>

      {feedback && (
        <ActionFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {approvals.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="You have no approval requests at this time. New requests will appear here when submitted."
        />
      ) : (
        <div className="space-y-4">
          {approvals.map((a) => {
            const isActing = acting === a.id;
            const isDelegateMode = delegateId === a.id;

            return (
              <Card key={a.id}>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <p className="font-medium">
                      {a.request?.assignment?.title ?? "Request"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      From {a.request?.employee?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Request ID: {a.requestId}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(a.id)}
                      disabled={isActing}
                    >
                      {isActing ? "Processing…" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(a.id)}
                      disabled={isActing}
                    >
                      Reject
                    </Button>
                    {isDelegateMode ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor={`delegate-${a.id}`} className="sr-only">
                          Delegate to user ID
                        </Label>
                        <Input
                          id={`delegate-${a.id}`}
                          placeholder="User ID (e.g. user-3)"
                          value={delegateUserId}
                          onChange={(e) => setDelegateUserId(e.target.value)}
                          className="w-40"
                          disabled={isActing}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelegate(a.id)}
                          disabled={isActing || !delegateUserId.trim()}
                        >
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDelegateId(null);
                            setDelegateUserId("");
                          }}
                          disabled={isActing}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDelegateId(a.id)}
                        disabled={isActing}
                      >
                        Delegate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
