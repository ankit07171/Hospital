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
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Visibility,
  Receipt,
  Person,
  Payment,
  AccountBalance,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

interface Bill {
  _id: string;
  billId: string;
  patientName: string;
  billType: string;
  services: Array<{
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
  }>;
  amounts: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
  };
  insurance: {
    isInsured: boolean;
    provider?: string;
    claimStatus?: string;
    approvedAmount?: number;
  };
  status: string;
  createdAt: string;
}

const BillingManagement: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [billTypeFilter, setBillTypeFilter] = useState('All');

  useEffect(() => {
    fetchBills();
  }, [page, searchTerm, statusFilter, billTypeFilter]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/billing', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          status: statusFilter !== 'All' ? statusFilter : '',
          billType: billTypeFilter !== 'All' ? billTypeFilter : '',
        },
      });
      setBills(response.data.bills);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      // Mock data for demo
      setBills([
        {
          _id: '1',
          billId: 'BILL000001',
          patientName: 'John Doe',
          billType: 'OPD',
          services: [
            { serviceName: 'Consultation', quantity: 1, unitPrice: 1500, totalAmount: 1500 },
            { serviceName: 'ECG', quantity: 1, unitPrice: 500, totalAmount: 500 },
          ],
          amounts: {
            subtotal: 2000,
            totalDiscount: 100,
            totalTax: 190,
            totalAmount: 2090,
            paidAmount: 2090,
            balanceAmount: 0,
          },
          insurance: {
            isInsured: true,
            provider: 'Health Insurance Corp',
            claimStatus: 'Approved',
            approvedAmount: 1500,
          },
          status: 'Fully Paid',
          createdAt: '2024-02-01',
        },
        {
          _id: '2',
          billId: 'BILL000002',
          patientName: 'Jane Smith',
          billType: 'IPD',
          services: [
            { serviceName: 'Room Charges', quantity: 3, unitPrice: 2000, totalAmount: 6000 },
            { serviceName: 'Surgery', quantity: 1, unitPrice: 50000, totalAmount: 50000 },
            { serviceName: 'Medicines', quantity: 1, unitPrice: 5000, totalAmount: 5000 },
          ],
          amounts: {
            subtotal: 61000,
            totalDiscount: 1000,
            totalTax: 6000,
            totalAmount: 66000,
            paidAmount: 30000,
            balanceAmount: 36000,
          },
          insurance: {
            isInsured: true,
            provider: 'Medical Insurance Ltd',
            claimStatus: 'Submitted',
            approvedAmount: 0,
          },
          status: 'Partially Paid',
          createdAt: '2024-02-02',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'Generated': return 'info';
      case 'Partially Paid': return 'warning';
      case 'Fully Paid': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getBillTypeColor = (type: string) => {
    switch (type) {
      case 'OPD': return 'primary';
      case 'IPD': return 'secondary';
      case 'Emergency': return 'error';
      case 'Lab': return 'info';
      case 'Pharmacy': return 'success';
      default: return 'default';
    }
  };

  const getInsuranceStatusColor = (status: string) => {
    switch (status) {
      case 'Not Claimed': return 'default';
      case 'Submitted': return 'info';
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Partially Approved': return 'warning';
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
                Billing Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {/* Navigate to new bill */}}
              >
                Generate Bill
              </Button>
            </Box>

            {/* Stats Cards */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minWidth(200px, 1fr))', 
              gap: 2, 
              mb: 3 
            }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Today's Revenue
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        ₹1.2L
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                        <Typography variant="body2" sx={{ color: 'success.main' }}>
                          +12% from yesterday
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <Receipt />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Outstanding Amount
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        ₹45K
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
                        Insurance Claims
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        23
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <AccountBalance />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        Paid Bills Today
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        67
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                      placeholder="Search bills by patient, bill ID..."
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
                      <MenuItem value="All">All Status</MenuItem>
                      <MenuItem value="Generated">Generated</MenuItem>
                      <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                      <MenuItem value="Fully Paid">Fully Paid</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={billTypeFilter}
                      label="Type"
                      onChange={(e) => setBillTypeFilter(e.target.value)}
                    >
                      <MenuItem value="All">All Types</MenuItem>
                      <MenuItem value="OPD">OPD</MenuItem>
                      <MenuItem value="IPD">IPD</MenuItem>
                      <MenuItem value="Emergency">Emergency</MenuItem>
                      <MenuItem value="Lab">Lab</MenuItem>
                      <MenuItem value="Pharmacy">Pharmacy</MenuItem>
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="Today" color="primary" />
                    <Chip label="Outstanding" variant="outlined" />
                    <Chip label="Insurance" variant="outlined" />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Bills Table */}
            <Card>
              <CardContent>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Bill Details</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Payment Status</TableCell>
                        <TableCell>Insurance</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bills.map((bill) => (
                        <TableRow key={bill._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <Receipt />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {bill.billId}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {format(new Date(bill.createdAt), 'MMM dd, yyyy')}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {bill.patientName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={bill.billType}
                              color={getBillTypeColor(bill.billType)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                ₹{bill.amounts.totalAmount.toLocaleString()}
                              </Typography>
                              {bill.amounts.balanceAmount > 0 && (
                                <Typography variant="body2" color="error">
                                  Balance: ₹{bill.amounts.balanceAmount.toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={bill.status}
                              color={getStatusColor(bill.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {bill.insurance.isInsured ? (
                              <Box>
                                <Typography variant="body2" fontSize="0.75rem">
                                  {bill.insurance.provider}
                                </Typography>
                                <Chip
                                  label={bill.insurance.claimStatus}
                                  color={getInsuranceStatusColor(bill.insurance.claimStatus || '')}
                                  size="small"
                                />
                              </Box>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                No Insurance
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleViewBill(bill)}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {/* Edit bill */}}
                              >
                                <Edit />
                              </IconButton>
                              {bill.amounts.balanceAmount > 0 && (
                                <IconButton
                                  size="small"
                                  onClick={() => {/* Add payment */}}
                                  color="success"
                                >
                                  <Payment />
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

            {/* Bill Details Dialog */}
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              {selectedBill && (
                <>
                  <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Receipt />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          Bill Details - {selectedBill.billId}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {selectedBill.patientName} • {format(new Date(selectedBill.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                    </Box>
                  </DialogTitle>
                  <DialogContent>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minWidth(300px, 1fr))', 
                      gap: 3 
                    }}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Bill Information
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Patient:</strong> {selectedBill.patientName}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Type:</strong> {selectedBill.billType}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Date:</strong> {format(new Date(selectedBill.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Status:</strong> {selectedBill.status}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Amount Details
                        </Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Subtotal:</strong> ₹{selectedBill.amounts.subtotal.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Discount:</strong> ₹{selectedBill.amounts.totalDiscount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Tax:</strong> ₹{selectedBill.amounts.totalTax.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Total:</strong> ₹{selectedBill.amounts.totalAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Paid:</strong> ₹{selectedBill.amounts.paidAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, color: selectedBill.amounts.balanceAmount > 0 ? 'error.main' : 'success.main' }}>
                            <strong>Balance:</strong> ₹{selectedBill.amounts.balanceAmount.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      {selectedBill.insurance.isInsured && (
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Insurance Information
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Provider:</strong> {selectedBill.insurance.provider}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Claim Status:</strong> {selectedBill.insurance.claimStatus}
                            </Typography>
                            {selectedBill.insurance.approvedAmount && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Approved Amount:</strong> ₹{selectedBill.insurance.approvedAmount.toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}

                      <Box sx={{ gridColumn: '1 / -1' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Services
                        </Typography>
                        <TableContainer component={Paper} sx={{ mt: 1 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Service</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Unit Price</TableCell>
                                <TableCell>Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedBill.services.map((service, index) => (
                                <TableRow key={index}>
                                  <TableCell>{service.serviceName}</TableCell>
                                  <TableCell>{service.quantity}</TableCell>
                                  <TableCell>₹{service.unitPrice.toLocaleString()}</TableCell>
                                  <TableCell>₹{service.totalAmount.toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Close</Button>
                    {selectedBill.amounts.balanceAmount > 0 && (
                      <Button
                        variant="outlined"
                        startIcon={<Payment />}
                        onClick={() => {
                          setDialogOpen(false);
                          // Navigate to payment
                        }}
                      >
                        Add Payment
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={() => {
                        setDialogOpen(false);
                        // Print or download bill
                      }}
                    >
                      Print Bill
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

export default BillingManagement;