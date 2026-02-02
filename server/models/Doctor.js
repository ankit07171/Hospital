const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    // required: true,
    unique: true
  },
  personalInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] }
  },
  professionalInfo: {
    specialization: { type: String, required: true },
    department: { type: String, required: true },
    qualification: [String],
    experience: Number,
    licenseNumber: { type: String, required: true },
    consultationFee: { type: Number, required: true }
  },
  schedule: {
    workingDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
    workingHours: {
      start: String,
      end: String
    },
    breakTime: {
      start: String,
      end: String
    }
  },
  availability: [{
    date: Date,
    slots: [{
      time: String,
      isBooked: { type: Boolean, default: false },
      patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }
    }]
  }],
  consultations: [{
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    date: Date,
    notes: String,
    prescription: [{
      medicine: String,
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }],
    diagnosis: String,
    followUpDate: Date,
    ocrNotes: String // Notes from stylus OCR pad
  }],
  performance: {
    totalConsultations: { type: Number, default: 0 },
    patientSatisfaction: { type: Number, default: 0 },
    averageConsultationTime: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Generate doctor ID
doctorSchema.pre('save', async function(next) {
  if (!this.doctorId) {
    const count = await mongoose.model('Doctor').countDocuments();
    this.doctorId = `DOC${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);