const express = require('express');
const router = express.Router();
const Bill = require('../models/Billing');
const LabReport = require('../models/LabTest');
const { Prescription } = require('../models/Pharmacy');
const Patient = require('../models/Patient');

// Get all bills
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, billType, patientId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build query
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (billType && billType !== 'All') query.billType = billType;
    if (patientId) query.patientId = patientId;
    
    // Search in billId
    if (search) {
      query.$or = [
        { billId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const bills = await Bill.find(query)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName age personalInfo.gender patientId')
      .populate('labTests.testId')
      .populate('medicines.prescriptionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Bill.countDocuments(query);
    
    res.json({
      bills,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

// Get bill by ID
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patientId')
      .populate('labTests.testId')
      .populate('medicines.prescriptionId');
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json(bill);
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
});

// Auto-generate bill for a patient (from lab tests + medicines)
router.post('/generate/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { additionalItems, generatedBy } = req.body;

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get all completed lab tests for this patient that aren't billed yet
    const labTests = await LabReport.find({
      patientId: patientId,
      status: { $in: ['Normal', 'Abnormal', 'Critical'] }, // Any completed status
      billed: { $ne: true }
    });

    // Get all dispensed medicines for this patient that aren't billed yet
    const medicines = await Prescription.find({
      patientId: patientId,
      status: { $in: ['Fully Dispensed', 'Partially Dispensed'] },
      billed: { $ne: true }
    });

    if (labTests.length === 0 && medicines.length === 0 && (!additionalItems || additionalItems.length === 0)) {
      return res.status(400).json({ error: 'No unbilled items found for this patient' });
    }

    // Calculate lab tests total
    const labTestsData = labTests.map(test => ({
      testId: test._id,
      testName: test.testType || test.testName,
      cost: test.cost || 500,
      status: test.status
    }));
    const labTestsTotal = labTestsData.reduce((sum, test) => sum + test.cost, 0);

    // Calculate medicines total
    const medicinesData = medicines.map(prescription => {
      const totalCost = prescription.medicines.reduce((sum, med) => sum + (med.price * med.quantity), 0);
      return {
        prescriptionId: prescription._id,
        medicineName: prescription.medicines.map(m => m.name).join(', '),
        quantity: prescription.medicines.reduce((sum, m) => sum + m.quantity, 0),
        unitPrice: totalCost / prescription.medicines.reduce((sum, m) => sum + m.quantity, 0),
        total: totalCost
      };
    });
    const medicinesTotal = medicinesData.reduce((sum, med) => sum + med.total, 0);

    // Calculate other items total
    const items = additionalItems || [];
    const otherItemsTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    // Calculate totals
    const subTotal = labTestsTotal + medicinesTotal + otherItemsTotal;
    const gstAmount = subTotal * 0.18; // 18% GST
    const totalAmount = subTotal + gstAmount;

    // Create bill
    const bill = new Bill({
      patientId: patientId,
      labTests: labTestsData,
      medicines: medicinesData,
      items: items,
      summary: {
        labTestsTotal,
        medicinesTotal,
        otherItemsTotal,
        subTotal,
        gstAmount,
        totalAmount,
        paidAmount: 0,
        balanceAmount: totalAmount
      },
      status: 'Generated',
      generatedBy: generatedBy || 'System'
    });

    await bill.save();

    // Mark lab tests as billed
    await LabReport.updateMany(
      { _id: { $in: labTests.map(t => t._id) } },
      { $set: { billed: true } }
    );

    // Mark medicines as billed
    await Prescription.updateMany(
      { _id: { $in: medicines.map(m => m._id) } },
      { $set: { billed: true } }
    );

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('billing').emit('bill-generated', bill);
    }

    res.json(bill);
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ error: 'Failed to generate bill' });
  }
});

