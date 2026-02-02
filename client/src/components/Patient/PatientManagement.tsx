import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PatientForm from './PatientForm';
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
  Person,
  Phone,
  Email,
  TrendingUp,
  TrendingDown,
  FilterList,
} from '@mui/icons-material';
import axios from '../../api/axios';

interface Patient {
  _id: string;
  patientId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    email?: string;
    address?: {
      city: string;
      state: string;
    };
  };
  medicalInfo: {
    bloodGroup?: string;
    allergies: string[];
    chronicConditions: string[];
  };
  healthScore: {
    current: number;
    riskFactors: string[];
  };
  status: string;
  createdAt: string;
}

const PatientManagement: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Active');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, [page, searchTerm, statusFilter]);

  const fetchPatients = async () => {
  setLoading(true);
  try {
    const { data } = await axios.get('/api/patients', {
      params: {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter === 'All' ? undefined : statusFilter,
      },
    });

    setPatients(data.patients);
    setTotalPages(data.totalPages);
  } catch (err) {
    console.error(err);
    setPatients([]);
  } finally {
    setLoading(false);
  }
};


  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp />;
    return <TrendingDown />;
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Routes>
      <Route path="/" element={<PatientList />} />
      <Route path="/new" element={<PatientForm />} />
      <Route path="/:id/edit" element={<PatientForm />} />
    </Routes>
  );
};

const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Active');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, [page, searchTerm, statusFilter]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/patients', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          status: statusFilter,
        },
      });
      setPatients(response.data.patients);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      // Mock data for demo
      // setPatients([
      //   {
      //     _id: '1',
      //     patientId: 'PAT000001',
      //     personalInfo: {
      //       firstName: 'John',
      //       lastName: 'Doe',
      //       dateOfBirth: '1985-06-15',
      //       gender: 'Male',
      //       phoneNumber: '+91-9876543210',
      //       email: 'john.doe@email.com',
      //     },
      //     medicalInfo: {
      //       bloodGroup: 'O+',
      //       allergies: ['Penicillin'],
      //       chronicConditions: ['Hypertension'],
      //     },
      //     healthScore: {
      //       current: 75,
      //       riskFactors: ['High Blood Pressure'],
      //     },
      //     status: 'Active',
      //     createdAt: '2024-01-15',
      //   },
      //   {
      //     _id: '2',
      //     patientId: 'PAT000002',
      //     personalInfo: {
      //       firstName: 'Jane',
      //       lastName: 'Smith',
      //       dateOfBirth: '1990-03-22',
      //       gender: 'Female',
      //       phoneNumber: '+91-9876543211',
      //       email: 'jane.smith@email.com',
      //     },
      //     medicalInfo: {
      //       bloodGroup: 'A+',
      //       allergies: [],
      //       chronicConditions: [],
      //     },
      //     healthScore: {
      //       current: 92,
      //       riskFactors: [],
      //     },
      //     status: 'Active',
      //     createdAt: '2024-01-20',
      //   },
      // ]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp />;
    return <TrendingDown />;
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Patient Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/patients/new')}
        >
          Add New Patient
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
                      placeholder="Search patients by name, ID, or phone..."
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
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="All">All</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="All Patients" color="primary" />
                    <Chip label="High Risk" variant="outlined" />
                    <Chip label="Recent" variant="outlined" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Patients Table */}
            <Card>
              <CardContent>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Patient</TableCell>
                        <TableCell>Contact</TableCell>
                        <TableCell>Medical Info</TableCell>
                        <TableCell>Health Score</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patients.map((patient) => (
                        <TableRow key={patient._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {patient.personalInfo.firstName} {patient.personalInfo.lastName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {patient.patientId} • Age: {calculateAge(patient.personalInfo.dateOfBirth)}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {patient.personalInfo.phoneNumber}
                                </Typography>
                              </Box>
                              {patient.personalInfo.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="body2">
                                    {patient.personalInfo.email}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              {patient.medicalInfo.bloodGroup && (
                                <Chip
                                  label={patient.medicalInfo.bloodGroup}
                                  size="small"
                                  color="secondary"
                                  sx={{ mb: 0.5 }}
                                />
                              )}
                              <Typography variant="body2" color="textSecondary">
                                {patient.medicalInfo.chronicConditions.length > 0
                                  ? `${patient.medicalInfo.chronicConditions.length} conditions`
                                  : 'No chronic conditions'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                icon={getHealthScoreIcon(patient.healthScore.current)}
                                label={patient.healthScore.current}
                                color={getHealthScoreColor(patient.healthScore.current)}
                                size="small"
                              />
                              <Typography variant="body2" color="textSecondary">
                                {patient.healthScore.riskFactors.length} risks
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={patient.status}
                              color={patient.status === 'Active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewPatient(patient)}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/patients/${patient._id}/edit`)}
                              >
                                <Edit />
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

            {/* Patient Details Dialog */}
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              {selectedPatient && (
                <>
                  <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedPatient.personalInfo.firstName} {selectedPatient.personalInfo.lastName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {selectedPatient.patientId}
                        </Typography>
                      </Box>
                    </Box>
                  </DialogTitle>
                  <DialogContent>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                      gap: 3 
                    }}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Personal Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Age:</strong> {calculateAge(selectedPatient.personalInfo.dateOfBirth)} years
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Gender:</strong> {selectedPatient.personalInfo.gender}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Phone:</strong> {selectedPatient.personalInfo.phoneNumber}
                          </Typography>
                          {selectedPatient.personalInfo.email && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Email:</strong> {selectedPatient.personalInfo.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Medical Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          {selectedPatient.medicalInfo.bloodGroup && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Blood Group:</strong> {selectedPatient.medicalInfo.bloodGroup}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Allergies:</strong> {selectedPatient.medicalInfo.allergies.length > 0 
                              ? selectedPatient.medicalInfo.allergies.join(', ') 
                              : 'None'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Chronic Conditions:</strong> {selectedPatient.medicalInfo.chronicConditions.length > 0 
                              ? selectedPatient.medicalInfo.chronicConditions.join(', ') 
                              : 'None'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Health Score & Risk Factors
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Chip
                              icon={getHealthScoreIcon(selectedPatient.healthScore.current)}
                              label={`Health Score: ${selectedPatient.healthScore.current}`}
                              color={getHealthScoreColor(selectedPatient.healthScore.current)}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Risk Factors:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {selectedPatient.healthScore.riskFactors.map((risk, index) => (
                              <Chip
                                key={index}
                                label={risk}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Close</Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setDialogOpen(false);
                        navigate(`/patients/${selectedPatient._id}/edit`);
                      }}
                    >
                      Edit Patient
                    </Button>
                  </DialogActions>
                </>
              )}
            </Dialog>
          </Box>
        );
      };

export default PatientManagement;