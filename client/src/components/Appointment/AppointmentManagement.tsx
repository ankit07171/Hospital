import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Pagination,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Visibility,
  EventNote,
  Person,
  LocalHospital,
  AccessTime,
  Cancel,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

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

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [page, searchTerm, statusFilter, dateFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/appointments', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          status: statusFilter !== 'All' ? statusFilter : '',
          date: dateFilter,
        },
      });
      setAppointments(response.data.appointments);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      // Mock data for demo
      setAppointments([
        {
          _id: '1',
          appointmentId: 'APT000001',
          patientName: 'John Doe',
          doctorName: 'Dr. Sarah Johnson',
          department: 'Cardiology',
          date: '2024-02-03',
          time: '10:00',
          duration: 30,
          type: 'OPD',
          status: 'Scheduled',
          notes: 'Regular checkup',
        },
        {
          _id: '2',
          appointmentId: 'APT000002',
          patientName: 'Jane Smith',
          doctorName: 'Dr. Michael Chen',
          department: 'Neurology',
          date: '2024-02-03',
          time: '14:30',
          duration: 45,
          type: 'OPD',
          status: 'Confirmed',
          notes: 'Follow-up consultation',
        },
        {
          _id: '3',
          appointmentId: 'APT000003',
          patientName: 'Robert Wilson',
          doctorName: 'Dr. Emily Davis',
          department: 'Orthopedics',
          date: '2024-02-04',
          time: '09:15',
          duration: 30,
          type: 'OPD',
          status: 'Completed',
          notes: 'Knee pain consultation',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}`, { status: newStatus });
      fetchAppointments();
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'info';
      case 'Confirmed': return 'primary';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      case 'No Show': return 'error';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'OPD': return 'primary';
      case 'IPD': return 'secondary';
      case 'Emergency': return 'error';
      default: return 'default';
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Appointment Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {/* Navigate to new appointment */}}
              >
                Book Appointment
              </Button>
            </Box>

            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2, 
                  alignItems: 'center' 
                }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
                    <TextField
                      fullWidth
                      placeholder="Search appointments by patient, doctor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <TextField
                    type="date"
                    label="Date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 150 }}
                  />
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Status</MenuItem>
                      <MenuItem value="Scheduled">Scheduled</MenuItem>
                      <MenuItem value="Confirmed">Confirmed</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="Today" color="primary" />
                    <Chip label="This Week" variant="outlined" />
                    <Chip label="Pending" variant="outlined" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Appointments Table */}
            <Card>
              <CardContent>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Appointment</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Doctor</TableCell>
                        <TableCell>Date & Time</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {appointments.map((appointment) => (
                        <TableRow key={appointment._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <EventNote />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {appointment.appointmentId}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {appointment.duration} min • {appointment.department}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {appointment.patientName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocalHospital sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {appointment.doctorName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {format(new Date(appointment.date), 'MMM dd, yyyy')}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="textSecondary">
                                  {appointment.time}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={appointment.type}
                              color={getTypeColor(appointment.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={appointment.status}
                              color={getStatusColor(appointment.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewAppointment(appointment)}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {/* Edit appointment */}}
                              >
                                <Edit />
                              </IconButton>
                              {appointment.status === 'Scheduled' && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusChange(appointment._id, 'Confirmed')}
                                  color="success"
                                >
                                  <CheckCircle />
                                </IconButton>
                              )}
                              {(appointment.status === 'Scheduled' || appointment.status === 'Confirmed') && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusChange(appointment._id, 'Cancelled')}
                                  color="error"
                                >
                                  <Cancel />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, newPage) => setPage(newPage)}
                    color="primary"
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Appointment Details Dialog */}
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              {selectedAppointment && (
                <>
                  <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <EventNote />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          Appointment Details
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {selectedAppointment.appointmentId}
                        </Typography>
                      </Box>
                    </Box>
                  </DialogTitle>
                  <DialogContent>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                      gap: 3 
                    }}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Patient Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Name:</strong> {selectedAppointment.patientName}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Doctor Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Doctor:</strong> {selectedAppointment.doctorName}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Department:</strong> {selectedAppointment.department}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Appointment Details
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Date:</strong> {format(new Date(selectedAppointment.date), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Time:</strong> {selectedAppointment.time}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Duration:</strong> {selectedAppointment.duration} minutes
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Type:</strong> {selectedAppointment.type}
                          </Typography>
                        </Box>
                      </Box>
                      {selectedAppointment.notes && (
                        <Box sx={{ gridColumn: '1 / -1' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Notes
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2">
                              {selectedAppointment.notes}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Close</Button>
                    {selectedAppointment.status === 'Scheduled' && (
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={() => {
                          handleStatusChange(selectedAppointment._id, 'Confirmed');
                          setDialogOpen(false);
                        }}
                      >
                        Confirm
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={() => {
                        setDialogOpen(false);
                        // Navigate to edit
                      }}
                    >
                      Edit Appointment
                    </Button>
                  </DialogActions>
                </>
              )}
            </Dialog>
          </Box>
        }
      />
    </Routes>
  );
};

export default AppointmentManagement;