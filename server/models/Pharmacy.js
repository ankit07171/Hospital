const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  medicineId: {
    type: String,
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  genericName: String,
  manufacturer: String,
  category: String,
  dosageForm: { type: String, enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Other'] },
  strength: String,
  price: {
    mrp: Number,
    sellingPrice: Number,
    discount: Number
  },
  inventory: {
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, default: 10 },
    maximumStock: { type: Number, default: 1000 },
    reorderLevel: { type: Number, default: 20 }
  },
  batchInfo: [{
    batchNumber: String,
    expiryDate: Date,
    quantity: Number,
    supplierPrice: Number
  }],
  status: {
    type: String,
    enum: ['Available', 'Out of Stock', 'Discontinued'],
    default: 'Available'
  }
}, {
  timestamps: true
});

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  medicines: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    quantity: Number,
    instructions: String,
    price: Number,
    dispensed: { type: Boolean, default: false }
  }],
  totalAmount: Number,
  status: {
    type: String,
    enum: ['Pending', 'Partially Dispensed', 'Fully Dispensed', 'Cancelled'],
    default: 'Pending'
  },
  dispensedBy: {
    pharmacistId: String,
    pharmacistName: String,
    dispensedDate: Date
  },
  notes: String
}, {
  timestamps: true
});

// Generate IDs
medicineSchema.pre('save', async function(next) {
  if (!this.medicineId) {
    const count = await mongoose.model('Medicine').countDocuments();
    this.medicineId = `MED${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionId) {
    const count = await mongoose.model('Prescription').countDocuments();
    this.prescriptionId = `PRE${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Medicine = mongoose.model('Medicine', medicineSchema);
const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = { Medicine, Prescription };