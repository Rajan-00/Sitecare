import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getSystemReadiness } from "../services/systemStatusApi";
import type { SystemReadiness } from "../types/systemStatus";

type SystemState =
  | "checking"
  | "operational"
  | "disabled"
  | "unavailable";

const STATUS_INTERVAL_MS = 60_000;

function getStatusText(
  state: SystemState,
): {
  title: string;
  description: string;
} {
  if (state === "checking") {
    return {
      title: "Checking system",
      description: "Connecting to SiteCare API",
    };
  }

  if (state === "operational") {
    return {
      title: "All systems operational",
      description: "Automatic monitoring is running",
    };
  }

  if (state === "disabled") {
    return {
      title: "System connected",
      description: "Automatic monitoring is disabled",
    };
  }

  return {
    title: "System unavailable",
    description: "Click to check the connection",
  };
}

export default function SystemStatus() {
  const [state, setState] =
    useState<SystemState>("checking");

  const [readiness, setReadiness] =
    useState<SystemReadiness | null>(null);

  const [isChecking, setIsChecking] =
    useState(false);

  const checkSystemStatus = useCallback(
    async (showChecking = false) => {
      if (showChecking) {
        setState("checking");
      }

      setIsChecking(true);

      try {
        const response =
          await getSystemReadiness();

        setReadiness(response);

        if (response.scheduler === "running") {
          setState("operational");
        } else if (
          response.scheduler === "disabled"
        ) {
          setState("disabled");
        } else {
          setState("unavailable");
        }
      } catch {
        setReadiness(null);
        setState("unavailable");
      } finally {
        setIsChecking(false);
      }
    },
    [],
  );

  useEffect(() => {
    void checkSystemStatus(true);

    const intervalId = window.setInterval(() => {
      if (
        document.visibilityState === "visible"
      ) {
        void checkSystemStatus();
      }
    }, STATUS_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [checkSystemStatus]);

  const statusText = getStatusText(state);

  const tooltip = readiness
    ? [
        `API: ${readiness.status}`,
        `Database: ${readiness.database}`,
        `Scheduler: ${readiness.scheduler}`,
        `Interval: ${readiness.scheduler_interval_seconds} seconds`,
      ].join("\n")
    : "Unable to connect to the SiteCare API.";

  return (
    <button
      type="button"
      className={
        `sidebar-workspace sidebar-workspace--${state}`
      }
      title={tooltip}
      disabled={isChecking}
      onClick={() =>
        void checkSystemStatus(true)
      }
    >
      <span className="sidebar-workspace-indicator">
        <span />
      </span>

      <span className="sidebar-workspace-copy">
        <strong>{statusText.title}</strong>
        <span>{statusText.description}</span>
      </span>
    </button>
  );
}