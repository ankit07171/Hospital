import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Science,
  Person,
  FilterList,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from '../../api/axios';

interface Patient {
  _id: string;
  patientId?: string;  // ✅ Added optional patientId field
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    email: string;
  };
  medicalInfo: {
    bloodGroup: string;
    chronicConditions: string[];
    allergies: string[];
  };
  riskAssessment: {
    riskScore: number;
    riskLevel: string;
    lastCalculated: string;
  };
  status: string;
  age: number;
  labReportsCount?: number;
}

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [statusFilter, riskLevelFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (riskLevelFilter) params.riskLevel = riskLevelFilter;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get('/api/patients', { params });
      
      // ✅ FIX: Extract patients array from response object
      const patientsData = response.data.patients || response.data;
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      setError(error.response?.data?.error || 'Failed to load patients');
      setPatients([]);  // ✅ Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPatients();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This will also delete all lab reports.`)) {
      return;
    }

    try {
      await axios.delete(`/api/patients/${id}`);
      setSuccess('Patient deleted successfully');
      fetchPatients();
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      setError(error.response?.data?.error || 'Failed to delete patient');
    }
  };

  const getRiskColor = (riskLevel: string): 'error' | 'warning' | 'info' | 'success' | 'default' => {
    switch (riskLevel) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return 'error.main';
    if (score >= 50) return 'warning.main';
    if (score >= 30) return 'info.main';
    return 'success.main';
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical':
      case 'High':
        return <Warning />;
      case 'Medium':
        return <ErrorIcon />;
      case 'Low':
      case 'Minimal':
        return <CheckCircle />;
      default:
        return null;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading && patients.length === 0) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography sx={{ textAlign: 'center', mt: 2 }}>
          Loading patients...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, color: 'primary.main' }}
          >
            Patient Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage patient records and monitor health risks
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/app/patients/new')}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            boxShadow: 3
          }}
        >
          Add Patient
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards - Flex Layout */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* Total Patients */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Patients
            </Typography>
            <Typography variant="h3" color="primary">
              {patients.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {patients.filter(p => p.status === 'Active').length} active
            </Typography>
          </CardContent>
        </Card>

        {/* Critical Risk */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="error" />
              <Typography variant="h6">Critical Risk</Typography>
            </Box>
            <Typography variant="h3" color="error">
              {patients.filter(p => p.riskAssessment.riskLevel === 'Critical').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Immediate attention
            </Typography>
          </CardContent>
        </Card>

        {/* High Risk */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="warning" />
              <Typography variant="h6">High Risk</Typography>
            </Box>
            <Typography variant="h3" color="warning.main">
              {patients.filter(p => p.riskAssessment.riskLevel === 'High').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Close monitoring
            </Typography>
          </CardContent>
        </Card>

        {/* Low Risk */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle color="success" />
              <Typography variant="h6">Low Risk</Typography>
            </Box>
            <Typography variant="h3" color="success.main">
              {patients.filter(p =>
                p.riskAssessment.riskLevel === 'Low' ||
                p.riskAssessment.riskLevel === 'Minimal'
              ).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Routine care
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters and Search - Flex Layout */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email, phone, or patient ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </InputAdornment>
            ),
          }}
        />

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as string)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Discharged">Discharged</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Risk Level</InputLabel>
          <Select
            value={riskLevelFilter}
            label="Risk Level"
            onChange={(e) => setRiskLevelFilter(e.target.value as string)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Minimal">Minimal</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Patients Table */}
      <TableContainer component={Paper}>
        {patients.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Person sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No patients found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm || statusFilter || riskLevelFilter
                ? 'Try adjusting your filters'
                : 'Click "Add Patient" to create your first patient record'
              }
            </Typography>
            {!searchTerm && !statusFilter && !riskLevelFilter && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/app/patients/new')}
                size="large"
              >
                Add First Patient
              </Button>
            )}
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Age / Gender</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Blood Group</TableCell>
                <TableCell>Conditions</TableCell>
                <TableCell>Lab Reports</TableCell>
                <TableCell>Risk Assessment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 45,
                          height: 45,
                          fontSize: '1.1rem'
                        }}
                      >
                        {getInitials(patient.personalInfo.firstName, patient.personalInfo.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {patient.personalInfo.firstName} {patient.personalInfo.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {/* ✅ Show patientId if available, otherwise show MongoDB _id */}
                          ID: {patient.patientId || patient._id.slice(-8)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {patient.age} years
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {patient.personalInfo.gender}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {patient.personalInfo.phoneNumber}
                    </Typography>
                    {patient.personalInfo.email && (
                      <Typography variant="caption" color="text.secondary">
                        {patient.personalInfo.email}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={patient.medicalInfo.bloodGroup || 'Unknown'}
                      size="small"
                      color={patient.medicalInfo.bloodGroup ? 'primary' : 'default'}
                    />
                  </TableCell>

                  <TableCell>
                    {patient.medicalInfo.chronicConditions.length > 0 ? (
                      <Chip
                        label={`${patient.medicalInfo.chronicConditions.length} condition${patient.medicalInfo.chronicConditions.length > 1 ? 's' : ''}`}
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 500 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        None
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Button
                      startIcon={<Science />}
                      onClick={() => navigate(`/app/patients/${patient._id}/lab-reports`)}
                      variant="outlined"
                      sx={{ minWidth: 80 }}
                    >
                      {patient.labReportsCount || 0}
                    </Button>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getRiskIcon(patient.riskAssessment.riskLevel)}
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {patient.riskAssessment.riskScore}%
                        </Typography>
                        <Chip
                          label={patient.riskAssessment.riskLevel}
                          size="small"
                          color={getRiskColor(patient.riskAssessment.riskLevel)}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={patient.status}
                      size="small"
                      color={patient.status === 'Active' ? 'success' : 'default'}
                    />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit Patient">
                        <IconButton
                          onClick={() => navigate(`/app/patients/${patient._id}/edit`)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Patient">
                        <IconButton
                          onClick={() =>
                            handleDelete(
                              patient._id,
                              `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`
                            )}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
};

export default Patients;