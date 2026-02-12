const express = require('express');
const Emergency = require('../models/Emergency');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const router = express.Router();

// Get all emergency cases
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', triageLevel = '', search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    let query = {};
    if (status) query.status = status;
    if (triageLevel) query.triageLevel = triageLevel;
    if (search) {
      query.$or = [
        { emergencyId: { $regex: search, $options: 'i' } },
        { chiefComplaint: { $regex: search, $options: 'i' } }
      ];
    }

    const [emergencies, total] = await Promise.all([
      Emergency.find(query)
        .populate({
          path: 'patientId',
          select: 'patientId personalInfo.firstName personalInfo.lastName personalInfo.phoneNumber personalInfo.gender personalInfo.dateOfBirth'
        })
        .populate('assignedDoctor', 'firstName lastName specialization')
        .skip(skip)
        .limit(Number(limit))
        .sort({ arrivalTime: -1 }),
      Emergency.countDocuments(query)
    ]);

    // ✅ SAFE TRANSFORM - Prevents frontend crashes
    const safeEmergencies = emergencies.map(emergency => ({
      ...emergency.toObject(),
      patientName: emergency.patientName || 'Unknown Patient',
      patientInitials: emergency.patientId?.personalInfo 
        ? `${emergency.patientId.personalInfo.firstName?.[0] || ''}${emergency.patientId.personalInfo.lastName?.[0] || ''}`.toUpperCase()
        : '??',
      patientPhone: emergency.patientId?.personalInfo?.phoneNumber || 'N/A',
      patientGender: emergency.patientId?.personalInfo?.gender || 'N/A',
      patientAge: emergency.patientId?.personalInfo?.dateOfBirth ? new Date().getFullYear() - new Date(emergency.patientId.personalInfo.dateOfBirth).getFullYear() : 'N/A'
    }));

    res.json({
      emergencies: safeEmergencies,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('Get emergencies error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency cases' });
  }
});

// Get emergency case by ID
router.get('/:id', async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('patientId')
      .populate('assignedDoctor')
      .populate('labTests.testId');
      
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }
    
    res.json(emergency);
  } catch (error) {
    console.error('Get emergency error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency case' });
  }
});

// Create new emergency case
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    if (!req.body.chiefComplaint) {
      return res.status(400).json({ error: 'Chief complaint is required' });
    }

    // Verify patient exists
    const patient = await Patient.findById(req.body.patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found with this ID' });
    }

    const newEmergency = new Emergency(req.body);
    await newEmergency.save();
    
    const populatedEmergency = await Emergency.findById(newEmergency._id)
      .populate('patientId', 'firstName lastName dateOfBirth gender phone')
      .populate('assignedDoctor', 'firstName lastName specialization');

    // Emit real-time update (if Socket.IO is configured)
    if (req.app.get('io')) {
      req.app.get('io').emit('emergency-case-created', populatedEmergency);
    }

    res.status(201).json(populatedEmergency);
  } catch (error) {
    console.error('Create emergency error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    
    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid patient ID format. Please select a valid patient.' });
    }
    
    res.status(500).json({ error: 'Failed to create emergency case. Please try again.' });
  }
});

// Update emergency case
router.put('/:id', async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patientId', 'firstName lastName dateOfBirth gender phone')
     .populate('assignedDoctor', 'firstName lastName specialization');

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('emergency-case-updated', emergency);
    }

    res.json(emergency);
  } catch (error) {
    console.error('Update emergency error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update emergency case' });
  }
});

// Add treatment note
router.post('/:id/notes', async (req, res) => {
  try {
    const { note, provider } = req.body;
    
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }
    
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    emergency.treatmentNotes.push({
      note,
      provider: provider || 'Staff',
      timestamp: new Date()
    });

    await emergency.save();

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('emergency-note-added', {
        emergencyId: emergency._id,
        note: emergency.treatmentNotes[emergency.treatmentNotes.length - 1]
      });
    }

    res.json(emergency);
  } catch (error) {
    console.error('Add treatment note error:', error);
    res.status(500).json({ error: 'Failed to add treatment note' });
  }
});

