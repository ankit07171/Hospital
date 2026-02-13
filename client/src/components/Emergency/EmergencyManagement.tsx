import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Tooltip,
  Snackbar,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  LocalHospital,
  Search,
  Emergency,
  Warning,
  Person,
  AccessTime,
  Assignment,
  Healing,
  Timeline,
  Refresh,
  Print,
  Download,
  CheckCircle,
  Cancel,
  Visibility,
  PersonAdd,
  MedicalServices,
  MonitorHeart,
  LocalPharmacy,
  Science,
  CloudUpload,
} from '@mui/icons-material';
import axios from '../../api/axios';
import { format, differenceInMinutes } from 'date-fns';

interface EmergencyCase {
  _id: string;
  emergencyId: string;
  patientId: {
    _id: string;
    personalInfo: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      gender: string;
      phoneNumber: string;
    };
  };
  triageLevel: string;
  chiefComplaint: string;
  symptoms: string[];
  vitalSigns: {
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    painScale: number;
  };
  arrivalTime: string;
  arrivalMethod: string;
  assignedDoctor?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    specialization?: string;
    personalInfo?: {
      firstName: string;
      lastName: string;
    };
    professionalInfo?: {
      specialization: string;
    };
  };
  assignedNurse?: string;
  bedNumber?: string;
  status: string;
  treatmentNotes: Array<{
    timestamp: string;
    note: string;
    provider: string;
  }>;
  medications?: Array<{
    name: string;
    dosage: string;
    route: string;
    frequency: string;
    startTime: string;
  }>;
  procedures?: Array<{
    name: string;
    performedBy: string;
    timestamp: string;
    notes: string;
  }>;
  disposition?: string;
  dischargeTime?: string;
}

interface EmergencyStats {
  totalCases: number;
  activeCases: number;
  criticalCases: number;
  todayCases: number;
  avgWaitingTime: number;
}

interface Patient {
  _id: string;
  patientId?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    email?: string;
  };
}

