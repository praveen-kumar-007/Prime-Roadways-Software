import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Users, DollarSign, FileText, Globe, ArrowUpRight, TrendingUp, Activity, ArrowDownRight, CreditCard, RefreshCw, Clock, Truck, Package, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DashboardSkeleton } from '../components/SkeletonLoader';
import { formatDate } from '../utils/formatters';
import RupeeIcon from '../components/RupeeIcon';
import { AuthContext } from '../context/AuthContext';

const StatCard = ({ title, value, icon, subtitle, trend }) => (
  <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', margin: 0 }}>{title}</p>
        <h3 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0.25rem 0 0 0' }}>{value}</h3>
      </div>
      <div style={{ backgroundColor: '#f1f5f9', padding: '0.75rem', borderRadius: '50%', color: '#6366f1' }}>
        {icon}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
      <span style={{ color: trend.startsWith('-') ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', fontWeight: '600' }}>
        {trend.startsWith('-') ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />} {trend}
      </span>
      <span style={{ color: '#94a3b8' }}>{subtitle}</span>
    </div>
  </div>
);

const VendorDashboardView = ({ user, hasPermission }) => {
  const navigate = useNavigate();

  const showTripMis = hasPermission('tripmis');
  const showVendorMis = hasPermission('vendormis');

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100%", padding: "20px" }}>
      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        color: "white",
        borderRadius: "16px",
        padding: "3rem 2rem",
        marginBottom: "2rem",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          right: "-50px",
          top: "-50px",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }} />
        
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-block", background: "rgba(255, 255, 255, 0.1)", padding: "0.4rem 1rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "1rem", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
            Vendor Portal
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "800", margin: "0 0 0.5rem 0", letterSpacing: "-0.5px" }}>
            Welcome to Prime Roadways
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#cbd5e1", margin: 0, maxWidth: "600px", lineHeight: "1.6" }}>
            Hello, <strong style={{ color: "#ffffff" }}>{user?.name || user?.email || "Vendor"}</strong>. Select an available module below to manage your records and manifests.
          </p>
        </div>
      </div>

      {/* Available Modules Section */}
      <div style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "1.25rem", color: "#0f172a", margin: "0 0 1.25rem 0", fontWeight: "700" }}>
          Assigned Modules
        </h3>

        {(!showTripMis && !showVendorMis) ? (
          <div style={{
            background: "white",
            padding: "3rem",
            borderRadius: "12px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
            color: "#64748b"
          }}>
            <p style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", fontWeight: "600" }}>No module permissions assigned yet.</p>
            <p style={{ fontSize: "0.9rem", margin: 0 }}>Please contact an administrator to request permissions for Trip MIS or Vendor MIS.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem"
          }}>
            {showTripMis && (
              <div 
                onClick={() => navigate("/dashboard/trip-mis")}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "2rem",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.25s ease",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 10px 10px -5px rgba(99, 102, 241, 0.04)";
                  e.currentTarget.style.borderColor = "#818cf8";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    marginBottom: "1.5rem"
                  }}>
                    <Truck size={28} />
                  </div>
                  <h4 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.75rem 0" }}>
                    Trip MIS
                  </h4>
                  <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6", margin: "0 0 2rem 0" }}>
                    View, create, and print trip consignment notes, parcel details, and freight billing records.
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#4f46e5",
                  fontWeight: "600",
                  fontSize: "0.95rem"
                }}>
                  Open Trip MIS <ChevronRight size={18} />
                </div>
              </div>
            )}

            {showVendorMis && (
              <div 
                onClick={() => navigate("/dashboard/vendor-mis")}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "2rem",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.25s ease",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)";
                  e.currentTarget.style.borderColor = "#34d399";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    marginBottom: "1.5rem"
                  }}>
                    <Package size={28} />
                  </div>
                  <h4 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.75rem 0" }}>
                    Vendor Vehicle MIS
                  </h4>
                  <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.6", margin: "0 0 2rem 0" }}>
                    Submit vehicle hire bills, manage transport charges, and check payment approval status.
                  </p>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#059669",
                  fontWeight: "600",
                  fontSize: "0.95rem"
                }}>
                  Open Vendor Vehicle MIS <ChevronRight size={18} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, hasPermission } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  if (user?.role === 'Vendor') {
    return <VendorDashboardView user={user} hasPermission={hasPermission} />;
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data || null);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await fetchStats();
    } catch (error) {
      console.error('Error syncing stats:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100%", padding: "20px" }}>
      {/* Header */}
      <div className="header-flex">
        <div>
          <h3 style={{ fontSize: '1.8rem', color: '#0f172a', margin: '0 0 0.25rem 0' }}>Overview Dashboard</h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>Here's what's happening with your operations today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Last Updated: {stats?.lastUpdated ? formatDate(stats.lastUpdated) : 'Never'}
          </span>
          <button 
            onClick={handleSync}
            disabled={syncing}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: syncing ? '#94a3b8' : '#6366f1', 
              color: 'white', 
              borderRadius: '8px', 
              border: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.9rem', 
              fontWeight: '500', 
              cursor: syncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={16} className={syncing ? "spin-animation" : ""} />
            {syncing ? 'Syncing...' : 'Sync Analytics'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard title="Total Clients" value={stats?.totalClients || 0} icon={<Users size={24} />} trend="+Active" subtitle="Registered clients" />
        <StatCard title="Total Revenue" value={<span style={{ display: 'flex', alignItems: 'center' }}><RupeeIcon size={28} /> {((stats?.totalCashIn || 0) + (stats?.totalBillsAmount || 0)).toLocaleString()}</span>} icon={<DollarSign size={24} />} trend="+Gross" subtitle="Cash In & Bills" />
        <StatCard title="Total Cash Out" value={<span style={{ display: 'flex', alignItems: 'center' }}><RupeeIcon size={28} /> {(stats?.totalCashOut || 0).toLocaleString()}</span>} icon={<CreditCard size={24} />} trend="-Expense" subtitle="Recorded Cash Out" />
        <StatCard title="Total Bookings" value={stats?.totalBookings || 0} icon={<FileText size={24} />} trend="+Logistics" subtitle="Dispatched total" />
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts">
        {/* Revenue Trend Area Chart */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <TrendingUp size={20} color="#6366f1" />
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Revenue Trends (YTD)</h4>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.revenueData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: 'white' }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings by Branch Bar Chart */}
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Globe size={20} color="#10b981" />
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Bookings by Region</h4>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.bookingsData || []} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: 'white' }}
                />
                <Bar dataKey="bookings" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Leaders & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
      {/* Top Leaders Table */}
      <div>
        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#0f172a' }}>Top Leaders & Management</h4>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
          <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Employee</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Designation</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Branch</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Contact</th>
              </tr>
            </thead>
            <tbody>
              {stats?.topLeaders?.length > 0 ? (
                stats.topLeaders.map((item, index) => (
                  <tr key={index} style={{ borderBottom: index === stats.topLeaders.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={`https://ui-avatars.com/api/?name=${item.name.replace(' ', '+')}&background=6366f1&color=fff`} alt={item.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{item.role || 'Manager'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        {item.branch || 'HO'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{item.phone || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No leaders assigned.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
      
      {/* Recent Activity Feed */}
      <div>
        <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#0f172a' }}>Recent Dispatches & Activity</h4>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
          {stats?.recentActivity?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.recentActivity.map((activity, index) => (
                <div key={activity.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: index !== stats.recentActivity.length - 1 ? '1rem' : 0, borderBottom: index !== stats.recentActivity.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: activity.type === 'booking' ? '#eff6ff' : '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {activity.type === 'booking' ? <FileText size={20} color="#3b82f6" /> : <Truck size={20} color="#f97316" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <h5 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: '600' }}>{activity.title}</h5>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {formatDate(activity.timestamp?.seconds ? activity.timestamp.seconds * 1000 : activity.timestamp)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.subtitle}</p>
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: activity.status === 'Active' ? '#ecfdf5' : '#f1f5f9', color: activity.status === 'Active' ? '#10b981' : '#64748b' }}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <Activity size={48} opacity={0.2} style={{ margin: '0 auto 1rem auto' }} />
              <p>No recent activity found.</p>
            </div>
          )}
        </div>
      </div>
      
      </div>
    </div>
  );
};

export default Dashboard;
