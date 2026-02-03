import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp,
  People,
  MedicalServices,
  Schedule,
  LocalHospital,
} from "@mui/icons-material";

export default function Dashboard() {
  const stats = [
    { title: "Total Patients", value: "1,234", change: "+12%", icon: People, color: "primary" },
    { title: "Doctors", value: "89", change: "+2%", icon: MedicalServices, color: "secondary" },
    { title: "Appointments", value: "456", change: "-3%", icon: Schedule, color: "success" },
    { title: "Revenue", value: "$45,678", change: "+18%", icon: LocalHospital, color: "warning" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      {/* Stats Cards - FLEXBOX */}
      <Box sx={{ 
        display: "flex", 
        flexWrap: "wrap", 
        gap: 3, 
        mb: 4,
        justifyContent: { xs: "center", md: "space-between" }
      }}>
        {stats.map((stat, index) => (
          <Card key={index} sx={{ 
            flex: { xs: "1 1 100%", sm: "1 1 48%", md: "1 1 23%" }, 
            boxShadow: 3, 
            transition: "transform 0.2s",
            minWidth: { xs: 280, md: 220 }
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: `${stat.color}.main`,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                  }}
                >
                  <stat.icon sx={{ color: "white", fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={stat.change}
                size="small"
                color={stat.change.startsWith("+") ? "success" : "error"}
                sx={{ fontWeight: "bold" }}
              />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Recent Activity - FLEXBOX */}
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", md: "row" }, 
        gap: 3 
      }}>
        <Card sx={{ flex: 1, boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
              Recent Appointments
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Today's Appointments
              </Typography>
              <LinearProgress variant="determinate" value={65} color="primary" sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                65% of daily slots filled
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
