import { useState } from "react";
import axios from "axios";
import { Box, Button, TextField, Card, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password,
    });

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    navigate("/");
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
      <Card sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" mb={2}>Login</Typography>

        <TextField fullWidth label="Email" margin="normal"
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField fullWidth type="password" label="Password" margin="normal"
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleLogin}>
          Login
        </Button>
      </Card>
    </Box>
  );
}
