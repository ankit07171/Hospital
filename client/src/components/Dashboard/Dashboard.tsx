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
import axios from '../../api/axios';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingLabTests: number;
  totalRevenue: number;
  occupancyRate: number;
  emergencyCases: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  time: string;
  status: string;
}

interface ChartData {
  name: string;
  patients: number;
  revenue: number;
}

interface DepartmentData {
  name: string;
  value: number;
  color: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingLabTests: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    emergencyCases: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard analytics
      const [
        analyticsResponse,
        patientsResponse,
        appointmentsResponse,
        labResponse,
        emergencyResponse,
        billingResponse
      ] = await Promise.all([
        axios.get('/api/analytics/dashboard'),
        axios.get('/api/patients', { params: { limit: 5 } }),
        axios.get('/api/appointments', { params: { limit: 10 } }),
        axios.get('/api/lab', { params: { status: 'Pending', limit: 5 } }),
        axios.get('/api/emergency', { params: { limit: 5 } }),
        axios.get('/api/billing', { params: { limit: 5 } })
      ]);

      // Update stats
      const analytics = analyticsResponse.data;
      setStats({
        totalPatients: analytics.patients?.total || 0,
        todayAppointments: analytics.appointments?.today || 0,
        pendingLabTests: analytics.lab?.pendingTests || 0,
        totalRevenue: analytics.revenue?.thisMonth || 0,
        occupancyRate: analytics.occupancy?.rate || 0,
        emergencyCases: analytics.emergency?.activeCases || 0,
      });

      // Update recent activities
      const recentActivities: Activity[] = [];
      
      // Add patient activities
      patientsResponse.data.patients?.slice(0, 2).forEach((patient: any, index: number) => {
        recentActivities.push({
          id: `patient-${patient._id}`,
          type: 'patient',
          message: `New patient registered: ${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
          time: getRelativeTime(patient.createdAt),
          status: 'success'
        });
      });

      // Add lab activities
      labResponse.data.tests?.slice(0, 2).forEach((test: any) => {
        recentActivities.push({
          id: `lab-${test._id}`,
          type: 'lab',
          message: `Lab test ${test.status.toLowerCase()}: ${test.testDetails.name}`,
          time: getRelativeTime(test.dates.ordered),
          status: 'info'
        });
      });

      // Add emergency activities
      emergencyResponse.data.emergencies?.slice(0, 1).forEach((emergency: any) => {
        recentActivities.push({
          id: `emergency-${emergency._id}`,
          type: 'emergency',
          message: `Emergency case: ${emergency.chiefComplaint}`,
          time: getRelativeTime(emergency.arrivalTime),
          status: emergency.triageLevel === 'Critical' ? 'error' : 'warning'
        });
      });

      setActivities(recentActivities.slice(0, 4));

      // Update chart data (last 6 months)
      const chartData = [
        { name: 'Jan', patients: analytics.trends?.jan?.patients || 400, revenue: analytics.trends?.jan?.revenue || 24000 },
        { name: 'Feb', patients: analytics.trends?.feb?.patients || 300, revenue: analytics.trends?.feb?.revenue || 18000 },
        { name: 'Mar', patients: analytics.trends?.mar?.patients || 500, revenue: analytics.trends?.mar?.revenue || 32000 },
        { name: 'Apr', patients: analytics.trends?.apr?.patients || 450, revenue: analytics.trends?.apr?.revenue || 28000 },
        { name: 'May', patients: analytics.trends?.may?.patients || 600, revenue: analytics.trends?.may?.revenue || 35000 },
        { name: 'Jun', patients: analytics.trends?.jun?.patients || 550, revenue: analytics.trends?.jun?.revenue || 31000 },
      ];
      setChartData(chartData);

      // Update department data
      const departmentData = [
        { name: 'OPD', value: analytics.departments?.opd || 45, color: '#1976d2' },
        { name: 'IPD', value: analytics.departments?.ipd || 25, color: '#dc004e' },
        { name: 'Emergency', value: analytics.departments?.emergency || 15, color: '#ff9800' },
        { name: 'Lab', value: analytics.departments?.lab || 10, color: '#4caf50' },
        { name: 'Pharmacy', value: analytics.departments?.pharmacy || 5, color: '#9c27b0' },
      ];
      setDepartmentData(departmentData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

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
                <LineChart data={chartData}>
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
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {departmentData.map((item) => (
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