import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Extra Duty Management</h1>
      <p className="text-muted-foreground">
        Browse open assignments, submit requests, and manage approvals.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/assignments">View Open Assignments</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/requests">My Requests</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/approvals">Pending Approvals</Link>
        </Button>
      </div>
    </div>
  );
}
