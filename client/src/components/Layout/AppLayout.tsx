import React, { useState } from "react";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Dashboard from "../Dashboard/Dashboard";
import PatientManagement from "../Patient/PatientManagement";
import PatientForm from "../Patient/PatientForm";
import DoctorManagement from "../Doctor/DoctorManagement";
import AppointmentManagement from "../Appointment/AppointmentManagement";
import LabManagement from "../Lab/LabManagement";
import PharmacyManagement from "../Pharmacy/PharmacyManagement";
import BillingManagement from "../Billing/BillingManagement";
import OCRTools from "../OCR/OCRTools";
import EmergencyManagement from "../Emergency/EmergencyManagement";
import { Routes, Route } from "react-router-dom";
import DoctorForm from "../Doctor/DoctorForm";

// src/components/Layout/AppLayout.tsx
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Navbar onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          mt: { xs: 8, md: 9 },
          ml: sidebarOpen ? "50px" : "72px",
          transition: "margin-left 0.3s ease",
          overflow: "auto",
        }}
      > 
        <Routes>
          <Route index element={<Dashboard />} />              {/* /app/ */}
          <Route path="dashboard" element={<Dashboard />} />   {/* /app/dashboard */}
          {/* <Route path="patients/*" element={<PatientManagement />} /> */}
          {/* <Route path="patients/new" element={<PatientForm />} /> */}
        
<Route path="patients" element={<PatientManagement />} />
<Route path="patients/new" element={<PatientForm />} />
<Route path="patients/:id/edit" element={<PatientForm />} />
          <Route path="doctors/*" element={<DoctorManagement />} />
          <Route path="doctors/new" element={<DoctorForm />} />

          <Route path="appointments/*" element={<AppointmentManagement />} />
          <Route path="lab/*" element={<LabManagement />} />
          <Route path="pharmacy/*" element={<PharmacyManagement />} />
          <Route path="billing/*" element={<BillingManagement />} />
          <Route path="ocr/*" element={<OCRTools />} />
          <Route path="emergency/*" element={<EmergencyManagement />} />
          
          {/* Fallback for unmatched routes */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Box>
    </Box>
  );
}

