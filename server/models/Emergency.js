const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  emergencyId: {
    type: String,
    // required: true,
    unique: true
  },
  triageLevel: {
    type: String,
    required: true,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  chiefComplaint: {
    type: String,
    required: true,
    trim: true
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    respiratoryRate: Number,
    oxygenSaturation: Number,
    painScale: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  arrivalTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  arrivalMethod: {
    type: String,
    enum: ['Walk-in', 'Ambulance', 'Police', 'Helicopter', 'Transfer'],
    required: true
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  assignedNurse: {
    type: String,
    trim: true
  },
  bedNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Waiting', 'In Progress', 'Under Treatment', 'Stable', 'Discharged', 'Admitted', 'Transferred', 'Deceased'],
    default: 'Waiting'
  },
  treatmentNotes: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    provider: String
  }],
  medications: [{
    name: String,
    dosage: String,
    route: String,
    frequency: String,
    startTime: Date
  }],
  procedures: [{
    name: String,
    performedBy: String,
    timestamp: Date,
    notes: String
  }],
  labTests: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest'
    },
    ordered: Date,
    status: String
  }],
  imaging: [{
    type: String,
    ordered: Date,
    status: String,
    results: String
  }],
  disposition: {
    type: String,
    enum: ['Discharge', 'Admit', 'Transfer', 'AMA', 'Deceased'],
  },
  dischargeTime: Date,
  followUpInstructions: String,
  estimatedCost: Number,
  insurance: {
    provider: String,
    policyNumber: String,
    verified: Boolean
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    notified: Boolean
  }
}, {
  timestamps: true
});

// Generate emergency ID
emergencySchema.pre('save', async function(next) {
  if (!this.emergencyId) {
    const count = await mongoose.model('Emergency').countDocuments();
    this.emergencyId = `ER${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Index for efficient queries
emergencySchema.index({ emergencyId: 1 });
emergencySchema.index({ patientId: 1 });
emergencySchema.index({ triageLevel: 1 });
emergencySchema.index({ status: 1 });
emergencySchema.index({ arrivalTime: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);