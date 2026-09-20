import { apiRequest } from "./api";
import type { SystemReadiness } from "../types/systemStatus";

export function getSystemReadiness():
Promise<SystemReadiness> {
  return apiRequest<SystemReadiness>(
    "/health/ready",
  );
}