const express = require('express');
const router = express.Router();
const LabReport = require('../models/LabTest');
const Patient = require('../models/Patient');
 // Add this after your imports (line 6)
router.param('patientId', (req, res, next, id) => {
  if (!id || id === 'undefined') return res.status(400).json({error: 'Valid patient ID required'});
  req.patientId = id;
  next();
});

router.get('/', async (req, res) => {
  try {
    const { status, patientId, testCategory, startDate, endDate } = req.query;
    let query = {};

    // Filter by patient
    if (patientId) {
      query.patientId = patientId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by test category
    if (testCategory) {
      query.testCategory = testCategory;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.testDate = {};
      if (startDate) query.testDate.$gte = new Date(startDate);
      if (endDate) query.testDate.$lte = new Date(endDate);
    }

    const labReports = await LabReport.find(query)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName personalInfo.gender medicalInfo.bloodGroup')
      .sort({ testDate: -1 });

    res.json(labReports);
  } catch (error) {
    console.error('Error fetching lab reports:', error);
    res.status(500).json({ error: 'Failed to fetch lab reports' });
  }
});

// Get lab reports for a specific patient
// WRONG (missing closing brace)
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId || patientId === 'undefined') {
      return res.status(400).json({ error: 'Patient ID required' });
    }
    const labReports = await LabReport.find({ patientId });
    await LabReport.populate(labReports, { path: 'patientId', select: 'personalInfo medicalInfo' });
    res.json(labReports);
  } catch (error) {  // ✅ ADD CLOSING BRACE
    console.error('Error fetching patient labs:', error);
    res.status(500).json({ error: 'Failed to fetch lab reports' });
  }
});


// Get recent abnormal lab reports
router.get('/abnormal/recent', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const abnormalReports = await LabReport.findRecentAbnormal(days);
    res.json(abnormalReports);
  } catch (error) {
    console.error('Error fetching abnormal reports:', error);
    res.status(500).json({ error: 'Failed to fetch abnormal reports' });
  }
});

// Get critical lab reports
router.get('/critical', async (req, res) => {
  try {
    const criticalReports = await LabReport.findCritical();
    res.json(criticalReports);
  } catch (error) {
    console.error('Error fetching critical reports:', error);
    res.status(500).json({ error: 'Failed to fetch critical reports' });
  }
});

// Get lab report statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalReports = await LabReport.countDocuments();
    
    const statusDistribution = await LabReport.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryDistribution = await LabReport.aggregate([
      {
        $group: {
          _id: '$testCategory',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentReports = await LabReport.countDocuments({
      testDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      totalReports,
      statusDistribution,
      categoryDistribution,
      recentReports
    });
  } catch (error) {
    console.error('Error fetching lab statistics:', error);
    res.status(500).json({ error: 'Failed to fetch lab statistics' });
  }
});

// Get single lab report by ID
router.get('/:id', async (req, res) => {
  try {
    // const labReport = await LabReport.findById(req.params.id)
    if (!req.params.id || req.params.id === 'undefined') return res.status(400).json({error: 'ID required'});
    const labReport = await LabReport.findById(req.params.id)
      .populate('patientId', 'personalInfo medicalInfo riskAssessment');
 
    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

    res.json(labReport);
  } catch (error) {
    console.error('Error fetching lab report:', error);
    res.status(500).json({ error: 'Failed to fetch lab report' });
  }
});

// Create new lab report
router.post('/', async (req, res) => {
  try {
    const labData = req.body;

    // Validate required fields
    if (!labData.patientId || !labData.testType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['patientId', 'testType']
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(labData.patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Create lab report
    const labReport = new LabReport({
      ...labData,
      testDate: labData.testDate || new Date()
    });

    await labReport.save();

    // Risk assessment will be automatically updated via middleware

    // Populate patient data before returning
    await labReport.populate('patientId', 'personalInfo.firstName personalInfo.lastName');

    res.status(201).json(labReport);
  } catch (error) {
    console.error('Error creating lab report:', error);
    res.status(500).json({ 
      error: 'Failed to create lab report',
      details: error.message 
    });
  }
});

// Update lab report
router.put('/:id', async (req, res) => {
  try {
    const labReport = await LabReport.findById(req.params.id);
    
    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

    // Update fields
    Object.assign(labReport, req.body);
    labReport.updatedAt = new Date();

    await labReport.save();

    // Risk assessment will be automatically updated via middleware

    await labReport.populate('patientId', 'personalInfo.firstName personalInfo.lastName');

    res.json(labReport);
  } catch (error) {
    console.error('Error updating lab report:', error);
    res.status(500).json({ 
      error: 'Failed to update lab report',
      details: error.message 
    });
  }
});

// Update lab report status only
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['Normal', 'Abnormal', 'Critical', 'Pending'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses: ['Normal', 'Abnormal', 'Critical', 'Pending']
      });
    }

    const labReport = await LabReport.findById(req.params.id);
    
    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

    labReport.status = status;
    labReport.updatedAt = new Date();

    await labReport.save();

    // Risk assessment will be automatically updated via middleware

    res.json(labReport);
  } catch (error) {
    console.error('Error updating lab report status:', error);
    res.status(500).json({ 
      error: 'Failed to update lab report status',
      details: error.message 
    });
  }
});

// Delete lab report
router.delete('/:id', async (req, res) => {
  try {
    const labReport = await LabReport.findByIdAndDelete(req.params.id);
    
    if (!labReport) {
      return res.status(404).json({ error: 'Lab report not found' });
    }

    // Risk assessment will be automatically updated via middleware

    res.json({ message: 'Lab report deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab report:', error);
    res.status(500).json({ error: 'Failed to delete lab report' });
  }
});

// Bulk delete lab reports
router.post('/bulk-delete', async (req, res) => {
  try {
    const { reportIds } = req.body;

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty reportIds array' });
    }

    // Get unique patient IDs before deletion
    const reports = await LabReport.find({ _id: { $in: reportIds } });
    const patientIds = [...new Set(reports.map(r => r.patientId.toString()))];

    // Delete reports
    const result = await LabReport.deleteMany({ _id: { $in: reportIds } });

    // Update risk for affected patients
    for (const patientId of patientIds) {
      const patient = await Patient.findById(patientId);
      if (patient) {
        await patient.updateRiskAssessment();
      }
    }

    res.json({ 
      message: 'Lab reports deleted successfully',
      deletedCount: result.deletedCount,
      affectedPatients: patientIds.length
    });
  } catch (error) {
    console.error('Error bulk deleting lab reports:', error);
    res.status(500).json({ error: 'Failed to bulk delete lab reports' });
  }
});

module.exports = router;