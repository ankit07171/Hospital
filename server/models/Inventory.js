const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    enum: ['Medicine', 'Equipment', 'Consumable', 'Surgical', 'Laboratory', 'Other'],
    required: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  supplier: {
    type: String,
    trim: true
  },
  
  // Stock Information
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    default: 10
  },
  maximumStock: {
    type: Number,
    default: 1000
  },
  reorderLevel: {
    type: Number,
    default: 20
  },
  unit: {
    type: String,
    required: true,
    default: 'pieces'
  },
  
  // Pricing
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    min: 0
  },
  
  // Batch Information
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date,
    index: true
  },
  manufacturingDate: {
    type: Date
  },
  
  // Location
  location: {
    building: String,
    floor: String,
    room: String,
    shelf: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['Available', 'Low Stock', 'Out of Stock', 'Expired', 'Discontinued'],
    default: 'Available',
    index: true
  },
  
  // Transaction History
  transactions: [{
    type: {
      type: String,
      enum: ['Purchase', 'Usage', 'Return', 'Adjustment', 'Expired', 'Damaged']
    },
    quantity: Number,
    date: {
      type: Date,
      default: Date.now
    },
    performedBy: String,
    notes: String,
    referenceId: String // Link to bill, prescription, etc.
  }],
  
  // Metadata
  lastRestocked: Date,
  lastUsed: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
inventorySchema.index({ name: 'text', description: 'text' });
inventorySchema.index({ category: 1, status: 1 });
inventorySchema.index({ currentStock: 1 });

// Auto-generate itemId
inventorySchema.pre('save', async function(next) {
  if (!this.itemId) {
    const count = await mongoose.model('Inventory').countDocuments();
    this.itemId = `INV${String(count + 1).padStart(6, '0')}`;
  }
  
  // Update status based on stock levels
  if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minimumStock) {
    this.status = 'Low Stock';
  } else if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
    this.status = 'Expired';
  } else {
    this.status = 'Available';
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual for stock percentage
inventorySchema.virtual('stockPercentage').get(function() {
  if (this.maximumStock === 0) return 0;
  return Math.min(100, (this.currentStock / this.maximumStock) * 100);
});

// Virtual for days until expiry
inventorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const days = Math.floor((new Date(this.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  return days;
});

// Method to add stock
inventorySchema.methods.addStock = function(quantity, performedBy, notes = '') {
  this.currentStock += quantity;
  this.lastRestocked = new Date();
  this.transactions.push({
    type: 'Purchase',
    quantity,
    performedBy,
    notes,
    date: new Date()
  });
  return this.save();
};

// Method to use stock
inventorySchema.methods.useStock = function(quantity, performedBy, referenceId = '', notes = '') {
  if (this.currentStock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.currentStock -= quantity;
  this.lastUsed = new Date();
  this.transactions.push({
    type: 'Usage',
    quantity: -quantity,
    performedBy,
    referenceId,
    notes,
    date: new Date()
  });
  return this.save();
};

// Static method to get low stock items
inventorySchema.statics.getLowStockItems = function() {
  return this.find({
    $or: [
      { status: 'Low Stock' },
      { status: 'Out of Stock' }
    ]
  }).sort({ currentStock: 1 });
};

// Static method to get expiring items
inventorySchema.statics.getExpiringItems = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  }).sort({ expiryDate: 1 });
};

module.exports = mongoose.model('Inventory', inventorySchema);
