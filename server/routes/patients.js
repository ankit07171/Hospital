const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const LabReport = require('../models/LabTest');

// Get all patients - ✅ Added pagination, patientId, optimized lab count
router.get('/', async (req, res) => {
  try {
    const { status, riskLevel, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    let query = {};

    if (status) query.status = status;
    if (riskLevel) query['riskAssessment.riskLevel'] = riskLevel;
    
    if (search) {
      query.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { 'personalInfo.phoneNumber': { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } }  // ✅ Search by new patientId
      ];
    }

    const patients = await Patient.find(query)
      .sort({ 'riskAssessment.riskScore': -1, lastUpdated: -1 })
      .skip(skip)
      .limit(Number(limit));

    // ✅ Aggregate lab counts in single query (faster than Promise.all)
    const patientIds = patients.map(p => p._id);
    const labCounts = await LabReport.aggregate([
      { $match: { patientId: { $in: patientIds } } },
      { $group: { _id: '$patientId', count: { $sum: 1 } } }
    ]);

    const countMap = labCounts.reduce((acc, doc) => {
      acc[doc._id] = doc.count;
      return acc;
    }, {});

    const patientsWithLabCount = patients.map(patient => ({
      ...patient.toObject(),
      patientId: patient.patientId,  // ✅ Expose new field
      labReportsCount: countMap[patient._id] || 0
    }));

    res.json({
      patients: patientsWithLabCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: await Patient.countDocuments(query),
        pages: Math.ceil(await Patient.countDocuments(query) / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get high-risk patients (unchanged - solid)
router.get('/high-risk', async (req, res) => {
  try {
    const highRiskPatients = await Patient.findHighRiskPatients();
    res.json(highRiskPatients);
  } catch (error) {
    console.error('Error fetching high-risk patients:', error);
    res.status(500).json({ error: 'Failed to fetch high-risk patients' });
  }
});

// Get patient statistics - ✅ Added patientId stats
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalPatients, activePatients, riskDistribution, avgRiskScore] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ status: 'Active' }),
      Patient.aggregate([{ $group: { _id: '$riskAssessment.riskLevel', count: { $sum: 1 } } }]),
      Patient.aggregate([{ $group: { _id: null, avgScore: { $avg: '$riskAssessment.riskScore' } } }])
    ]);

    const [totalLabReports, criticalReports] = await Promise.all([
      LabReport.countDocuments(),
      LabReport.countDocuments({ status: 'Critical' })
    ]);

    res.json({
      totalPatients,
      activePatients,
      riskDistribution,
      averageRiskScore: avgRiskScore[0]?.avgScore || 0,
      totalLabReports,
      criticalReports
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get single patient by ID - ✅ Added patientId, lab count optimization
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID required' });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const labReportsCount = await LabReport.countDocuments({ patientId: patient._id });
    res.json({
      ...patient.toObject(),
      patientId: patient.patientId,  // ✅ Expose
      labReportsCount
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient (unchanged - perfect with new schema)
router.post('/', async (req, res) => {
  try {
    const patientData = req.body;

    if (!patientData.personalInfo?.firstName || 
        !patientData.personalInfo?.lastName ||
        !patientData.personalInfo?.dateOfBirth ||
        !patientData.personalInfo?.gender ||
        !patientData.personalInfo?.phoneNumber) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'phoneNumber']
      });
    }

    const patient = new Patient(patientData);
    patient.updateRiskAssessment();
    await patient.save();

    res.status(201).json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ 
      error: 'Failed to create patient',
      details: error.message 
    });
  }
});

// Update patient (unchanged)
router.put('/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID required' });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (req.body.personalInfo) {
      patient.personalInfo = { ...patient.personalInfo, ...req.body.personalInfo };
    }
    if (req.body.medicalInfo) {
      patient.medicalInfo = { ...patient.medicalInfo, ...req.body.medicalInfo };
    }
    if (req.body.status) {
      patient.status = req.body.status;
    }

    patient.updateRiskAssessment();
    await patient.save();

    res.json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient', details: error.message });
  }
});

// Update medical info only (unchanged)
router.patch('/:id/medical-info', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID required' });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const { bloodGroup, allergies, chronicConditions, emergencyContact } = req.body;
    if (bloodGroup !== undefined) patient.medicalInfo.bloodGroup = bloodGroup;
    if (allergies !== undefined) patient.medicalInfo.allergies = allergies;
    if (chronicConditions !== undefined) patient.medicalInfo.chronicConditions = chronicConditions;
    if (emergencyContact !== undefined) patient.medicalInfo.emergencyContact = emergencyContact;

    await patient.updateRiskAssessment();
    await patient.save();

    res.json(patient);
  } catch (error) {
    console.error('Error updating medical info:', error);
    res.status(500).json({ error: 'Failed to update medical info', details: error.message });
  }
});

// Recalculate risk (unchanged)
router.post('/:id/recalculate-risk', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID required' });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const riskAssessment = await patient.updateRiskAssessment();
    res.json({ message: 'Risk assessment recalculated successfully', riskAssessment });
  } catch (error) {
    console.error('Error recalculating risk:', error);
    res.status(500).json({ error: 'Failed to recalculate risk', details: error.message });
  }
});

// Delete patient (unchanged - LabReport uses _id correctly)
router.delete('/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'ID required' });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await LabReport.deleteMany({ patientId: req.params.id });
    await Patient.findByIdAndDelete(req.params.id);

    res.json({ message: 'Patient and associated lab reports deleted successfully' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;
