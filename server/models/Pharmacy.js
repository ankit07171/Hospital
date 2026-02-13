const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// Medicine Schema
const medicineSchema = new Schema({
  medicineId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  genericName: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  manufacturer: { 
    type: String, 
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Analgesic',
      'Antibiotic',
      'Antihistamine',
      'Cardiovascular',
      'Gastrointestinal',
      'Vitamin',
      'Antidiabetic',
      'Antihypertensive',
      'Respiratory',
      'Dermatological',
      'Other'
    ],
    required: true,
    index: true
  },
  price: {
    mrp: { 
      type: Number, 
      required: true, 
      min: [0, 'MRP cannot be negative'] 
    },
    sellingPrice: { 
      type: Number, 
      required: true, 
      min: [0, 'Selling price cannot be negative'] 
    }
  },
  inventory: {
    currentStock: { 
      type: Number, 
      required: true, 
      default: 0, 
      min: [0, 'Stock cannot be negative'],
      index: true
    },
    minimumStock: { 
      type: Number, 
      required: true, 
      default: 10, 
      min: [0, 'Minimum stock cannot be negative'] 
    },
    reorderLevel: {
      type: Number,
      default: 20
    }
  },
  status: {
    type: String,
    enum: ['Available', 'Low Stock', 'Out of Stock'],
    default: 'Available',
    index: true
  },
  expiryDate: { 
    type: Date,
    index: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  dosageForm: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other'],
    default: 'Tablet'
  },
  strength: {
    type: String,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
medicineSchema.virtual('isExpired').get(function() {
  return this.expiryDate && new Date(this.expiryDate) < new Date();
});

medicineSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const days = Math.floor((new Date(this.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  return days;
});

medicineSchema.virtual('expiresWithin90Days').get(function() {
  const days = this.daysUntilExpiry;
  return days !== null && days >= 0 && days <= 90;
});

medicineSchema.virtual('stockPercentage').get(function() {
  if (this.inventory.reorderLevel === 0) return 100;
  return Math.min(100, (this.inventory.currentStock / this.inventory.reorderLevel) * 100);
});

medicineSchema.virtual('profitMargin').get(function() {
  if (this.price.mrp === 0) return 0;
  return ((this.price.mrp - this.price.sellingPrice) / this.price.mrp) * 100;
});

// Indexes for better query performance
medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });
medicineSchema.index({ createdAt: -1 });
medicineSchema.index({ 'inventory.currentStock': 1, 'inventory.minimumStock': 1 });

// Auto-update status based on stock
medicineSchema.pre('save', function(next) {
  if (this.inventory.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.inventory.currentStock <= this.inventory.minimumStock) {
    this.status = 'Low Stock';
  } else {
    this.status = 'Available';
  }
  
  this.updatedAt = new Date();
  next();
});

// Validation: Selling price cannot exceed MRP
medicineSchema.pre('validate', function(next) {
  if (this.price.sellingPrice > this.price.mrp) {
    next(new Error('Selling price cannot exceed MRP'));
  } else {
    next();
  }
});

// Prescription Schema
const prescriptionSchema = new Schema({
  prescriptionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  patientName: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  patientAge: {
    type: Number,
    min: 0
  },
  patientGender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  patientContact: {
    type: String,
    trim: true
  },
  doctorName: { 
    type: String, 
    required: true,
    trim: true,
    index: true
  },
  doctorSpecialization: {
    type: String,
    trim: true
  },
  medicines: [{
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    dosage: { 
      type: String, 
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      trim: true
    },
    duration: {
      type: String,
      trim: true
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: [1, 'Quantity must be at least 1'] 
    },
    price: { 
      type: Number, 
      required: true, 
      min: [0, 'Price cannot be negative'] 
    },
    dispensed: { 
      type: Boolean, 
      default: false 
    },
    dispensedAt: {
      type: Date
    },
    instructions: {
      type: String,
      trim: true
    }
  }],
  totalAmount: { 
    type: Number, 
    required: true, 
    min: [0, 'Total amount cannot be negative'] 
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  finalAmount: {
    type: Number,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Insurance', 'Other']
  },
  status: {
    type: String,
    enum: ['Pending', 'Partially Dispensed', 'Fully Dispensed', 'Cancelled'],
    default: 'Pending',
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  dispensedBy: {
    type: String,
    trim: true
  },
  // Billing integration fields
  billed: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
prescriptionSchema.virtual('medicineCount').get(function() {
  return this.medicines.length;
});

prescriptionSchema.virtual('dispensedCount').get(function() {
  return this.medicines.filter(m => m.dispensed).length;
});

prescriptionSchema.virtual('pendingCount').get(function() {
  return this.medicines.filter(m => !m.dispensed).length;
});

prescriptionSchema.virtual('dispensedPercentage').get(function() {
  if (this.medicines.length === 0) return 0;
  return (this.dispensedCount / this.medicines.length) * 100;
});

// Indexes
prescriptionSchema.index({ patientName: 'text', doctorName: 'text' });
prescriptionSchema.index({ createdAt: -1 });
prescriptionSchema.index({ status: 1, createdAt: -1 });

// Calculate final amount before saving
prescriptionSchema.pre('save', function(next) {
  if (this.discount && this.discount > 0) {
    this.finalAmount = this.totalAmount - (this.totalAmount * this.discount / 100);
  } else {
    this.finalAmount = this.totalAmount;
  }
  next();
});

// Update prescription status based on dispensed medicines
prescriptionSchema.pre('save', function(next) {
  const dispensedCount = this.medicines.filter(m => m.dispensed).length;
  const totalCount = this.medicines.length;

  if (this.status === 'Cancelled') {
    // Keep cancelled status
  } else if (dispensedCount === 0) {
    this.status = 'Pending';
  } else if (dispensedCount === totalCount) {
    this.status = 'Fully Dispensed';
  } else {
    this.status = 'Partially Dispensed';
  }

  this.updatedAt = new Date();
  next();
});

// Update dispensedAt timestamp when marking as dispensed
prescriptionSchema.pre('save', function(next) {
  this.medicines.forEach(medicine => {
    if (medicine.dispensed && !medicine.dispensedAt) {
      medicine.dispensedAt = new Date();
    }
  });
  next();
});

module.exports = {
  Medicine: model('Medicine', medicineSchema),
  Prescription: model('Prescription', prescriptionSchema)
};
