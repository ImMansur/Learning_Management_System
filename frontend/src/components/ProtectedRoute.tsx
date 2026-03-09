import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles = [], children }: ProtectedRouteProps) => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  // Not logged in -> send to login
  if (!user) return <Navigate to="/" replace />;

  // If roles are specified and user role not included -> redirect to fallback
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallback = user.role === "Trainer" ? "/trainer/courses" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
