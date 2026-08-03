const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await getDb().collection('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
      
    const mappedUsers = users.map(u => ({
      ...u,
      id: u._id,
      permissions: u.permissions || [],
      employeeId: u.employeeId || ''
    }));
      
    return res.status(200).json({ success: true, data: mappedUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, permissions, employeeId } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existingUser = await getDb().collection('users').findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      permissions: permissions || [],
      employeeId: employeeId || '',
      createdAt: new Date(),
      failedLoginAttempts: 0,
      isBlocked: false
    };

    const result = await getDb().collection('users').insertOne(newUser);
    
    delete newUser.password;
    return res.status(201).json({ success: true, message: 'User created successfully', data: { id: result.insertedId, ...newUser } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, isBlocked, permissions, employeeId } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (isBlocked !== undefined) updates.isBlocked = isBlocked;
    if (permissions !== undefined) updates.permissions = permissions;
    if (employeeId !== undefined) updates.employeeId = employeeId;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    await getDb().collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    const updatedUser = await getDb().collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    return res.status(200).json({ 
      success: true, 
      message: 'User updated successfully',
      data: { ...updatedUser, id: updatedUser._id }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await getDb().collection('users').deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
