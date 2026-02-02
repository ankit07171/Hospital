const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String
    }
  },
  medicalInfo: {
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date
    }],
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      validUntil: Date
    }
  },
  healthScore: {
    current: { type: Number, default: 0 },
    history: [{
      score: Number,
      date: Date,
      factors: [String]
    }],
    riskFactors: [String],
    predictions: [{
      condition: String,
      probability: Number,
      timeframe: String,
      date: Date
    }]
  },
  visits: [{
    visitId: String,
    date: Date,
    department: String,
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    type: { type: String, enum: ['OPD', 'IPD', 'Emergency'] },
    status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'] },
    diagnosis: String,
    treatment: String,
    notes: String
  }],
  documents: [{
    type: String,
    name: String,
    url: String,
    uploadDate: Date,
    extractedText: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Deceased'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Generate patient ID
patientSchema.pre('validate', async function (next) {
  if (!this.patientId) {
    const lastPatient = await mongoose
      .model('Patient')
      .findOne()
      .sort({ createdAt: -1 })
      .select('patientId');

    let nextNumber = 1;

    if (lastPatient?.patientId) {
      nextNumber =
        parseInt(lastPatient.patientId.replace('PAT', ''), 10) + 1;
    }

    this.patientId = `PAT${String(nextNumber).padStart(6, '0')}`;
  }
  next();
});


module.exports = mongoose.model('Patient', patientSchema);