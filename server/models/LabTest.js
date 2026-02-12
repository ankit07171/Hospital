const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  // Reference to Patient
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },

  // Test Information
  testType: {
    type: String,
    required: true,
    trim: true
  },
  
  testCategory: {
    type: String,
    enum: [
      'Blood Test',
      'Urine Test',
      'Imaging',
      'Pathology',
      'Cardiology',
      'Metabolic',
      'Liver Function',
      'Kidney Function',
      'Other'
    ],
    default: 'Other'
  },

  // Test Date and Status
  testDate: {
    type: Date,
    default: Date.now,
    required: true
  },

  status: {
    type: String,
    enum: ['Normal', 'Abnormal', 'Critical', 'Pending'],
    default: 'Pending',
    required: true
  },

  // Results
  results: {
    type: String,
    trim: true
  },

  keyResults: {
    type: String,
    trim: true
  },

  // Numerical values for specific tests (optional)
  numericValues: [{
    parameter: String,
    value: Number,
    unit: String,
    referenceRange: String,
    isAbnormal: Boolean
  }],

  // Medical Notes
  doctorNotes: {
    type: String,
    trim: true
  },

  performedBy: {
    type: String,
    trim: true
  },

  reviewedBy: {
    type: String,
    trim: true
  },

  // File attachments
  reportFile: {
    filename: String,
    filepath: String,
    mimetype: String,
    size: Number
  },

  // Risk Impact (calculated by AI)
  riskImpact: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
labReportSchema.index({ patientId: 1, testDate: -1 });
labReportSchema.index({ status: 1 });
labReportSchema.index({ testCategory: 1 });
labReportSchema.index({ testDate: -1 });

// Pre-save middleware to update patient risk
labReportSchema.pre('save', async function(next) {
  if (this.isModified('status') || this.isModified('results') || this.isNew) {
    try {
      const Patient = require('./Patient');
      const patient = await Patient.findById(this.patientId);
      
      if (patient) {
        // Trigger risk recalculation
        await patient.updateRiskAssessment();
      }
    } catch (error) {
      console.error('Error updating patient risk after lab report save:', error);
    }
  }
  next();
});

// Post-remove middleware to update patient risk
labReportSchema.post('remove', async function(doc) {
  try {
    const Patient = require('./Patient');
    const patient = await Patient.findById(doc.patientId);
    
    if (patient) {
      // Trigger risk recalculation
      await patient.updateRiskAssessment();
    }
  } catch (error) {
    console.error('Error updating patient risk after lab report deletion:', error);
  }
});

// Post-findOneAndDelete middleware
labReportSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Patient = require('./Patient');
      const patient = await Patient.findById(doc.patientId);
      
      if (patient) {
        await patient.updateRiskAssessment();
      }
    } catch (error) {
      console.error('Error updating patient risk after lab report deletion:', error);
    }
  }
});

// Method to get report summary
labReportSchema.methods.getSummary = function() {
  return {
    id: this._id,
    patientId: this.patientId,
    testType: this.testType,
    testDate: this.testDate,
    status: this.status,
    keyResults: this.keyResults,
    riskImpact: this.riskImpact
  };
};

// Static method to get recent abnormal reports
labReportSchema.statics.findRecentAbnormal = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    status: { $in: ['Abnormal', 'Critical'] },
    testDate: { $gte: cutoffDate }
  })
  .populate('patientId', 'personalInfo.firstName personalInfo.lastName')
  .sort({ testDate: -1 });
};

// Static method to get reports by patient
labReportSchema.statics.findByPatient = function(patientId) {
  return this.find({ patientId })
    .sort({ testDate: -1 });
};

// Static method to get critical reports
labReportSchema.statics.findCritical = function() {
  return this.find({ status: 'Critical' })
    .populate('patientId', 'personalInfo.firstName personalInfo.lastName riskAssessment.riskLevel')
    .sort({ testDate: -1 });
};

const LabReport = mongoose.model('LabReport', labReportSchema);

module.exports = LabReport;