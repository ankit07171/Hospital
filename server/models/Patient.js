const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // ✅ NEW: Auto-generated unique patient ID
  patientId: { 
    type: String, 
    // required: true, 
    unique: true,
    sparse: true  // Allows null during migrations [web:31]
  },

  // Personal Information (unchanged)
  personalInfo: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    }
  },

  // Medical Information (unchanged)
  medicalInfo: {
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
    allergies: [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  },

  // AI-Calculated Risk Assessment (unchanged)
  riskAssessment: {
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: { 
      type: String, 
      enum: ['Minimal', 'Low', 'Medium', 'High', 'Critical'], 
      default: 'Minimal' 
    },
    breakdown: {
      age: Number,
      conditions: Number,
      labs: Number,
      allergies: Number,
      interactions: Number
    },
    riskFactors: [{
      factor: String,
      severity: String,
      description: String
    }],
    recommendations: [{
      priority: String,
      action: String,
      description: String
    }],
    lastCalculated: { type: Date, default: Date.now },
    modelVersion: String,
    confidence: Number
  },

  // Metadata (unchanged)
  status: { type: String, enum: ['Active', 'Inactive', 'Discharged'], default: 'Active' },
  registrationDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// ✅ UPDATED: Pre-save hook - Auto-generate patientId + lastUpdated
patientSchema.pre('save', async function(next) {
  if (this.isNew && !this.patientId) {
    const lastPatient = await this.constructor.findOne(
      { patientId: { $regex: /^PAT\d+$/ } }
    ).sort({ patientId: -1 }).limit(1);

    let nextNumber = 1;
    if (lastPatient?.patientId) {
      nextNumber = parseInt(lastPatient.patientId.replace('PAT', ''), 10) + 1;
    }

    this.patientId = `PAT${String(nextNumber).padStart(4, '0')}`;
  }
  next();
});

// Indexes (your originals + patientId)
patientSchema.index({ patientId: 1 });  // Now safe with auto-gen [web:30]
patientSchema.index({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 });
patientSchema.index({ 'personalInfo.email': 1 });
patientSchema.index({ 'personalInfo.phoneNumber': 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ 'riskAssessment.riskLevel': 1 });

// Virtuals, methods, statics unchanged...
patientSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

patientSchema.virtual('age').get(function() {
  if (!this.personalInfo.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.personalInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

patientSchema.methods.updateRiskAssessment =  function() {
  // Your inline logic unchanged...
  try {
    const today = new Date();
    const birthDate = new Date(this.personalInfo.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    const conditionsScore = (this.medicalInfo.chronicConditions?.length || 0) * 15;
    const allergiesScore = (this.medicalInfo.allergies?.length || 0) * 8;
    const riskScore = Math.min((age / 80 * 30) + conditionsScore + allergiesScore, 100);
    
    this.riskAssessment = {
      riskScore: Math.round(riskScore),
      riskLevel: riskScore > 70 ? 'High' : riskScore > 50 ? 'Medium' : riskScore > 30 ? 'Low' : 'Minimal',
      lastCalculated: new Date(),
      breakdown: {
        age: Math.round(age / 80 * 30),
        conditions: Math.round(conditionsScore * 0.3),
        labs: 0,
        allergies: Math.round(allergiesScore * 0.1),
        interactions: 0
      },
      riskFactors: [],
      recommendations: [],
      modelVersion: 'v1.0',
      confidence: 0.85
    };
    
    // await this.riskAssessment();
    return this.riskAssessment;
  } catch (error) {
    console.error('Risk assessment failed:', error);
  }
};

patientSchema.statics.findHighRiskPatients = function() {
  return this.find({
    'riskAssessment.riskLevel': { $in: ['High', 'Critical'] },
    status: 'Active'
  }).sort({ 'riskAssessment.riskScore': -1 });
};

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
