const express = require('express');
const multer = require('multer');
const ocrService = require('../services/ocrService');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Extract text from any image
router.post('/extract-text', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await ocrService.extractTextFromImage(req.file.buffer);
    res.json(result);
  } catch (error) {
    console.error('OCR text extraction error:', error);
    res.status(500).json({ error: 'Failed to extract text from image' });
  }
});

// Extract patient ID from ID card/document
router.post('/extract-patient-id', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await ocrService.extractPatientID(req.file.buffer);
    res.json(result);
  } catch (error) {
    console.error('Patient ID extraction error:', error);
    res.status(500).json({ error: 'Failed to extract patient ID' });
  }
});

// Extract consultation notes from stylus pad
router.post('/extract-consultation-notes', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await ocrService.extractConsultationNotes(req.file.buffer);
    res.json(result);
  } catch (error) {
    console.error('Consultation notes extraction error:', error);
    res.status(500).json({ error: 'Failed to extract consultation notes' });
  }
});

// Extract lab report data
router.post('/extract-lab-report', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await ocrService.extractLabReportData(req.file.buffer);
    res.json(result);
  } catch (error) {
    console.error('Lab report extraction error:', error);
    res.status(500).json({ error: 'Failed to extract lab report data' });
  }
});

module.exports = router;