import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Alert,
  LinearProgress,
  Snackbar,
  Slide,
  Tooltip,
  Checkbox,
  Skeleton,
  DialogContentText,
  Divider,
  Stack,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Visibility,
  Delete,
  LocalPharmacy,
  Inventory,
  Warning,
  Assignment,
  Save,
  AttachMoney,
  DeleteOutline,
  Close,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import axios from '../../api/axios';

// ===== INTERFACES =====

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
  status: 'Available' | 'Low Stock' | 'Out of Stock';
  expiryDate?: string;
  batchNumber?: string;
  dosageForm?: string;
  strength?: string;
  createdAt: string;
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

interface PrescriptionMedicine {
  name: string;
  dosage: string;
  quantity: number;
  price: number;
  dispensed: boolean;
  frequency?: string;
  duration?: string;
}

interface Prescription {
  _id: string;
  prescriptionId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  patientContact?: string;
  doctorName: string;
  doctorSpecialization?: string;
  medicines: PrescriptionMedicine[];
  totalAmount: number;
  finalAmount?: number;
  discount?: number;
  status: 'Pending' | 'Partially Dispensed' | 'Fully Dispensed' | 'Cancelled';
  createdAt: string;
  notes?: string;
  diagnosis?: string;
  dispensedCount?: number;
  medicineCount?: number;
}

interface DashboardStats {
  medicines: {
    total: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
    expiringSoon: number;
  };
  prescriptions: {
    today: number;
    pending: number;
    todayRevenue: number;
    totalRevenue: number;
  };
}

interface MedicineFormData {
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
  expiryDate: string;
  batchNumber: string;
  dosageForm: string;
  strength: string;
}

interface PrescriptionFormData {
  patientName: string;
  patientAge: number | string;
  patientGender: string;
  patientContact: string;
  doctorName: string;
  doctorSpecialization: string;
  medicines: PrescriptionMedicine[];
  discount: number;
  notes: string;
  diagnosis: string;
}

// ===== COMPONENT =====

