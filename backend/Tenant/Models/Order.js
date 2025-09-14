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
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true, index: true },
  roomNo: String,
  userId: { type: String, required: true, index: true }, // <-- Add this line

  supplierId: { type: String}, // null until accepted
  status: { type: String, enum: orderStatuses, default: 'PLACED', index: true },

  subtotalCents: { type: Number, default: 0, min: 0 },
  discountCents: { type: Number, default: 0, min: 0 },
  totalCents: { type: Number, default: 0, min: 0 },

  notes: String,
  items: { type: [orderItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },

  histories: [statusHistorySchema]
}, { timestamps: true });

/** Auto-calc totals before save (creation & item edits) */
orderSchema.pre('save', function(next) {
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
