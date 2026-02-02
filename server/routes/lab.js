const express = require('express');
const LabTest = require('../models/LabTest');
const aiService = require('../services/aiService');
const router = express.Router();

// Get all lab tests
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientId, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    if (date) {
      const filterDate = new Date(date);
      query['dates.ordered'] = {
        $gte: new Date(filterDate.setHours(0, 0, 0, 0)),
        $lt: new Date(filterDate.setHours(23, 59, 59, 999))
      };
    }

    const labTests = await LabTest.find(query)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId')
      .populate('doctorId', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'dates.ordered': -1 });

    const total = await LabTest.countDocuments(query);

    res.json({
      labTests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get lab tests error:', error);
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
});

// Get lab test by ID
router.get('/:id', async (req, res) => {
  try {
    const labTest = await LabTest.findById(req.params.id)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId')
      .populate('doctorId', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization');
    
    if (!labTest) {
      return res.status(404).json({ error: 'Lab test not found' });
    }

    res.json(labTest);
  } catch (error) {
    console.error('Get lab test error:', error);
    res.status(500).json({ error: 'Failed to fetch lab test' });
  }
});

// Create new lab test
router.post('/', async (req, res) => {
  try {
    const labTest = new LabTest(req.body);
    await labTest.save();

    // Populate the created test
    await labTest.populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId');
    await labTest.populate('doctorId', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization');

    // Emit real-time update
    req.app.get('io').emit('lab-test-created', labTest);

    res.status(201).json(labTest);
  } catch (error) {
    console.error('Create lab test error:', error);
    res.status(500).json({ error: 'Failed to create lab test' });
  }
});

// Update lab test status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const labTest = await LabTest.findById(req.params.id);

    if (!labTest) {
      return res.status(404).json({ error: 'Lab test not found' });
    }

    labTest.status = status;

    // Update relevant dates based on status
    switch (status) {
      case 'Sample Collected':
        labTest.dates.sampleCollected = new Date();
        break;
      case 'Completed':
        labTest.dates.completed = new Date();
        break;
    }

    await labTest.save();

    // Emit real-time update
    req.app.get('io').emit('lab-test-status-updated', {
      testId: labTest._id,
      status,
      dates: labTest.dates
    });

    res.json(labTest);
  } catch (error) {
    console.error('Update lab test status error:', error);
    res.status(500).json({ error: 'Failed to update lab test status' });
  }
});

// Add lab results
router.put('/:id/results', async (req, res) => {
  try {
    const labTest = await LabTest.findById(req.params.id);

    if (!labTest) {
      return res.status(404).json({ error: 'Lab test not found' });
    }

    labTest.results = req.body;
    labTest.status = 'Completed';
    labTest.dates.completed = new Date();
    labTest.dates.reportGenerated = new Date();

    // Generate AI summary for faster clinical decisions
    if (labTest.results.values && labTest.results.values.length > 0) {
      try {
        const aiSummary = await aiService.generateLabReportSummary(labTest.results.values);
        labTest.results.aiSummary = aiSummary.summary;
        labTest.results.recommendations = aiSummary.recommendations;
      } catch (aiError) {
        console.error('AI summary generation failed:', aiError);
        // Continue without AI summary
      }
    }

    await labTest.save();

    // Emit real-time update
    req.app.get('io').emit('lab-results-added', {
      testId: labTest._id,
      results: labTest.results,
      status: labTest.status
    });

    res.json(labTest);
  } catch (error) {
    console.error('Add lab results error:', error);
    res.status(500).json({ error: 'Failed to add lab results' });
  }
});

// Get pending tests
router.get('/status/pending', async (req, res) => {
  try {
    const pendingTests = await LabTest.find({
      status: { $in: ['Ordered', 'Sample Collected', 'In Progress'] }
    })
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId')
      .populate('doctorId', 'personalInfo.firstName personalInfo.lastName')
      .sort({ 'dates.ordered': 1 });

    res.json(pendingTests);
  } catch (error) {
    console.error('Get pending tests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending tests' });
  }
});

// Get lab statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const stats = await Promise.all([
      LabTest.countDocuments({ 'dates.ordered': { $gte: startOfDay, $lte: endOfDay } }),
      LabTest.countDocuments({ status: 'Ordered' }),
      LabTest.countDocuments({ status: 'In Progress' }),
      LabTest.countDocuments({ status: 'Completed', 'dates.completed': { $gte: startOfDay, $lte: endOfDay } }),
      LabTest.countDocuments({ status: 'Sample Collected' })
    ]);

    res.json({
      todayOrdered: stats[0],
      pending: stats[1],
      inProgress: stats[2],
      todayCompleted: stats[3],
      sampleCollected: stats[4]
    });
  } catch (error) {
    console.error('Get lab stats error:', error);
    res.status(500).json({ error: 'Failed to fetch lab statistics' });
  }
});

// Quality control verification
router.put('/:id/verify', async (req, res) => {
  try {
    const { verifiedBy, notes } = req.body;
    const labTest = await LabTest.findById(req.params.id);

    if (!labTest) {
      return res.status(404).json({ error: 'Lab test not found' });
    }

    labTest.qualityControl = {
      verified: true,
      verifiedBy,
      verificationDate: new Date(),
      notes
    };

    await labTest.save();

    // Emit real-time update
    req.app.get('io').emit('lab-test-verified', {
      testId: labTest._id,
      verifiedBy,
      verificationDate: labTest.qualityControl.verificationDate
    });

    res.json(labTest);
  } catch (error) {
    console.error('Verify lab test error:', error);
    res.status(500).json({ error: 'Failed to verify lab test' });
  }
});

module.exports = router;