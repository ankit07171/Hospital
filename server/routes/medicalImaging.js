const express = require('express');
const multer = require('multer');
const MedicalImaging = require('../models/MedicalImaging');
const ocrService = require('../services/ocrService');
const medicalImagingAI = require('../services/medicalImagingAI');
const router = express.Router();

// Configure multer for file uploads (images and PDFs)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'), false);
    }
  }
});

// Upload and analyze medical imaging
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { imagingType, patientId, patientName, patientAge, patientGender, metadata } = req.body;

    if (!imagingType) {
      return res.status(400).json({ error: 'Imaging type is required' });
    }

    // Create initial medical imaging record
    const medicalImaging = new MedicalImaging({
      patientId: patientId || null,
      patientName: patientName || 'Unknown',
      patientAge: patientAge || null,
      patientGender: patientGender || 'Unknown',
      imagingType,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      status: 'Processing',
      metadata: metadata ? JSON.parse(metadata) : {}
    });

    await medicalImaging.save();

    // Process in background
    processImageAnalysis(medicalImaging._id, req.file.buffer, imagingType, req.app.get('io'));

    res.json({
      success: true,
      message: 'File uploaded successfully. Analysis in progress.',
      imagingId: medicalImaging.imagingId,
      recordId: medicalImaging._id
    });
  } catch (error) {
    console.error('Medical imaging upload error:', error);
    res.status(500).json({ error: 'Failed to upload medical imaging file' });
  }
});

// Background processing function
async function processImageAnalysis(recordId, imageBuffer, imagingType, io) {
  try {
    // Extract text using OCR
    const ocrResult = await ocrService.extractTextFromImage(imageBuffer);
    
    // Perform AI analysis with OCR text
    const aiAnalysis = await medicalImagingAI.analyzeMedicalImage(imageBuffer, imagingType, ocrResult.text);

    // Update record with results
    const updatedRecord = await MedicalImaging.findByIdAndUpdate(
      recordId,
      {
        $set: {
          extractedText: ocrResult.text,
          aiAnalysis: aiAnalysis,
          status: 'Analyzed'
        }
      },
      { new: true, strict: false }
    );

    // Emit real-time update
    if (io) {
      io.to('medical-imaging').emit('imaging-analyzed', updatedRecord);
    }

    console.log(`Medical imaging analysis completed for record ${recordId}`);
  } catch (error) {
    console.error('Medical imaging analysis error:', error);
    
    // Update status to show error
    await MedicalImaging.findByIdAndUpdate(
      recordId,
      {
        $set: {
          status: 'Uploaded',
          aiAnalysis: {
            summary: 'Analysis failed. Please retry or contact support.',
            urgencyLevel: 'Routine'
          }
        }
      },
      { strict: false }
    );
  }
}

// Get all medical imaging records
router.get('/', async (req, res) => {
  try {
    const { patientId, imagingType, status, urgencyLevel } = req.query;
    
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (imagingType) filter.imagingType = imagingType;
    if (status) filter.status = status;
    if (urgencyLevel) filter['aiAnalysis.urgencyLevel'] = urgencyLevel;

    const imagingRecords = await MedicalImaging.find(filter)
      .sort({ createdAt: -1 })
      .populate('patientId', 'name age gender patientId');

    res.json(imagingRecords);
  } catch (error) {
    console.error('Error fetching medical imaging records:', error);
    res.status(500).json({ error: 'Failed to fetch medical imaging records' });
  }
});

// Get specific medical imaging record
router.get('/:id', async (req, res) => {
  try {
    const imagingRecord = await MedicalImaging.findById(req.params.id)
      .populate('patientId', 'name age gender patientId bloodGroup allergies');

    if (!imagingRecord) {
      return res.status(404).json({ error: 'Medical imaging record not found' });
    }

    res.json(imagingRecord);
  } catch (error) {
    console.error('Error fetching medical imaging record:', error);
    res.status(500).json({ error: 'Failed to fetch medical imaging record' });
  }
});

// Radiologist review
router.put('/:id/review', async (req, res) => {
  try {
    const { reviewedBy, notes, confirmed, modifications } = req.body;

    const updatedRecord = await MedicalImaging.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'radiologistReview.reviewed': true,
          'radiologistReview.reviewedBy': reviewedBy,
          'radiologistReview.reviewDate': new Date(),
          'radiologistReview.notes': notes,
          'radiologistReview.confirmed': confirmed,
          'radiologistReview.modifications': modifications,
          status: 'Reviewed'
        }
      },
      { new: true, strict: false }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: 'Medical imaging record not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('medical-imaging').emit('imaging-reviewed', updatedRecord);
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating radiologist review:', error);
    res.status(500).json({ error: 'Failed to update radiologist review' });
  }
});

// Mark as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const updatedRecord = await MedicalImaging.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'Completed' } },
      { new: true, strict: false }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: 'Medical imaging record not found' });
    }

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error completing medical imaging record:', error);
    res.status(500).json({ error: 'Failed to complete medical imaging record' });
  }
});

// Delete medical imaging record
router.delete('/:id', async (req, res) => {
  try {
    const deletedRecord = await MedicalImaging.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({ error: 'Medical imaging record not found' });
    }

    res.json({ message: 'Medical imaging record deleted successfully' });
  } catch (error) {
    console.error('Error deleting medical imaging record:', error);
    res.status(500).json({ error: 'Failed to delete medical imaging record' });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalScans = await MedicalImaging.countDocuments();
    const pendingReview = await MedicalImaging.countDocuments({ status: 'Analyzed' });
    const emergencyCases = await MedicalImaging.countDocuments({ 'aiAnalysis.urgencyLevel': 'Emergency' });
    
    const scansByType = await MedicalImaging.aggregate([
      { $group: { _id: '$imagingType', count: { $sum: 1 } } }
    ]);

    res.json({
      totalScans,
      pendingReview,
      emergencyCases,
      scansByType
    });
  } catch (error) {
    console.error('Error fetching medical imaging statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
