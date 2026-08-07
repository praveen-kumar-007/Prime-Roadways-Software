const { getDb } = require('../config/database');
const { ObjectId } = require('mongodb');

// Get all items in the trash, optionally filtering by collection
exports.getTrash = async (req, res) => {
  try {
    const { collection } = req.query;
    const query = {};
    if (collection) {
      query.originalCollection = collection;
    }

    // Sort by deletedAt descending (newest first)
    const trashItems = await getDb().collection('trash')
      .find(query)
      .sort({ deletedAt: -1 })
      .toArray();

    res.status(200).json({ success: true, count: trashItems.length, data: trashItems });
  } catch (error) {
    console.error('Error fetching trash:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Restore an item from trash back to its original collection
exports.restoreTrash = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the item in the trash
    const trashItem = await getDb().collection('trash').findOne({ _id: new ObjectId(id) });
    
    if (!trashItem) {
      return res.status(404).json({ success: false, error: 'Trash item not found' });
    }

    const { originalCollection, document } = trashItem;

    // Remove the _id from the restored document if it causes issues, but we want to keep the original _id
    // Make sure document has its original _id as an ObjectId
    if (document._id && typeof document._id === 'string') {
      document._id = new ObjectId(document._id);
    }

    // Insert back into original collection
    await getDb().collection(originalCollection).insertOne(document);

    // Delete from trash
    await getDb().collection('trash').deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ success: true, message: 'Item restored successfully' });
  } catch (error) {
    console.error('Error restoring trash item:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Force permanently delete an item from trash
exports.forceDeleteTrash = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await getDb().collection('trash').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Trash item not found' });
    }

    res.status(200).json({ success: true, message: 'Item permanently deleted' });
  } catch (error) {
    console.error('Error force deleting trash item:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Clear all items from trash
exports.clearTrash = async (req, res) => {
  try {
    await getDb().collection('trash').deleteMany({});
    res.status(200).json({ success: true, message: 'Trash emptied successfully' });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
