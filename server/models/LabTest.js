const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  testId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  testDetails: {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: String,
    sampleType: { type: String, enum: ['Blood', 'Urine', 'Stool', 'Saliva', 'Other'] },
    cost: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['Ordered', 'Sample Collected', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Ordered'
  },
  dates: {
    ordered: { type: Date, default: Date.now },
    sampleCollected: Date,
    completed: Date,
    reportGenerated: Date
  },
  results: {
    values: [{
      parameter: String,
      value: String,
      unit: String,
      normalRange: String,
      status: { type: String, enum: ['Normal', 'High', 'Low', 'Critical'] }
    }],
    summary: String,
    aiSummary: String, // AI-generated summary for faster clinical decisions
    recommendations: [String],
    attachments: [{
      name: String,
      url: String,
      type: String
    }]
  },
  technician: {
    name: String,
    id: String,
    signature: String
  },
  qualityControl: {
    verified: { type: Boolean, default: false },
    verifiedBy: String,
    verificationDate: Date,
    notes: String
  }
}, {
  timestamps: true
});

// Generate test ID
labTestSchema.pre('save', async function(next) {
  if (!this.testId) {
    const count = await mongoose.model('LabTest').countDocuments();
    this.testId = `LAB${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('LabTest', labTestSchema);