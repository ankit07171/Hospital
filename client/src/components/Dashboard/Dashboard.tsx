import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  People,
  LocalHospital,
  Science,
  Receipt,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Schedule,
  Emergency,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data
const mockStats = {
  totalPatients: 1247,
  todayAppointments: 23,
  pendingLabTests: 15,
  totalRevenue: 125000,
  occupancyRate: 78,
  emergencyCases: 3,
};

const mockRecentActivities = [
  {
    id: 1,
    type: 'patient',
    message: 'New patient registered: John Doe',
    time: '5 minutes ago',
    status: 'success',
  },
  {
    id: 2,
    type: 'lab',
    message: 'Lab report ready for PAT001234',
    time: '12 minutes ago',
    status: 'info',
  },
  {
    id: 3,
    type: 'emergency',
    message: 'Emergency case admitted to ICU',
    time: '25 minutes ago',
    status: 'warning',
  },
  {
    id: 4,
    type: 'billing',
    message: 'Payment received: ₹15,000',
    time: '1 hour ago',
    status: 'success',
  },
];

const mockChartData = [
  { name: 'Jan', patients: 400, revenue: 24000 },
  { name: 'Feb', patients: 300, revenue: 18000 },
  { name: 'Mar', patients: 500, revenue: 32000 },
  { name: 'Apr', patients: 450, revenue: 28000 },
  { name: 'May', patients: 600, revenue: 35000 },
  { name: 'Jun', patients: 550, revenue: 31000 },
];

const mockDepartmentData = [
  { name: 'OPD', value: 45, color: '#1976d2' },
  { name: 'IPD', value: 25, color: '#dc004e' },
  { name: 'Emergency', value: 15, color: '#ff9800' },
  { name: 'Lab', value: 10, color: '#4caf50' },
  { name: 'Pharmacy', value: 5, color: '#9c27b0' },
];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState(mockStats);
  const [activities, setActivities] = useState(mockRecentActivities);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        todayAppointments: prev.todayAppointments + Math.floor(Math.random() * 2),
        totalRevenue: prev.totalRevenue + Math.floor(Math.random() * 1000),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card sx={{ height: '100%', minHeight: 120 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{ color: trend > 0 ? 'success.main' : 'error.main' }}
                >
                  {Math.abs(trend)}% from last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'patient': return <People />;
      case 'lab': return <Science />;
      case 'emergency': return <Emergency />;
      case 'billing': return <Receipt />;
      default: return <CheckCircle />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'success.main';
      case 'warning': return 'warning.main';
      case 'error': return 'error.main';
      default: return 'info.main';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Hospital Dashboard
      </Typography>

      {/* Stats Cards - Using CSS Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 2, 
        mb: 3 
      }}>
        <StatCard
          title="Total Patients"
          value={stats.totalPatients.toLocaleString()}
          icon={<People />}
          color="primary.main"
          trend={12}
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={<Schedule />}
          color="info.main"
          trend={8}
        />
        <StatCard
          title="Pending Lab Tests"
          value={stats.pendingLabTests}
          icon={<Science />}
          color="warning.main"
          trend={-5}
        />
        <StatCard
          title="Revenue (₹)"
          value={`₹${(stats.totalRevenue / 1000).toFixed(0)}K`}
          icon={<Receipt />}
          color="success.main"
          trend={15}
        />
        <StatCard
          title="Bed Occupancy"
          value={`${stats.occupancyRate}%`}
          icon={<LocalHospital />}
          color="secondary.main"
          trend={3}
        />
        <StatCard
          title="Emergency Cases"
          value={stats.emergencyCases}
          icon={<Emergency />}
          color="error.main"
          trend={-20}
        />
      </Box>

      {/* Charts and Activities - Using Flexbox */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Patient & Revenue Trends */}
        <Box sx={{ flex: '2 1 500px', minWidth: 500 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient & Revenue Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="patients"
                    stroke="#1976d2"
                    strokeWidth={3}
                    name="Patients"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#dc004e"
                    strokeWidth={3}
                    name="Revenue (₹)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Department Distribution */}
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockDepartmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockDepartmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {mockDepartmentData.map((item) => (
                  <Chip
                    key={item.name}
                    label={`${item.name}: ${item.value}%`}
                    sx={{
                      m: 0.5,
                      bgcolor: item.color,
                      color: 'white',
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Bottom Section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
        {/* Recent Activities */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {activities.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getActivityColor(activity.status) }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.message}
                      secondary={activity.time}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* System Health */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Server Performance</Typography>
                  <Typography variant="body2">92%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={92} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Database Health</Typography>
                  <Typography variant="body2">88%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={88} sx={{ height: 8, borderRadius: 4 }} />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Network Status</Typography>
                  <Typography variant="body2">95%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={95} sx={{ height: 8, borderRadius: 4 }} />
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Chip
                  icon={<CheckCircle />}
                  label="All Systems Operational"
                  color="success"
                  size="small"
                />
                <Chip
                  icon={<Warning />}
                  label="1 Minor Alert"
                  color="warning"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;