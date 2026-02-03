import { Box, Button, Typography, Container, Divider, Card, CardContent } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Box>
      {/* HERO SECTION */}
      <Box sx={{ 
        py: 12, 
        textAlign: "center", 
        background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)", 
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight="bold" sx={{ mb: 3, fontSize: { xs: "2.5rem", md: "3.5rem" } }}>
            Smart Hospital Management
          </Typography>
          <Typography variant="h5" sx={{ mb: 6, fontSize: { xs: "1.2rem", md: "1.5rem" }, opacity: 0.9 }}>
            Digital care. Secure records. Smarter hospitals.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              sx={{ px: 6, py: 1.5 }}
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ px: 6, py: 1.5 }}
              onClick={() => navigate("/auth")}
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>

      {/* FEATURES - FLEXBOX */}
      <Container sx={{ py: 10 }} maxWidth="lg">
        <Typography variant="h3" fontWeight="bold" textAlign="center" sx={{ mb: 8 }}>
          Complete Hospital Solution
        </Typography>
        <Box sx={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 3, 
          justifyContent: { xs: "center", md: "space-between" },
          alignItems: "stretch"
        }}>
          <Card sx={{ 
            flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 30%" }, 
            boxShadow: 3, 
            height: "100%" 
          }}>
            <CardContent sx={{ textAlign: "center", p: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "primary.main" }}>
                Patient Management
              </Typography>
              <Typography color="text.secondary">
                Complete patient records, history, and treatment tracking.
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 30%" }, 
            boxShadow: 3, 
            height: "100%" 
          }}>
            <CardContent sx={{ textAlign: "center", p: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "primary.main" }}>
                Appointment System
              </Typography>
              <Typography color="text.secondary">
                Smart scheduling and real-time availability.
              </Typography>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            flex: { xs: "1 1 100%", sm: "1 1 45%", md: "1 1 30%" }, 
            boxShadow: 3, 
            height: "100%" 
          }}>
            <CardContent sx={{ textAlign: "center", p: 4 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: "primary.main" }}>
                Analytics Dashboard
              </Typography>
              <Typography color="text.secondary">
                Real-time insights and performance metrics.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* CTA */}
      <Box sx={{ py: 8, bgcolor: "primary.main", textAlign: "center" }}>
        <Container maxWidth="lg">
          <Typography variant="h4" color="white" fontWeight="bold" sx={{ mb: 3 }}>
            Ready to transform your hospital?
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{ px: 6, py: 1.5 }}
            onClick={() => navigate("/auth")}
          >
            Start Free Trial
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
