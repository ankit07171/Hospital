import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
  Autocomplete,
} from '@mui/material';
import { Save, Cancel, Person } from '@mui/icons-material';
import axios from '../../api/axios';

interface PatientFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phoneNumber: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  medicalInfo: {
    bloodGroup: string;
    allergies: string[];
    chronicConditions: string[];
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  healthScore: {
    current: number;
    riskFactors: string[];
  };
}

const PatientForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<PatientFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phoneNumber: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
    },
    medicalInfo: {
      bloodGroup: '',
      allergies: [],
      chronicConditions: [],
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
    },
    healthScore: {
      current: 80,
      riskFactors: [],
    },
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];
  const relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];
  const commonAllergies = ['Penicillin', 'Aspirin', 'Peanuts', 'Shellfish', 'Latex', 'Dust', 'Pollen'];
  const commonConditions = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Arthritis', 'Depression'];
  const commonRiskFactors = ['Smoking', 'High Blood Pressure', 'Diabetes', 'Family History', 'Obesity', 'Sedentary Lifestyle'];

  useEffect(() => {
    if (isEdit && id) {
      fetchPatient();
    }
  }, [id, isEdit]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/patients/${id}`);
      const patient = response.data;
      
      setFormData({
        personalInfo: {
          firstName: patient.personalInfo.firstName || '',
          lastName: patient.personalInfo.lastName || '',
          dateOfBirth: patient.personalInfo.dateOfBirth ? patient.personalInfo.dateOfBirth.split('T')[0] : '',
          gender: patient.personalInfo.gender || '',
          phoneNumber: patient.personalInfo.phoneNumber || '',
          email: patient.personalInfo.email || '',
          address: {
            street: patient.personalInfo.address?.street || '',
            city: patient.personalInfo.address?.city || '',
            state: patient.personalInfo.address?.state || '',
            zipCode: patient.personalInfo.address?.zipCode || '',
            country: patient.personalInfo.address?.country || 'USA',
          },
        },
        medicalInfo: {
          bloodGroup: patient.medicalInfo.bloodGroup || '',
          allergies: patient.medicalInfo.allergies || [],
          chronicConditions: patient.medicalInfo.chronicConditions || [],
          emergencyContact: {
            name: patient.medicalInfo.emergencyContact?.name || '',
            relationship: patient.medicalInfo.emergencyContact?.relationship || '',
            phone: patient.medicalInfo.emergencyContact?.phone || '',
          },
        },
        healthScore: {
          current: patient.healthScore?.current || 80,
          riskFactors: patient.healthScore?.riskFactors || [],
        },
      });
    } catch (error) {
      console.error('Error fetching patient:', error);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEdit) {
        await axios.put(`/api/patients/${id}`, formData);
        setSuccess('Patient updated successfully!');
      } else {
        await axios.post('/api/patients', formData);
        setSuccess('Patient created successfully!');
      }
      
      setTimeout(() => {
        navigate('/patients');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving patient:', error);
      setError(error.response?.data?.error || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: keyof PatientFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNestedInputChange = (section: keyof PatientFormData, nestedSection: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedSection]: {
          ...(prev[section] as any)[nestedSection],
          [field]: value,
        },
      },
    }));
  };

  if (loading && isEdit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading patient data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Person sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {isEdit ? 'Edit Patient' : 'Add New Patient'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* Personal Information */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="h6" sx={{ p: 3, pb: 2 }}>
              Personal Information
            </Typography>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  label="First Name"
                  required
                  value={formData.personalInfo.firstName}
                  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  label="Last Name"
                  required
                  value={formData.personalInfo.lastName}
                  onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  label="Date of Birth"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.personalInfo.dateOfBirth}
                  onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                />
                <FormControl sx={{ flex: 1, minWidth: 200 }} required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    sx={{ minWidth: 200 }}
                    value={formData.personalInfo.gender}
                    label="Gender"
                    onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                  >
                    {genders.map((gender) => (
                      <MenuItem key={gender} value={gender}>
                        {gender}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  label="Phone Number"
                  required
                  value={formData.personalInfo.phoneNumber}
                  onChange={(e) => handleInputChange('personalInfo', 'phoneNumber', e.target.value)}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  label="Email"
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                />
              </Box>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.personalInfo.address.street}
                onChange={(e) => handleNestedInputChange('personalInfo', 'address', 'street', e.target.value)}
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="City"
                  value={formData.personalInfo.address.city}
                  onChange={(e) => handleNestedInputChange('personalInfo', 'address', 'city', e.target.value)}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 150 }}
                  label="State"
                  value={formData.personalInfo.address.state}
                  onChange={(e) => handleNestedInputChange('personalInfo', 'address', 'state', e.target.value)}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 150 }}
                  label="ZIP Code"
                  value={formData.personalInfo.address.zipCode}
                  onChange={(e) => handleNestedInputChange('personalInfo', 'address', 'zipCode', e.target.value)}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="h6" sx={{ p: 3, pb: 2 }}>
              Medical Information
            </Typography>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: 1, minWidth: 200 }}>
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    sx={{ minWidth: 200 }}
                    value={formData.medicalInfo.bloodGroup}
                    label="Blood Group"
                    onChange={(e) => handleInputChange('medicalInfo', 'bloodGroup', e.target.value)}
                  >
                    {bloodGroups.map((group) => (
                      <MenuItem key={group} value={group}>
                        {group}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Health Score"
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  value={formData.healthScore.current}
                  onChange={(e) => handleInputChange('healthScore', 'current', parseInt(e.target.value) || 0)}
                />
              </Box>
              <Autocomplete
                multiple
                options={commonAllergies}
                freeSolo
                value={formData.medicalInfo.allergies}
                onChange={(_, newValue) => handleInputChange('medicalInfo', 'allergies', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Allergies"
                    placeholder="Add allergies..."
                  />
                )}
              />
              <Autocomplete
                multiple
                options={commonConditions}
                freeSolo
                value={formData.medicalInfo.chronicConditions}
                onChange={(_, newValue) => handleInputChange('medicalInfo', 'chronicConditions', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Chronic Conditions"
                    placeholder="Add conditions..."
                  />
                )}
              />
              <Autocomplete
                multiple
                options={commonRiskFactors}
                freeSolo
                value={formData.healthScore.riskFactors}
                onChange={(_, newValue) => handleInputChange('healthScore', 'riskFactors', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" color="warning" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Risk Factors"
                    placeholder="Add risk factors..."
                  />
                )}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="h6" sx={{ p: 3, pb: 2 }}>
              Emergency Contact
            </Typography>
            <Box sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                sx={{ flex: 1, minWidth: 250 }}
                label="Contact Name"
                value={formData.medicalInfo.emergencyContact.name}
                onChange={(e) => handleNestedInputChange('medicalInfo', 'emergencyContact', 'name', e.target.value)}
              />
              <FormControl sx={{ flex: 1, minWidth: 200 }}>
                <InputLabel>Relationship</InputLabel>
                <Select
                  sx={{ minWidth: 200 }}
                  value={formData.medicalInfo.emergencyContact.relationship}
                  label="Relationship"
                  onChange={(e) => handleNestedInputChange('medicalInfo', 'emergencyContact', 'relationship', e.target.value)}
                >
                  {relationships.map((rel) => (
                    <MenuItem key={rel} value={rel}>
                      {rel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                sx={{ flex: 1, minWidth: 200 }}
                label="Contact Phone"
                value={formData.medicalInfo.emergencyContact.phone}
                onChange={(e) => handleNestedInputChange('medicalInfo', 'emergencyContact', 'phone', e.target.value)}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/patients')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Patient' : 'Create Patient'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PatientForm;

