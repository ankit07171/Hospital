import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Box,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard,
  People,
  LocalHospital,
  EventNote,
  Science,
  LocalPharmacy,
  Receipt,
  CameraAlt,
  Emergency,
} from '@mui/icons-material';
import axios from '../../api/axios';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

// const menuItems = [
//   { text: 'Dashboard', icon: <Dashboard />, path: '/' },
//   { text: 'Patients', icon: <People />, path: '/patients' },
//   { text: 'Doctors', icon: <LocalHospital />, path: '/doctors' },
//   { text: 'Appointments', icon: <EventNote />, path: '/appointments' },
//   { text: 'Laboratory', icon: <Science />, path: '/lab' },
//   { text: 'Pharmacy', icon: <LocalPharmacy />, path: '/pharmacy' },
//   { text: 'Billing', icon: <Receipt />, path: '/billing' },
//   { text: 'OCR Tools', icon: <CameraAlt />, path: '/ocr' },
//   { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
//   { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
//   { text: 'Emergency', icon: <Emergency />, path: '/emergency' },
// ];

// src/components/Layout/Sidebar.tsx
const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/app/dashboard' },
  { text: 'Patients', icon: <People />, path: '/app/patients' },
  { text: 'Doctors', icon: <LocalHospital />, path: '/app/doctors' },
  { text: 'Appointments', icon: <EventNote />, path: '/app/appointments' },
  { text: 'Laboratory', icon: <Science />, path: '/app/lab' },
  { text: 'Pharmacy', icon: <LocalPharmacy />, path: '/app/pharmacy' },
  { text: 'Billing', icon: <Receipt />, path: '/app/billing' },
  { text: 'Medical Imaging', icon: <CameraAlt />, path: '/app/ocr' },
  { text: 'Emergency', icon: <Emergency />, path: '/app/emergency' },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    patients: 0,
    appointments: 0,
    loading: true
  });

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        axios.get('/api/patients', { params: { limit: 1 } }),
        axios.get('/api/appointments', { params: { limit: 1 } })
      ]);

      setStats({
        patients: patientsRes.data.total || patientsRes.data.pagination?.total || 0,
        appointments: appointmentsRes.data.total || appointmentsRes.data.pagination?.total || 0,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching sidebar stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const drawerWidth = open ? 240 : 60;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          mt: 8,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
          borderRight: '1px solid #e0e0e0',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', pt: 1 }}>
        <List>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <ListItem key={item.text} disablePadding>
                <Tooltip title={!open ? item.text : ''} placement="right">
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                      mx: 1,
                      my: 0.5,
                      borderRadius: 2,
                      backgroundColor: isActive ? 'primary.main' : 'transparent',
                      color: isActive ? 'white' : 'text.primary',
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                        color: isActive ? 'white' : 'primary.main',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      sx={{
                        opacity: open ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                      }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
        
        <Divider sx={{ mx: 2, my: 1 }} />
        
        {/* Quick Stats when sidebar is open */}
        {open && (
          <Box sx={{ p: 2, mt: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                textAlign: 'center',
              }}
            >
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                Today's Stats
              </Box>
              {stats.loading ? (
                <CircularProgress size={24} sx={{ my: 2 }} />
              ) : (
                <>
                  <Box sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'primary.main' }}>
                    {stats.patients} Patients
                  </Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {stats.appointments} Appointments
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;