// Create manual bill
router.post('/', async (req, res) => {
  try {
    const billData = req.body;
    
    // Calculate totals if not provided
    if (!billData.summary) {
      const labTestsTotal = (billData.labTests || []).reduce((sum, test) => sum + (test.cost || 0), 0);
      const medicinesTotal = (billData.medicines || []).reduce((sum, med) => sum + (med.total || 0), 0);
      const otherItemsTotal = (billData.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
      const subTotal = labTestsTotal + medicinesTotal + otherItemsTotal;
      const gstAmount = subTotal * 0.18;
      const totalAmount = subTotal + gstAmount;
      const paidAmount = billData.paidAmount || 0;

      billData.summary = {
        labTestsTotal,
        medicinesTotal,
        otherItemsTotal,
        subTotal,
        gstAmount,
        totalAmount,
        paidAmount: paidAmount,
        balanceAmount: totalAmount - paidAmount
      };
    }

    // Determine status based on payment
    if (billData.summary.balanceAmount <= 0) {
      billData.status = 'Fully Paid';
    } else if (billData.summary.paidAmount > 0) {
      billData.status = 'Partially Paid';
    } else {
      billData.status = 'Generated';
    }

    const bill = new Bill(billData);
    await bill.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('billing').emit('bill-created', bill);
    }

    res.status(201).json(bill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ 
      error: 'Failed to create bill',
      details: error.message 
    });
  }
});

// Add payment to bill
router.post('/:id/payment', async (req, res) => {
  try {
    const { amount, method, reference } = req.body;

    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Add payment
    bill.payments.push({
      amount,
      method,
      reference,
      date: new Date()
    });

    // Update paid amount
    bill.summary.paidAmount += amount;
    bill.summary.balanceAmount = bill.summary.totalAmount - bill.summary.paidAmount;
    bill.lastPaymentDate = new Date();

    // Update status
    if (bill.summary.balanceAmount <= 0) {
      bill.status = 'Fully Paid';
    } else if (bill.summary.paidAmount > 0) {
      bill.status = 'Partially Paid';
    }

    await bill.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('billing').emit('payment-added', bill);
    }

    res.json(bill);
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ error: 'Failed to add payment' });
  }
});

// Update bill
router.put('/:id', async (req, res) => {
  try {
    const { items, paidAmount } = req.body;
    
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Update items if provided
    if (items) {
      bill.items = items;
      
      // Recalculate totals
      const labTestsTotal = (bill.labTests || []).reduce((sum, test) => sum + (test.cost || 0), 0);
      const medicinesTotal = (bill.medicines || []).reduce((sum, med) => sum + (med.total || 0), 0);
      const otherItemsTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      const subTotal = labTestsTotal + medicinesTotal + otherItemsTotal;
      const gstAmount = subTotal * 0.18;
      const totalAmount = subTotal + gstAmount;
      
      bill.summary.labTestsTotal = labTestsTotal;
      bill.summary.medicinesTotal = medicinesTotal;
      bill.summary.otherItemsTotal = otherItemsTotal;
      bill.summary.subTotal = subTotal;
      bill.summary.gstAmount = gstAmount;
      bill.summary.totalAmount = totalAmount;
    }

    // Update paid amount if provided
    if (paidAmount !== undefined) {
      bill.summary.paidAmount = paidAmount;
    }

    // Recalculate balance
    bill.summary.balanceAmount = bill.summary.totalAmount - bill.summary.paidAmount;

    // Update status based on payment
    if (bill.summary.balanceAmount <= 0) {
      bill.status = 'Fully Paid';
    } else if (bill.summary.paidAmount > 0) {
      bill.status = 'Partially Paid';
    } else {
      bill.status = 'Generated';
    }

    await bill.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('billing').emit('bill-updated', bill);
    }

    res.json(bill);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: 'Failed to update bill', details: error.message });
  }
});

// Delete bill
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Unmark lab tests and medicines as billed
    if (bill.labTests && bill.labTests.length > 0) {
      await LabReport.updateMany(
        { _id: { $in: bill.labTests.map(t => t.testId) } },
        { $set: { billed: false } }
      );
    }

    if (bill.medicines && bill.medicines.length > 0) {
      await Prescription.updateMany(
        { _id: { $in: bill.medicines.map(m => m.prescriptionId) } },
        { $set: { billed: false } }
      );
    }

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

// Get bills for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const bills = await Bill.find({ patientId: req.params.patientId })
      .populate('labTests.testId')
      .populate('medicines.prescriptionId')
      .sort({ createdAt: -1 });
    
    res.json(bills);
  } catch (error) {
    console.error('Error fetching patient bills:', error);
    res.status(500).json({ error: 'Failed to fetch patient bills' });
  }
});

module.exports = router;
