"use client";

import { cn } from "@/lib/utils";

interface InlineErrorProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({
  message,
  onDismiss,
  onRetry,
  className,
}: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start justify-between gap-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className
      )}
    >
      <span>{message}</span>
      <div className="flex shrink-0 gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
