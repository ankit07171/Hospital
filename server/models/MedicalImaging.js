const mongoose = require('mongoose');

const medicalImagingSchema = new mongoose.Schema({
  imagingId: {
    type: String,
    unique: true,
    sparse: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  patientName: String,
  patientAge: Number,
  patientGender: String,
  
  // Imaging details
  imagingType: {
    type: String,
    enum: ['X-Ray', 'MRI', 'CT Scan']
  },
  
  // File information
  fileName: String,
  fileType: String,
  fileSize: Number,
  uploadDate: {
    type: Date,
    default: Date.now
  },
  
  // AI Analysis Results - using Mixed type for flexibility
  aiAnalysis: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // OCR extracted text
  extractedText: String,
  
  // Radiologist review
  radiologistReview: {
    reviewed: {
      type: Boolean,
      default: false
    },
    reviewedBy: String,
    reviewDate: Date,
    notes: String,
    confirmed: Boolean,
    modifications: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['Uploaded', 'Processing', 'Analyzed', 'Reviewed', 'Completed'],
    default: 'Uploaded'
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Generate imaging ID before saving
medicalImagingSchema.pre('save', async function(next) {
  if (!this.imagingId) {
    try {
      // Use a loop to handle race conditions
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        // Generate ID based on timestamp + random number for uniqueness
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const potentialId = `IMG${String(timestamp).slice(-6)}${String(random).padStart(3, '0')}`;
        
        // Check if this ID already exists
        const existing = await this.constructor.findOne({ imagingId: potentialId });
        
        if (!existing) {
          this.imagingId = potentialId;
          break;
        }
        
        attempts++;
        // Small delay to avoid collision
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Fallback if all attempts failed
      if (!this.imagingId) {
        this.imagingId = `IMG${Date.now()}${Math.floor(Math.random() * 10000)}`;
      }
    } catch (error) {
      console.error('Error generating imaging ID:', error);
      // Ultimate fallback
      this.imagingId = `IMG${Date.now()}${Math.floor(Math.random() * 10000)}`;
    }
  }
  next();
});

// Index for efficient queries
medicalImagingSchema.index({ imagingId: 1 });
medicalImagingSchema.index({ patientId: 1 });
medicalImagingSchema.index({ imagingType: 1 });
medicalImagingSchema.index({ status: 1 });

module.exports = mongoose.model('MedicalImaging', medicalImagingSchema);
