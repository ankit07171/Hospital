import React from 'react';
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
  Analytics,
  Inventory,
  Emergency,
} from '@mui/icons-material';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Patients', icon: <People />, path: '/patients' },
  { text: 'Doctors', icon: <LocalHospital />, path: '/doctors' },
  { text: 'Appointments', icon: <EventNote />, path: '/appointments' },
  { text: 'Laboratory', icon: <Science />, path: '/lab' },
  { text: 'Pharmacy', icon: <LocalPharmacy />, path: '/pharmacy' },
  { text: 'Billing', icon: <Receipt />, path: '/billing' },
  { text: 'OCR Tools', icon: <CameraAlt />, path: '/ocr' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
  { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
  { text: 'Emergency', icon: <Emergency />, path: '/emergency' },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
              <Box sx={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'primary.main' }}>
                127 Patients
              </Box>
              <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                23 Appointments
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;