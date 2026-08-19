const { getDb } = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const db = getDb();
    const tripMisCollection = db.collection('trip_mis');
    const vendorMisCollection = db.collection('vendor_mis');
    const usersCollection = db.collection('users');

    const totalBookings = await tripMisCollection.countDocuments();
    const vendorCount = await vendorMisCollection.countDocuments();
    const totalUsers = await usersCollection.countDocuments();

    // Calculate sum of Trip MIS revenue (Cash In vs Bills)
    const allTrips = await tripMisCollection.find({}).toArray();
    let totalRevenue = 0;
    let totalCashIn = 0;
    let totalBillsAmount = 0;
    const clientSet = new Set();
    const originCounts = {};

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = Array(12).fill(0);

    allTrips.forEach(trip => {
      const tripRevenue = parseFloat(trip.freight || 0) + 
                          (trip.parcels ? trip.parcels.reduce((s, p) => s + (parseFloat(p.freight) || 0) + (parseFloat(p.other) || 0), 0) : 0);
      
      totalRevenue += tripRevenue;
      
      const paymentMode = (trip.payment || '').trim().toUpperCase();
      if (paymentMode === 'PAID' || paymentMode === 'CASH') {
        totalCashIn += tripRevenue;
      } else {
        totalBillsAmount += tripRevenue;
      }

      if (trip.createdAt) {
        const d = new Date(trip.createdAt);
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          revenueByMonth[m] += tripRevenue;
        }
      }

      if (trip.clientName) clientSet.add(trip.clientName.trim().toUpperCase());
      const orig = (trip.origin || '').trim().toUpperCase();
      if (orig) {
        originCounts[orig] = (originCounts[orig] || 0) + 1;
      }
    });

    // Calculate sum of Vendor MIS expenses
    const allVendors = await vendorMisCollection.find({}).toArray();
    let totalExpenses = 0;
    allVendors.forEach(vendor => {
      totalExpenses += parseFloat(vendor.totalAmount || 0);
    });

    // Chart Data: Real Revenue by month
    const revenueData = months.map((m, i) => ({
      name: m,
      revenue: Math.round(revenueByMonth[i])
    }));

    // Bookings by Region
    const topOrigins = Object.keys(originCounts).slice(0, 5);
    const bookingsData = topOrigins.map(orig => ({
      name: orig,
      bookings: originCounts[orig]
    }));

    // Top Leaders
    const users = await usersCollection.find({}).limit(5).toArray();
    const topLeaders = users.map(u => ({
      name: u.name || u.email || 'Admin',
      role: u.role || 'Manager',
      branch: u.branch || 'HO',
      phone: u.phone || '-'
    }));

    // Recent Activity (matching frontend keys)
    const recentTrips = allTrips.slice(-5).reverse().map(t => ({
      id: t._id,
      type: 'booking',
      title: t.clientName || 'Client',
      subtitle: `New Trip #${t.tripNo || ''} from ${t.origin || '-'} to ${t.destination || '-'}`,
      status: 'Active',
      timestamp: t.createdAt || new Date()
    }));

    res.status(200).json({
      success: true,
      data: {
        totalClients: clientSet.size,
        totalCashIn: Math.round(totalCashIn),
        totalBillsAmount: Math.round(totalBillsAmount),
        totalCashOut: Math.round(totalExpenses),
        totalBookings,
        revenueData,
        bookingsData,
        topLeaders,
        recentActivity: recentTrips,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      data: null
    });
  }
};
