import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  IconButton,
} from '@mui/material';
import {
  Upload,
  LocalHospital,
  Visibility,
  CheckCircle,
  Error,
  Warning,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from '../../api/axios';

interface AIAnalysis {
  detectedConditions: Array<{
    condition: string;
    confidence: number;
    severity: string;
    location: string;
    description: string;
    riskScore?: number;
  }>;
  findings: any;
  summary: string;
  recommendations: string[];
  urgencyLevel: string;
  processingTime: number;
  riskScore?: number;
  detailedFindings?: Array<{
    finding: string;
    location: string;
    severity: string;
    measurement: string;
    clinical_significance: string;
  }>;
}

interface MedicalImagingRecord {
  _id: string;
  imagingId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  imagingType: string;
  status: string;
  aiAnalysis?: AIAnalysis;
  createdAt: string;
  radiologistReview?: {
    reviewed: boolean;
    reviewedBy?: string;
    notes?: string;
  };
}

const OCRTools: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [imagingRecords, setImagingRecords] = useState<MedicalImagingRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalImagingRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  // Form state
  const [imagingType, setImagingType] = useState<string>('X-Ray');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('');
  
  // Review form state
  const [reviewedBy, setReviewedBy] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [confirmed, setConfirmed] = useState(true);

  useEffect(() => {
    fetchImagingRecords();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      const patientsData = response.data.patients || response.data;
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchImagingRecords = async () => {
    try {
      const response = await axios.get('/api/medical-imaging');
      setImagingRecords(response.data);
    } catch (error) {
      console.error('Error fetching imaging records:', error);
    }
  };

  const processFile = async (file: File) => {
    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }

    setLoading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imagingType', imagingType);
      formData.append('patientId', selectedPatientId);
      formData.append('patientName', patientName);
      formData.append('patientAge', patientAge);
      formData.append('patientGender', patientGender);

      const response = await axios.post('/api/medical-imaging/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data);
      
      // Reset form
      setSelectedPatientId('');
      setPatientName('');
      setPatientAge('');
      setPatientGender('');
      
      // Refresh records after a delay to allow processing
      setTimeout(() => {
        fetchImagingRecords();
      }, 3000);
    } catch (error: any) {
      setUploadResult({
        success: false,
        error: error.response?.data?.error || 'Failed to process file',
      });
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      }
    },
  });

  const handleViewRecord = (record: MedicalImagingRecord) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleReviewRecord = (record: MedicalImagingRecord) => {
    setSelectedRecord(record);
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedRecord || !reviewedBy) {
      alert('Please enter reviewer name');
      return;
    }

    try {
      await axios.put(`/api/medical-imaging/${selectedRecord._id}/review`, {
        reviewedBy,
        notes: reviewNotes,
        confirmed,
      });

      setReviewDialogOpen(false);
      setReviewedBy('');
      setReviewNotes('');
      setConfirmed(true);
      fetchImagingRecords();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await axios.delete(`/api/medical-imaging/${id}`);
      fetchImagingRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'severe':
        return 'error';
      case 'moderate':
        return 'warning';
      case 'mild':
        return 'info';
      default:
        return 'success';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Emergency':
        return 'error';
      case 'Urgent':
        return 'warning';
      default:
        return 'success';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Medical Imaging & AI Analysis
      </Typography>

      {/* Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload Medical Imaging
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Imaging Type</InputLabel>
              <Select
                value={imagingType}
                label="Imaging Type"
                onChange={(e) => setImagingType(e.target.value)}
              >
                <MenuItem value="X-Ray">X-Ray</MenuItem>
                <MenuItem value="MRI">MRI</MenuItem>
                <MenuItem value="CT Scan">CT Scan</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Select Patient</InputLabel>
              <Select
                value={selectedPatientId}
                label="Select Patient"
                onChange={(e) => {
                  const patId = e.target.value;
                  setSelectedPatientId(patId);
                  // Auto-fill patient details
                  const patient = patients.find(p => p._id === patId);
                  if (patient) {
                    setPatientName(`${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`);
                    setPatientAge(patient.age?.toString() || '');
                    setPatientGender(patient.personalInfo.gender || '');
                  }
                }}
              >
                <MenuItem value="">Select a patient...</MenuItem>
                {patients.map((patient) => (
                  <MenuItem key={patient._id} value={patient._id}>
                    {patient.personalInfo.firstName} {patient.personalInfo.lastName} - {patient.patientId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Patient Name"
              value={patientName}
              disabled
              helperText="Auto-filled from selected patient"
            />

            <TextField
              fullWidth
              label="Patient Age"
              type="number"
              value={patientAge}
              disabled
              helperText="Auto-filled from selected patient"
            />

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={patientGender}
                label="Gender"
                disabled
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} />
            <LocalHospital sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {imagingType} Upload
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {isDragActive
                ? 'Drop the file here...'
                : 'Drag & drop an image (JPEG, PNG) or PDF file, or click to select'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Upload />}
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Upload File'}
            </Button>
          </Paper>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Analyzing medical imaging...</Typography>
            </Box>
          )}

          {uploadResult && (
            <Alert severity={uploadResult.success ? 'success' : 'error'} sx={{ mt: 3 }}>
              {uploadResult.success ? (
                <>
                  File uploaded successfully! Imaging ID: {uploadResult.imagingId}
                  <br />
                  AI analysis in progress. Results will appear below.
                </>
              ) : (
                uploadResult.error
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Records Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Medical Imaging Records
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Imaging ID</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Risk Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Urgency</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {imagingRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{record.imagingId}</TableCell>
                    <TableCell>
                      {record.patientName}
                      {record.patientAge && `, ${record.patientAge}y`}
                      {record.patientGender && ` (${record.patientGender})`}
                    </TableCell>
                    <TableCell>
                      <Chip label={record.imagingType} size="small" />
                    </TableCell>
                    <TableCell>
                      {record.aiAnalysis?.riskScore !== undefined ? (
                        <Chip
                          label={`${record.aiAnalysis.riskScore}/100`}
                          size="small"
                          color={
                            record.aiAnalysis.riskScore >= 70 ? 'error' :
                            record.aiAnalysis.riskScore >= 40 ? 'warning' : 'success'
                          }
                          sx={{ fontWeight: 'bold' }}
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={record.status} 
                        size="small"
                        color={record.status === 'Completed' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {record.aiAnalysis && (
                        <Chip
                          label={record.aiAnalysis.urgencyLevel}
                          size="small"
                          color={getUrgencyColor(record.aiAnalysis.urgencyLevel)}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(record.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewRecord(record)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      {record.status === 'Analyzed' && (
                        <IconButton
                          size="small"
                          onClick={() => handleReviewRecord(record)}
                          title="Add Review"
                        >
                          <Edit />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRecord(record._id)}
                        title="Delete"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {imagingRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No medical imaging records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Medical Imaging Details - {selectedRecord?.imagingId}
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                Patient Information
              </Typography>
              <Typography>Name: {selectedRecord.patientName}</Typography>
              <Typography>Age: {selectedRecord.patientAge || 'N/A'}</Typography>
              <Typography>Gender: {selectedRecord.patientGender || 'N/A'}</Typography>
              <Typography>Imaging Type: {selectedRecord.imagingType}</Typography>

              {selectedRecord.aiAnalysis && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    AI Analysis Results
                  </Typography>
                  
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedRecord.aiAnalysis.riskScore !== undefined && (
                      <Chip
                        label={`Risk Score: ${selectedRecord.aiAnalysis.riskScore}/100`}
                        color={
                          selectedRecord.aiAnalysis.riskScore >= 70 ? 'error' :
                          selectedRecord.aiAnalysis.riskScore >= 40 ? 'warning' : 'success'
                        }
                        sx={{ mr: 1, fontWeight: 'bold', fontSize: '1.1rem', py: 2.5 }}
                      />
                    )}
                    <Chip
                      label={`Urgency: ${selectedRecord.aiAnalysis.urgencyLevel}`}
                      color={getUrgencyColor(selectedRecord.aiAnalysis.urgencyLevel)}
                      sx={{ mr: 1, fontSize: '0.95rem' }}
                    />
                    <Chip
                      label={`Processing Time: ${selectedRecord.aiAnalysis.processingTime}ms`}
                      variant="outlined"
                      sx={{ fontSize: '0.95rem' }}
                    />
                  </Box>

                  {selectedRecord.aiAnalysis.detectedConditions.length > 0 && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                        Detected Conditions:
                      </Typography>
                      <List dense>
                        {selectedRecord.aiAnalysis.detectedConditions.map((condition, index) => (
                          <ListItem key={index}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {condition.severity === 'Severe' || condition.severity === 'Critical' ? (
                                  <Error color="error" />
                                ) : condition.severity === 'Moderate' ? (
                                  <Warning color="warning" />
                                ) : (
                                  <CheckCircle color="success" />
                                )}
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                  {condition.condition}
                                </Typography>
                                <Chip
                                  label={condition.severity}
                                  size="small"
                                  color={getSeverityColor(condition.severity)}
                                />
                                <Chip
                                  label={`${Math.round(condition.confidence * 100)}% confidence`}
                                  size="small"
                                  variant="outlined"
                                />
                                {condition.riskScore && (
                                  <Chip
                                    label={`Risk: ${condition.riskScore}/100`}
                                    size="small"
                                    color={
                                      condition.riskScore >= 70 ? 'error' :
                                      condition.riskScore >= 40 ? 'warning' : 'success'
                                    }
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                )}
                              </Box>
                              <Typography variant="body2" color="textSecondary">
                                Location: {condition.location}
                              </Typography>
                              <Typography variant="body2">
                                {condition.description}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}

                  {selectedRecord.aiAnalysis.detailedFindings && selectedRecord.aiAnalysis.detailedFindings.length > 0 && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                        Detailed Clinical Findings:
                      </Typography>
                      {selectedRecord.aiAnalysis.detailedFindings.map((finding: any, index: number) => (
                        <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {finding.finding}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              <strong>Location:</strong> {finding.location}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Severity:</strong> {finding.severity}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Measurement:</strong> {finding.measurement}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                              <strong>Clinical Significance:</strong> {finding.clinical_significance}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </>
                  )}

                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                    Summary:
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedRecord.aiAnalysis.summary}
                    </Typography>
                  </Paper>

                  {selectedRecord.aiAnalysis.recommendations.length > 0 && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                        Recommendations:
                      </Typography>
                      <List dense>
                        {selectedRecord.aiAnalysis.recommendations.map((rec, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={`• ${rec}`} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </>
              )}

              {selectedRecord.radiologistReview?.reviewed && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Radiologist Review
                  </Typography>
                  <Typography>Reviewed by: {selectedRecord.radiologistReview.reviewedBy}</Typography>
                  <Typography>Notes: {selectedRecord.radiologistReview.notes || 'No notes'}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Radiologist Review</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reviewed By"
            value={reviewedBy}
            onChange={(e) => setReviewedBy(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Review Notes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Confirm AI Analysis</InputLabel>
            <Select
              value={confirmed ? 'yes' : 'no'}
              label="Confirm AI Analysis"
              onChange={(e) => setConfirmed(e.target.value === 'yes')}
            >
              <MenuItem value="yes">Yes, Confirmed</MenuItem>
              <MenuItem value="no">No, Needs Modification</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitReview} variant="contained">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feature Information */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 3, 
        mt: 3 
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              X-Ray Analysis
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Fracture Detection
              <br />
              • Dislocation Detection
              <br />
              AI-powered bone structure analysis
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              MRI Analysis
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Brain Tumor Detection
              <br />
              • Ligament Tear Detection
              <br />
              Advanced soft tissue imaging
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              CT Scan Analysis
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Internal Bleeding Detection
              <br />
              Critical emergency diagnostics
            </Typography>
          </CardContent>
        </Card>

        {/* <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Ultrasound Analysis
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Kidney Stones Detection
              <br />
              • Pregnancy Detection
              <br />
              Real-time imaging analysis
            </Typography>
          </CardContent>
        </Card> */}
      </Box>
    </Box>
  );
};

export default OCRTools;
