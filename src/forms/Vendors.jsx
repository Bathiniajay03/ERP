import React, { useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";
// import DocumentAttachments from "../components/DocumentAttachments";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showForm, setShowForm] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const [form, setForm] = useState({
    vendorCode: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: ""
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await smartErpApi.getVendors();
      setVendors(res.data || []);
    } catch (err) {
      setMessage({ text: err?.response?.data || "Failed to load vendors", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchVendors(); 
  }, []);

  useEffect(() => {
    if (vendors.length > 0 && !selectedVendorId) {
      setSelectedVendorId(vendors[0].id);
    }
  }, [vendors, selectedVendorId]);

  // eslint-disable-next-line no-unused-vars
  const selectedVendor = useMemo(() => {
    if (!selectedVendorId) return null;
    return vendors.find((vendor) => vendor.id === Number(selectedVendorId)) ?? null;
  }, [vendors, selectedVendorId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await smartErpApi.createVendor(form);
      setMessage({ text: "✓ Vendor created successfully!", type: "success" });
      setForm({ vendorCode: "", name: "", contactPerson: "", phone: "", email: "" });
      setShowForm(false);
      fetchVendors();
    } catch (err) {
      setMessage({ text: err?.response?.data || "Failed to create vendor", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Vendor Management</h4>
            <span className="erp-text-muted small text-uppercase">Supplier Master Data & Relationships</span>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
              onClick={fetchVendors} 
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
              Refresh Data
            </button>
            <button 
              className={`btn erp-btn fw-bold ${showForm ? 'btn-secondary' : 'btn-primary'}`} 
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel Creation" : "+ Add Vendor"}
            </button>
          </div>
        </div>

        {/* ALERT */}
        {message.text && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
          }}>
            <span className="fw-semibold">{message.text}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage({ text: "", type: "" })}></button>
          </div>
        )}

        {/* CREATE FORM PANEL */}
        {showForm && (
          <div className="erp-panel shadow-sm mb-4">
            <div className="erp-panel-header bg-light">
              <span className="fw-bold">New Vendor Registration</span>
            </div>
            <div className="p-4 bg-white">
              <form onSubmit={handleCreate}>
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <label className="erp-label">Vendor Code <span className="text-danger">*</span></label>
                    <input 
                      className="form-control erp-input font-monospace" 
                      value={form.vendorCode} 
                      onChange={(e) => setForm({...form, vendorCode: e.target.value})} 
                      placeholder="e.g. VEND-001" 
                      required 
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="erp-label">Company Name <span className="text-danger">*</span></label>
                    <input 
                      className="form-control erp-input" 
                      value={form.name} 
                      onChange={(e) => setForm({...form, name: e.target.value})} 
                      placeholder="Supplier Pvt Ltd" 
                      required 
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Primary Contact Person</label>
                    <input 
                      className="form-control erp-input" 
                      value={form.contactPerson} 
                      onChange={(e) => setForm({...form, contactPerson: e.target.value})} 
                      placeholder="Jane Smith" 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="erp-label">Contact Email</label>
                    <input 
                      type="email" 
                      className="form-control erp-input" 
                      value={form.email} 
                      onChange={(e) => setForm({...form, email: e.target.value})} 
                      placeholder="contact@supplier.com" 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="erp-label">Contact Phone</label>
                    <input 
                      className="form-control erp-input font-monospace" 
                      value={form.phone} 
                      onChange={(e) => setForm({...form, phone: e.target.value})} 
                      placeholder="+91 9876543210" 
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end pt-3 border-top">
                  <button type="submit" className="btn btn-primary erp-btn px-5 py-2 fw-bold" disabled={loading}>
                    {loading ? "Processing..." : "Commit Vendor Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VENDOR DIRECTORY GRID */}
        <div className="erp-panel d-flex flex-column shadow-sm mb-4" style={{ height: "calc(100vh - 350px)", minHeight: "300px" }}>
          <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Vendor Directory</span>
            <span className="badge bg-secondary">{vendors.length} Accounts</span>
          </div>
          
          <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
            {loading && vendors.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100">
                <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }}></div>
              </div>
            ) : (
              <table className="table erp-table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Vendor Code</th>
                    <th>Company Name</th>
                    <th>Contact Person</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th className="text-center">Status</th>
                    <th className="text-end">Date Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-5 text-muted">No vendor records found. Please create your first vendor.</td></tr>
                  ) : (
                    vendors.map((vendor) => (
                      <tr 
                        key={vendor.id}
                        onClick={() => setSelectedVendorId(vendor.id)}
                        className={selectedVendorId === vendor.id ? "table-primary" : ""}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="fw-bold font-monospace text-dark">{vendor.vendorCode}</td>
                        <td className="fw-semibold text-dark">{vendor.name}</td>
                        <td>{vendor.contactPerson || "---"}</td>
                        <td>{vendor.email || "---"}</td>
                        <td className="font-monospace">{vendor.phone || "---"}</td>
                        <td className="text-center">
                          <span className={`erp-status-tag ${vendor.isActive ? "tag-success" : "tag-secondary"}`}>
                            {vendor.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="text-end text-muted small">
                          {new Date(vendor.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* DOCUMENT MANAGEMENT SECTION */}
        <div className="erp-panel shadow-sm">
          <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
            <span className="fw-bold">Vendor Document Management</span>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Context:</span>
              <select
                className="form-select form-select-sm erp-input font-monospace"
                style={{ width: '250px' }}
                value={selectedVendorId || ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedVendorId(value ? Number(value) : null);
                }}
              >
                <option value="">-- Select Vendor Context --</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorCode} - {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-white">
            {/* <DocumentAttachments
                entityType="Vendor"
                entityId={selectedVendor?.id}
                entityLabel={selectedVendor?.name || "Vendor"}
              /> 
            */}
            <div className="p-4 text-center text-muted small border-bottom border-light">
               [ DocumentAttachments Component Payload Area - Rendered when context is selected ]
            </div>
          </div>
        </div>

      </div>

      <style>{`
        /* --- ERP THEME CSS --- */
        :root {
          --erp-primary: #0f4c81;
          --erp-bg: #eef2f5;
          --erp-surface: #ffffff;
          --erp-border: #cfd8dc;
          --erp-text-main: #263238;
          --erp-text-muted: #607d8b;
        }

        .erp-app-wrapper {
          background-color: var(--erp-bg);
          color: var(--erp-text-main);
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 0.85rem;
        }

        .erp-text-muted { color: var(--erp-text-muted) !important; }

        /* Panels */
        .erp-panel {
          background: var(--erp-surface);
          border: 1px solid var(--erp-border);
          border-radius: 4px;
          overflow: hidden;
        }
        .erp-panel-header {
          border-bottom: 1px solid var(--erp-border);
          padding: 12px 16px;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #34495e;
        }

        /* Inputs & Buttons */
        .erp-input {
          border-radius: 3px;
          border-color: #b0bec5;
          font-size: 0.85rem;
          padding: 6px 10px;
        }
        .erp-input:focus {
          border-color: var(--erp-primary);
          box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
        }
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.8rem;
          padding: 6px 14px;
        }
        .erp-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }
        .erp-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #90a4ae;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--erp-border);
          padding-bottom: 4px;
          margin-bottom: 12px;
        }

        /* Data Table */
        .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
        .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
        .erp-table { font-size: 0.85rem; }
        .erp-table thead th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #cbd5e1;
          padding: 10px 16px;
          white-space: nowrap;
        }
        .erp-table tbody td {
          padding: 12px 16px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }
        .table-primary { background-color: #f0f4f8 !important; }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          white-space: nowrap;
        }
        .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
      `}</style>
    </div>
  );
}