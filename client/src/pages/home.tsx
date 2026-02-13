import { Box, Button, Typography, Container, Card, CardContent, Fade, Grow } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { 
  LocalHospital, 
  People, 
  CalendarMonth, 
  Science, 
  LocalPharmacy, 
  Assessment,
  Emergency,
  Receipt,
  MedicalServices,
  Security,
  Speed,
  CloudDone
} from "@mui/icons-material";
import { keyframes } from "@mui/system";

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

export default function Home() {
  const navigate = useNavigate();

  const features = [
    { icon: <People sx={{ fontSize: 48 }} />, title: "Patient Management", desc: "Complete patient records, history, and treatment tracking with AI-powered health scoring" },
    { icon: <MedicalServices sx={{ fontSize: 48 }} />, title: "Doctor Management", desc: "Manage doctor profiles, schedules, consultations, and performance metrics" },
    { icon: <CalendarMonth sx={{ fontSize: 48 }} />, title: "Appointments", desc: "Smart scheduling system with real-time availability and automated reminders" },
    { icon: <Science sx={{ fontSize: 48 }} />, title: "Lab Management", desc: "Digital lab reports with medical imaging AI analysis (X-Ray, MRI, CT Scan)" },
    { icon: <LocalPharmacy sx={{ fontSize: 48 }} />, title: "Pharmacy", desc: "Medicine inventory, prescription management, and automated stock tracking" },
    { icon: <Receipt sx={{ fontSize: 48 }} />, title: "Billing System", desc: "Automated billing with GST calculation, payment tracking, and invoice generation" },
    { icon: <Emergency sx={{ fontSize: 48 }} />, title: "Emergency Care", desc: "Triage management, vital signs monitoring, and real-time case tracking" },
    { icon: <Assessment sx={{ fontSize: 48 }} />, title: "Analytics", desc: "Real-time dashboards with comprehensive insights and performance metrics" },
  ];

  const benefits = [
    { icon: <Security />, title: "Secure & Compliant", desc: "Bank-grade security with encrypted data storage" },
    { icon: <Speed />, title: "Lightning Fast", desc: "Real-time updates with optimized performance" },
    { icon: <CloudDone />, title: "Cloud-Based", desc: "Access from anywhere, anytime, on any device" },
  ];

  return (
    <Box>
      {/* HERO SECTION */}
      <Box sx={{ 
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        color: "white",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        }
      }}>
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ 
                display: "inline-block", 
                animation: `${float} 3s ease-in-out infinite`,
                mb: 4
              }}>
                <LocalHospital sx={{ fontSize: 100, filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }} />
              </Box>
              
              <Typography 
                variant="h1" 
                fontWeight="bold" 
                sx={{ 
                  mb: 3, 
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  textShadow: "0 4px 20px rgba(0,0,0,0.3)"
                }}
              >
                Lifeline X Hospital System
              </Typography>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 6, 
                  fontSize: { xs: "1.2rem", md: "1.8rem" }, 
                  opacity: 0.95,
                  maxWidth: 800,
                  mx: "auto"
                }}
              >
                Complete digital healthcare solution with AI-powered diagnostics, real-time analytics, and seamless patient care management
              </Typography>
              
              <Box sx={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ 
                    px: 6, 
                    py: 2,
                    fontSize: "1.1rem",
                    bgcolor: "white",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.9)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                    },
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => navigate("/auth")}
                >
                  Get Started Now
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ 
                    px: 6, 
                    py: 2,
                    fontSize: "1.1rem",
                    borderColor: "white",
                    color: "white",
                    borderWidth: 2,
                    "&:hover": {
                      borderWidth: 2,
                      bgcolor: "rgba(255,255,255,0.1)",
                      transform: "translateY(-2px)"
                    },
                    transition: "all 0.3s ease"
                  }}
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore Features
                </Button>
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* FEATURES SECTION */}
      <Box id="features" sx={{ py: 12, bgcolor: "#f8fafc" }}>
        <Container maxWidth="lg">
          <Fade in timeout={1500}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography 
                variant="h2" 
                fontWeight="bold" 
                sx={{ mb: 2, fontSize: { xs: "2rem", md: "3rem" } }}
              >
                Complete Hospital Solution
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: "auto" }}>
                Everything you need to run a modern, efficient healthcare facility
              </Typography>
            </Box>
          </Fade>

          {/* Flexbox Features Layout */}
          <Box sx={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: 4,
            justifyContent: { xs: "center", md: "space-between" },
            alignItems: "stretch"
          }}>
            {features.map((feature, index) => (
              <Grow in timeout={1000 + index * 200} key={index}>
                <Box 
                  sx={{ 
                    flex: { xs: "1 1 100%", sm: "1 1 48%", md: "1 1 23.5%" },
                    maxWidth: { xs: "100%", sm: "48%", md: "23.5%" }
                  }}
                >
                  <Card 
                    sx={{ 
                      height: "100%",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-10px)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        "& .feature-icon": {
                          animation: `${pulse} 1s ease-in-out infinite`
                        }
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: "center", p: 4 }}>
                      <Box 
                        className="feature-icon"
                        sx={{ 
                          color: "primary.main", 
                          mb: 2,
                          display: "flex",
                          justifyContent: "center"
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        {feature.title}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Grow>
            ))}
          </Box>
        </Container>
      </Box>

      {/* BENEFITS SECTION */}
      <Box sx={{ py: 12, bgcolor: "white" }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            fontWeight="bold" 
            textAlign="center" 
            sx={{ mb: 8, fontSize: { xs: "2rem", md: "2.5rem" } }}
          >
            Why Choose Lifeline X?
          </Typography>
          
          {/* Flexbox Benefits Layout */}
          <Box sx={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: 6,
            justifyContent: "center"
          }}>
            {benefits.map((benefit, index) => (
              <Fade in timeout={2000 + index * 300} key={index}>
                <Box 
                  sx={{ 
                    flex: { xs: "1 1 100%", md: "1 1 30%" },
                    maxWidth: { md: "30%" },
                    textAlign: "center"
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: "50%", 
                      bgcolor: "primary.main",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                      fontSize: 40
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                    {benefit.title}
                  </Typography>
                  <Typography color="text.secondary" variant="body1">
                    {benefit.desc}
                  </Typography>
                </Box>
              </Fade>
            ))}
          </Box>
        </Container>
      </Box>

      {/* STATS SECTION */}
      <Box sx={{ py: 12, bgcolor: "primary.main", color: "white" }}>
        <Container maxWidth="lg">
          {/* Flexbox Stats Layout */}
          <Box sx={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: 4, 
            justifyContent: "center",
            textAlign: "center"
          }}>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 32%" }, maxWidth: { sm: "32%" } }}>
              <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                10+
              </Typography>
              <Typography variant="h6">
                Core Modules
              </Typography>
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 32%" }, maxWidth: { sm: "32%" } }}>
              <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                24/7
              </Typography>
              <Typography variant="h6">
                System Availability
              </Typography>
            </Box>
            <Box sx={{ flex: { xs: "1 1 100%", sm: "1 1 32%" }, maxWidth: { sm: "32%" } }}>
              <Typography variant="h2" fontWeight="bold" sx={{ mb: 1 }}>
                100%
              </Typography>
              <Typography variant="h6">
                Data Security
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* CTA SECTION */}
      <Box sx={{ 
        py: 12, 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        textAlign: "center"
      }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" sx={{ mb: 3, fontSize: { xs: "2rem", md: "3rem" } }}>
            Ready to Transform Your Hospital?
          </Typography>
          <Typography variant="h6" sx={{ mb: 5, opacity: 0.9 }}>
            Join modern healthcare facilities using Lifeline X for better patient care
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{ 
              px: 8, 
              py: 2.5,
              fontSize: "1.2rem",
              bgcolor: "white",
              color: "primary.main",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.9)",
                transform: "scale(1.05)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
              },
              transition: "all 0.3s ease"
            }}
            onClick={() => navigate("/auth")}
          >
            Start Your Journey
          </Button>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box sx={{ py: 4, bgcolor: "#1a1a2e", color: "white", textAlign: "center" }}>
        <Container>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            © 2026 Lifeline X Hospital Information System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
