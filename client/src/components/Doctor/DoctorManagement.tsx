import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DoctorForm from './DoctorForm';
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
  LocalHospital,
  Phone,
  Email,
  Schedule,
  Star,
} from '@mui/icons-material';
// import axios from 'axios';
import axios from '../../api/axios';

interface Doctor {
  _id: string;
  doctorId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  professionalInfo: {
    specialization: string;
    department: string;
    qualification: string[];
    experience: number;
    consultationFee: number;
  };
  performance: {
    totalConsultations: number;
    patientSatisfaction: number;
  };
  status: string;
}

const DoctorList: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, [page, searchTerm, departmentFilter]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/doctors', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          department: departmentFilter !== 'All' ? departmentFilter : '',
        },
      });
      setDoctors(response.data.doctors);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      // Mock data for demo
      setDoctors([
        {
          _id: '1',
          doctorId: 'DOC000001',
          personalInfo: {
            firstName: 'Dr. Sarah',
            lastName: 'Johnson',
            email: 'sarah.johnson@hospital.com',
            phoneNumber: '+91-9876543210',
          },
          professionalInfo: {
            specialization: 'Cardiology',
            department: 'Cardiology',
            qualification: ['MBBS', 'MD Cardiology'],
            experience: 15,
            consultationFee: 1500,
          },
          performance: {
            totalConsultations: 1250,
            patientSatisfaction: 4.8,
          },
          status: 'Active',
        },
        {
          _id: '2',
          doctorId: 'DOC000002',
          personalInfo: {
            firstName: 'Dr. Michael',
            lastName: 'Chen',
            email: 'michael.chen@hospital.com',
            phoneNumber: '+91-9876543211',
          },
          professionalInfo: {
            specialization: 'Neurology',
            department: 'Neurology',
            qualification: ['MBBS', 'MD Neurology', 'DM'],
            experience: 12,
            consultationFee: 2000,
          },
          performance: {
            totalConsultations: 980,
            patientSatisfaction: 4.9,
          },
          status: 'Active',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'On Leave': return 'warning';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Doctor Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/doctors/new')}
        >
          Add New Doctor
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            '@media (min-width: 600px)': {
              flexDirection: 'row',
              alignItems: 'center'
            }
          }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
              <TextField
                fullWidth
                placeholder="Search doctors by name, specialization..."
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
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={departmentFilter}
                label="Department"
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <MenuItem value="All">All Departments</MenuItem>
                <MenuItem value="Cardiology">Cardiology</MenuItem>
                <MenuItem value="Neurology">Neurology</MenuItem>
                <MenuItem value="Orthopedics">Orthopedics</MenuItem>
                <MenuItem value="Pediatrics">Pediatrics</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="All Doctors" color="primary" size="small" />
              <Chip label="Available" variant="outlined" size="small" />
              <Chip label="Top Rated" variant="outlined" size="small" />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Specialization</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <LocalHospital />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {doctor.personalInfo.firstName} {doctor.personalInfo.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {doctor.doctorId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {doctor.professionalInfo.specialization}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {doctor.professionalInfo.department}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {doctor.personalInfo.phoneNumber}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {doctor.personalInfo.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {doctor.professionalInfo.experience} years
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Fee: ₹{doctor.professionalInfo.consultationFee}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2">
                            {doctor.performance.patientSatisfaction}/5.0
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {doctor.performance.totalConsultations} consultations
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doctor.status}
                        color={getStatusColor(doctor.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleViewDoctor(doctor)}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/doctors/${doctor._id}/edit`)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/doctors/${doctor._id}/schedule`)}
                        >
                          <Schedule />
                        </IconButton>
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

      {/* Doctor Details Dialog - Using Flexbox instead of Grid */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedDoctor && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <LocalHospital />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedDoctor.personalInfo.firstName} {selectedDoctor.personalInfo.lastName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {selectedDoctor.doctorId} • {selectedDoctor.professionalInfo.specialization}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                '@media (min-width: 900px)': {
                  flexDirection: 'row',
                }
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Professional Information
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Specialization:</strong> {selectedDoctor.professionalInfo.specialization}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Department:</strong> {selectedDoctor.professionalInfo.department}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Experience:</strong> {selectedDoctor.professionalInfo.experience} years
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Consultation Fee:</strong> ₹{selectedDoctor.professionalInfo.consultationFee}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Qualifications:</strong> {selectedDoctor.professionalInfo.qualification.join(', ')}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Contact Information
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Email:</strong> {selectedDoctor.personalInfo.email}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {selectedDoctor.personalInfo.phoneNumber}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: '1 1 100%', mt: { xs: 0, md: 0 } }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Chip
                        icon={<Star />}
                        label={`${selectedDoctor.performance.patientSatisfaction}/5.0 Rating`}
                        color="warning"
                        size="medium"
                      />
                      <Chip
                        label={`${selectedDoctor.performance.totalConsultations} Total Consultations`}
                        color="info"
                        size="medium"
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setDialogOpen(false);
                  navigate(`/doctors/${selectedDoctor._id}/schedule`);
                }}
              >
                View Schedule
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDialogOpen(false);
                  navigate(`/doctors/${selectedDoctor._id}/edit`);
                }}
              >
                Edit Doctor
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

const DoctorManagement: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DoctorList />} />
      <Route path="/new" element={<DoctorForm />} />
      <Route path="/:id/edit" element={<DoctorForm />} />
    </Routes>
  );
};

export default DoctorManagement;
