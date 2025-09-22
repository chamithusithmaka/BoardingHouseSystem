const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const EmailService = require('../../Services/EmailService');

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid credentials.' });

    // Only allow accepted users
    if (user.status !== 'accepted')
      return res.status(403).json({ message: 'Account not approved by admin.' });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid credentials.' });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        userId: user.userId,
        name: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '', // if you have avatar
      },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );

    // Return user info similar to your context
    res.json({
      token,
      user: {
        id: user.userId,
        name: user.fullName,
        email: user.email,
        role: user.role.toLowerCase(),
        location: user.address,
        avatar: user.avatar || '',
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register User - Update this function to handle admin registration without document requirements
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      nic,
      phone,
      address,
      role,
      gender,
      age,
      occupation,
      smoking,
      alcoholic,
      cleanlinessLevel,
      noiseTolerance,
      sleepingHabit,
      socialBehavior,
      foodAllergies,
      medicalConditions,
      nicCopy,
      rentalAgreement,
      status
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { nic }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or NIC already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userData = {
      fullName,
      email,
      password: hashedPassword,
      nic,
      phone,
      address,
      role,
      // Use provided status or default from schema
      status: status || undefined
    };

    // Only add tenant-specific fields if user is a tenant
    if (role === 'Tenant') {
      Object.assign(userData, {
        gender,
        age,
        occupation,
        smoking,
        alcoholic,
        cleanlinessLevel,
        noiseTolerance,
        sleepingHabit,
        socialBehavior,
        foodAllergies,
        medicalConditions,
        nicCopy,
        rentalAgreement
      });
    }

    const user = new User(userData);
    await user.save();

    // Send registration confirmation email
    // Skip email for admin registration if you want
    if (role !== 'Admin') {
      try {
        await EmailService.sendRegistrationConfirmationEmail({
          email,
          name: fullName
        });
      } catch (emailError) {
        console.error('Error sending registration email:', emailError);
        // Continue despite email error
      }

      // Notify admin about new registration
      try {
        await EmailService.sendAdminNotification({
          subject: 'New User Registration',
          message: `A new user (${fullName}) has registered and is awaiting approval.`
        });
      } catch (emailError) {
        console.error('Error sending admin notification:', emailError);
      }
    }

    res.status(201).json({ 
      message: role === 'Admin' ? 'Admin registered successfully' : 'Registration successful. Awaiting admin approval.' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Status
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = status;
    if (status === 'rejected' && reason) {
      user.rejectionReason = reason;
    }
    
    await user.save();
    
    // Send email notification based on status
    try {
      if (status === 'accepted') {
        await EmailService.sendAccountApprovedEmail({
          email: user.email,
          name: user.fullName
        });
      } else if (status === 'rejected') {
        await EmailService.sendAccountRejectedEmail({
          email: user.email,
          name: user.fullName,
          reason: reason || 'No specific reason provided.'
        });
      }
    } catch (emailError) {
      console.error(`Error sending ${status} email:`, emailError);
    }
    
    res.status(200).json({ 
      message: `User ${status} successfully`,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        status: user.status
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Users (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOneAndDelete({ userId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    // req.userId comes from auth middleware
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password
    user.password = undefined;
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Profile
exports.updateUserProfile = async (req, res) => {
  try {
    // These fields can be updated
    const { 
      fullName, email, phone, address,
      gender, age, occupation, smoking, alcoholic,
      cleanlinessLevel, noiseTolerance, sleepingHabit, socialBehavior,
      foodAllergies, medicalConditions
    } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check email uniqueness if changed
    if (email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.userId } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update basic fields
    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    user.address = address;
    
    // Update tenant-specific fields if user is a tenant
    if (user.role === 'Tenant') {
      user.gender = gender;
      user.age = age;
      user.occupation = occupation;
      user.smoking = smoking;
      user.alcoholic = alcoholic;
      user.cleanlinessLevel = cleanlinessLevel;
      user.noiseTolerance = noiseTolerance;
      user.sleepingHabit = sleepingHabit;
      user.socialBehavior = socialBehavior;
      user.foodAllergies = foodAllergies;
      user.medicalConditions = medicalConditions;
    }
    
    await user.save();
    
    // Don't send password
    user.password = undefined;
    
    res.json({ 
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete User Account
exports.deleteUserAccount = async (req, res) => {
  try {
    // Find and delete the user
    const user = await User.findByIdAndDelete(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User Profile by ID
exports.getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't send password
    user.password = undefined;
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Profile by ID
exports.updateUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      fullName, email, phone, address,
      gender, age, occupation, smoking, alcoholic,
      cleanlinessLevel, noiseTolerance, sleepingHabit, socialBehavior,
      foodAllergies, medicalConditions
    } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check email uniqueness if changed
    if (email !== user.email) {
      const emailExists = await User.findOne({ email, userId: { $ne: userId } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update basic fields
    user.fullName = fullName;
    user.email = email;
    user.phone = phone;
    user.address = address;
    
    // Update tenant-specific fields if user is a tenant
    if (user.role === 'Tenant') {
      user.gender = gender;
      user.age = age;
      user.occupation = occupation;
      user.smoking = smoking;
      user.alcoholic = alcoholic;
      user.cleanlinessLevel = cleanlinessLevel;
      user.noiseTolerance = noiseTolerance;
      user.sleepingHabit = sleepingHabit;
      user.socialBehavior = socialBehavior;
      user.foodAllergies = foodAllergies;
      user.medicalConditions = medicalConditions;
    }
    
    await user.save();
    
    // Don't send password
    user.password = undefined;
    
    res.json({ 
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete User Account by ID
exports.deleteUserAccountById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOneAndDelete({ userId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if email or NIC is available
exports.checkAvailability = async (req, res) => {
  try {
    const { email, nic } = req.body;
    let query = {};
    
    if (email) query.email = email;
    if (nic) query.nic = nic;
    
    // If neither email nor NIC provided
    if (!email && !nic) {
      return res.status(400).json({ 
        message: 'Email or NIC is required for availability check',
        available: false
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne(query);
    
    res.json({
      available: !existingUser,
      field: email ? 'email' : 'nic'
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      available: false
    });
  }
};