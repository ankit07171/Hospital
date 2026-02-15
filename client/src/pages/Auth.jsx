import { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  const handleSubmit = async () => {
  setError("");
  setLoading(true);

  try {
    const url = mode === "signup"
      ? `${API_BASE_URL}/auth/signup`
      : `${API_BASE_URL}/auth/login`;

    const payload = mode === "signup"
      ? form
      : { email: form.email, password: form.password };

    const res = await axios.post(url, payload);

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    navigate("/app/dashboard");
  } catch (err) {
    setError(err.response?.data?.error || "Something went wrong");
  } finally {
    setLoading(false);
  }
};
  // const handleSubmit = async () => {
  //   setError("");
  //   setLoading(true);

  //   try {
  //     const url = mode === "signup"
  //       ? "http://localhost:5000/api/auth/signup"
  //       : "http://localhost:5000/api/auth/login";

  //     const payload = mode === "signup"
  //       ? form
  //       : { email: form.email, password: form.password };

  //     const res = await axios.post(url, payload);

  //     localStorage.setItem("token", res.data.token);
  //     localStorage.setItem("user", JSON.stringify(res.data.user));
  //     navigate("/app/dashboard");
  //   } catch (err) {
  //     setError(err.response?.data?.error || "Something went wrong");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      <Card sx={{ width: { xs: "100%", md: 450 }, maxWidth: 450, boxShadow: 24 }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {mode === "login" 
                ? "Sign in to your account" 
                : "Join our hospital management system"
              }
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {mode === "signup" && (
            <TextField
              label="Full Name"
              fullWidth
              margin="normal"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleSubmit}
            disabled={loading || !form.email || !form.password}
            sx={{ mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 
             (mode === "login" ? "Sign In" : "Create Account")}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            sx={{ py: 1.5 }}
          >
            {mode === "login"
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
