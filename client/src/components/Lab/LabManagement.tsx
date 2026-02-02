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
  LinearProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Visibility,
  Science,
  Person,
  LocalHospital,
  Assignment,
  CheckCircle,
  Warning,
  Error,
  Pending,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

interface LabTest {
  _id: string;
  testId: string;
  patientName: string;
  doctorName: string;
  testName: string;
  category: string;
  status: string;
  orderedDate: string;
  completedDate?: string;
  cost: number;
  results?: {
    summary: string;
    aiSummary?: string;
    values: Array<{
      parameter: string;
      value: string;
      unit: string;
      status: string;
    }>;
  };
}

const LabManagement: React.FC = () => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchLabTests();
  }, [page, searchTerm, statusFilter]);

  const fetchLabTests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/lab', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          status: statusFilter !== 'All' ? statusFilter : '',
        },
      });
      setLabTests(response.data.labTests);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch lab tests:', error);
      // Mock data for demo
      setLabTests([
        {
          _id: '1',
          testId: 'LAB000001',
          patientName: 'John Doe',
          doctorName: 'Dr. Sarah Johnson',
          testName: 'Complete Blood Count',
          category: 'Hematology',
          status: 'Completed',
          orderedDate: '2024-02-01',
          completedDate: '2024-02-02',
          cost: 500,
          results: {
            summary: 'All parameters within normal range',
            aiSummary: 'No abnormalities detected. Patient shows healthy blood profile.',
            values: [
              { parameter: 'Hemoglobin', value: '14.2', unit: 'g/dL', status: 'Normal' },
              { parameter: 'WBC Count', value: '7500', unit: '/μL', status: 'Normal' },
              { parameter: 'Platelet Count', value: '250000', unit: '/μL', status: 'Normal' },
            ],
          },
        },
        {
          _id: '2',
          testId: 'LAB000002',
          patientName: 'Jane Smith',
          doctorName: 'Dr. Michael Chen',
          testName: 'Lipid Profile',
          category: 'Biochemistry',
          status: 'In Progress',
          orderedDate: '2024-02-02',
          cost: 800,
        },
        {
          _id: '3',
          testId: 'LAB000003',
          patientName: 'Robert Wilson',
          doctorName: 'Dr. Emily Davis',
          testName: 'Thyroid Function Test',
          category: 'Endocrinology',
          status: 'Sample Collected',
          orderedDate: '2024-02-03',
          cost: 1200,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTest = (test: LabTest) => {
    setSelectedTest(test);
    setDialogOpen(true);
  };

  const handleStatusChange = async (testId: string, newStatus: string) => {
    try {
      await axios.put(`/api/lab/${testId}/status`, { status: newStatus });
      fetchLabTests();
    } catch (error) {
      console.error('Failed to update test status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ordered': return 'info';
      case 'Sample Collected': return 'warning';
      case 'In Progress': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ordered': return <Pending />;
      case 'Sample Collected': return <Assignment />;
      case 'In Progress': return <Science />;
      case 'Completed': return <CheckCircle />;
      case 'Cancelled': return <Error />;
      default: return <Pending />;
    }
  };

  const getParameterStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'success';
      case 'High': return 'warning';
      case 'Low': return 'warning';
      case 'Critical': return 'error';
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
                Laboratory Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {/* Navigate to new test order */}}
              >
                Order Test
              </Button>
            </Box>

            {/* Stats Cards */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 2, 
              mb: 3 
            }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Today's Tests
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        24
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Science />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Pending Results
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        8
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <Pending />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Completed Today
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        16
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircle />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
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
                      placeholder="Search tests by patient, test name..."
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
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Status</MenuItem>
                      <MenuItem value="Ordered">Ordered</MenuItem>
                      <MenuItem value="Sample Collected">Sample Collected</MenuItem>
                      <MenuItem value="In Progress">In Progress</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="Today" color="primary" />
                    <Chip label="Urgent" variant="outlined" />
                    <Chip label="Pending" variant="outlined" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Lab Tests Table */}
            <Card>
              <CardContent>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Test Details</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Doctor</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Cost</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {labTests.map((test) => (
                        <TableRow key={test._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <Science />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {test.testName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {test.testId} • {format(new Date(test.orderedDate), 'MMM dd, yyyy')}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {test.patientName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocalHospital sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {test.doctorName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={test.category}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(test.status)}
                              label={test.status}
                              color={getStatusColor(test.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              ₹{test.cost}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewTest(test)}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {/* Edit test */}}
                              >
                                <Edit />
                              </IconButton>
                              {test.status === 'Sample Collected' && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleStatusChange(test._id, 'In Progress')}
                                  color="primary"
                                >
                                  <Science />
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

            {/* Test Details Dialog */}
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              {selectedTest && (
                <>
                  <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Science />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedTest.testName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {selectedTest.testId} • {selectedTest.category}
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
                          Test Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Patient:</strong> {selectedTest.patientName}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Doctor:</strong> {selectedTest.doctorName}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Ordered:</strong> {format(new Date(selectedTest.orderedDate), 'MMM dd, yyyy')}
                          </Typography>
                          {selectedTest.completedDate && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Completed:</strong> {format(new Date(selectedTest.completedDate), 'MMM dd, yyyy')}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Cost:</strong> ₹{selectedTest.cost}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {selectedTest.results && (
                        <>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              AI Summary
                            </Typography>
                            <Box sx={{ pl: 2 }}>
                              <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                                <Typography variant="body2">
                                  {selectedTest.results.aiSummary || selectedTest.results.summary}
                                </Typography>
                              </Paper>
                            </Box>
                          </Box>
                          
                          <Box sx={{ gridColumn: '1 / -1' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Test Results
                            </Typography>
                            <TableContainer component={Paper} sx={{ mt: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Parameter</TableCell>
                                    <TableCell>Value</TableCell>
                                    <TableCell>Unit</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {selectedTest.results.values.map((result, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{result.parameter}</TableCell>
                                      <TableCell>{result.value}</TableCell>
                                      <TableCell>{result.unit}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={result.status}
                                          color={getParameterStatusColor(result.status)}
                                          size="small"
                                        />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        </>
                      )}
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Close</Button>
                    {selectedTest.status !== 'Completed' && (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          // Update status logic
                          setDialogOpen(false);
                        }}
                      >
                        Update Status
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={() => {
                        setDialogOpen(false);
                        // Navigate to edit or add results
                      }}
                    >
                      {selectedTest.results ? 'View Full Report' : 'Add Results'}
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

export default LabManagement;