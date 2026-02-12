import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, Alert,
  Divider, Autocomplete, Paper, LinearProgress
} from '@mui/material';
import { Save, Cancel, Person, LocalHospital } from '@mui/icons-material';
import axios from '../../api/axios';

interface PatientFormData {
  patientId?: string;  // ✅ Added patientId
  personalInfo: {
    firstName: string; lastName: string; dateOfBirth: string;
    gender: string; phoneNumber: string; email: string;
    address: { street: string; city: string; state: string; zipCode: string; country: string };
  };
  medicalInfo: {
    bloodGroup: string; allergies: string[]; chronicConditions: string[];
    emergencyContact: { name: string; relationship: string; phone: string };
  };
  status: string;
}

type ObjectSection = 'personalInfo' | 'medicalInfo';

const PatientForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<PatientFormData>({
    personalInfo: {
      firstName: '', lastName: '', dateOfBirth: '', gender: '',
      phoneNumber: '', email: '', address: { street: '', city: '', state: '', zipCode: '', country: 'India' }
    },
    medicalInfo: {
      bloodGroup: '', allergies: [], chronicConditions: [],
      emergencyContact: { name: '', relationship: '', phone: '' }
    },
    status: 'Active'
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];
  const statuses = ['Active', 'Inactive', 'Discharged'];
  const commonAllergies = ['Penicillin', 'Aspirin', 'Sulfa Drugs', 'Peanuts', 'Shellfish'];
  const commonConditions = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Cancer'];

  useEffect(() => {
    if (isEdit && id) fetchPatient();
  }, [id]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/patients/${id}`);
      setFormData({
        ...data,
        personalInfo: {
          ...data.personalInfo,
          dateOfBirth: data.personalInfo.dateOfBirth?.split('T')[0] || '',
        },
      });
    } catch {
      setError('Failed to load patient');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (section: ObjectSection | 'status', field: string, value: any) => {
    setFormData(prev => {
      if (section === 'status') {
        return { ...prev, status: value };
      }
      return {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: value,
        },
      };
    });
  };

  const updateNested = (section: ObjectSection, nested: 'address' | 'emergencyContact', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nested]: {
          ...((prev[section] as any)?.[nested] || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateArray = (section: ObjectSection, field: 'allergies' | 'chronicConditions', value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEdit && id) {
        await axios.put(`/api/patients/${id}`, formData);
        setSuccess('Patient updated successfully!');
      } else {
        await axios.post('/api/patients', formData);
        setSuccess('Patient created successfully!');
      }
      setTimeout(() => navigate('/app/patients'), 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <LinearProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {isEdit ? 'Edit Patient' : 'Add Patient'}
          </Typography>

          {/* ✅ Show Patient ID when editing */}
          {isEdit && formData.patientId && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Patient ID:</strong> {formData.patientId}
            </Alert>
          )}

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            {/* Personal Info */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6">Personal Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  required
                  label="First Name"
                  value={formData.personalInfo.firstName}
                  onChange={(e) => updateForm('personalInfo', 'firstName', e.target.value)}
                />
                <TextField
                  required
                  label="Last Name"
                  value={formData.personalInfo.lastName}
                  onChange={(e) => updateForm('personalInfo', 'lastName', e.target.value)}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  required
                  type="date"
                  label="Date of Birth"
                  value={formData.personalInfo.dateOfBirth}
                  onChange={(e) => updateForm('personalInfo', 'dateOfBirth', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={formData.personalInfo.gender}
                    label="Gender"
                    onChange={(e) => updateForm('personalInfo', 'gender', e.target.value)}>
                    {genders.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <TextField
                  required
                  label="Phone Number"
                  value={formData.personalInfo.phoneNumber}
                  onChange={(e) => updateForm('personalInfo', 'phoneNumber', e.target.value)}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) => updateForm('personalInfo', 'email', e.target.value)}
                />
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>Address</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, mb: 2 }}>
                <TextField
                  label="Street"
                  value={formData.personalInfo.address.street}
                  onChange={(e) => updateNested('personalInfo', 'address', 'street', e.target.value)}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  label="City"
                  value={formData.personalInfo.address.city}
                  onChange={(e) => updateNested('personalInfo', 'address', 'city', e.target.value)}
                />
                <TextField
                  label="State"
                  value={formData.personalInfo.address.state}
                  onChange={(e) => updateNested('personalInfo', 'address', 'state', e.target.value)}
                />
                <TextField
                  label="Zip Code"
                  value={formData.personalInfo.address.zipCode}
                  onChange={(e) => updateNested('personalInfo', 'address', 'zipCode', e.target.value)}
                />
                <TextField
                  label="Country"
                  value={formData.personalInfo.address.country}
                  onChange={(e) => updateNested('personalInfo', 'address', 'country', e.target.value)}
                />
              </Box>
            </Box>

            {/* Medical Info */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalHospital color="primary" />
                <Typography variant="h6">Medical Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <FormControl>
                  <InputLabel>Blood Group</InputLabel>
                  <Select
                    value={formData.medicalInfo.bloodGroup}
                    label="Blood Group"
                    onChange={(e) => updateForm('medicalInfo', 'bloodGroup', e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    {bloodGroups.map(bg => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => updateForm('status', 'status', e.target.value)}>
                    {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>

              {/* Allergies */}
              <Autocomplete
                multiple
                freeSolo
                options={commonAllergies}
                value={formData.medicalInfo.allergies}
                onChange={(_, v) => updateArray('medicalInfo', 'allergies', v)}
                renderTags={(v, p) => v.map((o, i) => {
                  const { key, ...props } = p({ index: i });
                  return <Chip key={key} label={o} {...props} />;
                })}
                renderInput={p => <TextField {...p} label="Allergies" placeholder="Add allergy" />}
              />

              {/* Chronic Conditions */}
              <Autocomplete
                multiple
                freeSolo
                options={commonConditions}
                value={formData.medicalInfo.chronicConditions}
                onChange={(_, v) => updateArray('medicalInfo', 'chronicConditions', v)}
                renderTags={(v, p) => v.map((o, i) => {
                  const { key, ...props } = p({ index: i });
                  return <Chip key={key} label={o} {...props} />;
                })}
                renderInput={p => <TextField {...p} label="Chronic Conditions" placeholder="Add condition" />}
                sx={{ mt: 2 }}
              />

              <Typography variant="subtitle2" sx={{ mb: 1, mt: 3 }}>Emergency Contact</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  label="Name"
                  value={formData.medicalInfo.emergencyContact.name}
                  onChange={(e) => updateNested('medicalInfo', 'emergencyContact', 'name', e.target.value)}
                />
                <FormControl>
                  <InputLabel>Relationship</InputLabel>
                  <Select
                    value={formData.medicalInfo.emergencyContact.relationship}
                    label="Relationship"
                    onChange={(e) => updateNested('medicalInfo', 'emergencyContact', 'relationship', e.target.value)}>
                    {['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'].map(r => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Phone"
                  value={formData.medicalInfo.emergencyContact.phone}
                  onChange={(e) => updateNested('medicalInfo', 'emergencyContact', 'phone', e.target.value)}
                />
              </Box>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => navigate('/app/patients')}
                disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Update Patient' : 'Create Patient'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PatientForm;