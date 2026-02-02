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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Visibility,
  LocalPharmacy,
  Person,
  LocalHospital,
  Inventory,
  Warning,
  CheckCircle,
  Assignment,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

interface Medicine {
  _id: string;
  medicineId: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  price: {
    mrp: number;
    sellingPrice: number;
  };
  inventory: {
    currentStock: number;
    minimumStock: number;
  };
  status: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  patientName: string;
  doctorName: string;
  medicines: Array<{
    name: string;
    dosage: string;
    quantity: number;
    price: number;
    dispensed: boolean;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const PharmacyManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItem, setSelectedItem] = useState<Medicine | Prescription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (activeTab === 0) {
      fetchMedicines();
    } else {
      fetchPrescriptions();
    }
  }, [activeTab, page, searchTerm, statusFilter]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/pharmacy/medicines', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          status: statusFilter !== 'All' ? statusFilter : '',
        },
      });
      setMedicines(response.data.medicines);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
      // Mock data for demo
      setMedicines([
        {
          _id: '1',
          medicineId: 'MED000001',
          name: 'Paracetamol 500mg',
          genericName: 'Acetaminophen',
          manufacturer: 'PharmaCorp',
          category: 'Analgesic',
          price: {
            mrp: 50,
            sellingPrice: 45,
          },
          inventory: {
            currentStock: 500,
            minimumStock: 100,
          },
          status: 'Available',
        },
        {
          _id: '2',
          medicineId: 'MED000002',
          name: 'Amoxicillin 250mg',
          genericName: 'Amoxicillin',
          manufacturer: 'MediLife',
          category: 'Antibiotic',
          price: {
            mrp: 120,
            sellingPrice: 108,
          },
          inventory: {
            currentStock: 50,
            minimumStock: 100,
          },
          status: 'Low Stock',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/pharmacy/prescriptions', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          status: statusFilter !== 'All' ? statusFilter : '',
        },
      });
      setPrescriptions(response.data.prescriptions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      // Mock data for demo
      setPrescriptions([
        {
          _id: '1',
          prescriptionId: 'PRE000001',
          patientName: 'John Doe',
          doctorName: 'Dr. Sarah Johnson',
          medicines: [
            { name: 'Paracetamol 500mg', dosage: '1 tablet', quantity: 10, price: 45, dispensed: false },
            { name: 'Vitamin D3', dosage: '1 capsule', quantity: 30, price: 200, dispensed: false },
          ],
          totalAmount: 245,
          status: 'Pending',
          createdAt: '2024-02-03',
        },
        {
          _id: '2',
          prescriptionId: 'PRE000002',
          patientName: 'Jane Smith',
          doctorName: 'Dr. Michael Chen',
          medicines: [
            { name: 'Amoxicillin 250mg', dosage: '1 capsule', quantity: 21, price: 108, dispensed: true },
          ],
          totalAmount: 108,
          status: 'Fully Dispensed',
          createdAt: '2024-02-02',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewItem = (item: Medicine | Prescription) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'success';
      case 'Low Stock': return 'warning';
      case 'Out of Stock': return 'error';
      case 'Pending': return 'warning';
      case 'Partially Dispensed': return 'info';
      case 'Fully Dispensed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1);
    setSearchTerm('');
    setStatusFilter('All');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Pharmacy Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {/* Navigate based on active tab */}}
              >
                {activeTab === 0 ? 'Add Medicine' : 'New Prescription'}
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
                        Total Medicines
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        1,247
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <LocalPharmacy />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Low Stock Items
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        23
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.main' }}>
                      <Warning />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Today's Prescriptions
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        45
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <Assignment />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Revenue Today
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        ₹12.5K
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircle />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Tabs */}
            <Card sx={{ mb: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Medicines" />
                <Tab label="Prescriptions" />
              </Tabs>
            </Card>

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
                      placeholder={activeTab === 0 ? "Search medicines..." : "Search prescriptions..."}
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
                      {activeTab === 0 ? (
                        <>
                          <MenuItem value="Available">Available</MenuItem>
                          <MenuItem value="Low Stock">Low Stock</MenuItem>
                          <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                        </>
                      ) : (
                        <>
                          <MenuItem value="Pending">Pending</MenuItem>
                          <MenuItem value="Partially Dispensed">Partially Dispensed</MenuItem>
                          <MenuItem value="Fully Dispensed">Fully Dispensed</MenuItem>
                        </>
                      )}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="Today" color="primary" />
                    <Chip label="Urgent" variant="outlined" />
                    <Chip label="Expiring Soon" variant="outlined" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Content Table */}
            <Card>
              <CardContent>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {activeTab === 0 ? (
                          <>
                            <TableCell>Medicine</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Stock</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>Prescription</TableCell>
                            <TableCell>Patient</TableCell>
                            <TableCell>Doctor</TableCell>
                            <TableCell>Medicines</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeTab === 0 ? (
                        medicines.map((medicine) => (
                          <TableRow key={medicine._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  <LocalPharmacy />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {medicine.name}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {medicine.medicineId} • {medicine.genericName}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={medicine.category}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {medicine.inventory.currentStock} units
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Min: {medicine.inventory.minimumStock}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  ₹{medicine.price.sellingPrice}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  MRP: ₹{medicine.price.mrp}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={medicine.status}
                                color={getStatusColor(medicine.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewItem(medicine)}
                                >
                                  <Visibility />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {/* Edit medicine */}}
                                >
                                  <Edit />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {/* Update inventory */}}
                                >
                                  <Inventory />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        prescriptions.map((prescription) => (
                          <TableRow key={prescription._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                  <Assignment />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {prescription.prescriptionId}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {format(new Date(prescription.createdAt), 'MMM dd, yyyy')}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {prescription.patientName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocalHospital sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2">
                                  {prescription.doctorName}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {prescription.medicines.length} medicine(s)
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                ₹{prescription.totalAmount}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={prescription.status}
                                color={getStatusColor(prescription.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewItem(prescription)}
                                >
                                  <Visibility />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {/* Edit prescription */}}
                                >
                                  <Edit />
                                </IconButton>
                                {prescription.status === 'Pending' && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {/* Dispense */}}
                                    color="success"
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
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

            {/* Details Dialog */}
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              {selectedItem && (
                <>
                  <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {activeTab === 0 ? <LocalPharmacy /> : <Assignment />}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {activeTab === 0 
                            ? (selectedItem as Medicine).name 
                            : (selectedItem as Prescription).prescriptionId}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {activeTab === 0 
                            ? (selectedItem as Medicine).medicineId 
                            : `Patient: ${(selectedItem as Prescription).patientName}`}
                        </Typography>
                      </Box>
                    </Box>
                  </DialogTitle>
                  <DialogContent>
                    {/* Content based on active tab */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                      gap: 3 
                    }}>
                      {activeTab === 0 ? (
                        // Medicine details
                        <>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Medicine Information
                            </Typography>
                            <Box sx={{ pl: 2 }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Generic Name:</strong> {(selectedItem as Medicine).genericName}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Manufacturer:</strong> {(selectedItem as Medicine).manufacturer}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Category:</strong> {(selectedItem as Medicine).category}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Pricing & Stock
                            </Typography>
                            <Box sx={{ pl: 2 }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>MRP:</strong> ₹{(selectedItem as Medicine).price.mrp}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Selling Price:</strong> ₹{(selectedItem as Medicine).price.sellingPrice}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Current Stock:</strong> {(selectedItem as Medicine).inventory.currentStock} units
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Minimum Stock:</strong> {(selectedItem as Medicine).inventory.minimumStock} units
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      ) : (
                        // Prescription details
                        <>
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Prescription Information
                            </Typography>
                            <Box sx={{ pl: 2 }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Patient:</strong> {(selectedItem as Prescription).patientName}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Doctor:</strong> {(selectedItem as Prescription).doctorName}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Date:</strong> {format(new Date((selectedItem as Prescription).createdAt), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Amount:</strong> ₹{(selectedItem as Prescription).totalAmount}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ gridColumn: '1 / -1' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Medicines
                            </Typography>
                            <TableContainer component={Paper} sx={{ mt: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Medicine</TableCell>
                                    <TableCell>Dosage</TableCell>
                                    <TableCell>Quantity</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(selectedItem as Prescription).medicines.map((medicine, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{medicine.name}</TableCell>
                                      <TableCell>{medicine.dosage}</TableCell>
                                      <TableCell>{medicine.quantity}</TableCell>
                                      <TableCell>₹{medicine.price}</TableCell>
                                      <TableCell>
                                        <Chip
                                          label={medicine.dispensed ? 'Dispensed' : 'Pending'}
                                          color={medicine.dispensed ? 'success' : 'warning'}
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
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setDialogOpen(false);
                        // Action based on tab
                      }}
                    >
                      {activeTab === 0 ? 'Update Stock' : 'Dispense'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setDialogOpen(false);
                        // Edit action
                      }}
                    >
                      Edit
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

export default PharmacyManagement;