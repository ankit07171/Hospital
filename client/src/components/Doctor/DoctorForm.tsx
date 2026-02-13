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
  Autocomplete,
} from '@mui/material';
import { Save, Cancel, LocalHospital } from '@mui/icons-material';
import axios from '../../api/axios';

interface DoctorFormData {
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
  professionalInfo: {
    licenseNumber: string;
    specialization: string;
    department: string;
    experience: number;
    consultationFee: number;
    qualifications: string[];
    languages: string[];
  };
  workSchedule: {
    workingDays: string[];
    startTime: string;
    endTime: string;
    consultationDuration: number;
  };
  performance: {
    patientSatisfaction: number;
    averageConsultationTime: number;
  };
}

const DoctorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<DoctorFormData>({
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
    professionalInfo: {
      licenseNumber: '',
      specialization: '',
      department: '',
      experience: 0,
      consultationFee: 0,
      qualifications: [],
      languages: [],
    },
    workSchedule: {
      workingDays: [],
      startTime: '09:00',
      endTime: '17:00',
      consultationDuration: 30,
    },
    performance: {
      patientSatisfaction: 4.5,
      averageConsultationTime: 25,
    },
  });

  const specializations = [
    'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology',
    'Gastroenterology', 'General Practice', 'Neurology', 'Oncology',
    'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
  ];

  const departments = [
    'Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Surgery', 'Radiology', 'Laboratory', 'Pharmacy', 'Administration'
  ];

  const genders = ['Male', 'Female', 'Other'];
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const commonQualifications = ['MBBS', 'MD', 'MS', 'DM', 'MCh', 'DNB', 'FRCS', 'MRCP'];
  const commonLanguages = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Mandarin', 'Arabic'];

  useEffect(() => {
    if (isEdit && id) {
      fetchDoctor();
    }
  }, [id, isEdit]);

  const fetchDoctor = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/doctors/${id}`);
      const doctor = response.data;
      
      setFormData({
        personalInfo: {
          firstName: doctor.personalInfo?.firstName || '',
          lastName: doctor.personalInfo?.lastName || '',
          dateOfBirth: doctor.personalInfo?.dateOfBirth ? doctor.personalInfo.dateOfBirth.split('T')[0] : '',
          gender: doctor.personalInfo?.gender || '',
          phoneNumber: doctor.personalInfo?.phoneNumber || '',
          email: doctor.personalInfo?.email || '',
          address: {
            street: doctor.personalInfo?.address?.street || '',
            city: doctor.personalInfo?.address?.city || '',
            state: doctor.personalInfo?.address?.state || '',
            zipCode: doctor.personalInfo?.address?.zipCode || '',
            country: doctor.personalInfo?.address?.country || 'USA',
          },
        },
        professionalInfo: {
          licenseNumber: doctor.professionalInfo?.licenseNumber || '',
          specialization: doctor.professionalInfo?.specialization || '',
          department: doctor.professionalInfo?.department || '',
          experience: doctor.professionalInfo?.experience || 0,
          consultationFee: doctor.professionalInfo?.consultationFee || 0,
          qualifications: doctor.professionalInfo?.qualification || [],
          languages: doctor.professionalInfo?.languages || [],
        },
        workSchedule: {
          workingDays: doctor.schedule?.workingDays || [],
          startTime: doctor.schedule?.workingHours?.start || '09:00',
          endTime: doctor.schedule?.workingHours?.end || '17:00',
          consultationDuration: doctor.workSchedule?.consultationDuration || 30,
        },
        performance: {
          patientSatisfaction: doctor.performance?.patientSatisfaction || 4.5,
          averageConsultationTime: doctor.performance?.averageConsultationTime || 25,
        },
      });
    } catch (error) {
      console.error('Error fetching doctor:', error);
      setError('Failed to load doctor data');
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
        await axios.put(`/api/doctors/${id}`, formData);
        setSuccess('Doctor updated successfully!');
      } else {
        await axios.post('/api/doctors', formData);
        setSuccess('Doctor created successfully!');
      }
      
      setTimeout(() => {
        navigate('/doctors');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving doctor:', error);
      setError(error.response?.data?.error || 'Failed to save doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: keyof DoctorFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNestedInputChange = (section: keyof DoctorFormData, nestedSection: string, field: string, value: any) => {
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
        <Typography>Loading doctor data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <LocalHospital sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {isEdit ? 'Edit Doctor' : 'Add New Doctor'}
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
                  required
                  value={formData.personalInfo.email}
                  onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="h6" sx={{ p: 3, pb: 2 }}>
              Professional Information
            </Typography>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  label="License Number"
                  required
                  value={formData.professionalInfo.licenseNumber}
                  onChange={(e) => handleInputChange('professionalInfo', 'licenseNumber', e.target.value)}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  label="Years of Experience"
                  type="number"
                  required
                  value={formData.professionalInfo.experience}
                  onChange={(e) => handleInputChange('professionalInfo', 'experience', parseInt(e.target.value) || 0)}
                />
                <TextField
  label="Consultation Fee (₹)"
  type="number"
  required
  value={formData.professionalInfo.consultationFee}
  onChange={(e) =>
    handleInputChange(
      'professionalInfo',
      'consultationFee',
      Number(e.target.value)
    )
  }
/>

              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ flex: 1, minWidth: 250 }} required>
                  <InputLabel>Specialization</InputLabel>
                  <Select
                    sx={{ minWidth: 250 }}
                    value={formData.professionalInfo.specialization}
                    label="Specialization"
                    onChange={(e) => handleInputChange('professionalInfo', 'specialization', e.target.value)}
                  >
                    {specializations.map((spec) => (
                      <MenuItem key={spec} value={spec}>
                        {spec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ flex: 1, minWidth: 250 }} required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    sx={{ minWidth: 250 }}
                    value={formData.professionalInfo.department}
                    label="Department"
                    onChange={(e) => handleInputChange('professionalInfo', 'department', e.target.value)}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Autocomplete
                multiple
                options={commonQualifications}
                freeSolo
                value={formData.professionalInfo.qualifications}
                onChange={(_, newValue) => handleInputChange('professionalInfo', 'qualifications', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Qualifications"
                    placeholder="Add qualifications..."
                  />
                )}
              />
              <Autocomplete
                multiple
                options={commonLanguages}
                freeSolo
                value={formData.professionalInfo.languages}
                onChange={(_, newValue) => handleInputChange('professionalInfo', 'languages', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Languages Spoken"
                    placeholder="Add languages..."
                  />
                )}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Work Schedule */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Typography variant="h6" sx={{ p: 3, pb: 2 }}>
              Work Schedule
            </Typography>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                multiple
                options={weekDays}
                value={formData.workSchedule.workingDays}
                onChange={(_, newValue) => handleInputChange('workSchedule', 'workingDays', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Working Days"
                    placeholder="Select working days..."
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Start Time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={formData.workSchedule.startTime}
                  onChange={(e) => handleInputChange('workSchedule', 'startTime', e.target.value)}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="End Time"
                  type="time"
                  InputLabelProps={{ shrink: true }}
                  value={formData.workSchedule.endTime}
                  onChange={(e) => handleInputChange('workSchedule', 'endTime', e.target.value)}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 250 }}
                  label="Consultation Duration (minutes)"
                  type="number"
                  value={formData.workSchedule.consultationDuration}
                  onChange={(e) => handleInputChange('workSchedule', 'consultationDuration', parseInt(e.target.value) || 30)}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={() => navigate('/doctors')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Doctor' : 'Create Doctor'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DoctorForm;
