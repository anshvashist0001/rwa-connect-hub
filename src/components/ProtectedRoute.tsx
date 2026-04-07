import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authApi } from "@/lib/api";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("rwa_admin_token");
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;
