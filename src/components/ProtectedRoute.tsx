import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authApi } from "@/lib/api";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<"checking" | "valid" | "invalid">("checking");
  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("rwa_admin_token");
    if (!token) { setState("invalid"); return; }
    if (token === "demo-token") {
      setState(import.meta.env.VITE_DEMO_MODE === "true" ? "valid" : "invalid");
      return;
    }
    authApi.me().then(() => { if (active) setState("valid"); }).catch(() => {
      if (active) {
        localStorage.removeItem("rwa_admin_token");
        localStorage.removeItem("rwa_admin");
        setState("invalid");
      }
    });
    return () => { active = false; };
  }, []);
  if (state === "checking") return <p role="status">Checking your session...</p>;
  return state === "valid" ? <>{children}</> : <Navigate to="/admin/login" replace />;
};
export default ProtectedRoute;
