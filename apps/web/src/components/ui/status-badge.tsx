"use client";

import { Badge } from "./badge";
import type { StatusStyle } from "@/lib/status";

interface StatusBadgeProps {
  status: string;
  style: StatusStyle;
  className?: string;
}

export function StatusBadge({ status, style, className }: StatusBadgeProps) {
  return (
    <Badge variant={style.variant} className={className}>
      {style.label ?? status}
    </Badge>
  );
}