const PharmacyManagement: React.FC = () => {
  // Tab & Data States
  const [activeTab, setActiveTab] = useState(0);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Dialog States
  const [selectedItem, setSelectedItem] = useState<Medicine | Prescription | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [crudDialogOpen, setCrudDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form States
  const [editingItem, setEditingItem] = useState<Medicine | Prescription | null>(null);
  const [isMedicineForm, setIsMedicineForm] = useState(true);
  const [saving, setSaving] = useState(false);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch data when dependencies change
  useEffect(() => {
    if (activeTab === 0) {
      fetchMedicines();
    } else {
      fetchPrescriptions();
    }
  }, [activeTab, page, debouncedSearch, statusFilter, categoryFilter]);

  // Fetch dashboard stats on mount
  useEffect(() => {
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ===== API CALLS =====

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/pharmacy/dashboard-stats');
      setDashboardStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/pharmacy/medicines', {
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
          status: statusFilter !== 'All' ? statusFilter : '',
          category: categoryFilter !== 'All' ? categoryFilter : '',
        },
      });
      setMedicines(response.data.medicines || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error: any) {
      console.error('Failed to fetch medicines:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load medicines';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, categoryFilter]);

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/pharmacy/prescriptions', {
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
          status: statusFilter !== 'All' ? statusFilter : '',
        },
      });
      setPrescriptions(response.data.prescriptions || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error: any) {
      console.error('Failed to fetch prescriptions:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load prescriptions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  // ===== HANDLERS =====

  const handleViewItem = (item: Medicine | Prescription) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleEditItem = (item: Medicine | Prescription) => {
    setEditingItem(item);
    setIsMedicineForm(activeTab === 0);
    setCrudDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setConfirmDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      await axios.delete(`/api/pharmacy/${activeTab === 0 ? 'medicines' : 'prescriptions'}/${deleteId}`);
      setSuccess(`${activeTab === 0 ? 'Medicine' : 'Prescription'} deleted successfully!`);
      setConfirmDialogOpen(false);
      setDeleteId(null);
      
      if (activeTab === 0) {
        fetchMedicines();
        fetchDashboardStats();
      } else {
        fetchPrescriptions();
        fetchDashboardStats();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete item';
      setError(errorMessage);
      setConfirmDialogOpen(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!window.confirm(`Delete ${selectedIds.length} selected items?`)) return;

    try {
      await axios.patch('/api/pharmacy/medicines/bulk-delete', { ids: selectedIds });
      setSuccess(`${selectedIds.length} items deleted successfully!`);
      setSelectedIds([]);
      fetchMedicines();
      fetchDashboardStats();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete items';
      setError(errorMessage);
    }
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setIsMedicineForm(activeTab === 0);
    setCrudDialogOpen(true);
  };

  const handleSaveItem = async (formData: MedicineFormData | PrescriptionFormData) => {
    setSaving(true);
    try {
      if (isMedicineForm) {
        if (editingItem) {
          await axios.put(`/api/pharmacy/medicines/${editingItem._id}`, formData);
          setSuccess('Medicine updated successfully!');
        } else {
          await axios.post('/api/pharmacy/medicines', formData);
          setSuccess('Medicine created successfully!');
        }
        fetchMedicines();
      } else {
        if (editingItem) {
          await axios.put(`/api/pharmacy/prescriptions/${editingItem._id}`, formData);
          setSuccess('Prescription updated successfully!');
        } else {
          await axios.post('/api/pharmacy/prescriptions', formData);
          setSuccess('Prescription created successfully!');
        }
        fetchPrescriptions();
      }
      
      fetchDashboardStats();
      setCrudDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
        error.response?.data?.errors?.join(', ') || 
        'Failed to save item';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDispenseMedicine = async (prescriptionId: string, medicineIndex: number) => {
    try {
      await axios.patch(`/api/pharmacy/prescriptions/${prescriptionId}/dispense`, {
        medicineIndex
      });
      setSuccess('Medicine dispensed successfully!');
      fetchPrescriptions();
      fetchDashboardStats();
      
      // Update the selected item if viewing
      if (selectedItem && '_id' in selectedItem && selectedItem._id === prescriptionId) {
        const response = await axios.get(`/api/pharmacy/prescriptions/${prescriptionId}`);
        setSelectedItem(response.data);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to dispense medicine';
      setError(errorMessage);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1);
    setSearchTerm('');
    setDebouncedSearch('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setSelectedIds([]);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = activeTab === 0 
        ? medicines.map(m => m._id)
        : prescriptions.map(p => p._id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // ===== UTILITY FUNCTIONS =====

  const getStatusColor = (status: string): "default" | "success" | "warning" | "error" | "info" => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateStats = useMemo(() => {
    if (!dashboardStats) return null;
    return dashboardStats;
  }, [dashboardStats]);

  // ===== RENDER HELPERS =====

  const renderLoadingSkeleton = () => (
    <TableBody>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          {[...Array(activeTab === 0 ? 7 : 7)].map((_, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton animation="wave" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );

  // ===== MAIN RENDER =====

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <LocalPharmacy fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Pharmacy Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage medicines and prescriptions
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleNewItem}
          size="large"
        >
          {activeTab === 0 ? 'Add Medicine' : 'New Prescription'}
        </Button>
      </Box>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!success}
        autoHideDuration={5000}
        onClose={() => setSuccess('')}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Stats Cards */}
      {calculateStats && (
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 0', minWidth: 250 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Total Medicines
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {calculateStats.medicines.total}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                    <Inventory fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 0', minWidth: 250 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Low Stock Items
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {calculateStats.medicines.lowStock}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                    <Warning fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 0', minWidth: 250 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Today's Prescriptions
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {calculateStats.prescriptions.today}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.light', width: 56, height: 56 }}>
                    <Assignment fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 0', minWidth: 250 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      Today's Revenue
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {formatCurrency(calculateStats.prescriptions.todayRevenue)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                    <AttachMoney fontSize="large" />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Main Content Card */}
      <Card>
        <CardContent>
          {/* Tabs */}
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<LocalPharmacy />} label="Medicines" iconPosition="start" />
            <Tab icon={<Assignment />} label="Prescriptions" iconPosition="start" />
          </Tabs>

          {/* Search and Filters */}
          <Box sx={{ display: 'flex', gap: 2, my: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder={`Search ${activeTab === 0 ? 'medicines' : 'prescriptions'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
             
              <Select
  value={statusFilter}
  label="Status"
  onChange={(e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  }}
>
  <MenuItem value="All">All Status</MenuItem>

  {(activeTab === 0
    ? [
        <MenuItem key="available" value="Available">Available</MenuItem>,
        <MenuItem key="low" value="Low Stock">Low Stock</MenuItem>,
        <MenuItem key="out" value="Out of Stock">Out of Stock</MenuItem>,
      ]
    : [
        <MenuItem key="pending" value="Pending">Pending</MenuItem>,
        <MenuItem key="partial" value="Partially Dispensed">Partially Dispensed</MenuItem>,
        <MenuItem key="full" value="Fully Dispensed">Fully Dispensed</MenuItem>,
        <MenuItem key="cancel" value="Cancelled">Cancelled</MenuItem>,
      ]
  )}
</Select>

            </FormControl>

            {activeTab === 0 && (
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  <MenuItem value="Analgesic">Analgesic</MenuItem>
                  <MenuItem value="Antibiotic">Antibiotic</MenuItem>
                  <MenuItem value="Antihistamine">Antihistamine</MenuItem>
                  <MenuItem value="Cardiovascular">Cardiovascular</MenuItem>
                  <MenuItem value="Gastrointestinal">Gastrointestinal</MenuItem>
                  <MenuItem value="Vitamin">Vitamin</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            )}

            {selectedIds.length > 0 && activeTab === 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutline />}
                onClick={handleBulkDelete}
              >
                Delete {selectedIds.length} Selected
              </Button>
            )}
          </Box>

          {/* Loading Progress */}
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Content Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  {activeTab === 0 && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.length === medicines.length && medicines.length > 0}
                        indeterminate={selectedIds.length > 0 && selectedIds.length < medicines.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                  )}
                  {activeTab === 0 ? (
                    <>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>Prescription</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Medicines</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>

              {loading ? renderLoadingSkeleton() : (
                <TableBody>
                  {activeTab === 0 ? (
                    medicines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                            No medicines found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      medicines.map((medicine) => (
                        <TableRow key={medicine._id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedIds.includes(medicine._id)}
                              onChange={() => handleSelectOne(medicine._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.light' }}>
                                <LocalPharmacy />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {medicine.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {medicine.medicineId} • {medicine.genericName}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={medicine.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {medicine.inventory.currentStock} units
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Min: {medicine.inventory.minimumStock}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(medicine.price.sellingPrice)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                MRP: {formatCurrency(medicine.price.mrp)}
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
                          <TableCell align="right">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleViewItem(medicine)}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditItem(medicine)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(medicine._id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    prescriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                            No prescriptions found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      prescriptions.map((prescription) => (
                        <TableRow key={prescription._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'info.light' }}>
                                <Assignment />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {prescription.prescriptionId}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format(parseISO(prescription.createdAt), 'MMM dd, yyyy')}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{prescription.patientName}</TableCell>
                          <TableCell>{prescription.doctorName}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${prescription.medicines.length} medicine(s)`}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(prescription.totalAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={prescription.status}
                              color={getStatusColor(prescription.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => handleViewItem(prescription)}>
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleEditItem(prescription)}>
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(prescription._id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              )}
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedItem && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {activeTab === 0 ? <LocalPharmacy /> : <Assignment />}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6">
                    {activeTab === 0
                      ? (selectedItem as Medicine).name
                      : (selectedItem as Prescription).prescriptionId}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {activeTab === 0
                      ? (selectedItem as Medicine).medicineId
                      : `Patient: ${(selectedItem as Prescription).patientName}`}
                  </Typography>
                </Box>
                <IconButton onClick={() => setDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>
              {activeTab === 0 ? (
                // Medicine Details
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Medicine Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ flex: '1 1 45%' }}>
                          <Typography variant="body2">
                            <strong>Generic Name:</strong> {(selectedItem as Medicine).genericName}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 45%' }}>
                          <Typography variant="body2">
                            <strong>Manufacturer:</strong> {(selectedItem as Medicine).manufacturer}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 45%' }}>
                          <Typography variant="body2">
                            <strong>Category:</strong> {(selectedItem as Medicine).category}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: '1 1 45%' }}>
                          <Typography variant="body2">
                            <strong>Batch Number:</strong> {(selectedItem as Medicine).batchNumber || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Pricing & Stock
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Typography variant="body2">
                          <strong>MRP:</strong> {formatCurrency((selectedItem as Medicine).price.mrp)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Typography variant="body2">
                          <strong>Selling Price:</strong> {formatCurrency((selectedItem as Medicine).price.sellingPrice)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Typography variant="body2">
                          <strong>Current Stock:</strong> {(selectedItem as Medicine).inventory.currentStock} units
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Typography variant="body2">
                          <strong>Minimum Stock:</strong> {(selectedItem as Medicine).inventory.minimumStock} units
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 100%' }}>
                        <Chip
                          label={(selectedItem as Medicine).status}
                          color={getStatusColor((selectedItem as Medicine).status)}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {(selectedItem as Medicine).expiryDate && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Expiry Information
                        </Typography>
                        <Typography variant="body2">
                          <strong>Expiry Date:</strong>{' '}
                          {format(parseISO((selectedItem as Medicine).expiryDate!), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              ) : (
                // Prescription Details
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Prescription Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Typography variant="body2">
                          <strong>Patient:</strong> {(selectedItem as Prescription).patientName}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Typography variant="body2">
                          <strong>Doctor:</strong> {(selectedItem as Prescription).doctorName}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Typography variant="body2">
                          <strong>Date:</strong>{' '}
                          {format(parseISO((selectedItem as Prescription).createdAt), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Chip
                          label={(selectedItem as Prescription).status}
                          color={getStatusColor((selectedItem as Prescription).status)}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Medicines ({(selectedItem as Prescription).medicines.length})
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Medicine</TableCell>
                            <TableCell>Dosage</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(selectedItem as Prescription).medicines.map((med, index) => (
                            <TableRow key={index}>
                              <TableCell>{med.name}</TableCell>
                              <TableCell>{med.dosage}</TableCell>
                              <TableCell>{med.quantity}</TableCell>
                              <TableCell>{formatCurrency(med.price * med.quantity)}</TableCell>
                              <TableCell>
                                {med.dispensed ? (
                                  <Chip label="Dispensed" color="success" size="small" />
                                ) : (
                                  <Chip label="Pending" color="warning" size="small" />
                                )}
                              </TableCell>
                              <TableCell>
                                {!med.dispensed && (selectedItem as Prescription).status !== 'Cancelled' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleDispenseMedicine((selectedItem as Prescription)._id, index)}
                                  >
                                    Dispense
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Divider />

                  <Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: '1 1 45%' }}>
                        <Typography variant="body2">
                          <strong>Total Amount:</strong> {formatCurrency((selectedItem as Prescription).totalAmount)}
                        </Typography>
                      </Box>
                      {(selectedItem as Prescription).discount && (selectedItem as Prescription).discount! > 0 && (
                        <>
                          <Box sx={{ flex: '1 1 45%' }}>
                            <Typography variant="body2">
                              <strong>Discount:</strong> {(selectedItem as Prescription).discount}%
                            </Typography>
                          </Box>
                          <Box sx={{ flex: '1 1 45%' }}>
                            <Typography variant="body2">
                              <strong>Final Amount:</strong>{' '}
                              {formatCurrency((selectedItem as Prescription).finalAmount || (selectedItem as Prescription).totalAmount)}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>

                  {(selectedItem as Prescription).notes && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Notes
                        </Typography>
                        <Typography variant="body2">{(selectedItem as Prescription).notes}</Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              )}
            </DialogContent>
            <Divider />
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* CRUD Dialog */}
      <MedicineFormDialog
        open={crudDialogOpen && isMedicineForm}
        onClose={() => {
          setCrudDialogOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem as Medicine | null}
        saving={saving}
      />

      <PrescriptionFormDialog
        open={crudDialogOpen && !isMedicineForm}
        onClose={() => {
          setCrudDialogOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        editingItem={editingItem as Prescription | null}
        saving={saving}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {activeTab === 0 ? 'medicine' : 'prescription'}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ===== FORM DIALOGS =====

interface MedicineFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: MedicineFormData) => void;
  editingItem: Medicine | null;
  saving: boolean;
}

const MedicineFormDialog: React.FC<MedicineFormDialogProps> = ({
  open,
  onClose,
  onSave,
  editingItem,
  saving,
}) => {
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    genericName: '',
    manufacturer: '',
    category: 'Other',
    price: { mrp: 0, sellingPrice: 0 },
    inventory: { currentStock: 0, minimumStock: 10 },
    expiryDate: '',
    batchNumber: '',
    dosageForm: 'Tablet',
    strength: '',
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        genericName: editingItem.genericName,
        manufacturer: editingItem.manufacturer,
        category: editingItem.category,
        price: editingItem.price,
        inventory: editingItem.inventory,
        expiryDate: editingItem.expiryDate ? editingItem.expiryDate.split('T')[0] : '',
        batchNumber: editingItem.batchNumber || '',
        dosageForm: editingItem.dosageForm || 'Tablet',
        strength: editingItem.strength || '',
      });
    } else {
      setFormData({
        name: '',
        genericName: '',
        manufacturer: '',
        category: 'Other',
        price: { mrp: 0, sellingPrice: 0 },
        inventory: { currentStock: 0, minimumStock: 10 },
        expiryDate: '',
        batchNumber: '',
        dosageForm: 'Tablet',
        strength: '',
      });
    }
  }, [editingItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editingItem ? 'Edit Medicine' : 'New Medicine'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Row 1 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Medicine Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Generic Name"
                  fullWidth
                  required
                  value={formData.genericName}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                />
              </Box>
            </Box>

            {/* Row 2 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Manufacturer"
                  fullWidth
                  required
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <MenuItem value="Analgesic">Analgesic</MenuItem>
                    <MenuItem value="Antibiotic">Antibiotic</MenuItem>
                    <MenuItem value="Antihistamine">Antihistamine</MenuItem>
                    <MenuItem value="Cardiovascular">Cardiovascular</MenuItem>
                    <MenuItem value="Gastrointestinal">Gastrointestinal</MenuItem>
                    <MenuItem value="Vitamin">Vitamin</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Row 3 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="MRP"
                  fullWidth
                  required
                  type="number"
                  value={formData.price.mrp}
                  onChange={(e) =>
                    setFormData({ ...formData, price: { ...formData.price, mrp: Number(e.target.value) } })
                  }
                />
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Selling Price"
                  fullWidth
                  required
                  type="number"
                  value={formData.price.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, price: { ...formData.price, sellingPrice: Number(e.target.value) } })
                  }
                />
              </Box>
            </Box>

            {/* Row 4 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Current Stock"
                  fullWidth
                  required
                  type="number"
                  value={formData.inventory.currentStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventory: { ...formData.inventory, currentStock: Number(e.target.value) },
                    })
                  }
                />
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Minimum Stock"
                  fullWidth
                  required
                  type="number"
                  value={formData.inventory.minimumStock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      inventory: { ...formData.inventory, minimumStock: Number(e.target.value) },
                    })
                  }
                />
              </Box>
            </Box>

            {/* Row 5 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Expiry Date"
                  fullWidth
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Batch Number"
                  fullWidth
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

interface PrescriptionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PrescriptionFormData) => void;
  editingItem: Prescription | null;
  saving: boolean;
}

const PrescriptionFormDialog: React.FC<PrescriptionFormDialogProps> = ({
  open,
  onClose,
  onSave,
  editingItem,
  saving,
}) => {
  const [formData, setFormData] = useState<PrescriptionFormData>({
    patientName: '',
    patientAge: '',
    patientGender: '',
    patientContact: '',
    doctorName: '',
    doctorSpecialization: '',
    medicines: [{ name: '', dosage: '', quantity: 1, price: 0, dispensed: false }],
    discount: 0,
    notes: '',
    diagnosis: '',
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        patientName: editingItem.patientName,
        patientAge: editingItem.patientAge || '',
        patientGender: editingItem.patientGender || '',
        patientContact: editingItem.patientContact || '',
        doctorName: editingItem.doctorName,
        doctorSpecialization: editingItem.doctorSpecialization || '',
        medicines: editingItem.medicines,
        discount: editingItem.discount || 0,
        notes: editingItem.notes || '',
        diagnosis: editingItem.diagnosis || '',
      });
    } else {
      setFormData({
        patientName: '',
        patientAge: '',
        patientGender: '',
        patientContact: '',
        doctorName: '',
        doctorSpecialization: '',
        medicines: [{ name: '', dosage: '', quantity: 1, price: 0, dispensed: false }],
        discount: 0,
        notes: '',
        diagnosis: '',
      });
    }
  }, [editingItem, open]);

  const handleAddMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { name: '', dosage: '', quantity: 1, price: 0, dispensed: false }],
    });
  };

  const handleRemoveMedicine = (index: number) => {
    setFormData({
      ...formData,
      medicines: formData.medicines.filter((_, i) => i !== index),
    });
  };

  const handleMedicineChange = (index: number, field: keyof PrescriptionMedicine, value: any) => {
    const updatedMedicines = [...formData.medicines];
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value };
    setFormData({ ...formData, medicines: updatedMedicines });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editingItem ? 'Edit Prescription' : 'New Prescription'}</DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Row 1 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Patient Name"
                  fullWidth
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </Box>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
  <FormControl fullWidth required>
    <InputLabel>Gender</InputLabel>
    <Select
      label="Gender"
      value={formData.patientGender}
      onChange={(e) =>
        setFormData({ ...formData, patientGender: e.target.value })
      }
    >
      <MenuItem value="Male">Male</MenuItem>
      <MenuItem value="Female">Female</MenuItem>
      <MenuItem value="Other">Other</MenuItem>
    </Select>
  </FormControl>
</Box>

              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Doctor Name"
                  fullWidth
                  required
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                />
              </Box>
            </Box>

            {/* Medicines Section */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Medicines
              </Typography>
              {formData.medicines.map((medicine, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Box sx={{ flex: '1 1 20%', minWidth: 150 }}>
                    <TextField
                      label="Medicine Name"
                      fullWidth
                      required
                      value={medicine.name}
                      onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 20%', minWidth: 150 }}>
                    <TextField
                      label="Dosage"
                      fullWidth
                      required
                      value={medicine.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 15%', minWidth: 100 }}>
                    <TextField
                      label="Quantity"
                      fullWidth
                      required
                      type="number"
                      value={medicine.quantity}
                      onChange={(e) => handleMedicineChange(index, 'quantity', Number(e.target.value))}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 15%', minWidth: 100 }}>
                    <TextField
                      label="Price"
                      fullWidth
                      required
                      type="number"
                      value={medicine.price}
                      onChange={(e) => handleMedicineChange(index, 'price', Number(e.target.value))}
                    />
                  </Box>
                  <Box>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveMedicine(index)} 
                      disabled={formData.medicines.length === 1}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={handleAddMedicine}>
                Add Medicine
              </Button>
            </Box>

            {/* Row 2 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                <TextField
                  label="Discount (%)"
                  fullWidth
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                />
              </Box>
            </Box>

            {/* Notes */}
            <Box>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PharmacyManagement;