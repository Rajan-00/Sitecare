import {
  CircleCheck,
  CircleHelp,
  CircleX,
} from "lucide-react";

import type { WebsiteStatus } from "../types/dashboard";

interface StatusBadgeProps {
  status: WebsiteStatus;
}

const statusConfiguration = {
  up: {
    label: "Operational",
    className: "status-badge--up",
    icon: CircleCheck,
  },
  down: {
    label: "Down",
    className: "status-badge--down",
    icon: CircleX,
  },
  not_checked: {
    label: "Not checked",
    className: "status-badge--unknown",
    icon: CircleHelp,
  },
};

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  const configuration = statusConfiguration[status];
  const Icon = configuration.icon;

  return (
    <span
      className={`status-badge ${configuration.className}`}
    >
      <Icon size={14} strokeWidth={2.4} />
      {configuration.label}
    </span>
  );
}