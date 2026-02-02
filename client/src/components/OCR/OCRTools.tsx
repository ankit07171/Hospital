import React, { useState } from 'react';
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
  ListItemIcon,
} from '@mui/material';
import {
  Upload,
  PersonSearch,
  Description,
  Science,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface OCRResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
  patientIds?: string[];
  primaryPatientId?: string;
  structuredNotes?: any;
  labData?: any;
}

const OCRTools: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [activeTab, setActiveTab] = useState<'patient-id' | 'consultation' | 'lab-report'>('patient-id');

  const processImage = async (file: File, endpoint: string) => {
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`/api/ocr/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (error: any) {
      setResult({
        text: '',
        confidence: 0,
        success: false,
        error: error.response?.data?.error || 'Failed to process image',
      });
    } finally {
      setLoading(false);
    }
  };

  const PatientIDDropzone = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
      },
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          processImage(acceptedFiles[0], 'extract-patient-id');
        }
      },
    });

    return (
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
        <PersonSearch sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Patient ID Verification
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isDragActive
            ? 'Drop the ID card image here...'
            : 'Drag & drop an ID card image, or click to select'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          sx={{ mt: 2 }}
        >
          Upload ID Card
        </Button>
      </Paper>
    );
  };

  const ConsultationDropzone = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
      },
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          processImage(acceptedFiles[0], 'extract-consultation-notes');
        }
      },
    });

    return (
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
        <Description sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Consultation Notes OCR
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isDragActive
            ? 'Drop the consultation notes image here...'
            : 'Drag & drop stylus consultation notes, or click to select'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          sx={{ mt: 2 }}
        >
          Upload Notes
        </Button>
      </Paper>
    );
  };

  const LabReportDropzone = () => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
      },
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          processImage(acceptedFiles[0], 'extract-lab-report');
        }
      },
    });

    return (
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
        <Science sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Lab Report OCR
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {isDragActive
            ? 'Drop the lab report image here...'
            : 'Drag & drop lab report image, or click to select'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Upload />}
          sx={{ mt: 2 }}
        >
          Upload Lab Report
        </Button>
      </Paper>
    );
  };

  const renderResults = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Processing image...</Typography>
        </Box>
      );
    }

    if (!result) return null;

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            OCR Results
          </Typography>
          
          {result.success ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle />
                Text extracted successfully (Confidence: {Math.round(result.confidence)}%)
              </Box>
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Error />
                {result.error || 'Failed to extract text'}
              </Box>
            </Alert>
          )}

          {result.success && (
            <>
              {/* Patient ID Results */}
              {result.patientIds && result.patientIds.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Detected Patient IDs:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {result.patientIds.map((id, index) => (
                      <Chip
                        key={index}
                        label={id}
                        color={id === result.primaryPatientId ? 'primary' : 'default'}
                        variant={id === result.primaryPatientId ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Structured Consultation Notes */}
              {result.structuredNotes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Structured Notes:
                  </Typography>
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: 2 
                  }}>
                    {Object.entries(result.structuredNotes).map(([key, value]) => {
                      if (key === 'rawText' || !value) return null;
                      const displayValue = Array.isArray(value) 
                        ? value.join(', ') 
                        : typeof value === 'object' 
                          ? JSON.stringify(value) 
                          : String(value);
                      
                      return (
                        <Paper key={key} sx={{ p: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                          <Typography variant="body2">
                            {displayValue || 'N/A'}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Lab Data */}
              {result.labData && result.labData.parameters && result.labData.parameters.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Lab Parameters:
                  </Typography>
                  <List>
                    {result.labData.parameters.map((param: any, index: number) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          {param.status === 'Normal' ? (
                            <CheckCircle color="success" />
                          ) : param.status === 'High' || param.status === 'Low' ? (
                            <Warning color="warning" />
                          ) : (
                            <Error color="error" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={`${param.name}: ${param.value} ${param.unit}`}
                          secondary={`Status: ${param.status} | Normal Range: ${param.normalRangeMin}-${param.normalRangeMax}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Raw Text */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Extracted Text:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {result.text}
                  </Typography>
                </Paper>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        OCR Tools
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Button
                  variant={activeTab === 'patient-id' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setActiveTab('patient-id')}
                >
                  Patient ID
                </Button>
                <Button
                  variant={activeTab === 'consultation' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setActiveTab('consultation')}
                >
                  Consultation
                </Button>
                <Button
                  variant={activeTab === 'lab-report' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setActiveTab('lab-report')}
                >
                  Lab Report
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {activeTab === 'patient-id' && <PatientIDDropzone />}
              {activeTab === 'consultation' && <ConsultationDropzone />}
              {activeTab === 'lab-report' && <LabReportDropzone />}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
          {renderResults()}
        </Box>
      </Box>

      {/* Feature Information */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 3, 
        mt: 3 
      }}>
        <Card>
          <CardContent>
            <PersonSearch sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Patient ID Verification
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Automatically extract and verify patient IDs from ID cards, wristbands, or documents using advanced OCR technology.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Description sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Stylus Consultation Pad
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Convert handwritten consultation notes from stylus pads into structured digital format with intelligent text recognition.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Science sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Lab Report Processing
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Extract structured data from lab reports including test parameters, values, and normal ranges for faster clinical decisions.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default OCRTools;