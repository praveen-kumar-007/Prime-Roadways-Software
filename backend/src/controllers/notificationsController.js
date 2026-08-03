const { getDb } = require('../config/database');

exports.getIncompleteNotifications = async (req, res) => {
  try {
    const incompleteItems = [];
    let total = 0;
    const collections = [
      { name: 'clients', type: 'client' },
      { name: 'vendors', type: 'vendor' },
      { name: 'cities', type: 'city' },
      { name: 'branches', type: 'branch' }
    ];

    for (const col of collections) {
      const records = await getDb().collection(col.name).find({ isIncomplete: true }).toArray();
      records.forEach(doc => {
        incompleteItems.push({
          id: doc._id ? doc._id.toString() : (doc.id || ''),
          type: col.type,
          name: col.type === 'city' ? doc.city : (doc.name || doc.client || doc.branch || 'Unknown'),
          ...doc
        });
        total++;
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Incomplete items fetched successfully',
      data: { total, items: incompleteItems }
    });
  } catch (error) {
    console.error('Error fetching incomplete items:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching incomplete items' });
  }
};
