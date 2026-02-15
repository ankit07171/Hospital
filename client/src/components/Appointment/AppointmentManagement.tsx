import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  InputAdornment, FormControl, InputLabel, Select, MenuItem, 
  FormHelperText
} from '@mui/material';
import { Add, Search, Edit, Visibility } from '@mui/icons-material';
import { format } from 'date-fns';
import axios from '../../api/axios';

interface Appointment {
  _id: string;
  appointmentId: string;
  patientName: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
}

const doctors = [
  'Dr. Sarah Johnson', 'Dr. Michael Chen', 'Dr. Emily Davis', 
  'Dr. James Wilson', 'Dr. Lisa Patel', 'Dr. Robert Kim'
];

const departments = ['Cardiology', 'Neurology', 'Orthopedics', 'General Medicine', 'Pediatrics'];
const types = ['OPD', 'IPD', 'Emergency'];
const statuses = ['Scheduled', 'Completed'];

const AppointmentForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  
  const [formData, setFormData] = useState<Appointment>({
    _id: '', appointmentId: '', patientName: '', doctorName: '', department: '',
    date: '', time: '10:00', duration: 30, type: 'OPD', status: 'Scheduled', notes: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      const fetchAppointment = async () => {
        try {
          const response = await axios.get(`/api/appointments/${id}`);
          setFormData(response.data);
        } catch (error) {
          alert('❌ Appointment not found');
          setTimeout(() => navigate('/app/appointments'), 1500);
        }
      };
      fetchAppointment();
    }
  }, [id, isEdit, navigate]);

  const validate = () => {
    const newErrors: any = {};
    if (!formData.patientName.trim()) newErrors.patientName = 'Patient name required';
    if (!formData.doctorName) newErrors.doctorName = 'Doctor required';
    if (!formData.date) newErrors.date = 'Date required';
    if (!formData.department) newErrors.department = 'Department required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/api/appointments/${id}`, formData);
        alert('✅ Appointment updated successfully!');
      } else {
        await axios.post('/api/appointments', formData);
        alert('✅ Appointment created successfully!');
      }
      setTimeout(() => navigate('/app/appointments'), 1500);
    } catch (error: any) {
      alert(`❌ Error: ${error.response?.data?.error || 'Failed to save appointment'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/app/appointments');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button startIcon={<Edit />} onClick={handleCancel}>
            Back to List
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {isEdit ? 'Edit Appointment' : 'New Appointment'}
          </Typography>
        </Box>
        {isEdit && formData.appointmentId && (
          <Chip label={formData.appointmentId} color="primary" variant="outlined" />
        )}
      </Box>

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {isEdit && (
              <TextField 
                label="Appointment ID" 
                value={formData.appointmentId}
                fullWidth 
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: 'grey.100' }}
              />
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField fullWidth label="Patient Name" value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                error={!!errors.patientName} helperText={errors.patientName} required />
              <FormControl fullWidth error={!!errors.doctorName} sx={{ minWidth: 250 }}>
                <InputLabel>Doctor</InputLabel>
                <Select value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  label="Doctor">
                  {doctors.map(doctor => (
                    <MenuItem key={doctor} value={doctor}>{doctor}</MenuItem>
                  ))}
                </Select>
                {errors.doctorName && <FormHelperText>{errors.doctorName}</FormHelperText>}
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl fullWidth error={!!errors.department} sx={{ minWidth: 200 }}>
                <InputLabel>Department</InputLabel>
                <Select value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  label="Department">
                  {departments.map(dept => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
                </Select>
                {errors.department && <FormHelperText>{errors.department}</FormHelperText>}
              </FormControl>
              <TextField select label="Type" fullWidth value={formData.type} sx={{ minWidth: 150 }}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                {types.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField type="date" label="Date" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date}
                sx={{ minWidth: 200 }} required />
              <TextField type="time" label="Time" value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                InputLabelProps={{ shrink: true }} sx={{ minWidth: 200 }} inputProps={{ step: 300 }} />
              <TextField label="Duration (min)" type="number" value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                sx={{ minWidth: 200 }} inputProps={{ min: 15, max: 120 }} />
            </Box>

            <FormControl fullWidth sx={{ minWidth: 200 }}>
              <InputLabel>Status</InputLabel>
              <Select value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                label="Status">
                {statuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Notes (optional)" multiline rows={3} fullWidth value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" type="submit" disabled={loading} fullWidth>
                {loading 
                  ? (isEdit ? 'Updating...' : 'Creating...') 
                  : (isEdit ? 'Update Appointment' : 'Create Appointment')
                }
              </Button>
              <Button variant="outlined" onClick={handleCancel} fullWidth disabled={loading}>
                Cancel
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

// ✅ PERFECT SORTING: Scheduled First → Sorted by Date/Time
const AppointmentList: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPages] = useState(1);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await axios.get('/api/appointments', {
        params: { page: 1, limit: 50, search: searchTerm } // Increased limit for sorting
      });
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      alert('Failed to load appointments');
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ✅ PRIORITY SORTING: 
  // 1. Scheduled (0) before Completed (1)
  // 2. Within each group: Soonest date/time first (ascending)
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      // Step 1: Status priority (Scheduled=0, Completed=1)
      const statusPriorityA = a.status === 'Scheduled' ? 0 : 1;
      const statusPriorityB = b.status === 'Scheduled' ? 0 : 1;
      
      if (statusPriorityA !== statusPriorityB) {
        return statusPriorityA - statusPriorityB; // Scheduled first
      }
      
      // Step 2: Date + Time (ascending - soonest first)
      const dateTimeA = new Date(`${a.date}T${a.time}:00`).getTime();
      const dateTimeB = new Date(`${b.date}T${b.time}:00`).getTime();
      
      return dateTimeA - dateTimeB; // Soonest first
    });
  }, [appointments]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      Scheduled: 'info', Confirmed: 'primary', 'In Progress': 'warning',
      Completed: 'success', Cancelled: 'error', 'No Show': 'error'
    };
    return colors[status] || 'default';
  };

  const handleEdit = (appointment: Appointment) => {
    navigate(`new/${appointment._id}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Appointment Management ({sortedAppointments.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`Scheduled: ${sortedAppointments.filter(a => a.status === 'Scheduled').length}`} color="info" />
          <Chip label={`Completed: ${sortedAppointments.filter(a => a.status === 'Completed').length}`} color="success" />
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('new')}>
          Book Appointment
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField fullWidth placeholder="Search by patient/doctor..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ mb: 2 }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography>No appointments found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAppointments.map((apt, index) => (
                    <TableRow key={apt._id} hover sx={{ 
                      '&:first-child': { borderTop: '2px solid #1976d2' } // Highlight first (soonest)
                    }}>
                      <TableCell>{apt.appointmentId}</TableCell>
                      <TableCell>{apt.patientName}</TableCell>
                      <TableCell>{apt.doctorName}</TableCell>
                      <TableCell>
                        <strong>{format(new Date(`${apt.date}T${apt.time}:00`), 'MMM dd, HH:mm')}</strong>
                      </TableCell>
                      <TableCell>{apt.department}</TableCell>
                      <TableCell>
                        <Chip label={apt.status} color={getStatusColor(apt.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(apt)}>
                          <Edit />
                        </IconButton>
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

const AppointmentManagement: React.FC = () => (
  <Routes>
    <Route index element={<AppointmentList />} />
    <Route path="new" element={<AppointmentForm />} />
    <Route path="new/:id" element={<AppointmentForm />} />
  </Routes>
);

export default AppointmentManagement;
