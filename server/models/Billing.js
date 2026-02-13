const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  billId: { 
    type: String, 
    unique: true,
    sparse: true  // Allows null/undefined before generation
  },
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Patient', 
    required: true 
  },
  
  // Linked lab tests
  labTests: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabReport' },
    testName: String,
    cost: Number,
    status: String
  }],
  
  // Linked medicines
  medicines: [{
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    medicineName: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  
  // Other items (consultation, bed charges, etc.)
  items: [
    { 
      category: { 
        type: String, 
        enum: ['Consultation', 'Bed', 'Service', 'Medicine', 'Lab', 'Other'], 
        required: true 
      },
      name: String, 
      quantity: Number, 
      unitPrice: Number, 
      gstPercent: Number, 
      total: Number 
    }
  ],
  
  summary: {
    labTestsTotal: { type: Number, default: 0 },
    medicinesTotal: { type: Number, default: 0 },
    otherItemsTotal: { type: Number, default: 0 },
    subTotal: Number, 
    gstAmount: Number, 
    totalAmount: Number,
    paidAmount: { type: Number, default: 0 }, 
    balanceAmount: Number 
  },
  
  status: { 
    type: String, 
    enum: ['Generated', 'Partially Paid', 'Fully Paid'], 
    default: 'Generated' 
  },
  
  payments: [{
    amount: Number, 
    method: { type: String, enum: ['Cash', 'Card', 'UPI', 'Insurance'] }, 
    date: { type: Date, default: Date.now },
    reference: String
  }],
  
  insurance: { 
    isInsured: Boolean, 
    provider: String, 
    claimStatus: String, 
    approvedAmount: Number 
  },
  
  generatedBy: String,
  lastPaymentDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate bill ID
BillSchema.pre('save', async function(next) {
  if (!this.billId) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billId = `BILL${String(count + 1).padStart(6, '0')}`;
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bill', BillSchema);
