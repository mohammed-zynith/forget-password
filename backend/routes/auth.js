import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Employee from '../models/Employee.js'
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendEmployeeCredentials, sendOTPEmail } from '../services/emailService.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        personId: user.personId,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify token
router.post('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ valid: false, message: 'User not found' });
    }

    res.json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

// Request OTP for admin password reset
router.post('/admin/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email, isActive: true });
    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'Admin user not found for this email' });
    }

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 12);

    user.resetOTP = otpHash;
    user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetVerified = false;
    await user.save();

    const emailResult = await sendOTPEmail(user.email, otp);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email', error: emailResult.error });
    }

    res.json({ message: 'OTP sent to admin email' });
  } catch (error) {
    console.error('request-password-reset error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/admin/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email, isActive: true });
    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'Admin user not found for this email' });
    }

    if (!user.resetOTP || !user.resetOTPExpires) {
      return res.status(400).json({ message: 'No OTP requested for this user' });
    }

    if (Date.now() > user.resetOTPExpires.getTime()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOTP);
    if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

    user.resetVerified = true;
    await user.save();

    res.json({ message: 'OTP verified' });
  } catch (error) {
    console.error('verify-otp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password after OTP verification
router.post('/admin/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: 'Email and newPassword are required' });

    const user = await User.findOne({ email, isActive: true });
    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'Admin user not found for this email' });
    }

    if (!user.resetVerified) return res.status(400).json({ message: 'OTP not verified' });

    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    user.resetVerified = false;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('reset-password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

  export default router;