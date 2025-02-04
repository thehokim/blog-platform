import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const TOKEN = localStorage.getItem("token");

  if (!TOKEN) {
    return <Navigate to="/signup" replace />;
  }

  return children;
};

export default ProtectedRoute;
