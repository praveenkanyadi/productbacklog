"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCurrentUser, setDemoUser, DEMO_USERS } from "@/lib/auth";

const edmNavItems = [
  { href: "/assignments", label: "Open Assignments" },
  { href: "/requests", label: "My Requests" },
  { href: "/approvals", label: "Pending Approvals" },
];

const backlogNavItems = [
  { href: "/backlog", label: "Backlog" },
  { href: "/backlog/rank", label: "Stack Ranking" },
  { href: "/backlog/activity", label: "Activity" },
  { href: "/backlog/admin", label: "Admin" },
];

export function Nav() {
  const pathname = usePathname();
  const user = getCurrentUser();

  const isBacklog = pathname.startsWith("/backlog");
  const navItems = isBacklog ? backlogNavItems : edmNavItems;

  return (
    <nav className="flex items-center justify-between gap-4 border-b px-6 py-4">
      <div className="flex items-center gap-4">
        <Link
          href={isBacklog ? "/backlog" : "/"}
          className="font-semibold text-lg hover:text-primary"
        >
          {isBacklog ? "Product Backlog" : "EDM"}
        </Link>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium hover:text-primary",
              pathname === item.href || (item.href !== "/backlog" && pathname.startsWith(item.href))
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>View as:</span>
        {(pathname.startsWith("/backlog")
          ? (["pm-1", "pm-2", "eng-1", "exec-1"] as const)
          : (["user-1", "user-2", "user-3"] as const)
        ).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setDemoUser(id)}
            className={cn(
              "px-2 py-0.5 rounded hover:bg-muted",
              user.id === id ? "font-medium text-foreground" : ""
            )}
          >
            {DEMO_USERS[id].name}
          </button>
        ))}
      </div>
    </nav>
  );
}
