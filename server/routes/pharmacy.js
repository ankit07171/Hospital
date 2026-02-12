// const express = require('express');
// const router = express.Router();
// const { Medicine, Prescription } = require('../models/Pharmacy');
// const mongoose = require('mongoose');
// // const { generateId } = require('../utils/idGenerator'); // Helper function below


// const crypto = require('crypto');
// // Generate unique IDs
// // const generateMedicineId = () => `MED${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
// const generateMedicineId = async () => {
//   let id;
//   let exists = true;
//   while (exists) {
//     id = `MED${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
//     exists = await Medicine.exists({ medicineId: id });
//   }
//   return id;
// };
// const generatePrescriptionId = () => `PRE${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

// // GET /api/pharmacy/medicines - List medicines with pagination & filters
// router.get('/medicines', async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search = '', status = '' } = req.query;
//     const query= {};

//     if (search) {
//       query.$or = [
//         { name: { $regex: search, $options: 'i' } },
//         { genericName: { $regex: search, $options: 'i' } },
//         { medicineId: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     if (status && status !== 'All') {
//       query.status = status;
//     }

//     const skip = (Number(page) - 1) * Number(limit);
    
//     const [medicines, total] = await Promise.all([
//       Medicine.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit)),
//       Medicine.countDocuments(query)
//     ]);

//     res.json({
//       medicines,
//       total,
//       totalPages: Math.ceil(total / Number(limit)),
//       currentPage: Number(page)
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // POST /api/pharmacy/medicines - Create new medicine
// router.post('/medicines', async (req, res) => {
//   try {
//     const medicineData = { ...req.body, medicineId: await generateMedicineId() };
//     const medicine = new Medicine(medicineData);
//     await medicine.save();
//     res.status(201).json(medicine);
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: 'Medicine ID already exists' });
//     }
//     res.status(400).json({ message: error.message });
//   }
// });

// // GET /api/pharmacy/medicines/:id - Get single medicine
// router.get('/medicines/:id', async (req, res) => {
//   try {
//     const medicine = await Medicine.findById(req.params.id);
//     if (!medicine) {
//       return res.status(404).json({ message: 'Medicine not found' });
//     }
//     res.json(medicine);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // PUT /api/pharmacy/medicines/:id - Update medicine
// router.put('/medicines/:id', async (req, res) => {
//   try {
//     const medicine = await Medicine.findById(req.params.id);
//     if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
//     Object.assign(medicine, req.body);
//     await medicine.save();  // Triggers pre-save hook
//     res.json(medicine);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });


// // DELETE /api/pharmacy/medicines/:id
// router.delete('/medicines/:id', async (req, res) => {
//   try {
//     const medicine = await Medicine.findByIdAndDelete(req.params.id);
//     if (!medicine) {
//       return res.status(404).json({ message: 'Medicine not found' });
//     }
//     res.json({ message: 'Medicine deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // === PRESCRIPTIONS ROUTES ===

// // GET /api/pharmacy/prescriptions
// router.get('/prescriptions', async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search = '', status = '' } = req.query;
//     const query= {};
    
//     if (search) {
//       query.$or = [
//         { prescriptionId: { $regex: search, $options: 'i' } },
//         { patientName: { $regex: search, $options: 'i' } },
//         { doctorName: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     if (status && status !== 'All') {
//       query.status = status;
//     }

//     const skip = (Number(page) - 1) * Number(limit);
    
//     const [prescriptions, total] = await Promise.all([
//       Prescription.find(query)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(Number(limit)),
//         // .populate('medicines.name'),
//       Prescription.countDocuments(query)
//     ]);

//     res.json({
//       prescriptions,
//       total,
//       totalPages: Math.ceil(total / Number(limit)),
//       currentPage: Number(page)
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // POST /api/pharmacy/prescriptions
// router.post('/prescriptions', async (req, res) => {
//   try {
//     const prescriptionData = { 
//       ...req.body, 
//       prescriptionId: await generatePrescriptionId(),
//       totalAmount: req.body.medicines.reduce((sum, med) => sum + (med.price * med.quantity), 0)
//     };
//     const prescription = new Prescription(prescriptionData);
//     await prescription.save();
//     res.status(201).json(prescription);
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: 'Prescription ID already exists' });
//     }
//     res.status(400).json({ message: error.message });
//   }
// });

// // GET /api/pharmacy/prescriptions/:id
// router.get('/prescriptions/:id', async (req, res) => {
//   try {
//     const prescription = await Prescription.findById(req.params.id);
//     if (!prescription) {
//       return res.status(404).json({ message: 'Prescription not found' });
//     }
//     res.json(prescription);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // PUT /api/pharmacy/prescriptions/:id
// router.put('/prescriptions/:id', async (req, res) => {
//   try {
//     const prescription = await Prescription.findById(req.params.id);
//     if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
//     Object.assign(prescription, req.body);
//     await prescription.save();  // Triggers status hook
//     res.json(prescription);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });


// // DELETE /api/pharmacy/prescriptions/:id
// router.delete('/prescriptions/:id', async (req, res) => {
//   try {
//     const prescription = await Prescription.findByIdAndDelete(req.params.id);
//     if (!prescription) {
//       return res.status(404).json({ message: 'Prescription not found' });
//     }
//     res.json({ message: 'Prescription deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // PATCH /api/pharmacy/prescriptions/:id/dispense - Dispense specific medicine
// router.patch('/prescriptions/:id/dispense', async (req, res) => {
//   const { medicineIndex } = req.body;
//   const prescription = await Prescription.findById(req.params.id).populate('medicines.medicineId');
//   if (!prescription || medicineIndex < 0 || medicineIndex >= prescription.medicines.length) {
//     return res.status(400).json({ message: 'Invalid prescription or index' });
//   }
//   const medItem = prescription.medicines[medicineIndex];
//   if (medItem.dispensed) return res.status(400).json({ message: 'Already dispensed' });

//   const medicine = await Medicine.findOne({ medicineId: medItem.medicineId });
//   if (!medicine || medicine.inventory.currentStock < medItem.quantity) {
//     return res.status(400).json({ message: 'Insufficient stock' });
//   }

//   medItem.dispensed = true;
//   medicine.inventory.currentStock -= medItem.quantity;
//   await Promise.all([prescription.save(), medicine.save()]);  // Both hooks trigger
//   res.json(prescription);
// });


// module.exports = router;










