const mongoose = require('mongoose');
const BillSchema = new mongoose.Schema({
  billId: { type: String, required: true, unique: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  items: [ // unchanged
    { category: { type: String, enum: ['Bed','Medicine','Service','Lab'], required: true },
      name: String, quantity: Number, unitPrice: Number, gstPercent: Number, total: Number }
  ],
  summary: { // unchanged
    subTotal: Number, gstAmount: Number, totalAmount: Number,
    paidAmount: { type: Number, default: 0 }, balanceAmount: Number },
  status: { type: String, enum: ['Generated','Partially Paid','Fully Paid'], default: 'Generated' },
  payments: [{ amount: Number, method: String, date: { type: Date, default: Date.now } }], // ✅ ADD
  insurance: { isInsured: Boolean, provider: String, claimStatus: String, approvedAmount: Number }, // ✅ ADD
  lastPaymentDate: Date, // ✅ ADD (renamed from dates.lastPayment)
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Bill', BillSchema);
