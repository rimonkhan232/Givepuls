import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOnboardingStatus } from "../lib/db";

export default function RequireOnboarding({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return children;

  const status = getOnboardingStatus(user.id);
  if (!status.complete) {
    return (
      <Navigate
        to={!status.profileComplete ? "/profile" : "/reports"}
        state={{ onboarding: true, from: location.pathname }}
        replace
      />
    );
  }

  return children;
}
