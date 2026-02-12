// src/components/Lab/LabOverview.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Alert, Stack } from '@mui/material';
import { ArrowForward, Add, Science } from '@mui/icons-material';

const LabOverview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box p={3}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Science color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" gutterBottom>Lab Management</Typography>
            <Typography variant="h6" color="text.secondary">
              Manage lab reports and patient test results
            </Typography>
          </Box>
        </Stack>

        {/* Quick Actions */}
        <Alert severity="info" sx={{ alignItems: 'flex-start' }}>
          <Typography variant="body1">
            Select a patient or create new lab reports
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mt={2}>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<ArrowForward />}
            onClick={() => navigate('/app/patients')}
            sx={{ flex: 1 }}
          >
            View Patients → Lab Reports
          </Button>
          <Button 
            variant="outlined" 
            size="large"
            startIcon={<Add />}
            // Future: Create lab without patient
          >
            Quick Lab Entry
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default LabOverview;
