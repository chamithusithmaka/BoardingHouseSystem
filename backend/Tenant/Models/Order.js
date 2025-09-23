const mongoose = require('mongoose');

const orderStatuses = ['PLACED','ACCEPTED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'];
const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT'];

const orderItemSchema = new mongoose.Schema({
  mealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true, index: true },
  mealType: { type: String, enum: mealTypes, required: true, index: true }, // snapshot
  nameSnapshot: { type: String, required: true },
  unitPriceCentsSnap: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
  lineTotalCents: { type: Number, required: true, min: 0 }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  fromStatus: { type: String, enum: orderStatuses },
  toStatus: { type: String, enum: orderStatuses, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: String // supplier user/email or system
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    index: true
  },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true, index: true },
  roomNo: String,
  userId: { type: String, required: true, index: true },

  supplierId: { type: String}, // null until accepted
  status: { type: String, enum: orderStatuses, default: 'PLACED', index: true },

  subtotalCents: { type: Number, default: 0, min: 0 },
  discountCents: { type: Number, default: 0, min: 0 },
  totalCents: { type: Number, default: 0, min: 0 },

  notes: String,
  items: { type: [orderItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },

  histories: [statusHistorySchema]
}, { timestamps: true });

// Auto-generate orderId if not present
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    // Generate a unique orderId using timestamp and random number
    this.orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (this.isModified('items') || this.isNew) {
    const subtotal = (this.items || []).reduce((sum, it) => sum + (it.lineTotalCents || 0), 0);
    this.subtotalCents = subtotal;
    this.totalCents = Math.max(0, subtotal - (this.discountCents || 0));
  }
  next();
});

/** Helper to push status history consistently */
orderSchema.methods.updateStatus = async function(newStatus, changedBy) {
  if (!newStatus || !['ACCEPTED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED'].includes(newStatus)) {
    throw new Error('Invalid new status');
  }
  const from = this.status;
  this.status = newStatus;
  this.histories = this.histories || [];
  this.histories.push({ fromStatus: from, toStatus: newStatus, changedBy, changedAt: new Date() });
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
