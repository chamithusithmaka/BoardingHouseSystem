const mongoose = require('mongoose');

const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT'];
const mealSizes = ['SMALL', 'MEDIUM', 'LARGE']; // add more if needed

// Price per size schema
const sizePrice = new mongoose.Schema({
  size: { type: String, enum: mealSizes, required: true },
  priceCents: { type: Number, required: true, min: 0 }
}, { _id: false });

// Feedback subdocument
const feedbackSchema = new mongoose.Schema({
  contactName: { type: String },
  contactPhone: { type: String },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const mealSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: String,
  mealType: { type: String, enum: mealTypes, required: true, index: true },
  sizePrices: [sizePrice],
  defaultSize: { type: String, enum: mealSizes, required: true },
  image: { type: String }, // For Base64 encoded image
  isActive: { type: Boolean, default: true },

  feedbacks: [feedbackSchema],
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 }
}, { timestamps: true });

// Auto calculate rating aggregates
mealSchema.pre('save', function (next) {
  if (this.isModified('feedbacks')) {
    const count = this.feedbacks.length;
    const avg = count > 0
      ? this.feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / count
      : 0;
    this.ratingCount = count;
    this.ratingAvg = Math.round(avg * 10) / 10;
  }
  next();
});

// Virtual for getting price of default size
mealSchema.virtual('defaultPriceCents').get(function() {
  const defaultSizePrice = this.sizePrices.find(sp => sp.size === this.defaultSize);
  return defaultSizePrice ? defaultSizePrice.priceCents : 0;
});

const Meal = mongoose.model('Meal', mealSchema);
module.exports = Meal;
