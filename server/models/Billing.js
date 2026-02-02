const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  billId: {
    type: String,
    required: true,
    unique: true
  },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  visitId: String,
  billType: {
    type: String,
    enum: ['OPD', 'IPD', 'Emergency', 'Lab', 'Pharmacy', 'Radiology'],
    required: true
  },
  services: [{
    serviceId: String,
    serviceName: String,
    category: String,
    quantity: { type: Number, default: 1 },
    unitPrice: Number,
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: Number
  }],
  amounts: {
    subtotal: Number,
    totalDiscount: Number,
    totalTax: Number,
    totalAmount: Number,
    paidAmount: { type: Number, default: 0 },
    balanceAmount: Number
  },
  insurance: {
    isInsured: { type: Boolean, default: false },
    provider: String,
    policyNumber: String,
    claimAmount: Number,
    approvedAmount: Number,
    claimStatus: {
      type: String,
      enum: ['Not Claimed', 'Submitted', 'Approved', 'Rejected', 'Partially Approved'],
      default: 'Not Claimed'
    }
  },
  payments: [{
    paymentId: String,
    amount: Number,
    method: { type: String, enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Insurance'] },
    transactionId: String,
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Completed' }
  }],
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Partially Paid', 'Fully Paid', 'Cancelled'],
    default: 'Draft'
  },
  generatedBy: {
    userId: String,
    userName: String,
    department: String
  },
  dates: {
    serviceDate: Date,
    billGenerated: { type: Date, default: Date.now },
    dueDate: Date,
    lastPayment: Date
  }
}, {
  timestamps: true
});

// Generate bill ID
billingSchema.pre('save', async function(next) {
  if (!this.billId) {
    const count = await mongoose.model('Billing').countDocuments();
    this.billId = `BILL${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Billing', billingSchema);