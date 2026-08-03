const { getDb } = require('../config/database');
const { ObjectId } = require('mongodb');

exports.getVendorMis = async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';
    
    let query = {};
    if (!isAdmin) {
      query.createdBy = user.id;
    }

    const records = await getDb().collection('vendor_mis')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    const formattedRecords = records.map(r => ({
      ...r,
      id: r._id.toString()
    }));

    return res.status(200).json({ success: true, data: formattedRecords });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createVendorMis = async (req, res) => {
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
    if (payload.details && Array.isArray(payload.details)) {
      payload.details = payload.details.map(d => ({
        ...d,
        status: payload.approvalStatus
      }));
    }

    const result = await getDb().collection('vendor_mis').insertOne(payload);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Vendor MIS created successfully', 
      data: { ...payload, id: result.insertedId.toString(), _id: result.insertedId } 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateVendorMis = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const doc = await getDb().collection('vendor_mis').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    
    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';

    if (!isAdmin && req.body.approvalStatus && req.body.approvalStatus !== doc.approvalStatus) {
      return res.status(403).json({ success: false, message: 'You are not allowed to approve/reject entries.' });
    }

    if (!isAdmin && doc.createdBy !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this entry.' });
    }
    
    delete req.body._id; 
    delete req.body.id;
    
    await getDb().collection('vendor_mis').updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );
    
    return res.status(200).json({ success: true, message: 'Vendor MIS updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteVendorMis = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const doc = await getDb().collection('vendor_mis').findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    
    const isAdmin = user.role === 'Admin' || user.role === 'SuperAdmin';

    if (!isAdmin && doc.createdBy !== user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this entry.' });
    }
    
    await getDb().collection('vendor_mis').deleteOne({ _id: new ObjectId(id) });
    
    return res.status(200).json({ success: true, message: 'Vendor MIS deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
