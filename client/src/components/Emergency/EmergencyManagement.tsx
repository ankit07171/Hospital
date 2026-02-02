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
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

interface EmergencyCase {
  _id: string;
  emergencyId: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
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
    firstName: string;
    lastName: string;
    specialization: string;
  };
  assignedNurse?: string;
  bedNumber?: string;
  status: string;
  treatmentNotes: Array<{
    timestamp: string;
    note: string;
    provider: string;
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

const EmergencyManagement: React.FC = () => {
  const [cases, setCases] = useState<EmergencyCase[]>([]);
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
  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [noteProvider, setNoteProvider] = useState('');

  const [formData, setFormData] = useState({
    patientId: '',
    triageLevel: 'Medium',
    chiefComplaint: '',
    symptoms: [''],
    arrivalMethod: 'Walk-in',
    assignedNurse: '',
    bedNumber: '',
    vitalSigns: {
      bloodPressure: { systolic: 0, diastolic: 0 },
      heartRate: 0,
      temperature: 0,
      respiratoryRate: 0,
      oxygenSaturation: 0,
      painScale: 0,
    },
  });

  const [vitalsData, setVitalsData] = useState({
    bloodPressure: { systolic: 0, diastolic: 0 },
    heartRate: 0,
    temperature: 0,
    respiratoryRate: 0,
    oxygenSaturation: 0,
    painScale: 0,
  });

  const triageLevels = ['Critical', 'High', 'Medium', 'Low'];
  const arrivalMethods = ['Walk-in', 'Ambulance', 'Police', 'Helicopter', 'Transfer'];
  const statuses = ['Waiting', 'In Progress', 'Under Treatment', 'Stable', 'Discharged', 'Admitted', 'Transferred'];

  useEffect(() => {
    fetchCases();
    fetchStats();
  }, [searchTerm, statusFilter, triageFilter]);

  const fetchCases = async () => {
    try {
      const response = await axios.get('/api/emergency', {
        params: {
          search: searchTerm,
          status: statusFilter,
          triageLevel: triageFilter,
          limit: 50,
        },
      });
      setCases(response.data.emergencies);
    } catch (error) {
      console.error('Error fetching emergency cases:', error);
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

  const handleSubmit = async () => {
    try {
      if (selectedCase) {
        await axios.put(`/api/emergency/${selectedCase._id}`, formData);
      } else {
        await axios.post('/api/emergency', formData);
      }
      setOpenDialog(false);
      resetForm();
      fetchCases();
      fetchStats();
    } catch (error) {
      console.error('Error saving emergency case:', error);
    }
  };

  const handleVitalsUpdate = async () => {
    if (!selectedCase) return;

    try {
      await axios.put(`/api/emergency/${selectedCase._id}/vitals`, vitalsData);
      setOpenVitalsDialog(false);
      fetchCases();
    } catch (error) {
      console.error('Error updating vitals:', error);
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !newNote.trim()) return;

    try {
      await axios.post(`/api/emergency/${selectedCase._id}/notes`, {
        note: newNote,
        provider: noteProvider || 'Staff',
      });
      setOpenNotesDialog(false);
      setNewNote('');
      setNoteProvider('');
      fetchCases();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      triageLevel: 'Medium',
      chiefComplaint: '',
      symptoms: [''],
      arrivalMethod: 'Walk-in',
      assignedNurse: '',
      bedNumber: '',
      vitalSigns: {
        bloodPressure: { systolic: 0, diastolic: 0 },
        heartRate: 0,
        temperature: 0,
        respiratoryRate: 0,
        oxygenSaturation: 0,
        painScale: 0,
      },
    });
    setSelectedCase(null);
  };

  const handleEdit = (emergencyCase: EmergencyCase) => {
    setSelectedCase(emergencyCase);
    setFormData({
      patientId: emergencyCase.patientId._id,
      triageLevel: emergencyCase.triageLevel,
      chiefComplaint: emergencyCase.chiefComplaint,
      symptoms: emergencyCase.symptoms,
      arrivalMethod: emergencyCase.arrivalMethod,
      assignedNurse: emergencyCase.assignedNurse || '',
      bedNumber: emergencyCase.bedNumber || '',
      vitalSigns: emergencyCase.vitalSigns,
    });
    setOpenDialog(true);
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

  const getTriageColor = (level: string) => {
    switch (level) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Waiting':
        return 'warning';
      case 'In Progress':
      case 'Under Treatment':
        return 'info';
      case 'Stable':
        return 'success';
      case 'Discharged':
        return 'default';
      case 'Admitted':
        return 'primary';
      case 'Transferred':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {typeof value === 'number' && title.includes('Time') 
                ? `${value} min` 
                : value.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Emergency Department
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 3, 
        mb: 3 
      }}>
        <StatCard
          title="Total Cases"
          value={stats.totalCases}
          icon={<Emergency sx={{ fontSize: 40 }} />}
          color="primary"
        />
        <StatCard
          title="Active Cases"
          value={stats.activeCases}
          icon={<Person sx={{ fontSize: 40 }} />}
          color="info"
        />
        <StatCard
          title="Critical Cases"
          value={stats.criticalCases}
          icon={<Warning sx={{ fontSize: 40 }} />}
          color="error"
        />
        <StatCard
          title="Today's Cases"
          value={stats.todayCases}
          icon={<Timeline sx={{ fontSize: 40 }} />}
          color="success"
        />
        <StatCard
          title="Avg Wait Time"
          value={stats.avgWaitingTime}
          icon={<AccessTime sx={{ fontSize: 40 }} />}
          color="warning"
        />
      </Box>

      {/* Alerts */}
      {stats.criticalCases > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {stats.criticalCases} critical cases require immediate attention!
        </Alert>
      )}
      {stats.avgWaitingTime > 60 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Average waiting time is {stats.avgWaitingTime} minutes. Consider additional staffing.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Emergency Cases</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
            >
              New Case
            </Button>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
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
            <FormControl sx={{ minWidth: 150 }}>
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

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Emergency ID</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Triage Level</TableCell>
                  <TableCell>Chief Complaint</TableCell>
                  <TableCell>Arrival Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Doctor</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cases.map((emergencyCase) => (
                  <TableRow key={emergencyCase._id}>
                    <TableCell>{emergencyCase.emergencyId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {emergencyCase.patientId.firstName} {emergencyCase.patientId.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {emergencyCase.patientId.gender}, {new Date().getFullYear() - new Date(emergencyCase.patientId.dateOfBirth).getFullYear()} years
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={emergencyCase.triageLevel}
                        color={getTriageColor(emergencyCase.triageLevel) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {emergencyCase.chiefComplaint}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(emergencyCase.arrivalTime), 'MMM dd, HH:mm')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {emergencyCase.arrivalMethod}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={emergencyCase.status}
                        color={getStatusColor(emergencyCase.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {emergencyCase.assignedDoctor ? (
                        <Typography variant="body2">
                          Dr. {emergencyCase.assignedDoctor.firstName} {emergencyCase.assignedDoctor.lastName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Not assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(emergencyCase)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleVitalsEdit(emergencyCase)}
                        color="secondary"
                      >
                        <Healing />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleNotesEdit(emergencyCase)}
                        color="info"
                      >
                        <Assignment />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCase ? 'Edit Emergency Case' : 'New Emergency Case'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
            <TextField
              label="Patient ID"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Triage Level</InputLabel>
              <Select
                value={formData.triageLevel}
                label="Triage Level"
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
          <TextField
            label="Chief Complaint"
            value={formData.chiefComplaint}
            onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedCase ? 'Update' : 'Create'} Case
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vitals Dialog */}
      <Dialog open={openVitalsDialog} onClose={() => setOpenVitalsDialog(false)}>
        <DialogTitle>Update Vital Signs</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
            <TextField
              label="Systolic BP"
              type="number"
              value={vitalsData.bloodPressure.systolic}
              onChange={(e) => setVitalsData({
                ...vitalsData,
                bloodPressure: { ...vitalsData.bloodPressure, systolic: parseInt(e.target.value) || 0 }
              })}
              fullWidth
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
            />
            <TextField
              label="Heart Rate"
              type="number"
              value={vitalsData.heartRate}
              onChange={(e) => setVitalsData({ ...vitalsData, heartRate: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Temperature (°F)"
              type="number"
              value={vitalsData.temperature}
              onChange={(e) => setVitalsData({ ...vitalsData, temperature: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Respiratory Rate"
              type="number"
              value={vitalsData.respiratoryRate}
              onChange={(e) => setVitalsData({ ...vitalsData, respiratoryRate: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Oxygen Saturation (%)"
              type="number"
              value={vitalsData.oxygenSaturation}
              onChange={(e) => setVitalsData({ ...vitalsData, oxygenSaturation: parseInt(e.target.value) || 0 })}
              fullWidth
            />
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
        <DialogTitle>Treatment Notes</DialogTitle>
        <DialogContent>
          {selectedCase && selectedCase.treatmentNotes.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Previous Notes</Typography>
              <List>
                {selectedCase.treatmentNotes.map((note, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={note.note}
                      secondary={`${note.provider} - ${format(new Date(note.timestamp), 'MMM dd, yyyy HH:mm')}`}
                    />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}
          <Typography variant="h6" gutterBottom>Add New Note</Typography>
          <TextField
            label="Provider Name"
            value={noteProvider}
            onChange={(e) => setNoteProvider(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Treatment Note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            fullWidth
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotesDialog(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyManagement;