const express = require('express');
const Inventory = require('../models/Inventory');
const router = express.Router();

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', status = '' } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const items = await Inventory.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Inventory.countDocuments(query);

    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create new inventory item
router.post('/', async (req, res) => {
  try {
    const newItem = new Inventory(req.body);
    await newItem.save();

    // Emit real-time update
    req.app.get('io').emit('inventory-item-created', newItem);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update inventory item
router.put('/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Emit real-time update
    req.app.get('io').emit('inventory-item-updated', item);

    res.json(item);
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Update stock levels
router.put('/:id/stock', async (req, res) => {
  try {
    const { quantity, operation, reason, user } = req.body; // operation: 'add' or 'subtract'
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const previousStock = item.currentStock;

    if (operation === 'add') {
      item.currentStock += quantity;
    } else if (operation === 'subtract') {
      if (item.currentStock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
      item.currentStock -= quantity;
    }

    // Add movement record
    item.movements.push({
      type: operation === 'add' ? 'IN' : 'OUT',
      quantity,
      reason,
      user: user || 'System'
    });

    await item.save();

    // Create stock movement record
    const stockMovement = {
      itemCode: item.itemCode,
      operation,
      quantity,
      reason,
      previousStock,
      newStock: item.currentStock,
      timestamp: new Date()
    };

    // Emit real-time update
    req.app.get('io').emit('inventory-stock-updated', {
      item,
      stockMovement
    });

    res.json({ item, stockMovement });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({ status: 'Low Stock' });
    res.json(lowStockItems);
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// Get out of stock items
router.get('/alerts/out-of-stock', async (req, res) => {
  try {
    const outOfStockItems = await Inventory.find({ status: 'Out of Stock' });
    res.json(outOfStockItems);
  } catch (error) {
    console.error('Get out of stock items error:', error);
    res.status(500).json({ error: 'Failed to fetch out of stock items' });
  }
});

// Get expiring items
router.get('/alerts/expiring', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + parseInt(days));

    const expiringItems = await Inventory.find({
      expiryDate: {
        $lte: alertDate,
        $gt: new Date()
      }
    });

    res.json(expiringItems);
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({ error: 'Failed to fetch expiring items' });
  }
});

// Get inventory statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalItems = await Inventory.countDocuments();
    const availableItems = await Inventory.countDocuments({ status: 'In Stock' });
    const lowStockItems = await Inventory.countDocuments({ status: 'Low Stock' });
    const outOfStockItems = await Inventory.countDocuments({ status: 'Out of Stock' });
    
    const items = await Inventory.find();
    const totalValue = items.reduce((sum, item) => 
      sum + (item.currentStock * item.unitPrice), 0
    );

    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + 30);
    const expiringItems = await Inventory.countDocuments({
      expiryDate: {
        $lte: alertDate,
        $gt: new Date()
      }
    });

    res.json({
      totalItems,
      availableItems,
      lowStockItems,
      outOfStockItems,
      totalValue: Math.round(totalValue * 100) / 100,
      expiringItems
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory statistics' });
  }
});

// Get inventory by category
router.get('/analytics/by-category', async (req, res) => {
  try {
    const categoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$unitPrice'] } },
          lowStockCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Low Stock'] }, 1, 0] }
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Out of Stock'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          totalItems: 1,
          totalValue: { $round: ['$totalValue', 2] },
          lowStockCount: 1,
          outOfStockCount: 1,
          _id: 0
        }
      }
    ]);

    res.json(categoryStats);
  } catch (error) {
    console.error('Get category analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
});

module.exports = router;