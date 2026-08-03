const { getDb } = require('../config/database');
const { ObjectId } = require('mongodb');

exports.getTripMis = async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
    
    let query = {};
    if (user.role === 'Client' || user.role?.toLowerCase() === 'client') {
      const cleanName = (user.name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const clientNameRegex = new RegExp(cleanName, 'i');
      query = {
        $or: [
          { clientName: clientNameRegex },
          { client: clientNameRegex },
          { client_name: clientNameRegex },
          { clientEmail: user.email?.toLowerCase() }
        ]
      };
    } else if (!isAdmin) {
      query.createdBy = user.id;
    }

    const records = await getDb().collection('trip_mis')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Map to include id for frontend compatibility
    const formattedRecords = records.map(r => ({
      ...r,
      tripNo: (r.tripNo || '').replace(/^TRP-/i, 'PR-'),
      id: r._id.toString()
    }));

    return res.status(200).json({ success: true, data: formattedRecords });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createTripMis = async (req, res) => {
  try {
    const user = req.user;
    const payload = req.body;
    
    payload.createdAt = new Date();
    payload.createdBy = user.id;
    payload.creatorRole = user.role;
    payload.creatorEmail = user.email;
    payload.creatorName = user.name;

    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
    payload.approvalStatus = isAdmin ? 'Approved' : 'Pending';

    if (!payload.tripNo || payload.tripNo.startsWith('TRP-')) {
      const count = await getDb().collection('trip_mis').countDocuments();
      payload.tripNo = `PR-${1000 + count + 1}`;
    }

    const result = await getDb().collection('trip_mis').insertOne(payload);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Trip MIS created successfully', 
      data: { ...payload, id: result.insertedId.toString(), _id: result.insertedId } 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTripMis = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const doc = await getDb().collection('trip_mis').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    
    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
    const isClient = user.role === 'Client' || user.role?.toLowerCase() === 'client';

    if (isClient) {
      const updateData = {};
      if (req.body.approvalStatus) {
        updateData.approvalStatus = req.body.approvalStatus;
      }
      await getDb().collection('trip_mis').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      return res.status(200).json({ success: true, message: 'Trip MIS approval status updated successfully' });
    }

    if (!isAdmin && req.body.approvalStatus && req.body.approvalStatus !== doc.approvalStatus) {
      return res.status(403).json({ success: false, message: 'You are not allowed to approve/reject entries.' });
    }

    if (!isAdmin && doc.createdBy !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this entry.' });
    }
    
    delete req.body._id; 
    delete req.body.id;
    delete req.body.remarks;
    
    await getDb().collection('trip_mis').updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );
    
    return res.status(200).json({ success: true, message: 'Trip MIS updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteTripMis = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const doc = await getDb().collection('trip_mis').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    
    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
    if (user.role === 'Client' || user.role?.toLowerCase() === 'client') {
      return res.status(403).json({ success: false, message: 'Clients are not authorized to delete entries.' });
    }
    if (!isAdmin && doc.createdBy !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this entry.' });
    }
    
    await getDb().collection('trip_mis').deleteOne({ _id: new ObjectId(id) });
    
    return res.status(200).json({ success: true, message: 'Trip MIS deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.addTripMisRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const doc = await getDb().collection('trip_mis').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
    const isClient = user.role === 'Client' || user.role?.toLowerCase() === 'client';
    const isClientMatch = isClient && (doc.client?.toLowerCase() === user.name?.toLowerCase() || doc.clientEmail?.toLowerCase() === user.email?.toLowerCase());

    if (!isAdmin && !isClientMatch && doc.createdBy !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to comment on this entry.' });
    }

    const newRemark = {
      id: new ObjectId().toString(),
      senderId: user.id,
      senderName: user.name || (isAdmin ? 'Admin' : 'Vendor'),
      senderRole: user.role || 'Vendor',
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    await getDb().collection('trip_mis').updateOne(
      { _id: new ObjectId(id) },
      { $push: { remarks: newRemark } }
    );

    return res.status(200).json({ success: true, data: newRemark, message: 'Remark added successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
