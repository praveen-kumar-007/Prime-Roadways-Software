import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Edit2, Trash2, Plus, Download, Upload, FileText, Search, Building2 } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { useDialog } from "../context/DialogContext";
import { useToast } from "../context/ToastContext";
import { formatAllCaps, formatTitleCase } from "../utils/formatters";
import { API_BASE_URL } from "../config/api";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";

const Clients = () => {
  const { user, token } = useContext(AuthContext);
  const { confirm } = useDialog();
  const { addToast } = useToast();

  const isSuperAdmin = user?.role === 'SuperAdmin' || user?.email === 'admin@primeroadways.com';
  const isAdmin = user?.role === 'Admin' || isSuperAdmin;

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const initialFormState = {
    codeInitial: "PRPL",
    clientCode: "",
    name: "",
    gst: "",
    address: "",
    contact: "",
    email: "",
    status: "Active",
  };
  const [form, setForm] = useState(initialFormState);

  // Pagination and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setClients(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching clients", error);
      addToast("Failed to fetch clients", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setForm({
      codeInitial: item.codeInitial || "PRPL",
      clientCode: item.clientCode || "",
      name: item.name || "",
      gst: item.gst || "",
      address: item.address || "",
      contact: item.contact || "",
      email: item.email || "",
      status: item.status || "Active",
    });
    setEditing(item);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast("Client Name is required", "error");
      return;
    }

    const tempId = "temp-" + Date.now();
    try {
      if (editing) {
        setClients(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c));
        await axios.put(`${API_BASE_URL}/api/clients/${editing.id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        addToast("Client updated successfully", "success");
        setEditing(null);
      } else {
        setClients(prev => [{ ...form, id: tempId }, ...prev]);
        const res = await axios.post(`${API_BASE_URL}/api/clients`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data) {
          setClients(prev => prev.map(c => c.id === tempId ? res.data.data : c));
        } else {
          fetchClients();
        }
        addToast("Client created successfully", "success");
      }
      setForm(initialFormState);
      setIsAdding(false);
    } catch (err) {
      console.error("Save error", err);
      addToast("Failed to save client", "error");
      fetchClients();
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete Client",
      message: "Are you sure you want to delete this client? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    setClients(prev => prev.filter(c => c.id !== id));
    try {
      await axios.delete(`${API_BASE_URL}/api/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast("Client deleted successfully", "success");
    } catch (err) {
      console.error("Delete error", err);
      addToast("Failed to delete client", "error");
      fetchClients();
    }
  };

  const handleAddClick = () => {
    let maxCode = 0;
    clients.forEach(c => {
      if (c.clientCode) {
        const numericMatch = String(c.clientCode).match(/\d+/);
        if (numericMatch) {
          const code = parseInt(numericMatch[0], 10);
          if (!isNaN(code) && code > maxCode) {
            maxCode = code;
          }
        }
      }
    });

    const nextCode = maxCode === 0 ? "101" : String(maxCode + 1).padStart(3, '0');
    setForm({
      ...initialFormState,
      clientCode: nextCode
    });
    setEditing(null);
    setIsAdding(true);
  };

  const handleDeleteAll = async () => {
    const isConfirmed = await confirm({
      title: "Delete All Clients",
      message: "Are you absolutely sure you want to delete ALL clients? This action is irreversible and all client data will be permanently wiped.",
      confirmText: "Yes, Delete All",
      cancelText: "Cancel"
    });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/clients/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients([]);
      addToast("All clients deleted successfully", "success");
    } catch (err) {
      console.error("Delete all error", err);
      addToast("Failed to delete all clients", "error");
      fetchClients();
    } finally {
      setLoading(false);
    }
  };

  const handleSampleCSV = () => {
    const sample = "Client Code,Client Name,GST No,Address,Contact Person,Email,Status\nPRPL-101,ABC LOGISTICS,27AAACC4175D1Z4,MUMBAI,RAJESH KUMAR,abc@logistics.com,Active\n";
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Clients_Sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportCSV = () => {
    let csv = "Client Code,Client Name,GST No,Address,Contact Person,Email,Status\n";
    filteredClients.forEach(c => {
      const fullCode = `${c.codeInitial || 'PRPL'}-${c.clientCode || ''}`;
      csv += `"${fullCode}","${c.name || ''}","${c.gst || ''}","${c.address || ''}","${c.contact || ''}","${c.email || ''}","${c.status || 'Active'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clients_Export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast("Clients exported successfully", "success");
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!rows || rows.length === 0) {
          addToast("CSV is empty or invalid", "error");
          return;
        }

        let importedCount = 0;
        for (const row of rows) {
          const rawCode = row['Client Code'] || row['clientCode'] || '';
          const name = row['Client Name'] || row['name'] || '';
          if (!name) continue;

          const parts = rawCode.split('-');
          const codeInitial = parts.length > 1 ? parts[0] : 'PRPL';
          const clientCode = parts.length > 1 ? parts[1] : (rawCode || '');

          const clientData = {
            codeInitial,
            clientCode,
            name: formatAllCaps(name),
            gst: formatAllCaps(row['GST No'] || row['gst'] || ''),
            address: formatAllCaps(row['Address'] || row['address'] || ''),
            contact: formatTitleCase(row['Contact Person'] || row['contact'] || ''),
            email: row['Email'] || row['email'] || '',
            status: row['Status'] || row['status'] || 'Active'
          };

          try {
            await axios.post(`${API_BASE_URL}/api/clients`, clientData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            importedCount++;
          } catch (err) {
            console.error("Failed to import client row", row, err);
          }
        }
        addToast(`Successfully imported ${importedCount} clients`, "success");
        fetchClients();
      }
    });
    e.target.value = null;
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(c => {
    const query = searchQuery.toLowerCase();
    const cName = c.name || "";
    return (
      cName.toLowerCase().includes(query) ||
      (c.clientCode || "").toLowerCase().includes(query) ||
      (c.gst || "").toLowerCase().includes(query) ||
      (c.address || "").toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    const matchA = String(a.clientCode || "").match(/\d+/);
    const matchB = String(b.clientCode || "").match(/\d+/);
    const numA = matchA ? parseInt(matchA[0], 10) : 0;
    const numB = matchB ? parseInt(matchB[0], 10) : 0;
    return numB - numA;
  });

  const totalPages = Math.ceil(filteredClients.length / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredClients.slice(indexOfFirstEntry, indexOfLastEntry);

  if (!isAdmin) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', margin: '2rem', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>This page is restricted to Admin and Super Admin accounts only.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.5rem", color: "#0f172a", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={24} color="#4F46E5" />
            Clients Management
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
            Admin & Super Admin view — Manage client masters and details
          </p>
        </div>

        <div className="top-actions-container">
          <button
            type="button"
            onClick={handleSampleCSV}
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            <FileText size={16} />
            Sample CSV
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSV}
            accept=".csv"
            style={{ display: "none" }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            <Upload size={16} />
            Import CSV
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            <Download size={16} />
            Export CSV
          </button>

          {isSuperAdmin && clients.length > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.85rem"
              }}
            >
              <Trash2 size={16} />
              Delete All
            </button>
          )}

          <button
            onClick={() => {
              if (isAdding && !editing) {
                setIsAdding(false);
              } else {
                handleAddClick();
              }
            }}
            style={{
              background: "#4F46E5",
              color: "white",
              border: "none",
              padding: "0.55rem 1.25rem",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.9rem",
              boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)"
            }}
          >
            <Plus size={18} />
            {isAdding && !editing ? "Cancel" : "Add Client"}
          </button>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              backgroundColor: "white",
              padding: "1.75rem",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              marginBottom: "2rem",
              border: "1px solid #e2e8f0"
            }}
          >
            <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "1.15rem", color: "#0f172a", fontWeight: "700" }}>
              {editing ? "Edit Client" : "Create New Client"}
            </h4>

            <form onSubmit={handleSave}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "0.4rem" }}>
                    Code Prefix
                  </label>
                  <input
                    type="text"
                    value={form.codeInitial}
                    onChange={e => setForm({ ...form, codeInitial: formatAllCaps(e.target.value) })}
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "0.4rem" }}>
                    Client Code
                  </label>
                  <input
                    type="text"
                    value={form.clientCode}
                    onChange={e => setForm({ ...form, clientCode: e.target.value })}
                    placeholder="101"
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", fontWeight: "600" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "0.4rem" }}>
                    Client Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: formatAllCaps(e.target.value) })}
                    placeholder="e.g. RELIANCE LOGISTICS"
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "0.4rem" }}>
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={form.gst}
                    onChange={e => setForm({ ...form, gst: formatAllCaps(e.target.value) })}
                    placeholder="27AAACC4175D1Z4"
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "0.4rem" }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={e => setForm({ ...form, contact: formatTitleCase(e.target.value) })}
                    placeholder="e.g. Rajesh Kumar"
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "0.4rem" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@client.com"
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "0.4rem" }}>
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", backgroundColor: "white" }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#64748b", fontWeight: "600", marginBottom: "0.4rem" }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: formatAllCaps(e.target.value) })}
                    placeholder="e.g. ANDHERI EAST, MUMBAI"
                    style={{ width: "100%", padding: "0.65rem", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => { setIsAdding(false); setEditing(null); }}
                  style={{ backgroundColor: "transparent", color: "#64748b", border: "1px solid #cbd5e1", padding: "0.55rem 1.25rem", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "#4F46E5", color: "white", border: "none", padding: "0.55rem 1.5rem", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                >
                  {editing ? "Update Client" : "Save Client"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ padding: "0.35rem 0.5rem", border: "1px solid #cbd5e1", borderRadius: "4px", outline: "none" }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>entries</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.35rem 0.75rem", minWidth: "260px" }}>
          <Search size={16} color="#64748b" style={{ marginRight: "0.5rem" }} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ border: "none", outline: "none", width: "100%", fontSize: "0.9rem" }}
          />
        </div>
      </div>

      {/* Clients Table */}
      <div style={{ backgroundColor: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>Code</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>Client Name</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>GST No</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>Contact Person</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>Email</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>Address</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569", fontWeight: "700" }}>Status</th>
              <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#475569", fontWeight: "700", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Loading clients...</td>
              </tr>
            ) : currentEntries.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No clients found.</td>
              </tr>
            ) : (
              currentEntries.map(item => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "#4F46E5" }}>
                    {item.codeInitial || 'PRPL'}-{item.clientCode || ''}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: "600", color: "#0f172a" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#475569", fontFamily: "monospace" }}>
                    {item.gst || '-'}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                    {item.contact || '-'}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                    {item.email || '-'}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                    {item.address || '-'}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{
                      padding: "0.25rem 0.65rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      backgroundColor: item.status === "Active" ? "#dcfce7" : "#fee2e2",
                      color: item.status === "Active" ? "#166534" : "#991b1b"
                    }}>
                      {item.status || "Active"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        style={{ border: "1px solid #cbd5e1", background: "white", padding: "0.4rem", borderRadius: "4px", cursor: "pointer", color: "#4F46E5" }}
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        style={{ border: "1px solid #fecaca", background: "white", padding: "0.4rem", borderRadius: "4px", cursor: "pointer", color: "#ef4444" }}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredClients.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Showing <strong>{indexOfFirstEntry + 1}</strong> to <strong>{Math.min(indexOfLastEntry, filteredClients.length)}</strong> of <strong>{filteredClients.length}</strong> entries
          </div>

          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{ padding: "0.4rem 0.8rem", border: "1px solid #cbd5e1", borderRadius: "4px", background: "white", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#94a3b8" : "#0f172a" }}
            >
              Previous
            </button>
            <span style={{ display: "inline-flex", alignItems: "center", padding: "0 0.75rem", fontSize: "0.9rem", fontWeight: "600" }}>
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              style={{ padding: "0.4rem 0.8rem", border: "1px solid #cbd5e1", borderRadius: "4px", background: "white", cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer", color: (currentPage === totalPages || totalPages === 0) ? "#94a3b8" : "#0f172a" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
