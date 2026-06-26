"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type RequestDetail, type ApprovalTimelineStep } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import { ActionFeedback } from "@/components/action-feedback";
import { requestStatusVariant, approvalStepStatusVariant } from "@/lib/status";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timelineStepIcon(status: string) {
  switch (status) {
    case "APPROVED":
    case "SKIPPED":
      return "✓";
    case "REJECTED":
    case "INELIGIBLE":
      return "✕";
    case "DELEGATED":
      return "→";
    case "TIMED_OUT":
      return "⏱";
    case "PENDING":
    default:
      return "○";
  }
}

function TimelineStep({
  step,
  isLast,
}: {
  step: ApprovalTimelineStep;
  isLast: boolean;
}) {
  const isPositive = ["APPROVED", "SKIPPED"].includes(step.status);
  const isNegative = ["REJECTED", "DELEGATED", "TIMED_OUT"].includes(step.status);
  const isPending = step.status === "PENDING";
  const style = approvalStepStatusVariant(step.status);

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium
            ${isPositive ? "border-green-600 bg-green-50 text-green-700" : ""}
            ${isNegative ? "border-red-600 bg-red-50 text-red-700" : ""}
            ${isPending ? "border-muted-foreground/30 bg-muted/50 text-muted-foreground" : ""}
            ${!isPositive && !isNegative && !isPending ? "border-muted-foreground/30 bg-muted/50" : ""}`}
        >
          {timelineStepIcon(step.status)}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[16px] bg-border self-center" />
        )}
      </div>
      <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
        <div className="font-medium">{step.label}</div>
        <StatusBadge status={step.status} style={style} className="mt-1" />
        {step.approverName && (
          <p className="mt-1 text-sm text-muted-foreground">
            By {step.approverName}
            {step.actedAt && ` · ${formatDate(step.actedAt)}`}
          </p>
        )}
        {step.note && (
          <p className="mt-1 text-sm italic text-muted-foreground">
            &ldquo;{step.note}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

export default function RequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function refetch() {
    if (!id) return;
    setError(null);
    api.requests.get(id).then(setRequest).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (!id) return;
    api.requests
      .get(id)
      .then(setRequest)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleWithdraw() {
    if (!id) return;
    setWithdrawing(true);
    setFeedback(null);
    try {
      await api.requests.withdraw(id);
      refetch();
      setFeedback({ type: "success", message: "Request withdrawn successfully." });
    } catch (e) {
      setFeedback({
        type: "error",
        message: e instanceof Error ? e.message : "Failed to withdraw",
      });
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) return <LoadingState message="Loading request…" />;
  if (error || !request)
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/requests">← My Requests</Link>
        </Button>
        <InlineError
          message={error ?? "Request not found"}
          onRetry={() => id && refetch()}
          onDismiss={() => setError(null)}
        />
      </div>
    );

  const showRejectionReason =
    (request.status === "REJECTED" || request.status === "INELIGIBLE") &&
    (request.rejectionReason || request.eligibility?.reason);

  const statusStyle = requestStatusVariant(request.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/requests">← My Requests</Link>
        </Button>
      </div>

      {feedback && (
        <ActionFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Header with prominent status */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold">
              Request: {request.assignment.title}
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={request.status} style={statusStyle} className="text-sm" />
              {request.status === "PENDING_APPROVAL" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing ? "Withdrawing…" : "Withdraw Request"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Withdrawal notice */}
      {request.status === "WITHDRAWN" && (
        <div className="rounded-md border border-amber-500/50 bg-amber-50 p-4">
          <p className="font-medium text-amber-800">Request withdrawn</p>
          <p className="mt-1 text-sm text-amber-700">
            This request was withdrawn by the employee while approval was pending.
          </p>
        </div>
      )}

      {/* Rejection / Ineligibility reason */}
      {showRejectionReason && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
          <p className="font-medium text-destructive">
            {request.status === "INELIGIBLE" ? "Ineligibility reason" : "Rejection reason"}
          </p>
          <p className="mt-1 text-sm">
            {request.status === "INELIGIBLE" && request.eligibility?.reason
              ? request.eligibility.reason
              : request.rejectionReason ?? "No reason provided."}
          </p>
        </div>
      )}

      {/* Assignment summary */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Assignment</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-medium">{request.assignment.title}</p>
          {request.assignment.location && (
            <p className="text-sm text-muted-foreground">
              Location: {request.assignment.location}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Scheduled: {formatDate(request.assignment.scheduledAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            Pay: {request.assignment.payType} · {request.assignment.payAmount}
          </p>
        </CardContent>
      </Card>

      {/* Requester */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium">Requester</h2>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{request.employee.name}</p>
          <p className="text-sm text-muted-foreground">{request.employee.email}</p>
        </CardContent>
      </Card>

      {/* Eligibility (if evaluated) */}
      {request.eligibility && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Eligibility</h2>
          </CardHeader>
          <CardContent>
            <StatusBadge
              status={request.eligibility.eligible ? "Eligible" : "Ineligible"}
              style={
                request.eligibility.eligible
                  ? { variant: "default" }
                  : { variant: "destructive" }
              }
            />
            {request.eligibility.reason && (
              <p className="mt-2 text-sm text-muted-foreground">
                {request.eligibility.reason}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval timeline */}
      {request.approvalTimeline.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Approval Timeline</h2>
            {request.status === "PENDING_APPROVAL" && (
              <p className="text-sm text-muted-foreground">
                Awaiting approval from the next step.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {request.approvalTimeline.map((step, i) => (
                <TimelineStep
                  key={step.stepOrder}
                  step={step}
                  isLast={i === request.approvalTimeline.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Request note */}
      {request.note && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Request Note</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{request.note}</p>
          </CardContent>
        </Card>
      )}

      {/* Audit events / Activity */}
      {request.auditEvents.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Activity</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {request.auditEvents.slice(0, 10).map((e, i) => (
                <li key={i} className="text-muted-foreground">
                  {e.actorName ? `${e.actorName} ` : ""}
                  {e.action.replace(/_/g, " ")}
                  {" · "}
                  {formatDate(e.createdAt)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">Activity</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
