const express = require('express');
const { Medicine, Prescription } = require('../models/Pharmacy');
const router = express.Router();

// Medicine Routes

// Get all medicines
router.get('/medicines', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = 'Available' } = req.query;
    const query = { status };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { medicineId: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const medicines = await Medicine.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Medicine.countDocuments(query);

    res.json({
      medicines,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

// Get medicine by ID
router.get('/medicines/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine' });
  }
});

// Create new medicine
router.post('/medicines', async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
    await medicine.save();

    // Emit real-time update
    req.app.get('io').emit('medicine-created', medicine);

    res.status(201).json(medicine);
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ error: 'Failed to create medicine' });
  }
});

// Update medicine
router.put('/medicines/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Emit real-time update
    req.app.get('io').emit('medicine-updated', medicine);

    res.json(medicine);
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ error: 'Failed to update medicine' });
  }
});

// Update medicine inventory
router.put('/medicines/:id/inventory', async (req, res) => {
  try {
    const { quantity, operation, batchInfo } = req.body; // operation: 'add' or 'subtract'
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (operation === 'add') {
      medicine.inventory.currentStock += quantity;
      if (batchInfo) {
        medicine.batchInfo.push(batchInfo);
      }
    } else if (operation === 'subtract') {
      if (medicine.inventory.currentStock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      medicine.inventory.currentStock -= quantity;
    }

    // Update status based on stock level
    if (medicine.inventory.currentStock === 0) {
      medicine.status = 'Out of Stock';
    } else if (medicine.inventory.currentStock <= medicine.inventory.reorderLevel) {
      medicine.status = 'Low Stock';
    } else {
      medicine.status = 'Available';
    }

    await medicine.save();

    // Emit real-time update
    req.app.get('io').emit('medicine-inventory-updated', {
      medicineId: medicine._id,
      currentStock: medicine.inventory.currentStock,
      status: medicine.status
    });

    res.json(medicine);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Prescription Routes

// Get all prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientId, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    if (date) {
      const filterDate = new Date(date);
      query.createdAt = {
        $gte: new Date(filterDate.setHours(0, 0, 0, 0)),
        $lt: new Date(filterDate.setHours(23, 59, 59, 999))
      };
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId')
      .populate('doctorId', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization')
      .populate('medicines.medicineId', 'name genericName price.sellingPrice')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Prescription.countDocuments(query);

    res.json({
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Get prescription by ID
router.get('/prescriptions/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId')
      .populate('doctorId', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization')
      .populate('medicines.medicineId', 'name genericName price.sellingPrice inventory.currentStock');

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
});

// Create new prescription
router.post('/prescriptions', async (req, res) => {
  try {
    // Calculate total amount
    let totalAmount = 0;
    for (const medicine of req.body.medicines) {
      totalAmount += medicine.price * medicine.quantity;
    }

    const prescription = new Prescription({
      ...req.body,
      totalAmount
    });

    await prescription.save();

    // Populate the created prescription
    await prescription.populate('patientId', 'personalInfo.firstName personalInfo.lastName patientId');
    await prescription.populate('doctorId', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization');
    await prescription.populate('medicines.medicineId', 'name genericName price.sellingPrice');

    // Emit real-time update
    req.app.get('io').emit('prescription-created', prescription);

    res.status(201).json(prescription);
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Dispense prescription
router.put('/prescriptions/:id/dispense', async (req, res) => {
  try {
    const { pharmacistId, pharmacistName, dispensedMedicines } = req.body;
    const prescription = await Prescription.findById(req.params.id)
      .populate('medicines.medicineId');

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Update medicine inventory and dispensed status
    for (const dispensedMed of dispensedMedicines) {
      const prescriptionMedicine = prescription.medicines.find(
        med => med._id.toString() === dispensedMed.medicineId
      );

      if (prescriptionMedicine) {
        prescriptionMedicine.dispensed = true;

        // Update medicine inventory
        const medicine = await Medicine.findById(prescriptionMedicine.medicineId._id);
        if (medicine) {
          if (medicine.inventory.currentStock < dispensedMed.quantity) {
            return res.status(400).json({
              error: `Insufficient stock for ${medicine.name}. Available: ${medicine.inventory.currentStock}`
            });
          }

          medicine.inventory.currentStock -= dispensedMed.quantity;
          
          // Update status based on stock level
          if (medicine.inventory.currentStock === 0) {
            medicine.status = 'Out of Stock';
          } else if (medicine.inventory.currentStock <= medicine.inventory.reorderLevel) {
            medicine.status = 'Low Stock';
          }

          await medicine.save();

          // Emit inventory update
          req.app.get('io').emit('medicine-inventory-updated', {
            medicineId: medicine._id,
            currentStock: medicine.inventory.currentStock,
            status: medicine.status
          });
        }
      }
    }

    // Update prescription status
    const allDispensed = prescription.medicines.every(med => med.dispensed);
    const someDispensed = prescription.medicines.some(med => med.dispensed);

    if (allDispensed) {
      prescription.status = 'Fully Dispensed';
    } else if (someDispensed) {
      prescription.status = 'Partially Dispensed';
    }

    prescription.dispensedBy = {
      pharmacistId,
      pharmacistName,
      dispensedDate: new Date()
    };

    await prescription.save();

    // Emit real-time update
    req.app.get('io').emit('prescription-dispensed', {
      prescriptionId: prescription._id,
      status: prescription.status,
      dispensedBy: prescription.dispensedBy
    });

    res.json(prescription);
  } catch (error) {
    console.error('Dispense prescription error:', error);
    res.status(500).json({ error: 'Failed to dispense prescription' });
  }
});

// Get low stock medicines
router.get('/medicines/alerts/low-stock', async (req, res) => {
  try {
    const lowStockMedicines = await Medicine.find({
      $expr: { $lte: ['$inventory.currentStock', '$inventory.reorderLevel'] }
    }).sort({ 'inventory.currentStock': 1 });

    res.json(lowStockMedicines);
  } catch (error) {
    console.error('Get low stock medicines error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock medicines' });
  }
});

// Get pharmacy statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const stats = await Promise.all([
      Medicine.countDocuments({ status: 'Available' }),
      Medicine.countDocuments({ status: 'Out of Stock' }),
      Medicine.countDocuments({ $expr: { $lte: ['$inventory.currentStock', '$inventory.reorderLevel'] } }),
      Prescription.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Prescription.countDocuments({ status: 'Pending' }),
      Prescription.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ])
    ]);

    res.json({
      availableMedicines: stats[0],
      outOfStock: stats[1],
      lowStock: stats[2],
      todayPrescriptions: stats[3],
      pendingPrescriptions: stats[4],
      todayRevenue: stats[5][0]?.totalRevenue || 0
    });
  } catch (error) {
    console.error('Get pharmacy stats error:', error);
    res.status(500).json({ error: 'Failed to fetch pharmacy statistics' });
  }
});

module.exports = router;