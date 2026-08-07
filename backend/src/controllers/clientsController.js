const { getDb } = require('../config/database');
const { ObjectId } = require('mongodb');

function getQueryId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return id;
  }
}

exports.getClients = async (req, res) => {
  try {
    const records = await getDb().collection('clients')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const formattedRecords = records.map(r => ({
      ...r,
      id: r._id ? r._id.toString() : (r.id || '')
    }));

    return res.status(200).json({ success: true, data: formattedRecords });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching clients' });
  }
};

exports.createClient = async (req, res) => {
  try {
    const payload = req.body || {};
    
    // Generate next client code if not provided
    if (!payload.clientCode) {
      const records = await getDb().collection('clients').find({}).toArray();
      let maxCode = 0;
      records.forEach(c => {
        if (c.clientCode) {
          const numMatch = String(c.clientCode).match(/\d+/);
          if (numMatch) {
            const num = parseInt(numMatch[0], 10);
            if (!isNaN(num) && num > maxCode) maxCode = num;
          }
        }
      });
      payload.clientCode = maxCode === 0 ? '101' : String(maxCode + 1).padStart(3, '0');
    }

    if (!payload.codeInitial) {
      payload.codeInitial = 'PRPL';
    }

    payload.status = payload.status || 'Active';
    payload.createdAt = new Date().toISOString();

    const result = await getDb().collection('clients').insertOne(payload);
    const newDoc = {
      ...payload,
      id: result.insertedId.toString()
    };

    return res.status(201).json({ success: true, message: 'Client created successfully', data: newDoc });
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({ success: false, message: 'Server error creating client' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const query = { $or: [{ _id: getQueryId(id) }, { id: id }] };

    const doc = await getDb().collection('clients').findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const updates = { ...req.body };
    delete updates._id;
    delete updates.id;

    await getDb().collection('clients').updateOne(query, { $set: updates });

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: { ...doc, ...updates, id: doc._id ? doc._id.toString() : id }
    });
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ success: false, message: 'Server error updating client' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const query = { $or: [{ _id: getQueryId(id) }, { id: id }] };
    const doc = await getDb().collection('clients').findOne(query);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    await getDb().collection('trash').insertOne({
      originalCollection: 'clients',
      document: doc,
      deletedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await getDb().collection('clients').deleteOne(query);

    return res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting client' });
  }
};

exports.deleteAllClients = async (req, res) => {
  try {
    const clients = await getDb().collection('clients').find({}).toArray();
    if (clients.length > 0) {
      const trashDocs = clients.map(doc => ({
        originalCollection: 'clients',
        document: doc,
        deletedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }));
      await getDb().collection('trash').insertMany(trashDocs);
    }
    
    await getDb().collection('clients').deleteMany({});
    res.status(200).json({ success: true, message: 'All clients moved to Trash' });
  } catch (error) {
    console.error('Error deleting all clients:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting all clients' });
  }
};