// Update vital signs
router.put('/:id/vitals', async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { vitalSigns: req.body },
      { new: true, runValidators: true }
    );

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('emergency-vitals-updated', {
        emergencyId: emergency._id,
        vitalSigns: emergency.vitalSigns
      });
    }

    res.json(emergency);
  } catch (error) {
    console.error('Update vitals error:', error);
    res.status(500).json({ error: 'Failed to update vital signs' });
  }
});

// Assign doctor
router.put('/:id/assign-doctor', async (req, res) => {
  try {
    const { doctorId } = req.body;
    
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    // Verify doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { assignedDoctor: doctorId },
      { new: true, runValidators: true }
    ).populate('assignedDoctor', 'firstName lastName specialization');

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('emergency-doctor-assigned', {
        emergencyId: emergency._id,
        doctor: emergency.assignedDoctor
      });
    }

    res.json(emergency);
  } catch (error) {
    console.error('Assign doctor error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    
    res.status(500).json({ error: 'Failed to assign doctor' });
  }
});

// Update triage level
router.put('/:id/triage', async (req, res) => {
  try {
    const { triageLevel } = req.body;
    
    if (!triageLevel) {
      return res.status(400).json({ error: 'Triage level is required' });
    }

    const validLevels = ['Critical', 'High', 'Medium', 'Low'];
    if (!validLevels.includes(triageLevel)) {
      return res.status(400).json({ error: 'Invalid triage level' });
    }
    
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { triageLevel },
      { new: true, runValidators: true }
    );

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('emergency-triage-updated', {
        emergencyId: emergency._id,
        triageLevel: emergency.triageLevel
      });
    }

    res.json(emergency);
  } catch (error) {
    console.error('Update triage error:', error);
    res.status(500).json({ error: 'Failed to update triage level' });
  }
});

// Get emergency statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalCases = await Emergency.countDocuments();
    const activeCases = await Emergency.countDocuments({ 
      status: { $in: ['Waiting', 'In Progress', 'Under Treatment'] }
    });
    
    const criticalCases = await Emergency.countDocuments({ 
      triageLevel: 'Critical',
      status: { $in: ['Waiting', 'In Progress', 'Under Treatment'] }
    });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayCases = await Emergency.countDocuments({
      arrivalTime: { $gte: todayStart, $lte: todayEnd }
    });

    // Average waiting time (in minutes)
    const waitingCases = await Emergency.find({
      status: 'Waiting'
    });
    
    const avgWaitingTime = waitingCases.length > 0 
      ? waitingCases.reduce((sum, case_) => {
          const waitTime = (new Date() - case_.arrivalTime) / (1000 * 60);
          return sum + waitTime;
        }, 0) / waitingCases.length
      : 0;

    res.json({
      totalCases,
      activeCases,
      criticalCases,
      todayCases,
      avgWaitingTime: Math.round(avgWaitingTime)
    });
  } catch (error) {
    console.error('Get emergency stats error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency statistics' });
  }
});

// Get triage distribution
router.get('/analytics/triage-distribution', async (req, res) => {
  try {
    const distribution = await Emergency.aggregate([
      {
        $group: {
          _id: '$triageLevel',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Waiting', 'In Progress', 'Under Treatment']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          triageLevel: '$_id',
          count: 1,
          active: 1,
          _id: 0
        }
      }
    ]);

    res.json(distribution);
  } catch (error) {
    console.error('Get triage distribution error:', error);
    res.status(500).json({ error: 'Failed to fetch triage distribution' });
  }
});

// Get hourly arrival pattern
router.get('/analytics/arrival-pattern', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const pattern = await Emergency.aggregate([
      {
        $match: {
          arrivalTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$arrivalTime' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          hour: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { hour: 1 }
      }
    ]);

    res.json(pattern);
  } catch (error) {
    console.error('Get arrival pattern error:', error);
    res.status(500).json({ error: 'Failed to fetch arrival pattern' });
  }
});

// Delete emergency case (soft delete - change status)
router.delete('/:id', async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status: 'Discharged', dischargeTime: new Date() },
      { new: true }
    );

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency case not found' });
    }

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').emit('emergency-case-discharged', emergency);
    }

    res.json({ message: 'Emergency case discharged successfully' });
  } catch (error) {
    console.error('Discharge emergency error:', error);
    res.status(500).json({ error: 'Failed to discharge emergency case' });
  }
});

module.exports = router;