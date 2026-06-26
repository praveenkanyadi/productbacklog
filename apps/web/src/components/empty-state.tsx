"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-8 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground text-4xl">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
