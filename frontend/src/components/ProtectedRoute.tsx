import type { ReactNode } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";
import { LoaderCircle } from "lucide-react";

import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const location = useLocation();

  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <LoaderCircle
          className="spin-animation"
          size={32}
        />
        <p>Restoring your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to="/login"
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  return children;
}