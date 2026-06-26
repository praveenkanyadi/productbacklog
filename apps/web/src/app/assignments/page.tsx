"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, type Assignment } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import { assignmentStatusVariant } from "@/lib/status";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function formatPay(payType: string, payAmount: string) {
  if (payType === "HOURLY") return `$${payAmount}/hr`;
  if (payType === "FLAT_RATE") return `$${payAmount} flat`;
  return `$${payAmount}`;
}

export default function AssignmentsPage() {
  const { orgId } = getCurrentUser();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(() => {
    setLoading(true);
    setError(null);
    api.assignments
      .list(orgId)
      .then(setAssignments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  if (loading) return <LoadingState message="Loading assignments…" />;
  if (error)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Open Assignments</h1>
        <InlineError
          message={error}
          onRetry={fetchAssignments}
          onDismiss={() => setError(null)}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Open Assignments</h1>
      <p className="text-muted-foreground">
        Assignments available for extra duty requests.
      </p>
      {assignments.length === 0 ? (
        <EmptyState
          title="No open assignments"
          description="There are no assignments available for requests at this time. Check back later."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{a.title}</h2>
                  <StatusBadge status={a.status} style={assignmentStatusVariant(a.status)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {a.location && <p>Location: {a.location}</p>}
                <p>Start: {formatDate(a.scheduledAt)}</p>
                <p>{formatPay(a.payType, a.payAmount)}</p>
              </CardContent>
              <CardFooter>
                <Button asChild size="sm">
                  <Link href={`/assignments/${a.id}`}>View / Request</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