const express = require('express');
const router = express.Router();
const { Medicine, Prescription } = require('../models/Pharmacy');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Utility: Generate unique IDs with collision checking
const generateMedicineId = async () => {
  let id;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (exists && attempts < maxAttempts) {
    id = `MED${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    exists = await Medicine.exists({ medicineId: id });
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique medicine ID');
  }

  return id;
};

const generatePrescriptionId = async () => {
  let id;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  while (exists && attempts < maxAttempts) {
    id = `PRX${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    exists = await Prescription.exists({ prescriptionId: id });
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique prescription ID');
  }

  return id;
};

// Input validation helpers
const validateMedicine = (data) => {
  const errors = [];

  if (!data.name?.trim()) errors.push('Medicine name is required');
  if (!data.genericName?.trim()) errors.push('Generic name is required');
  if (!data.manufacturer?.trim()) errors.push('Manufacturer is required');
  if (!data.category) errors.push('Category is required');

  if (!data.price?.mrp || data.price.mrp <= 0) {
    errors.push('Valid MRP is required');
  }
  if (!data.price?.sellingPrice || data.price.sellingPrice <= 0) {
    errors.push('Valid selling price is required');
  }
  if (data.price?.sellingPrice > data.price?.mrp) {
    errors.push('Selling price cannot exceed MRP');
  }

  if (data.inventory?.currentStock < 0) {
    errors.push('Current stock cannot be negative');
  }
  if (data.inventory?.minimumStock < 0) {
    errors.push('Minimum stock cannot be negative');
  }

  if (data.expiryDate && new Date(data.expiryDate) <= new Date()) {
    errors.push('Expiry date must be in the future');
  }

  return errors;
};

const validatePrescription = (data) => {
  const errors = [];

  if (!data.patientName?.trim()) errors.push('Patient name is required');
  if (!data.doctorName?.trim()) errors.push('Doctor name is required');
  
  if (!data.medicines || !Array.isArray(data.medicines) || data.medicines.length === 0) {
    errors.push('At least one medicine is required');
  } else {
    data.medicines.forEach((med, index) => {
      if (!med.name?.trim()) errors.push(`Medicine ${index + 1}: Name is required`);
      if (!med.dosage?.trim()) errors.push(`Medicine ${index + 1}: Dosage is required`);
      if (!med.quantity || med.quantity <= 0) errors.push(`Medicine ${index + 1}: Valid quantity is required`);
      if (!med.price || med.price <= 0) errors.push(`Medicine ${index + 1}: Valid price is required`);
    });
  }

  return errors;
};

// ===== MEDICINES ROUTES =====

// GET /api/pharmacy/medicines - List medicines with pagination & filters
router.get('/medicines', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      category = '',
      expiryWarning = '' 
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { medicineId: searchRegex },
        { manufacturer: searchRegex }
      ];
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Expiry warning filter
    if (expiryWarning === 'true') {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 90); // 90 days warning
      query.expiryDate = { $lte: warningDate, $gte: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [medicines, total] = await Promise.all([
      Medicine.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Medicine.countDocuments(query)
    ]);

    // Calculate additional stats
    const stats = await Medicine.aggregate([
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          totalValue: [
            { 
              $group: { 
                _id: null, 
                value: { 
                  $sum: { 
                    $multiply: ['$inventory.currentStock', '$price.sellingPrice'] 
                  } 
                } 
              } 
            }
          ],
          expiringSoon: [
            {
              $match: {
                expiryDate: {
                  $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                  $gte: new Date()
                }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    res.json({
      medicines,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      stats: {
        statusCounts: stats[0].statusCounts,
        totalValue: stats[0].totalValue[0]?.value || 0,
        expiringSoon: stats[0].expiringSoon[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ message: 'Failed to fetch medicines', error: error.message });
  }
});

// POST /api/pharmacy/medicines - Create new medicine
router.post('/medicines', async (req, res) => {
  try {
    // Validate input
    const validationErrors = validateMedicine(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    const medicineData = { 
      ...req.body, 
      medicineId: await generateMedicineId() 
    };

    const medicine = new Medicine(medicineData);
    await medicine.save();

    res.status(201).json({
      message: 'Medicine created successfully',
      medicine
    });
  } catch (error) {
    console.error('Error creating medicine:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Medicine with this ID already exists' });
    }
    res.status(400).json({ message: 'Failed to create medicine', error: error.message });
  }
});

// GET /api/pharmacy/medicines/:id - Get single medicine
router.get('/medicines/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json(medicine);
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ message: 'Failed to fetch medicine', error: error.message });
  }
});

// PUT /api/pharmacy/medicines/:id - Update medicine
router.put('/medicines/:id', async (req, res) => {
  try {
    // Don't allow updating medicineId
    delete req.body.medicineId;

    // Validate input
    const validationErrors = validateMedicine(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    Object.assign(medicine, req.body);
    await medicine.save(); // Triggers pre-save hook

    res.json({
      message: 'Medicine updated successfully',
      medicine
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(400).json({ message: 'Failed to update medicine', error: error.message });
  }
});

// DELETE /api/pharmacy/medicines/:id
router.delete('/medicines/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ message: 'Failed to delete medicine', error: error.message });
  }
});

// PATCH /api/pharmacy/medicines/bulk-delete - Bulk delete medicines
router.patch('/medicines/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid IDs provided' });
    }

    const result = await Medicine.deleteMany({ _id: { $in: ids } });

    res.json({ 
      message: `Successfully deleted ${result.deletedCount} medicine(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error bulk deleting medicines:', error);
    res.status(500).json({ message: 'Failed to delete medicines', error: error.message });
  }
});

// ===== PRESCRIPTIONS ROUTES =====

// GET /api/pharmacy/prescriptions
router.get('/prescriptions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      dateFrom = '',
      dateTo = ''
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { prescriptionId: searchRegex },
        { patientName: searchRegex },
        { doctorName: searchRegex }
      ];
    }

    // Status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Prescription.countDocuments(query)
    ]);

    // Calculate stats
    const stats = await Prescription.aggregate([
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          totalRevenue: [
            { 
              $match: { 
                status: { $in: ['Fully Dispensed', 'Partially Dispensed'] } 
              } 
            },
            { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
          ],
          todayCount: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  $lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    res.json({
      prescriptions,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      stats: {
        statusCounts: stats[0].statusCounts,
        totalRevenue: stats[0].totalRevenue[0]?.revenue || 0,
        todayCount: stats[0].todayCount[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
});

// POST /api/pharmacy/prescriptions
router.post('/prescriptions', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate input
    const validationErrors = validatePrescription(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    // Calculate total amount
    const totalAmount = req.body.medicines.reduce(
      (sum, med) => sum + (med.price * med.quantity), 
      0
    );

    const prescriptionData = {
      ...req.body,
      prescriptionId: await generatePrescriptionId(),
      totalAmount
    };

    const prescription = new Prescription(prescriptionData);
    await prescription.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating prescription:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Prescription with this ID already exists' });
    }
    res.status(400).json({ message: 'Failed to create prescription', error: error.message });
  } finally {
    session.endSession();
  }
});

// GET /api/pharmacy/prescriptions/:id
router.get('/prescriptions/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
});

// PUT /api/pharmacy/prescriptions/:id
router.put('/prescriptions/:id', async (req, res) => {
  try {
    // Don't allow updating prescriptionId
    delete req.body.prescriptionId;

    // Validate input
    const validationErrors = validatePrescription(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    // Recalculate total amount
    if (req.body.medicines) {
      req.body.totalAmount = req.body.medicines.reduce(
        (sum, med) => sum + (med.price * med.quantity), 
        0
      );
    }

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({
      message: 'Prescription updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(400).json({ message: 'Failed to update prescription', error: error.message });
  }
});

// DELETE /api/pharmacy/prescriptions/:id
router.delete('/prescriptions/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ message: 'Failed to delete prescription', error: error.message });
  }
});

// PATCH /api/pharmacy/prescriptions/:id/dispense - Dispense specific medicine
router.patch('/prescriptions/:id/dispense', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { medicineIndex } = req.body;
    const prescription = await Prescription.findById(req.params.id).session(session);

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (medicineIndex < 0 || medicineIndex >= prescription.medicines.length) {
      throw new Error('Invalid medicine index');
    }

    const prescribedMedicine = prescription.medicines[medicineIndex];

    // Check if already dispensed
    if (prescribedMedicine.dispensed) {
      throw new Error('Medicine already dispensed');
    }

    // Find and update medicine stock
    const medicineDoc = await Medicine.findOne({ 
      name: prescribedMedicine.name 
    }).session(session);

    if (medicineDoc) {
      if (medicineDoc.inventory.currentStock < prescribedMedicine.quantity) {
        throw new Error(
          `Insufficient stock for ${medicineDoc.name}. Available: ${medicineDoc.inventory.currentStock}, Required: ${prescribedMedicine.quantity}`
        );
      }

      medicineDoc.inventory.currentStock -= prescribedMedicine.quantity;
      await medicineDoc.save({ session });
    }

    // Mark as dispensed
    prescription.medicines[medicineIndex].dispensed = true;
    await prescription.save({ session });

    await session.commitTransaction();

    res.json({
      message: 'Medicine dispensed successfully',
      prescription
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error dispensing medicine:', error);
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// PATCH /api/pharmacy/prescriptions/:id/cancel - Cancel prescription
router.patch('/prescriptions/:id/cancel', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (prescription.status === 'Fully Dispensed') {
      return res.status(400).json({ 
        message: 'Cannot cancel a fully dispensed prescription' 
      });
    }

    prescription.status = 'Cancelled';
    await prescription.save();

    res.json({
      message: 'Prescription cancelled successfully',
      prescription
    });
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    res.status(500).json({ message: 'Failed to cancel prescription', error: error.message });
  }
});

// GET /api/pharmacy/dashboard-stats - Dashboard statistics
router.get('/dashboard-stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [medicineStats, prescriptionStats] = await Promise.all([
      Medicine.aggregate([
        {
          $facet: {
            totalMedicines: [{ $count: 'count' }],
            lowStock: [
              { 
                $match: { 
                  $expr: { $lte: ['$inventory.currentStock', '$inventory.minimumStock'] } 
                } 
              },
              { $count: 'count' }
            ],
            outOfStock: [
              { $match: { status: 'Out of Stock' } },
              { $count: 'count' }
            ],
            totalValue: [
              {
                $group: {
                  _id: null,
                  value: {
                    $sum: {
                      $multiply: ['$inventory.currentStock', '$price.sellingPrice']
                    }
                  }
                }
              }
            ],
            expiringSoon: [
              {
                $match: {
                  expiryDate: {
                    $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    $gte: new Date()
                  }
                }
              },
              { $count: 'count' }
            ]
          }
        }
      ]),
      Prescription.aggregate([
        {
          $facet: {
            todayPrescriptions: [
              { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
              { $count: 'count' }
            ],
            pendingPrescriptions: [
              { $match: { status: 'Pending' } },
              { $count: 'count' }
            ],
            todayRevenue: [
              { 
                $match: { 
                  createdAt: { $gte: today, $lt: tomorrow },
                  status: { $in: ['Fully Dispensed', 'Partially Dispensed'] }
                } 
              },
              { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
            ],
            totalRevenue: [
              { 
                $match: { 
                  status: { $in: ['Fully Dispensed', 'Partially Dispensed'] }
                } 
              },
              { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
            ]
          }
        }
      ])
    ]);

    res.json({
      medicines: {
        total: medicineStats[0].totalMedicines[0]?.count || 0,
        lowStock: medicineStats[0].lowStock[0]?.count || 0,
        outOfStock: medicineStats[0].outOfStock[0]?.count || 0,
        totalValue: medicineStats[0].totalValue[0]?.value || 0,
        expiringSoon: medicineStats[0].expiringSoon[0]?.count || 0
      },
      prescriptions: {
        today: prescriptionStats[0].todayPrescriptions[0]?.count || 0,
        pending: prescriptionStats[0].pendingPrescriptions[0]?.count || 0,
        todayRevenue: prescriptionStats[0].todayRevenue[0]?.revenue || 0,
        totalRevenue: prescriptionStats[0].totalRevenue[0]?.revenue || 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics', error: error.message });
  }
});

module.exports = router;