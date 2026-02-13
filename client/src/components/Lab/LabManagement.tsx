import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Autocomplete,
  LinearProgress,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Science,
  Warning,
  CheckCircle,
  Error,
  LocalHospital,
  TrendingUp,
  Save,
  Search as SearchIcon,
} from '@mui/icons-material';
import axios from '../../api/axios';

interface LabReport {
  _id: string;
  testType: string;
  testCategory: string;
  testDate: string;
  status: 'Normal' | 'Abnormal' | 'Critical' | 'Pending';
  keyResults: string;
  doctorNotes: string;
  reviewedBy: string;
}

interface Patient {
  _id: string;
  age: number;
  status: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    gender: string;
    phoneNumber: string;
  };
  medicalInfo: {
    bloodGroup: string;
    allergies: string[];
    chronicConditions: string[];
  };
  riskAssessment: {
    riskScore: number;
    riskLevel: string;
    lastCalculated: string;
    breakdown: {
      age: number;
      conditions: number;
      labs: number;
      allergies: number;
      interactions: number;
    };
  };
}

const LabManagement: React.FC = () => {
  const navigate = useNavigate();

  // States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [labReports, setLabReports] = useState<LabReport[]>([]);
  const [medicalImagingRecords, setMedicalImagingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<LabReport | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<LabReport | null>(null);
  const [medicalDialogOpen, setMedicalDialogOpen] = useState(false);
  const [savingLab, setSavingLab] = useState(false);
  const [savingMedical, setSavingMedical] = useState(false);

  const [labForm, setLabForm] = useState({
    testType: '',
    testCategory: 'Other',
    testDate: new Date().toISOString().split('T')[0],
    status: 'Pending' as 'Normal' | 'Abnormal' | 'Critical' | 'Pending',
    keyResults: '',
    doctorNotes: '',
    reviewedBy: '',
  });

  const [medicalForm, setMedicalForm] = useState({
    bloodGroup: '',
    allergies: [] as string[],
    chronicConditions: [] as string[],
  });

  const testCategories = ['Blood Test', 'Imaging', 'Cardiology', 'Metabolic', 'Other'];

  // Color functions
  const getRiskColor = (level: string): "success" | "warning" | "error" => {
    switch(level) {
      case 'Critical': return 'error';
      case 'High':
      case 'Medium': return 'warning';
      default: return 'success';
    }
  };

  const getRiskBorderColor = (level: string): string => {
    switch(level) {
      case 'Critical': return '#f44336';
      case 'High':
      case 'Medium': return '#ff9800';
      default: return '#4caf50';
    }
  };

  // Load patients
  useEffect(() => {
    fetchPatients();
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/patients');
      console.log('Patients API response:', response.data);
      // Handle both array and object responses
      const patientsData = response.data.patients || response.data;
      const patientsArray = Array.isArray(patientsData) ? patientsData : [];
      console.log('Patients array:', patientsArray.length, 'patients');
      setPatients(patientsArray);
    } catch (error: any) {
      console.error('Failed to fetch patients:', error);
      setError('Failed to load patients');
      setPatients([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = useCallback(async (patientId: string) => {
    try {
      setLoading(true);
      const patientResponse = await axios.get(`/api/patients/${patientId}`);
      const labResponse = await axios.get(`/api/lab/patient/${patientId}`);
      const imagingResponse = await axios.get(`/api/medical-imaging/patient/${patientId}`);
      
      const patient = patientResponse.data;
      setSelectedPatient(patient);
      setLabReports(labResponse.data);
      setMedicalImagingRecords(imagingResponse.data || []);
      
      setMedicalForm({
        bloodGroup: patient.medicalInfo?.bloodGroup || '',
        allergies: patient.medicalInfo?.allergies || [],
        chronicConditions: patient.medicalInfo?.chronicConditions || [],
      });
    } catch (error: any) {
      console.error('Failed to load patient data:', error);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMedicalSave = async () => {
    if (!selectedPatient) return;
    try {
      setSavingMedical(true);
      setError('');
      await axios.patch(`/api/patients/${selectedPatient._id}/medical-info`, medicalForm);
      
      const patientResponse = await axios.get(`/api/patients/${selectedPatient._id}`);
      setSelectedPatient(patientResponse.data);
      setMedicalForm({
        bloodGroup: patientResponse.data.medicalInfo?.bloodGroup || '',
        allergies: patientResponse.data.medicalInfo?.allergies || [],
        chronicConditions: patientResponse.data.medicalInfo?.chronicConditions || [],
      });
      
      fetchPatients(); // Refresh list
      setMedicalDialogOpen(false);
      setSuccess('✅ Medical info updated + Risk recalculated!');
    } catch (error: any) {
      console.error('Medical save error:', error);
      setError(error.response?.data?.message || 'Failed to update medical info');
    } finally {
      setSavingMedical(false);
    }
  };

  const handleLabSave = async () => {
    if (!selectedPatient || !labForm.testType) return;
    try {
      setSavingLab(true);
      setError('');
      const labData = { patientId: selectedPatient._id, ...labForm };
      
      if (editingLab) {
        await axios.put(`/api/lab/${editingLab._id}`, labData);
      } else {
        await axios.post('/api/lab', labData);
      }

      setLabDialogOpen(false);
      setEditingLab(null);
      setLabForm({
        testType: '',
        testCategory: 'Other',
        testDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        keyResults: '',
        doctorNotes: '',
        reviewedBy: '',
      });

      const labResponse = await axios.get(`/api/lab/patient/${selectedPatient._id}`);
      setLabReports(labResponse.data);
      setSuccess(editingLab ? 'Lab updated!' : '✅ New lab report created!');
    } catch (error: any) {
      console.error('Lab save error:', error);
      setError(error.response?.data?.message || 'Failed to save lab report');
    } finally {
      setSavingLab(false);
    }
  };

  const handleLabDelete = async (labId: string) => {
    try {
      await axios.delete(`/api/lab/${labId}`);
      setLabReports(labReports.filter(lab => lab._id !== labId));
      setSuccess('Lab report deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      setError('Failed to delete lab report');
    }
  };

  const handleLabFormChange = useCallback((field: keyof typeof labForm) => 
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setLabForm(prev => ({ ...prev, [field]: event.target.value }));
    },
    []
  );

  const handleLabEdit = useCallback((lab: LabReport) => {
    setEditingLab(lab);
    setLabForm({
      testType: lab.testType,
      testCategory: lab.testCategory,
      testDate: new Date(lab.testDate).toISOString().split('T')[0],
      status: lab.status,
      keyResults: lab.keyResults || '',
      doctorNotes: lab.doctorNotes || '',
      reviewedBy: lab.reviewedBy || '',
    });
    setLabDialogOpen(true);
  }, []);

  const handleBloodGroupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMedicalForm({ ...medicalForm, bloodGroup: event.target.value });
  };

  const handleAllergiesChange = (_: any, newValue: string[]) => {
    setMedicalForm({ ...medicalForm, allergies: newValue });
  };

  const handleConditionsChange = (_: any, newValue: string[]) => {
    setMedicalForm({ ...medicalForm, chronicConditions: newValue });
  };

  const filteredPatients = useMemo(() => {
    // Ensure patients is an array before filtering
    if (!Array.isArray(patients)) {
      return [];
    }
    return patients.filter(patient =>
      patient.personalInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.personalInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.riskAssessment?.riskLevel?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const statusIcon = (s: string) =>
    s === 'Normal' ? <CheckCircle color="success" /> :
    s === 'Critical' ? <Error color="error" /> :
    s === 'Abnormal' ? <Warning color="warning" /> :
    <Science color="info" />;

  if (loading && !selectedPatient) return <LinearProgress />;

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Science color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h3" component="h1">Laboratory Management</Typography>
            <Typography variant="h6" color="text.secondary">
              Manage patient lab reports and medical information
            </Typography>
          </Box>
        </Stack>
        <Button 
          variant="outlined" 
          onClick={fetchPatients}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {/* SUCCESS MESSAGE */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* PATIENTS LIST */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Patients ({filteredPatients.length})</Typography>
            <TextField
              size="small"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
              sx={{ minWidth: 300 }}
            />
          </Stack>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Patient</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Medical Info</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Risk Level</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Labs</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography>Loading patients...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <LocalHospital sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" mb={1}>
                        No patients found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Try adjusting your search' : 'Add patients from the Patient Management section'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                  <TableRow 
                    key={patient._id} 
                    selected={selectedPatient?._id === patient._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handlePatientSelect(patient._id)}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          {patient.personalInfo.firstName[0]}{patient.personalInfo.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="medium">
                            {patient.personalInfo.firstName} {patient.personalInfo.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {patient.age}y • {patient.personalInfo.phoneNumber}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {patient.medicalInfo.bloodGroup && (
                          <Chip label={patient.medicalInfo.bloodGroup} size="small" variant="outlined" />
                        )}
                        {patient.medicalInfo.chronicConditions.slice(0, 2).map((c, i) => (
                          <Chip key={i} label={c} size="small" color="warning" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={patient.riskAssessment.riskLevel} 
                        color={getRiskColor(patient.riskAssessment.riskLevel)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{labReports.length}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePatientSelect(patient._id);
                        }}
                      >
                        <Science />
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

      {/* SELECTED PATIENT DASHBOARD */}
      {selectedPatient && (
        <Box>
          {/* PATIENT HEADER */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
                  {selectedPatient.personalInfo.firstName[0]}{selectedPatient.personalInfo.lastName[0]}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h4">
                    {selectedPatient.personalInfo.firstName} {selectedPatient.personalInfo.lastName}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {selectedPatient.age} years • {selectedPatient.personalInfo.gender} • 
                    {selectedPatient.personalInfo.phoneNumber}
                  </Typography>
                </Box>
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<Science />}
                  onClick={() => setLabDialogOpen(true)}
                >
                  Add Lab Report
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* RISK ASSESSMENT */}
          <Card sx={{ mb: 4, borderLeft: `4px solid ${getRiskBorderColor(selectedPatient.riskAssessment.riskLevel)}` }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    AI Risk Assessment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Last calculated: {new Date(selectedPatient.riskAssessment.lastCalculated).toLocaleString()}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="h2" color="primary">
                    {selectedPatient.riskAssessment.riskScore}%
                  </Typography>
                  <Chip 
                    label={selectedPatient.riskAssessment.riskLevel} 
                    color={getRiskColor(selectedPatient.riskAssessment.riskLevel)}
                    size="medium"
                  />
                </Box>
              </Stack>

              {/* RISK BREAKDOWN */}
              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {Object.entries(selectedPatient.riskAssessment.breakdown).map(([key, value]) => (
                  <Paper key={key} sx={{ p: 2, textAlign: 'center', minWidth: 100 }}>
                    <Typography variant="caption" color="text.secondary">{key}</Typography>
                    <Typography variant="h5" fontWeight="bold">{value}%</Typography>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* MEDICAL INFO */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">
                  <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} /> Medical Information
                </Typography>
                <Button size="small" startIcon={<Edit />} onClick={() => setMedicalDialogOpen(true)}>
                  Edit Info
                </Button>
              </Stack>
              <Divider />
              <Box mt={3}>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Blood Group</Typography>
                    <Typography variant="h6">{selectedPatient.medicalInfo.bloodGroup || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Chronic Conditions</Typography>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      {selectedPatient.medicalInfo.chronicConditions.map((c, i) => (
                        <Chip key={i} label={c} color="warning" size="small" />
                      ))}
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Allergies</Typography>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      {selectedPatient.medicalInfo.allergies.map((a, i) => (
                        <Chip key={i} label={a} color="error" variant="outlined" size="small" />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* LAB REPORTS */}
          <Card>
            <CardContent>
              <Typography variant="h6" mb={3}>
                <Science sx={{ mr: 1, verticalAlign: 'middle' }} /> Lab Reports ({labReports.length})
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reviewed By</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {labReports.map((report) => (
                      <TableRow key={report._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {statusIcon(report.status)}
                            <Typography fontWeight="medium">{report.testType}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{new Date(report.testDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={report.status} 
                            size="small"
                            color={
                              report.status === 'Normal' ? 'success' :
                              report.status === 'Critical' ? 'error' :
                              report.status === 'Abnormal' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{report.reviewedBy || '—'}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleLabEdit(report)} size="small">
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog(report);
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {labReports.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <Science sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" mb={2}>
                            No lab reports yet
                          </Typography>
                          <Button 
                            variant="contained" 
                            startIcon={<Add />}
                            onClick={() => setLabDialogOpen(true)}
                          >
                            Add First Report
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* MEDICAL IMAGING RESULTS */}
          {medicalImagingRecords.length > 0 && (
            <Card sx={{ mt: 4 }}>
              <CardContent>
                <Typography variant="h6" mb={3}>
                  <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} /> Medical Imaging Results ({medicalImagingRecords.length})
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Imaging Type</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Urgency</TableCell>
                        <TableCell>Risk Score</TableCell>
                        <TableCell>Summary</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medicalImagingRecords.map((imaging) => (
                        <TableRow key={imaging._id} hover>
                          <TableCell>
                            <Typography fontWeight="medium">{imaging.imagingType}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {imaging.imagingId}
                            </Typography>
                          </TableCell>
                          <TableCell>{new Date(imaging.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={imaging.status} 
                              size="small"
                              color={
                                imaging.status === 'Completed' || imaging.status === 'Analyzed' ? 'success' :
                                imaging.status === 'Processing' ? 'warning' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={imaging.aiAnalysis?.urgencyLevel || 'N/A'} 
                              size="small"
                              color={
                                imaging.aiAnalysis?.urgencyLevel === 'Emergency' ? 'error' :
                                imaging.aiAnalysis?.urgencyLevel === 'Urgent' ? 'warning' : 'success'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {imaging.aiAnalysis?.riskScore ? (
                              <Chip 
                                label={`${imaging.aiAnalysis.riskScore}/100`}
                                size="small"
                                color={
                                  imaging.aiAnalysis.riskScore >= 70 ? 'error' :
                                  imaging.aiAnalysis.riskScore >= 40 ? 'warning' : 'success'
                                }
                              />
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                              {imaging.aiAnalysis?.summary || 'Processing...'}
                            </Typography>
                            {imaging.aiAnalysis?.detectedConditions && imaging.aiAnalysis.detectedConditions.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                {imaging.aiAnalysis.detectedConditions.slice(0, 2).map((condition: any, idx: number) => (
                                  <Chip 
                                    key={idx}
                                    label={condition.condition}
                                    size="small"
                                    color={
                                      condition.severity === 'Severe' || condition.severity === 'Critical' ? 'error' :
                                      condition.severity === 'Moderate' ? 'warning' : 'info'
                                    }
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* LAB DIALOG */}
      <Dialog open={labDialogOpen} onClose={() => {setLabDialogOpen(false); setEditingLab(null);}} maxWidth="md" fullWidth>
        <DialogTitle>{editingLab ? 'Edit Lab Report' : 'New Lab Report'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField 
              label="Test Type *" 
              value={labForm.testType} 
              onChange={handleLabFormChange('testType')} 
              fullWidth 
              required 
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select 
                value={labForm.testCategory} 
                label="Category" 
                onChange={(e) => setLabForm({ ...labForm, testCategory: e.target.value as string })}
              >
                {testCategories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              type="date"
              label="Test Date"
              InputLabelProps={{ shrink: true }}
              value={labForm.testDate}
              onChange={handleLabFormChange('testDate')}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              fullWidth
            />
            <TextField 
              select 
              label="Status" 
              value={labForm.status} 
              onChange={handleLabFormChange('status')} 
              fullWidth
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Abnormal">Abnormal</MenuItem>
              <MenuItem value="Critical">Critical</MenuItem>
            </TextField>
            <TextField 
              label="Key Results" 
              multiline 
              rows={3} 
              value={labForm.keyResults} 
              onChange={handleLabFormChange('keyResults')} 
              fullWidth 
            />
            <TextField 
              label="Doctor Notes" 
              multiline 
              rows={3} 
              value={labForm.doctorNotes} 
              onChange={handleLabFormChange('doctorNotes')} 
              fullWidth 
            />
            <TextField 
              label="Reviewed By" 
              value={labForm.reviewedBy} 
              onChange={handleLabFormChange('reviewedBy')} 
              fullWidth 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setLabDialogOpen(false); setEditingLab(null); }}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<Save />} 
            onClick={handleLabSave} 
            disabled={!labForm.testType || savingLab}
          >
            {savingLab ? 'Saving...' : (editingLab ? 'Update' : 'Create')} Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* MEDICAL DIALOG */}
      <Dialog open={medicalDialogOpen} onClose={() => setMedicalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Medical Information</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField 
              select 
              label="Blood Group" 
              value={medicalForm.bloodGroup} 
              onChange={handleBloodGroupChange} 
              fullWidth
            >
              <MenuItem value="">Select...</MenuItem>
              <MenuItem value="A+">A+</MenuItem>
              <MenuItem value="A-">A-</MenuItem>
              <MenuItem value="B+">B+</MenuItem>
              <MenuItem value="B-">B-</MenuItem>
              <MenuItem value="AB+">AB+</MenuItem>
              <MenuItem value="AB-">AB-</MenuItem>
              <MenuItem value="O+">O+</MenuItem>
              <MenuItem value="O-">O-</MenuItem>
            </TextField>
            <Autocomplete
              multiple 
              freeSolo
              options={['Penicillin', 'Peanuts', 'Latex', 'Pollen', 'Dust', 'Shellfish']}
              value={medicalForm.allergies}
              onChange={handleAllergiesChange}
              renderInput={(params) => <TextField {...params} label="Allergies" />}
            />
            <Autocomplete
              multiple 
              freeSolo
              options={['Diabetes', 'Hypertension', 'Asthma', 'COPD', 'Heart Disease']}
              value={medicalForm.chronicConditions}
              onChange={handleConditionsChange}
              renderInput={(params) => <TextField {...params} label="Chronic Conditions" />}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMedicalDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            startIcon={<Save />} 
            onClick={handleMedicalSave}
            disabled={savingMedical}
          >
            {savingMedical ? 'Saving...' : 'Save & Recalculate Risk'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="sm">
        <DialogTitle>Delete Lab Report?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the lab report for "{deleteDialog?.testType}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button 
            color="error" 
            onClick={() => {
              if (deleteDialog) {
                handleLabDelete(deleteDialog._id);
                setDeleteDialog(null);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabManagement;