const EmergencyManagement: React.FC = () => {
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<EmergencyStats>({
    totalCases: 0,
    activeCases: 0,
    criticalCases: 0,
    todayCases: 0,
    avgWaitingTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [triageFilter, setTriageFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openVitalsDialog, setOpenVitalsDialog] = useState(false);
  const [openNotesDialog, setOpenNotesDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteProvider, setNoteProvider] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const [formData, setFormData] = useState({
    patientId: '',
    triageLevel: 'Medium',
    chiefComplaint: '',
    symptoms: '',
    arrivalMethod: 'Walk-in',
    assignedNurse: '',
    bedNumber: '',
  });

  const [vitalsData, setVitalsData] = useState({
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: 75,
    temperature: 98.6,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    painScale: 0,
  });

  const triageLevels = ['Critical', 'High', 'Medium', 'Low'];
  const arrivalMethods = ['Walk-in', 'Ambulance', 'Police', 'Helicopter', 'Transfer'];
  const statuses = ['Waiting', 'In Progress', 'Under Treatment', 'Stable', 'Discharged', 'Admitted', 'Transferred'];

  useEffect(() => {
    fetchCases();
    fetchStats();
    fetchPatients();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchCases();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [searchTerm, statusFilter, triageFilter]);

  const fetchCases = async () => {
    try {
      const response = await axios.get('/api/emergency', {
        params: {
          search: searchTerm,
          status: statusFilter,
          triageLevel: triageFilter,
          limit: 100,
        },
      });
      setCases(response.data.emergencies || []);
    } catch (error) {
      console.error('Error fetching emergency cases:', error);
      showSnackbar('Failed to fetch emergency cases', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/emergency/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching emergency stats:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      // ✅ Handle paginated response
      const patientsData = response.data.patients || response.data;
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showSnackbar('Failed to fetch patients list', 'warning');
      setPatients([]);
    }
  };

  // ✅ Helper function to calculate age safely
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    try {
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return 0;
      return new Date().getFullYear() - birthDate.getFullYear();
    } catch {
      return 0;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.patientId) {
      showSnackbar('Please select a patient', 'warning');
      return;
    }
    if (!formData.chiefComplaint.trim()) {
      showSnackbar('Please enter chief complaint', 'warning');
      return;
    }

    try {
      const payload = {
        ...formData,
        symptoms: formData.symptoms.split(',').map(s => s.trim()).filter(s => s),
        vitalSigns: vitalsData,
      };

      if (selectedCase) {
        await axios.put(`/api/emergency/${selectedCase._id}`, payload);
        showSnackbar('Emergency case updated successfully', 'success');
      } else {
        await axios.post('/api/emergency', payload);
        showSnackbar('Emergency case created successfully', 'success');
      }
      setOpenDialog(false);
      resetForm();
      fetchCases();
      fetchStats();
    } catch (error: any) {
      console.error('Error saving emergency case:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save emergency case';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleVitalsUpdate = async () => {
    if (!selectedCase) return;

    try {
      await axios.put(`/api/emergency/${selectedCase._id}/vitals`, vitalsData);
      showSnackbar('Vital signs updated successfully', 'success');
      setOpenVitalsDialog(false);
      fetchCases();
    } catch (error) {
      console.error('Error updating vitals:', error);
      showSnackbar('Failed to update vital signs', 'error');
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !newNote.trim()) {
      showSnackbar('Please enter a note', 'warning');
      return;
    }

    try {
      await axios.post(`/api/emergency/${selectedCase._id}/notes`, {
        note: newNote,
        provider: noteProvider || 'Staff',
      });
      showSnackbar('Treatment note added successfully', 'success');
      setOpenNotesDialog(false);
      setNewNote('');
      setNoteProvider('');
      fetchCases();
    } catch (error) {
      console.error('Error adding note:', error);
      showSnackbar('Failed to add treatment note', 'error');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedCase || !newStatus) {
      showSnackbar('Please select a status', 'warning');
      return;
    }

    try {
      await axios.put(`/api/emergency/${selectedCase._id}`, {
        status: newStatus,
      });
      showSnackbar('Status updated successfully', 'success');
      setOpenStatusDialog(false);
      setNewStatus('');
      fetchCases();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleDischarge = async (caseId: string) => {
    if (!window.confirm('Are you sure you want to discharge this patient?')) return;

    try {
      await axios.delete(`/api/emergency/${caseId}`);
      showSnackbar('Patient discharged successfully', 'success');
      fetchCases();
      fetchStats();
    } catch (error) {
      console.error('Error discharging patient:', error);
      showSnackbar('Failed to discharge patient', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      triageLevel: 'Medium',
      chiefComplaint: '',
      symptoms: '',
      arrivalMethod: 'Walk-in',
      assignedNurse: '',
      bedNumber: '',
    });
    setVitalsData({
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: 75,
      temperature: 98.6,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      painScale: 0,
    });
    setSelectedCase(null);
  };

  const handleEdit = (emergencyCase: EmergencyCase) => {
    setSelectedCase(emergencyCase);
    setFormData({
      patientId: emergencyCase.patientId._id,
      triageLevel: emergencyCase.triageLevel,
      chiefComplaint: emergencyCase.chiefComplaint,
      symptoms: emergencyCase.symptoms.join(', '),
      arrivalMethod: emergencyCase.arrivalMethod,
      assignedNurse: emergencyCase.assignedNurse || '',
      bedNumber: emergencyCase.bedNumber || '',
    });
    setVitalsData(emergencyCase.vitalSigns);
    setOpenDialog(true);
  };

  const handleViewDetails = (emergencyCase: EmergencyCase) => {
    setSelectedCase(emergencyCase);
    setOpenDetailDialog(true);
  };

  const handleVitalsEdit = (emergencyCase: EmergencyCase) => {
    setSelectedCase(emergencyCase);
    setVitalsData(emergencyCase.vitalSigns);
    setOpenVitalsDialog(true);
  };

  const handleNotesEdit = (emergencyCase: EmergencyCase) => {
    setSelectedCase(emergencyCase);
    setOpenNotesDialog(true);
  };

  const handleStatusChange = (emergencyCase: EmergencyCase) => {
    setSelectedCase(emergencyCase);
    setNewStatus(emergencyCase.status);
    setOpenStatusDialog(true);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const getTriageColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting': return 'warning';
      case 'In Progress':
      case 'Under Treatment': return 'info';
      case 'Stable': return 'success';
      case 'Discharged': return 'default';
      case 'Admitted': return 'primary';
      case 'Transferred': return 'secondary';
      default: return 'default';
    }
  };

  const getWaitingTime = (arrivalTime: string) => {
    const minutes = differenceInMinutes(new Date(), new Date(arrivalTime));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const isVitalsAbnormal = (vitals: EmergencyCase['vitalSigns']) => {
    return (
      vitals.bloodPressure.systolic > 140 ||
      vitals.bloodPressure.systolic < 90 ||
      vitals.bloodPressure.diastolic > 90 ||
      vitals.heartRate > 100 ||
      vitals.heartRate < 60 ||
      vitals.temperature > 100.4 ||
      vitals.oxygenSaturation < 95 ||
      vitals.painScale > 7
    );
  };

  const exportToCSV = () => {
    const headers = ['Emergency ID', 'Patient Name', 'Triage', 'Chief Complaint', 'Arrival Time', 'Status'];
    const rows = cases.map(c => [
      c.emergencyId,
      `${c.patientId.personalInfo.firstName} ${c.patientId.personalInfo.lastName}`,
      c.triageLevel,
      c.chiefComplaint,
      format(new Date(c.arrivalTime), 'yyyy-MM-dd HH:mm'),
      c.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency-cases-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    showSnackbar('Data exported successfully', 'success');
  };

  const StatCard = ({ title, value, icon, color = 'primary', trend }: any) => (
    <Card sx={{ 
      height: '100%',
      background: `linear-gradient(135deg, ${
        color === 'error' ? '#f44336' :
        color === 'warning' ? '#ff9800' :
        color === 'success' ? '#4caf50' :
        color === 'info' ? '#2196f3' : '#9c27b0'
      }15, ${
        color === 'error' ? '#f44336' :
        color === 'warning' ? '#ff9800' :
        color === 'success' ? '#4caf50' :
        color === 'info' ? '#2196f3' : '#9c27b0'
      }05)`,
      border: `1px solid ${
        color === 'error' ? '#f44336' :
        color === 'warning' ? '#ff9800' :
        color === 'success' ? '#4caf50' :
        color === 'info' ? '#2196f3' : '#9c27b0'
      }30`,
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
              {typeof value === 'number' && title.includes('Time') 
                ? `${value} min` 
                : value.toLocaleString()}
            </Typography>
            {trend && (
              <Typography variant="caption" color="textSecondary">
                {trend}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ 
            bgcolor: `${color}.main`,
            width: 56,
            height: 56,
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Emergency Department
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Emergency case management and monitoring system
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => { fetchCases(); fetchStats(); }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <IconButton onClick={exportToCSV}>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3
      }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <StatCard
            title="Total Cases"
            value={stats.totalCases}
            icon={<Emergency sx={{ fontSize: 28 }} />}
            color="primary"
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <StatCard
            title="Active Cases"
            value={stats.activeCases}
            icon={<Person sx={{ fontSize: 28 }} />}
            color="info"
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <StatCard
            title="Critical Cases"
            value={stats.criticalCases}
            icon={<Warning sx={{ fontSize: 28 }} />}
            color="error"
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <StatCard
            title="Today's Cases"
            value={stats.todayCases}
            icon={<Timeline sx={{ fontSize: 28 }} />}
            color="success"
          />
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <StatCard
            title="Avg Wait Time"
            value={stats.avgWaitingTime}
            icon={<AccessTime sx={{ fontSize: 28 }} />}
            color="warning"
          />
        </Box>
      </Box>

      {/* Alerts */}
      {stats.criticalCases > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          icon={<Warning />}
        >
          <strong>{stats.criticalCases} critical case{stats.criticalCases > 1 ? 's' : ''}</strong> require immediate attention!
        </Alert>
      )}
      {stats.avgWaitingTime > 60 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Average waiting time is <strong>{stats.avgWaitingTime} minutes</strong>. Consider additional staffing.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Emergency Cases
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
              size="large"
            >
              Register New Case
            </Button>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search by ID or complaint..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: '1 1 300px', minWidth: '200px' }}
              size="small"
            />
            <FormControl sx={{ flex: '1 1 150px', minWidth: '150px' }} size="small">
              <InputLabel>Triage Level</InputLabel>
              <Select
                value={triageFilter}
                label="Triage Level"
                onChange={(e) => setTriageFilter(e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                {triageLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: '1 1 150px', minWidth: '150px' }} size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                {statuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Triage</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Chief Complaint</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Vitals</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Arrival</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Wait Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Box sx={{ py: 4 }}>
                        <LocalHospital sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography color="textSecondary">
                          No emergency cases found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((emergencyCase) => (
                    <TableRow 
                      key={emergencyCase._id}
                      sx={{
                        '&:hover': { bgcolor: 'action.hover' },
                        bgcolor: emergencyCase.triageLevel === 'Critical' ? 'error.lighter' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {emergencyCase.emergencyId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {emergencyCase.patientId.personalInfo.firstName} {emergencyCase.patientId.personalInfo.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {emergencyCase.patientId.personalInfo.gender}, {calculateAge(emergencyCase.patientId.personalInfo.dateOfBirth)}y
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emergencyCase.triageLevel}
                          color={getTriageColor(emergencyCase.triageLevel) as any}
                          size="small"
                          icon={emergencyCase.triageLevel === 'Critical' ? <Warning /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {emergencyCase.chiefComplaint}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={`BP: ${emergencyCase.vitalSigns.bloodPressure.systolic}/${emergencyCase.vitalSigns.bloodPressure.diastolic}, HR: ${emergencyCase.vitalSigns.heartRate}, SpO2: ${emergencyCase.vitalSigns.oxygenSaturation}%`}>
                          <Chip
                            icon={<MonitorHeart />}
                            label={isVitalsAbnormal(emergencyCase.vitalSigns) ? "Abnormal" : "Normal"}
                            color={isVitalsAbnormal(emergencyCase.vitalSigns) ? "error" : "success"}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(emergencyCase.arrivalTime), 'HH:mm')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {emergencyCase.arrivalMethod}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getWaitingTime(emergencyCase.arrivalTime)}
                          color={differenceInMinutes(new Date(), new Date(emergencyCase.arrivalTime)) > 60 ? "warning" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emergencyCase.status}
                          color={getStatusColor(emergencyCase.status) as any}
                          size="small"
                          onClick={() => handleStatusChange(emergencyCase)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(emergencyCase)}
                              color="primary"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(emergencyCase)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Update Vitals">
                            <IconButton
                              size="small"
                              onClick={() => handleVitalsEdit(emergencyCase)}
                              color="secondary"
                            >
                              <Healing />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Note">
                            <IconButton
                              size="small"
                              onClick={() => handleNotesEdit(emergencyCase)}
                              color="info"
                            >
                              <Assignment />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedCase ? 'Edit Emergency Case' : 'Register New Emergency Case'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Select Patient</InputLabel>
              <Select
                value={formData.patientId}
                label="Select Patient"
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              >
                <MenuItem value="">
                  <em>Select a patient</em>
                </MenuItem>
                {patients.length === 0 ? (
                  <MenuItem disabled>
                    <em>No patients available - Please add patients first</em>
                  </MenuItem>
                ) : (
                  patients.map((patient) => (
                    <MenuItem key={patient._id} value={patient._id}>
                      {/* ✅ FIXED: Access nested personalInfo structure */}
                      {patient.personalInfo.firstName} {patient.personalInfo.lastName} - {patient.personalInfo.gender}, {calculateAge(patient.personalInfo.dateOfBirth)}y ({patient.personalInfo.phoneNumber})
                      {patient.patientId && ` [${patient.patientId}]`}
                    </MenuItem>
                  ))
                )}
              </Select>
              {patients.length === 0 && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  No patients found. Please add patients from the Patients module first.
                </Typography>
              )}
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Triage Level *</InputLabel>
                <Select
                  value={formData.triageLevel}
                  label="Triage Level *"
                  onChange={(e) => setFormData({ ...formData, triageLevel: e.target.value })}
                >
                  {triageLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Arrival Method</InputLabel>
                <Select
                  value={formData.arrivalMethod}
                  label="Arrival Method"
                  onChange={(e) => setFormData({ ...formData, arrivalMethod: e.target.value })}
                >
                  {arrivalMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label="Chief Complaint"
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              fullWidth
              required
              multiline
              rows={2}
              helperText="Main reason for visit"
            />
            <TextField
              label="Symptoms"
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              fullWidth
              multiline
              rows={2}
              helperText="Separate multiple symptoms with commas"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Bed Number"
                value={formData.bedNumber}
                onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                fullWidth
              />
              <TextField
                label="Assigned Nurse"
                value={formData.assignedNurse}
                onChange={(e) => setFormData({ ...formData, assignedNurse: e.target.value })}
                fullWidth
              />
            </Box>

            <Divider sx={{ my: 1 }}>
              <Chip label="Initial Vital Signs" />
            </Divider>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Systolic BP"
                type="number"
                value={vitalsData.bloodPressure.systolic}
                onChange={(e) => setVitalsData({
                  ...vitalsData,
                  bloodPressure: { ...vitalsData.bloodPressure, systolic: parseInt(e.target.value) || 0 }
                })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">mmHg</InputAdornment> }}
              />
              <TextField
                label="Diastolic BP"
                type="number"
                value={vitalsData.bloodPressure.diastolic}
                onChange={(e) => setVitalsData({
                  ...vitalsData,
                  bloodPressure: { ...vitalsData.bloodPressure, diastolic: parseInt(e.target.value) || 0 }
                })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">mmHg</InputAdornment> }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Heart Rate"
                type="number"
                value={vitalsData.heartRate}
                onChange={(e) => setVitalsData({ ...vitalsData, heartRate: parseInt(e.target.value) || 0 })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">bpm</InputAdornment> }}
              />
              <TextField
                label="Temperature"
                type="number"
                value={vitalsData.temperature}
                onChange={(e) => setVitalsData({ ...vitalsData, temperature: parseFloat(e.target.value) || 0 })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">°F</InputAdornment> }}
              />
              <TextField
                label="Respiratory Rate"
                type="number"
                value={vitalsData.respiratoryRate}
                onChange={(e) => setVitalsData({ ...vitalsData, respiratoryRate: parseInt(e.target.value) || 0 })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">bpm</InputAdornment> }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Oxygen Saturation"
                type="number"
                value={vitalsData.oxygenSaturation}
                onChange={(e) => setVitalsData({ ...vitalsData, oxygenSaturation: parseInt(e.target.value) || 0 })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
              <TextField
                label="Pain Scale"
                type="number"
                value={vitalsData.painScale}
                onChange={(e) => setVitalsData({ ...vitalsData, painScale: parseInt(e.target.value) || 0 })}
                fullWidth
                inputProps={{ min: 0, max: 10 }}
                helperText="0-10 scale"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            size="large"
            disabled={!formData.patientId || !formData.chiefComplaint.trim()}
          >
            {selectedCase ? 'Update Case' : 'Register Case'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vitals Update Dialog */}
      <Dialog open={openVitalsDialog} onClose={() => setOpenVitalsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Update Vital Signs</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Systolic BP"
                type="number"
                value={vitalsData.bloodPressure.systolic}
                onChange={(e) => setVitalsData({
                  ...vitalsData,
                  bloodPressure: { ...vitalsData.bloodPressure, systolic: parseInt(e.target.value) || 0 }
                })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">mmHg</InputAdornment> }}
              />
              <TextField
                label="Diastolic BP"
                type="number"
                value={vitalsData.bloodPressure.diastolic}
                onChange={(e) => setVitalsData({
                  ...vitalsData,
                  bloodPressure: { ...vitalsData.bloodPressure, diastolic: parseInt(e.target.value) || 0 }
                })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">mmHg</InputAdornment> }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Heart Rate"
                type="number"
                value={vitalsData.heartRate}
                onChange={(e) => setVitalsData({ ...vitalsData, heartRate: parseInt(e.target.value) || 0 })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">bpm</InputAdornment> }}
              />
              <TextField
                label="Temperature"
                type="number"
                value={vitalsData.temperature}
                onChange={(e) => setVitalsData({ ...vitalsData, temperature: parseFloat(e.target.value) || 0 })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">°F</InputAdornment> }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Respiratory Rate"
                type="number"
                value={vitalsData.respiratoryRate}
                onChange={(e) => setVitalsData({ ...vitalsData, respiratoryRate: parseInt(e.target.value) || 0 })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">bpm</InputAdornment> }}
              />
              <TextField
                label="Oxygen Saturation"
                type="number"
                value={vitalsData.oxygenSaturation}
                onChange={(e) => setVitalsData({ ...vitalsData, oxygenSaturation: parseInt(e.target.value) || 0 })}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Box>
            <TextField
              label="Pain Scale (0-10)"
              type="number"
              value={vitalsData.painScale}
              onChange={(e) => setVitalsData({ ...vitalsData, painScale: parseInt(e.target.value) || 0 })}
              fullWidth
              inputProps={{ min: 0, max: 10 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVitalsDialog(false)}>Cancel</Button>
          <Button onClick={handleVitalsUpdate} variant="contained">
            Update Vitals
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Treatment Notes</DialogTitle>
        <DialogContent>
          {selectedCase && selectedCase.treatmentNotes && selectedCase.treatmentNotes.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Previous Notes
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {selectedCase.treatmentNotes.map((note, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', bgcolor: 'action.hover', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={note.note}
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" fontWeight="medium">
                            {note.provider}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format(new Date(note.timestamp), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Add New Note
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Provider Name"
              value={noteProvider}
              onChange={(e) => setNoteProvider(e.target.value)}
              fullWidth
              placeholder="e.g., Dr. Smith, Nurse Johnson"
            />
            <TextField
              label="Treatment Note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Enter detailed treatment notes, observations, or instructions..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotesDialog(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained" disabled={!newNote.trim()}>
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Update Case Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {statuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Emergency Case Details</span>
            {selectedCase && (
              <Chip
                label={selectedCase.emergencyId}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCase && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Patient Info */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person /> Patient Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Name:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedCase.patientId.personalInfo.firstName} {selectedCase.patientId.personalInfo.lastName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Age:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {calculateAge(selectedCase.patientId.personalInfo.dateOfBirth)} years
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Gender:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.patientId.personalInfo.gender}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Contact:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.patientId.personalInfo.phoneNumber}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Emergency Details */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Emergency /> Emergency Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Triage Level:</Typography>
                      <Chip label={selectedCase.triageLevel} color={getTriageColor(selectedCase.triageLevel) as any} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Status:</Typography>
                      <Chip label={selectedCase.status} color={getStatusColor(selectedCase.status) as any} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Arrival Method:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.arrivalMethod}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Arrival Time:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {format(new Date(selectedCase.arrivalTime), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Wait Time:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {getWaitingTime(selectedCase.arrivalTime)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body2" color="textSecondary">Chief Complaint:</Typography>
                      <Typography variant="body2" fontWeight="medium" sx={{ maxWidth: '60%', textAlign: 'right' }}>
                        {selectedCase.chiefComplaint}
                      </Typography>
                    </Box>
                    {selectedCase.symptoms && selectedCase.symptoms.length > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" color="textSecondary">Symptoms:</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '60%', justifyContent: 'flex-end' }}>
                          {selectedCase.symptoms.map((symptom, idx) => (
                            <Chip key={idx} label={symptom} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Vital Signs */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MonitorHeart /> Vital Signs
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Blood Pressure:</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {selectedCase.vitalSigns.bloodPressure.systolic}/{selectedCase.vitalSigns.bloodPressure.diastolic} mmHg
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Heart Rate:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.vitalSigns.heartRate} bpm</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Temperature:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.vitalSigns.temperature}°F</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Respiratory Rate:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.vitalSigns.respiratoryRate} bpm</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Oxygen Saturation:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.vitalSigns.oxygenSaturation}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Pain Scale:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.vitalSigns.painScale}/10</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Staff Assignment */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalServices /> Staff Assignment
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Assigned Nurse:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.assignedNurse || 'Not assigned'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="textSecondary">Bed Number:</Typography>
                      <Typography variant="body2" fontWeight="medium">{selectedCase.bedNumber || 'Not assigned'}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
          <Button 
            variant="outlined" 
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmergencyManagement;