const express = require('express');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const LabReport = require('../models/LabTest');
const Billing = require('../models/Billing');
const { Prescription } = require('../models/Pharmacy');
const router = express.Router();

// Dashboard overview analytics
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const analytics = await Promise.all([
      // Patient analytics
      Patient.countDocuments({ status: 'Active' }),
      Patient.countDocuments({ createdAt: { $gte: startOfMonth } }),
      
      // Doctor analytics
      Doctor.countDocuments({ status: 'Active' }),
      
      // Lab analytics
      LabReport.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      LabReport.countDocuments({ status: { $in: ['Ordered', 'Sample Collected', 'In Progress'] } }),
      
      // Revenue analytics
      Billing.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, totalRevenue: { $sum: '$summary.totalAmount' } } }
      ]),
      Billing.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, totalRevenue: { $sum: '$summary.totalAmount' } } }
      ]),
      
      // Prescription analytics
      Prescription.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Prescription.countDocuments({ status: 'Pending' })
    ]);

    // Get emergency cases count
    const Emergency = require('../models/Emergency');
    const emergencyCases = await Emergency.countDocuments({ 
      status: { $in: ['Waiting', 'In Progress', 'Under Treatment'] }
    });

    // Calculate monthly trends from actual data (last 6 months)
    const monthlyTrends = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const monthStart = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - (5 - i) + 1, 0, 23, 59, 59);
        const monthName = monthStart.toLocaleString('en-US', { month: 'short' }).toLowerCase();
        
        return Promise.all([
          Patient.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
          Billing.aggregate([
            { $match: { createdAt: { $gte: monthStart, $lte: monthEnd } } },
            { $group: { _id: null, totalRevenue: { $sum: '$summary.totalAmount' } } }
          ])
        ]).then(([patients, revenue]) => ({
          month: monthName,
          patients,
          revenue: revenue[0]?.totalRevenue || 0
        }));
      })
    );

    // Convert monthly trends to object format
    const trendsObject = monthlyTrends.reduce((acc, trend) => {
      acc[trend.month] = { patients: trend.patients, revenue: trend.revenue };
      return acc;
    }, {});

    res.json({
      patients: {
        total: analytics[0],
        newThisMonth: analytics[1]
      },
      doctors: {
        total: analytics[2]
      },
      appointments: {
        today: analytics[3]
      },
      lab: {
        todayTests: analytics[3],
        pendingTests: analytics[4]
      },
      revenue: {
        today: analytics[5][0]?.totalRevenue || 0,
        thisMonth: analytics[6][0]?.totalRevenue || 0
      },
      pharmacy: {
        todayPrescriptions: analytics[7],
        pendingPrescriptions: analytics[8]
      },
      emergency: {
        activeCases: emergencyCases
      },
      occupancy: {
        rate: 78 // Mock data - would need bed management system
      },
      departments: {
        opd: 45,
        ipd: 25,
        emergency: emergencyCases,
        lab: analytics[4],
        pharmacy: analytics[8]
      },
      trends: trendsObject
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Patient demographics analytics
router.get('/patients/demographics', async (req, res) => {
  try {
    const demographics = await Promise.all([
      // Age distribution
      Patient.aggregate([
        {
          $addFields: {
            age: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$personalInfo.dateOfBirth'] },
                  365.25 * 24 * 60 * 60 * 1000
                ]
              }
            }
          }
        },
        {
          $bucket: {
            groupBy: '$age',
            boundaries: [0, 18, 30, 45, 60, 75, 100],
            default: 'Other',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]),
      
      // Gender distribution
      Patient.aggregate([
        {
          $group: {
            _id: '$personalInfo.gender',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Blood group distribution
      Patient.aggregate([
        {
          $group: {
            _id: '$medicalInfo.bloodGroup',
            count: { $sum: 1 }
          }
        },
        { $match: { _id: { $ne: null } } }
      ])
    ]);

    res.json({
      ageDistribution: demographics[0],
      genderDistribution: demographics[1],
      bloodGroupDistribution: demographics[2]
    });
  } catch (error) {
    console.error('Patient demographics error:', error);
    res.status(500).json({ error: 'Failed to fetch patient demographics' });
  }
});

// Health score analytics
router.get('/patients/health-scores', async (req, res) => {
  try {
    const healthScoreAnalytics = await Patient.aggregate([
      {
        $bucket: {
          groupBy: '$healthScore.current',
          boundaries: [0, 25, 50, 75, 90, 100],
          default: 'Unknown',
          output: {
            count: { $sum: 1 },
            averageScore: { $avg: '$healthScore.current' }
          }
        }
      }
    ]);

    const riskFactorAnalytics = await Patient.aggregate([
      { $unwind: '$healthScore.riskFactors' },
      {
        $group: {
          _id: '$healthScore.riskFactors',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      healthScoreDistribution: healthScoreAnalytics,
      topRiskFactors: riskFactorAnalytics
    });
  } catch (error) {
    console.error('Health score analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch health score analytics' });
  }
});

// Department performance analytics
router.get('/departments/performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const departmentPerformance = await Promise.all([
      // Patient visits by department
      Patient.aggregate([
        { $unwind: '$visits' },
        { $match: dateFilter },
        {
          $group: {
            _id: '$visits.department',
            totalVisits: { $sum: 1 },
            uniquePatients: { $addToSet: '$_id' }
          }
        },
        {
          $addFields: {
            uniquePatientCount: { $size: '$uniquePatients' }
          }
        },
        { $project: { uniquePatients: 0 } },
        { $sort: { totalVisits: -1 } }
      ]),
      
      // Revenue by department
      Billing.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$billType',
            totalRevenue: { $sum: '$amounts.totalAmount' },
            totalBills: { $sum: 1 },
            averageBillAmount: { $avg: '$amounts.totalAmount' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ])
    ]);

    res.json({
      visitsByDepartment: departmentPerformance[0],
      revenueByDepartment: departmentPerformance[1]
    });
  } catch (error) {
    console.error('Department performance error:', error);
    res.status(500).json({ error: 'Failed to fetch department performance' });
  }
});

// Doctor performance analytics
router.get('/doctors/performance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter['consultations.date'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const doctorPerformance = await Doctor.aggregate([
      { $match: dateFilter },
      {
        $project: {
          doctorId: 1,
          'personalInfo.firstName': 1,
          'personalInfo.lastName': 1,
          'professionalInfo.specialization': 1,
          'professionalInfo.department': 1,
          totalConsultations: { $size: '$consultations' },
          'performance.patientSatisfaction': 1,
          'performance.averageConsultationTime': 1
        }
      },
      { $sort: { totalConsultations: -1 } },
      { $limit: 20 }
    ]);

    res.json(doctorPerformance);
  } catch (error) {
    console.error('Doctor performance error:', error);
    res.status(500).json({ error: 'Failed to fetch doctor performance' });
  }
});

// Lab test analytics
router.get('/lab/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter['dates.ordered'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const labAnalytics = await Promise.all([
      // Test volume by category
      LabReport.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$testDetails.category',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$testDetails.cost' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Test turnaround time
      LabReport.aggregate([
        {
          $match: {
            ...dateFilter,
            status: 'Completed',
            'dates.completed': { $exists: true }
          }
        },
        {
          $addFields: {
            turnaroundHours: {
              $divide: [
                { $subtract: ['$dates.completed', '$dates.ordered'] },
                1000 * 60 * 60
              ]
            }
          }
        },
        {
          $group: {
            _id: '$testDetails.category',
            averageTurnaroundHours: { $avg: '$turnaroundHours' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Abnormal results rate
      LabReport.aggregate([
        { $match: { ...dateFilter, status: 'Completed' } },
        { $unwind: '$results.values' },
        {
          $group: {
            _id: '$testDetails.category',
            totalParameters: { $sum: 1 },
            abnormalParameters: {
              $sum: {
                $cond: [
                  { $ne: ['$results.values.status', 'Normal'] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $addFields: {
            abnormalRate: {
              $multiply: [
                { $divide: ['$abnormalParameters', '$totalParameters'] },
                100
              ]
            }
          }
        }
      ])
    ]);

    res.json({
      testVolumeByCategory: labAnalytics[0],
      turnaroundTime: labAnalytics[1],
      abnormalResultsRate: labAnalytics[2]
    });
  } catch (error) {
    console.error('Lab analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch lab analytics' });
  }
});

// Financial analytics
router.get('/financial/overview', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let dateRange, groupBy;

    const now = new Date();
    
    if (period === 'daily') {
      dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupBy = {
        year: { $year: '$dates.billGenerated' },
        month: { $month: '$dates.billGenerated' },
        day: { $dayOfMonth: '$dates.billGenerated' }
      };
    } else if (period === 'weekly') {
      dateRange = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      groupBy = {
        year: { $year: '$dates.billGenerated' },
        week: { $week: '$dates.billGenerated' }
      };
    } else {
      dateRange = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      groupBy = {
        year: { $year: '$dates.billGenerated' },
        month: { $month: '$dates.billGenerated' }
      };
    }

    const financialData = await Promise.all([
      // Revenue trend
      Billing.aggregate([
        { $match: { 'dates.billGenerated': { $gte: dateRange } } },
        {
          $group: {
            _id: groupBy,
            totalRevenue: { $sum: '$amounts.totalAmount' },
            totalBills: { $sum: 1 },
            paidAmount: { $sum: '$amounts.paidAmount' },
            outstandingAmount: { $sum: '$amounts.balanceAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.day': 1 } }
      ]),
      
      // Payment method distribution
      Billing.aggregate([
        { $match: { 'dates.billGenerated': { $gte: dateRange } } },
        { $unwind: '$payments' },
        {
          $group: {
            _id: '$payments.method',
            totalAmount: { $sum: '$payments.amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Insurance claims analytics
      Billing.aggregate([
        { $match: { 'insurance.isInsured': true } },
        {
          $group: {
            _id: '$insurance.claimStatus',
            count: { $sum: 1 },
            totalClaimAmount: { $sum: '$insurance.claimAmount' },
            totalApprovedAmount: { $sum: '$insurance.approvedAmount' }
          }
        }
      ])
    ]);

    res.json({
      revenueTrend: financialData[0],
      paymentMethodDistribution: financialData[1],
      insuranceAnalytics: financialData[2]
    });
  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch financial analytics' });
  }
});

// Operational efficiency analytics
router.get('/operations/efficiency', async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const operationalData = await Promise.all([
      // Average patient wait time (mock data - would need appointment scheduling data)
      Promise.resolve({ averageWaitTime: 25, trend: -5 }),
      
      // Bed occupancy rate (mock data - would need bed management data)
      Promise.resolve({ occupancyRate: 78, availableBeds: 22, totalBeds: 100 }),
      
      // Staff utilization (based on consultations)
      Doctor.aggregate([
        {
          $project: {
            doctorId: 1,
            'personalInfo.firstName': 1,
            'personalInfo.lastName': 1,
            'professionalInfo.department': 1,
            weeklyConsultations: {
              $size: {
                $filter: {
                  input: '$consultations',
                  cond: { $gte: ['$$this.date', startOfWeek] }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: '$professionalInfo.department',
            averageConsultations: { $avg: '$weeklyConsultations' },
            totalDoctors: { $sum: 1 }
          }
        }
      ]),
      
      // Equipment utilization (mock data - would need equipment tracking)
      Promise.resolve([
        { equipment: 'MRI', utilizationRate: 85 },
        { equipment: 'CT Scan', utilizationRate: 92 },
        { equipment: 'X-Ray', utilizationRate: 67 }
        // { equipment: 'Ultrasound', utilizationRate: 78 }
      ])
    ]);

    res.json({
      patientWaitTime: operationalData[0],
      bedOccupancy: operationalData[1],
      staffUtilization: operationalData[2],
      equipmentUtilization: operationalData[3]
    });
  } catch (error) {
    console.error('Operational efficiency error:', error);
    res.status(500).json({ error: 'Failed to fetch operational efficiency data' });
  }
});

module.exports = router;

// Patient analytics endpoint
router.get('/patients', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - Number(days));

    const [totalPatients, genderDist, newPatients] = await Promise.all([
      Patient.countDocuments({ status: 'Active' }),
      Patient.aggregate([
        {
          $group: {
            _id: '$personalInfo.gender',
            count: { $sum: 1 }
          }
        }
      ]),
      Patient.countDocuments({ createdAt: { $gte: dateFilter } })
    ]);

    const demographics = {
      male: genderDist.find(g => g._id === 'Male')?.count || 0,
      female: genderDist.find(g => g._id === 'Female')?.count || 0,
      other: genderDist.find(g => g._id === 'Other')?.count || 0
    };

    res.json({
      total: totalPatients,
      newPatients,
      demographics
    });
  } catch (error) {
    console.error('Patient analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch patient analytics' });
  }
});

// Billing analytics endpoint
router.get('/billing', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - Number(days));

    const monthlyRevenue = await Billing.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$summary.totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({ monthlyRevenue });
  } catch (error) {
    console.error('Billing analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch billing analytics' });
  }
});

// Appointments analytics endpoint
router.get('/appointments', async (req, res) => {
  try {
    const trends = {
      jan: { patients: 400, revenue: 24000 },
      feb: { patients: 300, revenue: 18000 },
      mar: { patients: 500, revenue: 32000 },
      apr: { patients: 450, revenue: 28000 },
      may: { patients: 600, revenue: 35000 },
      jun: { patients: 550, revenue: 31000 }
    };

    res.json({ trends });
  } catch (error) {
    console.error('Appointments analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments analytics' });
  }
});
