import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Components
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import PatientManagement from './components/Patient/PatientManagement';
import DoctorManagement from './components/Doctor/DoctorManagement';
import AppointmentManagement from './components/Appointment/AppointmentManagement';
import LabManagement from './components/Lab/LabManagement';
import PharmacyManagement from './components/Pharmacy/PharmacyManagement';
import BillingManagement from './components/Billing/BillingManagement';
import OCRTools from './components/OCR/OCRTools';
import Analytics from './components/Analytics/Analytics';
import InventoryManagement from './components/Inventory/InventoryManagement';
import EmergencyManagement from './components/Emergency/EmergencyManagement';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Navbar onSidebarToggle={handleSidebarToggle} />
          <Sidebar open={sidebarOpen} onToggle={handleSidebarToggle} />
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              mt: 8,
              ml: sidebarOpen ? '240px' : '60px',
              transition: 'margin-left 0.3s ease',
              backgroundColor: 'background.default',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients/*" element={<PatientManagement />} />
              <Route path="/doctors/*" element={<DoctorManagement />} />
              <Route path="/appointments/*" element={<AppointmentManagement />} />
              <Route path="/lab/*" element={<LabManagement />} />
              <Route path="/pharmacy/*" element={<PharmacyManagement />} />
              <Route path="/billing/*" element={<BillingManagement />} />
              <Route path="/ocr/*" element={<OCRTools />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/inventory/*" element={<InventoryManagement />} />
              <Route path="/emergency/*" element={<EmergencyManagement />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;