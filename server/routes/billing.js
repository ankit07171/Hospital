const express = require('express');
const Billing = require('../models/Billing');
const router = express.Router();

// Get all bills
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, billType, patientId, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (billType) query.billType = billType;
    if (patientId) query.patientId = patientId;
    if (date) {
      const filterDate = new Date(date);
      query['dates.billGenerated'] = {
        $gte: new Date(filterDate.setHours(0, 0, 0, 0)),
        $lt: new Date(filterDate.setHours(23, 59, 59, 999))
      };
    }

    const bills = await Billing.find(query)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'dates.billGenerated': -1 });

    const total = await Billing.countDocuments(query);

    res.json({
      bills,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get bill by ID
router.get('/:id', async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId personalInfo.phoneNumber medicalInfo.insuranceInfo');

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

// Create new bill
router.post('/', async (req, res) => {
  try {
    // Calculate amounts
    const services = req.body.services || [];
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    services.forEach(service => {
      const serviceTotal = service.quantity * service.unitPrice;
      const serviceDiscount = (serviceTotal * service.discount) / 100;
      const serviceTax = ((serviceTotal - serviceDiscount) * service.tax) / 100;
      
      service.totalAmount = serviceTotal - serviceDiscount + serviceTax;
      subtotal += serviceTotal;
      totalDiscount += serviceDiscount;
      totalTax += serviceTax;
    });

    const totalAmount = subtotal - totalDiscount + totalTax;
    const balanceAmount = totalAmount - (req.body.amounts?.paidAmount || 0);

    const bill = new Billing({
      ...req.body,
      services,
      amounts: {
        subtotal,
        totalDiscount,
        totalTax,
        totalAmount,
        paidAmount: req.body.amounts?.paidAmount || 0,
        balanceAmount
      },
      status: balanceAmount > 0 ? 'Generated' : 'Fully Paid'
    });

    await bill.save();

    // Populate the created bill
    await bill.populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId');

    // Emit real-time update
    req.app.get('io').emit('bill-created', bill);

    res.status(201).json(bill);
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ error: 'Failed to create bill' });
  }
});

// Add payment to bill
router.post('/:id/payments', async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const payment = {
      paymentId: `PAY${Date.now()}`,
      ...req.body,
      date: new Date()
    };

    bill.payments.push(payment);
    bill.amounts.paidAmount += payment.amount;
    bill.amounts.balanceAmount = bill.amounts.totalAmount - bill.amounts.paidAmount;
    bill.dates.lastPayment = new Date();

    // Update bill status
    if (bill.amounts.balanceAmount <= 0) {
      bill.status = 'Fully Paid';
    } else if (bill.amounts.paidAmount > 0) {
      bill.status = 'Partially Paid';
    }

    await bill.save();

    // Emit real-time update
    req.app.get('io').emit('payment-added', {
      billId: bill._id,
      payment,
      newBalance: bill.amounts.balanceAmount,
      status: bill.status
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ error: 'Failed to add payment' });
  }
});

// Update insurance claim
router.put('/:id/insurance', async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    bill.insurance = {
      ...bill.insurance,
      ...req.body
    };

    // If claim is approved, add it as a payment
    if (req.body.claimStatus === 'Approved' && req.body.approvedAmount) {
      const insurancePayment = {
        paymentId: `INS${Date.now()}`,
        amount: req.body.approvedAmount,
        method: 'Insurance',
        transactionId: req.body.claimId || `CLAIM${Date.now()}`,
        date: new Date(),
        status: 'Completed'
      };

      bill.payments.push(insurancePayment);
      bill.amounts.paidAmount += req.body.approvedAmount;
      bill.amounts.balanceAmount = bill.amounts.totalAmount - bill.amounts.paidAmount;

      // Update bill status
      if (bill.amounts.balanceAmount <= 0) {
        bill.status = 'Fully Paid';
      } else {
        bill.status = 'Partially Paid';
      }
    }

    await bill.save();

    // Emit real-time update
    req.app.get('io').emit('insurance-claim-updated', {
      billId: bill._id,
      insurance: bill.insurance,
      status: bill.status
    });

    res.json(bill);
  } catch (error) {
    console.error('Update insurance error:', error);
    res.status(500).json({ error: 'Failed to update insurance claim' });
  }
});

// Get billing statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = await Promise.all([
      // Today's revenue
      Billing.aggregate([
        { $match: { 'dates.billGenerated': { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, totalRevenue: { $sum: '$amounts.totalAmount' } } }
      ]),
      // Monthly revenue
      Billing.aggregate([
        { $match: { 'dates.billGenerated': { $gte: startOfMonth } } },
        { $group: { _id: null, totalRevenue: { $sum: '$amounts.totalAmount' } } }
      ]),
      // Outstanding amount
      Billing.aggregate([
        { $match: { status: { $in: ['Generated', 'Partially Paid'] } } },
        { $group: { _id: null, totalOutstanding: { $sum: '$amounts.balanceAmount' } } }
      ]),
      // Today's bills count
      Billing.countDocuments({ 'dates.billGenerated': { $gte: startOfDay, $lte: endOfDay } }),
      // Pending bills count
      Billing.countDocuments({ status: { $in: ['Generated', 'Partially Paid'] } }),
      // Insurance claims pending
      Billing.countDocuments({ 'insurance.claimStatus': 'Submitted' })
    ]);

    res.json({
      todayRevenue: stats[0][0]?.totalRevenue || 0,
      monthlyRevenue: stats[1][0]?.totalRevenue || 0,
      outstandingAmount: stats[2][0]?.totalOutstanding || 0,
      todayBills: stats[3],
      pendingBills: stats[4],
      pendingClaims: stats[5]
    });
  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({ error: 'Failed to fetch billing statistics' });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let groupBy, dateRange;

    const now = new Date();
    
    if (period === 'daily') {
      // Last 30 days
      dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupBy = {
        year: { $year: '$dates.billGenerated' },
        month: { $month: '$dates.billGenerated' },
        day: { $dayOfMonth: '$dates.billGenerated' }
      };
    } else {
      // Last 12 months
      dateRange = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      groupBy = {
        year: { $year: '$dates.billGenerated' },
        month: { $month: '$dates.billGenerated' }
      };
    }

    const revenueData = await Billing.aggregate([
      { $match: { 'dates.billGenerated': { $gte: dateRange } } },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$amounts.totalAmount' },
          totalBills: { $sum: 1 },
          averageBillAmount: { $avg: '$amounts.totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json(revenueData);
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Get department-wise revenue
router.get('/analytics/department-revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};

    if (startDate && endDate) {
      matchQuery['dates.billGenerated'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const departmentRevenue = await Billing.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$billType',
          totalRevenue: { $sum: '$amounts.totalAmount' },
          totalBills: { $sum: 1 },
          averageBillAmount: { $avg: '$amounts.totalAmount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    res.json(departmentRevenue);
  } catch (error) {
    console.error('Get department revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch department revenue' });
  }
});

module.exports = router;