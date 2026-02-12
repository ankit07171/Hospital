const express = require('express');
const Billing = require('../models/Billing');
const router = express.Router();

/* CREATE BILL */
router.post('/', async (req, res) => {
  const { patientId, items, paidAmount } = req.body;

  let subTotal = 0;
  let gstAmount = 0;

  items.forEach(i => {
    const itemBase = i.quantity * i.unitPrice;
    const itemGst = (itemBase * (i.gstPercent || 0)) / 100;
    i.total = itemBase + itemGst;

    subTotal += itemBase;
    gstAmount += itemGst;
  });

  const totalAmount = subTotal + gstAmount;

  const bill = await Billing.create({
    billId: 'BILL-' + Date.now(),
    patientId,
    items,
    summary: {
      subTotal,
      gstAmount,
      totalAmount,
      paidAmount,
      balanceAmount: totalAmount - paidAmount,
    },
    status:
      paidAmount === totalAmount
        ? 'Fully Paid'
        : paidAmount > 0
        ? 'Partially Paid'
        : 'Generated',
  });

  res.status(201).json(bill);
});


/* ADD PAYMENT */
router.post('/:id/payments', async (req, res) => {
  const bill = await Billing.findById(req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  bill.payments.push(req.body);
  bill.amounts.paidAmount += req.body.amount;
  bill.amounts.balanceAmount =
    bill.amounts.totalAmount - bill.amounts.paidAmount;

  bill.status =
    bill.amounts.balanceAmount <= 0 ? 'Fully Paid' : 'Partially Paid';

  bill.dates.lastPayment = new Date();
  await bill.save();

  res.json(bill);
});

/* INSURANCE APPROVAL */
// router.put('/:id/insurance', async (req, res) => {
//   const bill = await Billing.findById(req.params.id);
//   if (!bill) return res.status(404).json({ error: 'Bill not found' });

//   bill.insurance = req.body;

//   if (req.body.claimStatus === 'Approved') {
//     bill.payments.push({
//       amount: req.body.approvedAmount,
//       method: 'Insurance'
//     });

//     bill.amounts.paidAmount += req.body.approvedAmount;
//     bill.amounts.balanceAmount =
//       bill.amounts.totalAmount - bill.amounts.paidAmount;
//   }

//   bill.status =
//     bill.amounts.balanceAmount <= 0 ? 'Fully Paid' : 'Partially Paid';

//   await bill.save();
//   res.json(bill);
// });

/* GET ALL BILLS */
// router.get('/', async (req, res) => {
//   try {
//     const bills = await Billing.find()
//       .populate('patientId')
//       .sort({ createdAt: -1 });

//     res.json(bills);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch bills' });
//   }
// });

/* BILLING STATS (REAL REVENUE) */
// router.get('/stats/overview', async (req, res) => {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   const revenue = await Billing.aggregate([
//     { $unwind: '$payments' },
//     { $match: { 'payments.status': 'Completed' } },
//     {
//       $group: {
//         _id: null,
//         totalRevenue: { $sum: '$payments.amount' }
//       }
//     }
//   ]);

//   const outstanding = await Billing.aggregate([
//     { $match: { status: { $in: ['Generated', 'Partially Paid'] } } },
//     { $group: { _id: null, total: { $sum: '$amounts.balanceAmount' } } }
//   ]);

//   res.json({
//     totalRevenue: revenue[0]?.totalRevenue || 0,
//     outstanding: outstanding[0]?.total || 0
//   });
// });


// ADD PAYMENT ✅ FIXED
router.post('/:id/payments', async (req, res) => {
  const bill = await Billing.findById(req.params.id).populate('patientId');
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  const { amount, method = 'Cash' } = req.body;
  bill.payments.push({ amount, method });
  bill.summary.paidAmount += amount;
  bill.summary.balanceAmount = bill.summary.totalAmount - bill.summary.paidAmount;
  bill.status = bill.summary.balanceAmount <= 0 ? 'Fully Paid' : 'Partially Paid';
  bill.lastPaymentDate = new Date();
  await bill.save();
  res.json(bill);
});

// INSURANCE APPROVAL ✅ FIXED
router.put('/:id/insurance', async (req, res) => {
  const bill = await Billing.findById(req.params.id).populate('patientId');
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  bill.insurance = req.body;
  if (req.body.claimStatus === 'Approved') {
    bill.payments.push({ amount: req.body.approvedAmount, method: 'Insurance' });
    bill.summary.paidAmount += req.body.approvedAmount;
    bill.summary.balanceAmount = bill.summary.totalAmount - bill.summary.paidAmount;
  }
  bill.status = bill.summary.balanceAmount <= 0 ? 'Fully Paid' : 'Partially Paid';
  await bill.save();
  res.json(bill);
});

// GET BILLS ✅ ENHANCED (pagination/search/populate/filter)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, billType, patientId } = req.query;
    const query= {};
    if (status && status !== 'All') query.status = status;
    if (patientId) query['patientId'] = patientId;
    // Add billType/search if schema extended

    const bills = await Billing.find(query)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 })
      .limit(+limit * 1)
      .skip((+page - 1) * +limit);
    const total = await Billing.countDocuments(query);
    res.json({
      bills,
      totalPages: Math.ceil(total / +limit),
      total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// STATS ✅ FIXED (use summary.balanceAmount)
router.get('/stats/overview', async (req, res) => {
  try {
    const revenue = await Billing.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: '$summary.paidAmount' } } }
    ]);
    const outstanding = await Billing.aggregate([
      { $match: { status: { $in: ['Generated', 'Partially Paid'] } } },
      { $group: { _id: null, total: { $sum: '$summary.balanceAmount' } } }
    ]);
    res.json({
      totalRevenue: revenue[0]?.totalRevenue || 0,
      outstanding: outstanding[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats fetch failed' });
  }
});


module.exports = router;
