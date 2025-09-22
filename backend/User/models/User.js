const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nic: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    role: {
      type: String,
      enum: ["Tenant", "Owner", "MealSupplier", "Admin"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },

    // Tenant-specific fields
    gender: { type: String },
    age: { type: Number },
    occupation: {
      type: String,
      enum: ["Student", "Employee", "Other"],
    },
    smoking: { type: Boolean, default: false },
    alcoholic: { type: Boolean, default: false },
    cleanlinessLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    noiseTolerance: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    sleepingHabit: {
      type: String,
      enum: ["Early sleeper", "Night owl"],
      default: "Early sleeper",
    },
    socialBehavior: {
      type: String,
      enum: ["Introvert", "Balanced", "Extrovert"],
      default: "Balanced",
    },

    foodAllergies: { type: String },
    medicalConditions: { type: String },

    // Document uploads (base64 strings)
    nicCopy: { type: String }, // NIC copy as base64 string
    rentalAgreement: { type: String }, // Rental agreement as base64 string
    userId: {
      type: String,
      unique: true,
      index: true
    },
  },
  { timestamps: true }
);

// Auto-generate userId before saving if not present
userSchema.pre('save', async function (next) {
  if (!this.userId) {
    const User = this.constructor;

    // Generate a random number between 100000 and 999999
    let randomId;
    let isUnique = false;

    while (!isUnique) {
      randomId = `user${Math.floor(1000 + Math.random() * 9000)}`; // Random 6-digit number prefixed with 'user'
      const existingUser = await User.findOne({ userId: randomId });
      if (!existingUser) {
        isUnique = true; // Ensure the generated ID is unique
      }
    }

    this.userId = randomId;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);