const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Medical Equipment', 'Pharmaceuticals', 'Surgical Instruments', 'Consumables', 'Laboratory', 'Other']
  },
  itemCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    min: 0
  },
  maximumStock: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['pieces', 'boxes', 'bottles', 'vials', 'kg', 'liters', 'meters', 'sets']
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  location: {
    department: String,
    room: String,
    shelf: String
  },
  expiryDate: {
    type: Date
  },
  batchNumber: {
    type: String
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired', 'Damaged'],
    default: 'In Stock'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  movements: [{
    type: {
      type: String,
      enum: ['IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'DAMAGED'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: String,
    date: {
      type: Date,
      default: Date.now
    },
    user: String
  }]
}, {
  timestamps: true
});

// Update status based on stock levels
inventorySchema.pre('save', function(next) {
  if (this.currentStock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minimumStock) {
    this.status = 'Low Stock';
  } else if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'Expired';
  } else {
    this.status = 'In Stock';
  }
  next();
});

// Index for efficient queries
inventorySchema.index({ itemCode: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ status: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);