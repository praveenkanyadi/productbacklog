"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, type EmployeeRequest } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";
import { InlineError } from "@/components/inline-error";
import { requestStatusVariant } from "@/lib/status";

export default function MyRequestsPage() {
  const { orgId, id: userId } = getCurrentUser();
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(() => {
    setLoading(true);
    setError(null);
    api.requests
      .list(userId, orgId)
      .then(setRequests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, orgId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (loading) return <LoadingState message="Loading your requests…" />;
  if (error)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">My Requests</h1>
        <InlineError
          message={error}
          onRetry={fetchRequests}
          onDismiss={() => setError(null)}
        />
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Requests</h1>
      <p className="text-muted-foreground">
        Your extra duty requests and status.
      </p>
      {requests.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="You haven't submitted any extra duty requests. Browse open assignments to get started."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">
                    {r.assignment?.title ?? "Assignment"}
                  </p>
                  <p className="text-sm text-muted-foreground">{r.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} style={requestStatusVariant(r.status)} />
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/requests/${r.id}`}>View</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
