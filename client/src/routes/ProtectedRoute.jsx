import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/auth", { replace: true });
    }
  }, [navigate, token]);

  return token ? children : null;
};

export default ProtectedRoute;
