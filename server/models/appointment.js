const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, unique: true },
    patientName: { type: String, required: true },
    doctorName: { type: String, required: true },
    department: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, default: '10:00' },
    duration: { type: Number, default: 30 },
    type: { type: String, default: 'OPD' },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled'
    },
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
