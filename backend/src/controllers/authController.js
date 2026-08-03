const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const usersCollection = getDb().collection('users');
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked. Contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates = { failedLoginAttempts: attempts };
      if (attempts >= 5) updates.isBlocked = true;
      
      await usersCollection.updateOne({ _id: user._id }, { $set: updates });
      
      return res.status(401).json({ success: false, message: `Invalid credentials. ${5 - attempts} attempts remaining.` });
    }

    // Reset attempts on successful login
    await usersCollection.updateOne(
      { _id: user._id }, 
      { $set: { failedLoginAttempts: 0, isBlocked: false, lastLogin: new Date() } }
    );

    const token = generateToken(user);
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      employeeId: user.employeeId || ''
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user: userData }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const { ObjectId } = require('mongodb');

exports.getMe = async (req, res) => {
  try {
    const usersCollection = getDb().collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      employeeId: user.employeeId || ''
    };

    return res.status(200).json({ success: true, data: userData });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
