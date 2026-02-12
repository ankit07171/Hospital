import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Pagination, InputAdornment, FormControl,
  InputLabel, Select, MenuItem, IconButtonProps
} from '@mui/material';
import { Add, Search, Edit, Visibility, Receipt, Person, Payment, Delete } from '@mui/icons-material';
import { format } from 'date-fns';
import axios from '../../api/axios';
import debounce from 'lodash/debounce'; // npm i lodash @types/lodash

interface BillItem {
  category: string;
  name: string;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  total: number;
}

interface Bill {
  _id: string;
  billId: string;
  patientId: {
    _id: string;
    personalInfo: { firstName: string; lastName: string };
  };
  billType?: string; // OPD/IPD etc. - add to schema if needed
  items: BillItem[];
  summary: {
    subTotal: number;
    gstAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
  };
  status: string;
  createdAt: string;
}

const BillingManagement: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [billTypeFilter, setBillTypeFilter] = useState('All');
  const [patientIdFilter, setPatientIdFilter] = useState(''); // Renamed for clarity
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [openGenerate, setOpenGenerate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate Bill form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([
    { category: 'Bed', name: 'General Ward', quantity: 1, unitPrice: 1500, gstPercent: 5, total: 1575 }
  ]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchPatients();
  }, []);

  const debouncedFetchBills = useCallback(
    debounce(async () => {
      await fetchBills();
    }, 500),
    [page, search, statusFilter, billTypeFilter, patientIdFilter]
  );

  useEffect(() => {
    debouncedFetchBills();
    return () => debouncedFetchBills.cancel();
  }, [page, search, statusFilter, billTypeFilter, patientIdFilter, debouncedFetchBills]);

  const fetchBills = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/billing', {
        params: {
          page, limit: 10, search,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          billType: billTypeFilter !== 'All' ? billTypeFilter : undefined,
          patientId: patientIdFilter || undefined,
        },
      });
      setBills(res.data.bills || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch bills');
      console.error('Billing fetch error:', err); // Debug axios [web:11]
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
  try {
    // Try your existing patients endpoint first
    let res = await axios.get('/api/patient');
    setPatients(Array.isArray(res.data) ? res.data : [res.data]);
  } catch (err: any) {
    if (err.response?.status === 404) {
      console.warn('Fallback: /api/patient 404 → Trying /api/patients');
      try {
        const res = await axios.get('/api/patients');
        setPatients(Array.isArray(res.data) ? res.data : [res.data]);
      } catch (fallbackErr) {
        console.error('Both patient endpoints 404:', fallbackErr);
        setPatients([]); // Empty dropdown graceful
      }
    } else {
      console.error('Patients fetch error:', err);
      setPatients([]);
    }
  }
};


  // Generate Bill handlers
  useEffect(() => {
    let sub = 0, gst = 0;
    billItems.forEach(i => {
      const base = i.quantity * i.unitPrice;
      const itemGst = (base * i.gstPercent) / 100;
      sub += base;
      gst += itemGst;
    });
    const total = sub + gst;
    setSubTotal(sub);
    setGstAmount(gst);
    setTotalAmount(total);
  }, [billItems]);

  const updateItem = (index: number, field: keyof BillItem, value: number | string) => {
    const newItems = [...billItems];
    (newItems[index] as any)[field] = value;
    // Recalc total
    const base = newItems[index].quantity * newItems[index].unitPrice;
    newItems[index].total = base + (base * newItems[index].gstPercent / 100);
    setBillItems(newItems);
  };

  const addItem = () => setBillItems([...billItems, { category: 'Bed', name: '', quantity: 1, unitPrice: 0, gstPercent: 0, total: 0 }]);
  const removeItem = (index: number) => setBillItems(billItems.filter((_, i) => i !== index));

  const handleCreateBill = async () => {
    if (!selectedPatientId || billItems.some(i => !i.name || i.unitPrice <= 0)) {
      alert('Please select patient and fill all items');
      return;
    }
    try {
      await axios.post('/api/billing', {
        patientId: selectedPatientId,
        items: billItems,
        paidAmount,
      });
      setOpenGenerate(false);
      setSelectedPatientId('');
      setBillItems([{ category: 'Bed', name: 'General Ward', quantity: 1, unitPrice: 1500, gstPercent: 5, total: 1575 }]);
      setPaidAmount(0);
      fetchBills(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create bill');
    }
  };

  const handlePayment = async (billId: string) => {
    // Stub: POST /api/billing/${billId}/payments { amount: X, method: 'Cash' }
    console.log('Payment for', billId);
  };

  const patientName = (bill: Bill) => `${bill.patientId.personalInfo.firstName} ${bill.patientId.personalInfo.lastName}`;

  const statusColor = (status: string) => {
    if (status === 'Fully Paid') return 'success';
    if (status === 'Partially Paid') return 'warning';
    return 'info';
  };

  if (loading) return <Typography>Loading bills...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold">Billing Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenGenerate(true)}>
          Generate Bill
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search bill / patient"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select 
              value={statusFilter} 
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as string)}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Generated">Generated</MenuItem>
              <MenuItem value="Partially Paid">Partially Paid</MenuItem>
              <MenuItem value="Fully Paid">Fully Paid</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Bill Type</InputLabel>
            <Select 
              value={billTypeFilter} 
              label="Bill Type"
              onChange={(e) => setBillTypeFilter(e.target.value as string)}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="OPD">OPD</MenuItem>
              <MenuItem value="IPD">IPD</MenuItem>
              <MenuItem value="Lab">Lab</MenuItem>
              <MenuItem value="Pharmacy">Pharmacy</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Patient</InputLabel>
            <Select 
              value={patientIdFilter} 
              label="Patient"
              onChange={(e) => setPatientIdFilter(e.target.value as string)}
            >
              <MenuItem value="">All Patients</MenuItem>
              {patients.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.personalInfo?.firstName} {p.personalInfo?.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bill</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill._id} hover>
                    <TableCell>
                      <Typography fontWeight="bold">{bill.billId}</Typography>
                      <Typography variant="body2">{format(new Date(bill.createdAt), 'dd MMM yyyy')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1} alignItems="center">
                        <Person fontSize="small" />
                        {patientName(bill)}
                      </Box>
                    </TableCell>
                    <TableCell>{bill.billType || 'General'}</TableCell>
                    <TableCell>₹{bill.summary.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={bill.status} color={statusColor(bill.status) as any} size="small" />
                    </TableCell>
                    <TableCell>
                      {bill.summary.balanceAmount > 0 ? `₹${bill.summary.balanceAmount.toLocaleString()}` : 'Paid'}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => setSelectedBill(bill)}><Visibility /></IconButton>
                      {bill.summary.balanceAmount > 0 && (
                        <IconButton color="success" onClick={() => handlePayment(bill._id)}><Payment /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p as number)} />
          </Box>
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog open={!!selectedBill} onClose={() => setSelectedBill(null)} maxWidth="md" fullWidth>
        {selectedBill && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar><Receipt /></Avatar>
                {selectedBill.billId} - {patientName(selectedBill)}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography>Subtotal: ₹{selectedBill.summary.subTotal.toLocaleString()}</Typography>
              <Typography>GST: ₹{selectedBill.summary.gstAmount.toLocaleString()}</Typography>
              <Typography>Total: ₹{selectedBill.summary.totalAmount.toLocaleString()}</Typography>
              <Typography color="success.main">Paid: ₹{selectedBill.summary.paidAmount.toLocaleString()}</Typography>
              <Typography color="error.main">Balance: ₹{selectedBill.summary.balanceAmount.toLocaleString()}</Typography>

              <Table size="small" sx={{ mt: 2 }}>
                <TableHead><TableRow>
                  <TableCell>Category</TableCell><TableCell>Service</TableCell><TableCell>Qty</TableCell>
                  <TableCell>Unit</TableCell><TableCell>GST%</TableCell><TableCell>Total</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {selectedBill.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₹{item.unitPrice}</TableCell>
                      <TableCell>{item.gstPercent}%</TableCell>
                      <TableCell>₹{item.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedBill(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Generate Bill Dialog */}
      <Dialog open={openGenerate} onClose={() => setOpenGenerate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate New Bill</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }} size="small">
            <InputLabel>Patient</InputLabel>
            <Select 
              value={selectedPatientId} 
              label="Patient"
              onChange={(e) => setSelectedPatientId(e.target.value as string)}
            >
              <MenuItem value="">Select Patient</MenuItem>
              {patients.map(p => (
                <MenuItem key={p._id} value={p._id}>
                  {p.personalInfo?.firstName} {p.personalInfo?.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {billItems.map((item, i) => (
            <Box key={i} display="flex" gap={1} mb={2} flexWrap="wrap">
              <TextField label="Category" size="small" select value={item.category} 
                onChange={(e) => updateItem(i, 'category', e.target.value)} sx={{ minWidth: 100 }}
              >
                <MenuItem value="Bed">Bed</MenuItem>
                <MenuItem value="Medicine">Medicine</MenuItem>
                <MenuItem value="Service">Service</MenuItem>
                <MenuItem value="Lab">Lab</MenuItem>
              </TextField>
              <TextField label="Name" size="small" value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} sx={{ flex: 1, minWidth: 150 }} />
              <TextField type="number" label="Qty" size="small" value={item.quantity} 
                onChange={(e) => updateItem(i, 'quantity', +e.target.value)} sx={{ width: 80 }} />
              <TextField type="number" label="Unit Price" size="small" value={item.unitPrice} 
                onChange={(e) => updateItem(i, 'unitPrice', +e.target.value)} sx={{ width: 100 }} />
              <TextField type="number" label="GST %" size="small" value={item.gstPercent} 
                onChange={(e) => updateItem(i, 'gstPercent', +e.target.value)} sx={{ width: 80 }} />
              <IconButton onClick={() => removeItem(i)}><Delete fontSize="small" /></IconButton>
            </Box>
          ))}

          <Box mb={2} p={2} border="1px solid" borderColor="grey.300" borderRadius={1}>
            <Typography>Subtotal: ₹{subTotal.toLocaleString()}</Typography>
            <Typography>GST: ₹{gstAmount.toLocaleString()}</Typography>
            <Typography fontWeight="bold">Total: ₹{totalAmount.toLocaleString()}</Typography>
          </Box>

          <TextField fullWidth label="Paid Amount" type="number" value={paidAmount}
            onChange={(e) => setPaidAmount(+e.target.value)} size="small"
            helperText={`Balance: ₹${(totalAmount - paidAmount).toLocaleString()}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerate(false)}>Cancel</Button>
          <Button variant="contained" onClick={addItem} startIcon={<Add />}>Add Item</Button>
          <Button variant="contained" onClick={handleCreateBill}>Create Bill</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingManagement;
