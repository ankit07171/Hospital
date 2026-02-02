import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
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
  Paper,
  Chip,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Inventory,
  Warning,
  TrendingDown,
  TrendingUp,
  Category,
  LocalShipping,
} from '@mui/icons-material';
import axios from 'axios';

interface InventoryItem {
  _id: string;
  itemName: string;
  category: string;
  itemCode: string;
  description: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitPrice: number;
  unit: string;
  supplier: {
    name: string;
    contact: string;
    email: string;
  };
  location: {
    department: string;
    room: string;
    shelf: string;
  };
  expiryDate?: string;
  batchNumber?: string;
  status: string;
  movements: Array<{
    type: string;
    quantity: number;
    reason: string;
    date: string;
    user: string;
  }>;
}

interface InventoryStats {
  totalItems: number;
  availableItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  expiringItems: number;
}

const InventoryManagement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    availableItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    expiringItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openStockDialog, setOpenStockDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [stockOperation, setStockOperation] = useState<'add' | 'subtract'>('add');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [stockReason, setStockReason] = useState('');

  const [formData, setFormData] = useState({
    itemName: '',
    category: 'Medical Equipment',
    itemCode: '',
    description: '',
    currentStock: 0,
    minimumStock: 0,
    maximumStock: 0,
    unitPrice: 0,
    unit: 'pieces',
    supplier: {
      name: '',
      contact: '',
      email: '',
    },
    location: {
      department: '',
      room: '',
      shelf: '',
    },
    expiryDate: '',
    batchNumber: '',
  });

  const categories = [
    'Medical Equipment',
    'Pharmaceuticals',
    'Surgical Instruments',
    'Consumables',
    'Laboratory',
    'Other'
  ];

  const units = ['pieces', 'boxes', 'bottles', 'vials', 'kg', 'liters', 'meters', 'sets'];

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, [searchTerm, categoryFilter, statusFilter]);

  const fetchItems = async () => {
    try {
      const response = await axios.get('/api/inventory', {
        params: {
          search: searchTerm,
          category: categoryFilter,
          status: statusFilter,
          limit: 50,
        },
      });
      setItems(response.data.items);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/inventory/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedItem) {
        await axios.put(`/api/inventory/${selectedItem._id}`, formData);
      } else {
        await axios.post('/api/inventory', formData);
      }
      setOpenDialog(false);
      resetForm();
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedItem) return;

    try {
      await axios.put(`/api/inventory/${selectedItem._id}/stock`, {
        quantity: stockQuantity,
        operation: stockOperation,
        reason: stockReason,
        user: 'Current User', // Replace with actual user
      });
      setOpenStockDialog(false);
      setStockQuantity(0);
      setStockReason('');
      fetchItems();
      fetchStats();
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      category: 'Medical Equipment',
      itemCode: '',
      description: '',
      currentStock: 0,
      minimumStock: 0,
      maximumStock: 0,
      unitPrice: 0,
      unit: 'pieces',
      supplier: {
        name: '',
        contact: '',
        email: '',
      },
      location: {
        department: '',
        room: '',
        shelf: '',
      },
      expiryDate: '',
      batchNumber: '',
    });
    setSelectedItem(null);
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      itemCode: item.itemCode,
      description: item.description,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock,
      unitPrice: item.unitPrice,
      unit: item.unit,
      supplier: item.supplier,
      location: item.location,
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
      batchNumber: item.batchNumber || '',
    });
    setOpenDialog(true);
  };

  const handleStockAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setOpenStockDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'success';
      case 'Low Stock':
        return 'warning';
      case 'Out of Stock':
        return 'error';
      case 'Expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {typeof value === 'number' && title.includes('Value') 
                ? `$${value.toLocaleString()}` 
                : value.toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Inventory Management
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 3, 
        mb: 3 
      }}>
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          icon={<Inventory sx={{ fontSize: 40 }} />}
          color="primary"
        />
        <StatCard
          title="Available Items"
          value={stats.availableItems}
          icon={<TrendingUp sx={{ fontSize: 40 }} />}
          color="success"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={<Warning sx={{ fontSize: 40 }} />}
          color="warning"
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockItems}
          icon={<TrendingDown sx={{ fontSize: 40 }} />}
          color="error"
        />
        <StatCard
          title="Total Value"
          value={stats.totalValue}
          icon={<Category sx={{ fontSize: 40 }} />}
          color="info"
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiringItems}
          icon={<LocalShipping sx={{ fontSize: 40 }} />}
          color="warning"
        />
      </Box>

      {/* Alerts */}
      {stats.lowStockItems > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {stats.lowStockItems} items are running low on stock. Please reorder soon.
        </Alert>
      )}
      {stats.outOfStockItems > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {stats.outOfStockItems} items are out of stock. Immediate action required.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Inventory Items</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
            >
              Add Item
            </Button>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="In Stock">In Stock</MenuItem>
                <MenuItem value="Low Stock">Low Stock</MenuItem>
                <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Current Stock</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.itemCode}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.itemName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.currentStock} {item.unit}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Min: {item.minimumStock}
                      </Typography>
                    </TableCell>
                    <TableCell>${item.unitPrice}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.location.department}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.location.room} - {item.location.shelf}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(item)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleStockAdjustment(item)}
                        color="secondary"
                      >
                        <TrendingUp />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 1 }}>
            <TextField
              label="Item Name"
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Item Code"
              value={formData.itemCode}
              onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Unit</InputLabel>
              <Select
                value={formData.unit}
                label="Unit"
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {units.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Current Stock"
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Minimum Stock"
              type="number"
              value={formData.minimumStock}
              onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Maximum Stock"
              type="number"
              value={formData.maximumStock}
              onChange={(e) => setFormData({ ...formData, maximumStock: parseInt(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Unit Price"
              type="number"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Supplier Name"
              value={formData.supplier.name}
              onChange={(e) => setFormData({ 
                ...formData, 
                supplier: { ...formData.supplier, name: e.target.value }
              })}
              fullWidth
            />
            <TextField
              label="Supplier Contact"
              value={formData.supplier.contact}
              onChange={(e) => setFormData({ 
                ...formData, 
                supplier: { ...formData.supplier, contact: e.target.value }
              })}
              fullWidth
            />
            <TextField
              label="Department"
              value={formData.location.department}
              onChange={(e) => setFormData({ 
                ...formData, 
                location: { ...formData.location, department: e.target.value }
              })}
              fullWidth
            />
            <TextField
              label="Room"
              value={formData.location.room}
              onChange={(e) => setFormData({ 
                ...formData, 
                location: { ...formData.location, room: e.target.value }
              })}
              fullWidth
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Batch Number"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              fullWidth
            />
          </Box>
          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={openStockDialog} onClose={() => setOpenStockDialog(false)}>
        <DialogTitle>Stock Adjustment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current Stock: {selectedItem?.currentStock} {selectedItem?.unit}
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Operation</InputLabel>
            <Select
              value={stockOperation}
              label="Operation"
              onChange={(e) => setStockOperation(e.target.value as 'add' | 'subtract')}
            >
              <MenuItem value="add">Add Stock</MenuItem>
              <MenuItem value="subtract">Remove Stock</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Quantity"
            type="number"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Reason"
            value={stockReason}
            onChange={(e) => setStockReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStockDialog(false)}>Cancel</Button>
          <Button onClick={handleStockUpdate} variant="contained">
            Update Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryManagement;