import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui/primitives";

export default function ProtectedRoute({ permissions = [], children }) {
  const { user, booting, has } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (permissions.length && !permissions.some((permission) => has(permission))) {
    return <Navigate to="/?denied=1" replace />;
  }

  return children ?? <Outlet />;
}