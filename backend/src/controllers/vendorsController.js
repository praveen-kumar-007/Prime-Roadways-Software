const { getDb } = require('../config/database');
const { ObjectId } = require('mongodb');

function getQueryId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return id;
  }
}

exports.getVendors = async (req, res) => {
  try {
    const records = await getDb().collection('vendors')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formattedRecords = records.map(r => ({
      ...r,
      id: r._id ? r._id.toString() : (r.id || '')
    }));

    return res.status(200).json({ success: true, data: formattedRecords });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching vendors' });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const payload = req.body || {};
    
    // Generate next vendor code if not provided
    if (!payload.vendorCode) {
      const records = await getDb().collection('vendors').find({}).toArray();
      let maxCode = 0;
      records.forEach(v => {
        if (v.vendorCode) {
          const numMatch = String(v.vendorCode).match(/\d+/);
          if (numMatch) {
            const num = parseInt(numMatch[0], 10);
            if (!isNaN(num) && num > maxCode) maxCode = num;
          }
        }
      });
      payload.vendorCode = maxCode === 0 ? '101' : String(maxCode + 1).padStart(3, '0');
    }

    if (!payload.codeInitial) {
      payload.codeInitial = 'PRPL';
    }

    payload.status = payload.status || 'Active';
    payload.createdAt = new Date().toISOString();

    const result = await getDb().collection('vendors').insertOne(payload);
    const newDoc = {
      ...payload,
      id: result.insertedId.toString()
    };

    return res.status(201).json({ success: true, message: 'Vendor created successfully', data: newDoc });
  } catch (error) {
    console.error('Error creating vendor:', error);
    return res.status(500).json({ success: false, message: 'Server error creating vendor' });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const query = { $or: [{ _id: getQueryId(id) }, { id: id }] };

    const doc = await getDb().collection('vendors').findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await getDb().collection('vendors').updateOne(query, { $set: updates });

    return res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      data: { ...doc, ...updates, id: doc._id ? doc._id.toString() : id }
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return res.status(500).json({ success: false, message: 'Server error updating vendor' });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const query = { $or: [{ _id: getQueryId(id) }, { id: id }] };

    const doc = await getDb().collection('vendors').findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    await getDb().collection('vendors').deleteOne(query);

    return res.status(200).json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting vendor' });
  }
};

exports.deleteAllVendors = async (req, res) => {
  try {
    await getDb().collection('vendors').deleteMany({});
    return res.status(200).json({ success: true, message: 'All vendors deleted successfully' });
  } catch (error) {
    console.error('Error deleting all vendors:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting all vendors' });
  }
};
