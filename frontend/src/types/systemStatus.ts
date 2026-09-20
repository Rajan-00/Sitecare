export type SchedulerStatus =
  | "running"
  | "disabled"
  | "stopped";

export interface SystemReadiness {
  status: "ready";
  service: string;
  database: "connected";
  scheduler: SchedulerStatus;
  scheduler_interval_seconds: number;
  timestamp: string;
}