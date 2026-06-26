"use client";

import { cn } from "@/lib/utils";

type FeedbackType = "success" | "error";

interface ActionFeedbackProps {
  type: FeedbackType;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function ActionFeedback({
  type,
  message,
  onDismiss,
  className,
}: ActionFeedbackProps) {
  const isSuccess = type === "success";
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start justify-between gap-4 rounded-md border px-4 py-3 text-sm",
        isSuccess
          ? "border-green-600/50 bg-green-50 text-green-800"
          : "border-destructive/50 bg-destructive/10 text-destructive",
        className
      )}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
