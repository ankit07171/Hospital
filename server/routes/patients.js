const express = require('express');
const Patient = require('../models/Patient');
const aiService = require('../services/aiService');
const router = express.Router();

// Get all patients with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'Active' } = req.query;
    const query = { status };

    if (search) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { 'personalInfo.phoneNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await Patient.find(query)
      .populate('visits.doctor', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Patient.countDocuments(query);

    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('visits.doctor', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization');
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();

    // Generate initial health score
    const healthScoreData = await aiService.predictHealthScore({
      age: new Date().getFullYear() - new Date(patient.personalInfo.dateOfBirth).getFullYear(),
      chronicConditions: patient.medicalInfo.chronicConditions,
      lifestyle: req.body.lifestyle || {}
    });

    patient.healthScore.current = healthScoreData.score;
    patient.healthScore.riskFactors = healthScoreData.riskFactors;
    patient.healthScore.predictions = healthScoreData.predictions;
    await patient.save();

    // Emit real-time update
    req.app.get('io').emit('patient-created', patient);

    res.status(201).json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Recalculate health score if medical info changed
    if (req.body.medicalInfo) {
      const healthScoreData = await aiService.predictHealthScore({
        age: new Date().getFullYear() - new Date(patient.personalInfo.dateOfBirth).getFullYear(),
        chronicConditions: patient.medicalInfo.chronicConditions,
        lifestyle: req.body.lifestyle || {}
      });

      patient.healthScore.current = healthScoreData.score;
      patient.healthScore.riskFactors = healthScoreData.riskFactors;
      patient.healthScore.predictions = healthScoreData.predictions;
      await patient.save();
    }

    // Emit real-time update
    req.app.get('io').emit('patient-updated', patient);

    res.json(patient);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Add visit to patient
router.post('/:id/visits', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const visitId = `VIS${String(patient.visits.length + 1).padStart(6, '0')}`;
    const visit = {
      visitId,
      ...req.body,
      date: new Date()
    };

    patient.visits.push(visit);
    await patient.save();

    // Emit real-time update
    req.app.get('io').emit('patient-visit-added', { patientId: patient._id, visit });

    res.status(201).json(visit);
  } catch (error) {
    console.error('Add visit error:', error);
    res.status(500).json({ error: 'Failed to add visit' });
  }
});

// Update health score
router.post('/:id/health-score', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const healthScoreData = await aiService.predictHealthScore({
      age: new Date().getFullYear() - new Date(patient.personalInfo.dateOfBirth).getFullYear(),
      chronicConditions: patient.medicalInfo.chronicConditions,
      recentLabResults: req.body.labResults || [],
      lifestyle: req.body.lifestyle || {},
      vitals: req.body.vitals || {}
    });

    // Add to history
    patient.healthScore.history.push({
      score: patient.healthScore.current,
      date: new Date(),
      factors: patient.healthScore.riskFactors
    });

    // Update current score
    patient.healthScore.current = healthScoreData.score;
    patient.healthScore.riskFactors = healthScoreData.riskFactors;
    patient.healthScore.predictions = healthScoreData.predictions;

    await patient.save();

    // Emit real-time update
    req.app.get('io').emit('health-score-updated', {
      patientId: patient._id,
      healthScore: patient.healthScore
    });

    res.json(patient.healthScore);
  } catch (error) {
    console.error('Update health score error:', error);
    res.status(500).json({ error: 'Failed to update health score' });
  }
});

// Search patients by patient ID (for OCR verification)
router.get('/search/by-id/:patientId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      found: true,
      patient: {
        _id: patient._id,
        patientId: patient.patientId,
        name: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
        dateOfBirth: patient.personalInfo.dateOfBirth,
        phoneNumber: patient.personalInfo.phoneNumber
      }
    });
  } catch (error) {
    console.error('Search patient by ID error:', error);
    res.status(500).json({ error: 'Failed to search patient' });
  }
});

module.exports = router;