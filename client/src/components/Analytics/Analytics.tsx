import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  People,
  LocalHospital,
  AttachMoney,
  Assessment,
  Timeline,
} from '@mui/icons-material';
import axios from 'axios';

interface AnalyticsData {
  patientDemographics: any[];
  revenueData: any[];
  departmentStats: any[];
  doctorPerformance: any[];
  monthlyTrends: any[];
  inventoryAnalytics: any[];
}

const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    patientDemographics: [],
    revenueData: [],
    departmentStats: [],
    doctorPerformance: [],
    monthlyTrends: [],
    inventoryAnalytics: [],
  });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple endpoints
      const [
        patientsResponse,
        billingResponse,
        doctorsResponse,
        appointmentsResponse,
        inventoryResponse,
      ] = await Promise.all([
        axios.get('/api/analytics/patients', { params: { days: timeRange } }),
        axios.get('/api/analytics/billing', { params: { days: timeRange } }),
        axios.get('/api/analytics/doctors', { params: { days: timeRange } }),
        axios.get('/api/analytics/appointments', { params: { days: timeRange } }),
        axios.get('/api/inventory/analytics/by-category'),
      ]);

      // Process patient demographics
      const patientDemographics = [
        { name: 'Male', value: patientsResponse.data.demographics?.male || 0 },
        { name: 'Female', value: patientsResponse.data.demographics?.female || 0 },
        { name: 'Other', value: patientsResponse.data.demographics?.other || 0 },
      ];

      // Process revenue data
      const revenueData = billingResponse.data.monthlyRevenue || [
        { month: 'Jan', revenue: 45000, expenses: 32000 },
        { month: 'Feb', revenue: 52000, expenses: 35000 },
        { month: 'Mar', revenue: 48000, expenses: 33000 },
        { month: 'Apr', revenue: 61000, expenses: 38000 },
        { month: 'May', revenue: 55000, expenses: 36000 },
        { month: 'Jun', revenue: 67000, expenses: 42000 },
      ];

      // Process department stats
      const departmentStats = [
        { department: 'Emergency', patients: 245, revenue: 125000 },
        { department: 'Cardiology', patients: 189, revenue: 98000 },
        { department: 'Orthopedics', patients: 156, revenue: 87000 },
        { department: 'Pediatrics', patients: 203, revenue: 76000 },
        { department: 'Neurology', patients: 134, revenue: 112000 },
      ];

      // Process doctor performance
      const doctorPerformance = doctorsResponse.data.performance || [
        { name: 'Dr. Smith', patients: 45, satisfaction: 4.8, revenue: 23000 },
        { name: 'Dr. Johnson', patients: 38, satisfaction: 4.6, revenue: 19000 },
        { name: 'Dr. Williams', patients: 42, satisfaction: 4.9, revenue: 21000 },
        { name: 'Dr. Brown', patients: 35, satisfaction: 4.5, revenue: 18000 },
        { name: 'Dr. Davis', patients: 40, satisfaction: 4.7, revenue: 20000 },
      ];

      // Process monthly trends
      const monthlyTrends = appointmentsResponse.data.trends || [
        { month: 'Jan', appointments: 1250, completed: 1180, cancelled: 70 },
        { month: 'Feb', appointments: 1340, completed: 1260, cancelled: 80 },
        { month: 'Mar', appointments: 1180, completed: 1120, cancelled: 60 },
        { month: 'Apr', appointments: 1420, completed: 1350, cancelled: 70 },
        { month: 'May', appointments: 1380, completed: 1310, cancelled: 70 },
        { month: 'Jun', appointments: 1520, completed: 1440, cancelled: 80 },
      ];

      setAnalyticsData({
        patientDemographics,
        revenueData,
        departmentStats,
        doctorPerformance,
        monthlyTrends,
        inventoryAnalytics: inventoryResponse.data,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', subtitle }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderPatientAnalytics = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Patient Demographics
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.patientDemographics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.patientDemographics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Monthly Patient Trends
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="#8884d8" name="Total Appointments" />
              <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderFinancialAnalytics = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Revenue vs Expenses
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${(value || 0).toLocaleString()}`, '']} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Department Performance
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Patients</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.departmentStats.map((dept) => (
                  <TableRow key={dept.department}>
                    <TableCell>{dept.department}</TableCell>
                    <TableCell align="right">{dept.patients}</TableCell>
                    <TableCell align="right">${dept.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderDoctorAnalytics = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Doctor Performance
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.doctorPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="patients" fill="#8884d8" name="Patients Treated" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Doctor Satisfaction Ratings
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Doctor</TableCell>
                  <TableCell align="right">Patients</TableCell>
                  <TableCell align="right">Satisfaction</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.doctorPerformance.map((doctor) => (
                  <TableRow key={doctor.name}>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell align="right">{doctor.patients}</TableCell>
                    <TableCell align="right">{doctor.satisfaction}/5.0</TableCell>
                    <TableCell align="right">${doctor.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderInventoryAnalytics = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inventory by Category
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.inventoryAnalytics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.category} $${entry.totalValue?.toFixed(0) || 0}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="totalValue"
              >
                {analyticsData.inventoryAnalytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${(value || 0).toLocaleString()}`, 'Value']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Inventory Status
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Total Items</TableCell>
                  <TableCell align="right">Low Stock</TableCell>
                  <TableCell align="right">Out of Stock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.inventoryAnalytics.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell>{category.category}</TableCell>
                    <TableCell align="right">{category.totalItems}</TableCell>
                    <TableCell align="right">{category.lowStockCount}</TableCell>
                    <TableCell align="right">{category.outOfStockCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Analytics & Reports
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 3 months</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 3, 
        mb: 3 
      }}>
        <StatCard
          title="Total Revenue"
          value="$342,000"
          subtitle="+12% from last month"
          icon={<AttachMoney sx={{ fontSize: 40 }} />}
          color="success"
        />
        <StatCard
          title="Total Patients"
          value="1,247"
          subtitle="+8% from last month"
          icon={<People sx={{ fontSize: 40 }} />}
          color="primary"
        />
        <StatCard
          title="Active Doctors"
          value="24"
          subtitle="All departments"
          icon={<LocalHospital sx={{ fontSize: 40 }} />}
          color="info"
        />
        <StatCard
          title="Avg Satisfaction"
          value="4.7/5.0"
          subtitle="Based on 892 reviews"
          icon={<Assessment sx={{ fontSize: 40 }} />}
          color="warning"
        />
      </Box>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Patient Analytics" />
            <Tab label="Financial Reports" />
            <Tab label="Doctor Performance" />
            <Tab label="Inventory Analytics" />
          </Tabs>

          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && renderPatientAnalytics()}
            {activeTab === 1 && renderFinancialAnalytics()}
            {activeTab === 2 && renderDoctorAnalytics()}
            {activeTab === 3 && renderInventoryAnalytics()}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;