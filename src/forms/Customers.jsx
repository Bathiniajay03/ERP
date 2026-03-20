import React, { useCallback, useEffect, useState } from "react";
import api from "../services/apiClient";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [form, setForm] = useState({
    customerCode: "",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    customerType: "Retail",
    paymentTerms: "Net30",
    creditLimit: 0,
    notes: ""
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers");
      setCustomers(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/customers", form);
      setMessage("✓ Customer created successfully!");
      setForm({ customerCode: "", companyName: "", contactPerson: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "", country: "India", customerType: "Retail", paymentTerms: "Net30", creditLimit: 0, notes: "" });
      setShowForm(false);
      fetchCustomers();
    } catch (err) {
      setMessage(err?.response?.data || "⚠ Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setSelectedCustomer(res.data);
    } catch (err) {
      setMessage(err?.response?.data || "⚠ Failed to load customer details");
    }
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Customer Master Data</h4>
            <span className="erp-text-muted small text-uppercase">Account Management & Directory</span>
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
              onClick={fetchCustomers} 
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
              Refresh Data
            </button>
            <button 
              className={`btn erp-btn fw-bold ${showForm ? 'btn-secondary' : 'btn-primary'}`} 
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Cancel Creation" : "+ Register New Customer"}
            </button>
          </div>
        </div>

        {/* ALERT */}
        {message && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: message.includes("✓") ? '#f0fdf4' : message.includes("⚠") ? '#fffbeb' : '#fef2f2',
            color: message.includes("✓") ? '#166534' : message.includes("⚠") ? '#92400e' : '#991b1b',
            border: `1px solid ${message.includes("✓") ? '#bbf7d0' : message.includes("⚠") ? '#fde68a' : '#fecaca'}`
          }}>
            <span className="fw-semibold">{message}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* CREATE FORM PANEL */}
        {showForm && (
          <div className="erp-panel shadow-sm mb-4">
            <div className="erp-panel-header bg-light">
              <span className="fw-bold">New Customer Registration</span>
            </div>
            <div className="p-4 bg-white">
              <form onSubmit={handleCreate}>
                
                <h6 className="erp-section-title mb-3">Primary Details</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <label className="erp-label">Customer Code <span className="text-danger">*</span></label>
                    <input className="form-control erp-input font-monospace" value={form.customerCode} onChange={(e) => setForm({...form, customerCode: e.target.value})} placeholder="e.g. CUST-001" required />
                  </div>
                  <div className="col-md-5">
                    <label className="erp-label">Company Name <span className="text-danger">*</span></label>
                    <input className="form-control erp-input" value={form.companyName} onChange={(e) => setForm({...form, companyName: e.target.value})} placeholder="Registered Entity Name" required />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Customer Type</label>
                    <select className="form-select erp-input" value={form.customerType} onChange={(e) => setForm({...form, customerType: e.target.value})}>
                      <option>Retail</option>
                      <option>Wholesale</option>
                      <option>Distributor</option>
                      <option>Corporate</option>
                    </select>
                  </div>
                </div>

                <h6 className="erp-section-title mb-3">Contact Information</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="erp-label">Primary Contact</label>
                    <input className="form-control erp-input" value={form.contactPerson} onChange={(e) => setForm({...form, contactPerson: e.target.value})} placeholder="Full Name" />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Email Address</label>
                    <input type="email" className="form-control erp-input" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="email@domain.com" />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Phone Number</label>
                    <input className="form-control erp-input font-monospace" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+91 0000000000" />
                  </div>
                  <div className="col-md-12 mt-3">
                    <label className="erp-label">Registered Address</label>
                    <input className="form-control erp-input" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="Street address, building, suite..." />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">City</label>
                    <input className="form-control erp-input" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} placeholder="City" />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">State / Province</label>
                    <input className="form-control erp-input" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} placeholder="State" />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Zip / Postal Code</label>
                    <input className="form-control erp-input font-monospace" value={form.zipCode} onChange={(e) => setForm({...form, zipCode: e.target.value})} placeholder="ZIP Code" />
                  </div>
                </div>

                <h6 className="erp-section-title mb-3">Financial Terms</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="erp-label">Payment Terms</label>
                    <select className="form-select erp-input" value={form.paymentTerms} onChange={(e) => setForm({...form, paymentTerms: e.target.value})}>
                      <option>Net30</option>
                      <option>Net60</option>
                      <option>Net90</option>
                      <option>COD</option>
                      <option>Advance</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Credit Limit (₹)</label>
                    <input type="number" className="form-control erp-input font-monospace text-end" value={form.creditLimit} onChange={(e) => setForm({...form, creditLimit: Number(e.target.value)})} placeholder="0.00" min="0" />
                  </div>
                  <div className="col-12 mt-3">
                    <label className="erp-label">Internal Notes</label>
                    <textarea className="form-control erp-input" rows="2" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Account specific notes..."></textarea>
                  </div>
                </div>

                <div className="d-flex justify-content-end pt-3 border-top">
                  <button type="submit" className="btn btn-primary erp-btn px-5 py-2 fw-bold" disabled={loading}>
                    {loading ? "Processing..." : "Commit Customer Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOMER DIRECTORY GRID */}
        <div className="erp-panel d-flex flex-column shadow-sm" style={{ height: "calc(100vh - 180px)" }}>
          <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Customer Directory</span>
            <span className="badge bg-secondary">{customers.length} Accounts</span>
          </div>
          
          <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
            {loading && customers.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100">
                <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }}></div>
              </div>
            ) : (
              <table className="table erp-table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Customer Code</th>
                    <th>Company Name</th>
                    <th>Primary Contact</th>
                    <th>Type</th>
                    <th className="text-end">Credit Limit</th>
                    <th className="text-center" style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-4 text-muted">No customer records found.</td></tr>
                  ) : (
                    customers.map((cust) => (
                      <tr key={cust.id}>
                        <td className="fw-bold font-monospace text-dark">{cust.customerCode}</td>
                        <td className="fw-semibold text-dark">{cust.companyName}</td>
                        <td>
                          <div className="text-dark">{cust.contactPerson || "---"}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>{cust.email || cust.phone || ""}</div>
                        </td>
                        <td>
                          <span className={`erp-status-tag ${cust.customerType === "Wholesale" || cust.customerType === "Corporate" ? "tag-info" : "tag-secondary"}`}>
                            {cust.customerType}
                          </span>
                        </td>
                        <td className="text-end font-monospace">₹{(cust.creditLimit || 0).toLocaleString()}</td>
                        <td className="text-center">
                          <button className="btn btn-light btn-sm border erp-btn" onClick={() => handleViewDetails(cust.id)}>View</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOMER DETAILS MODAL */}
      {selectedCustomer && (
        <div className="erp-modal-overlay" onClick={() => setSelectedCustomer(null)}>
          <div className="erp-dialog erp-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="erp-dialog-header">
              <div>
                <h5 className="m-0 fw-bold">{selectedCustomer.companyName}</h5>
                <small className="opacity-75 font-monospace">{selectedCustomer.customerCode}</small>
              </div>
              <button className="btn-close btn-close-white" onClick={() => setSelectedCustomer(null)}></button>
            </div>
            
            <div className="erp-dialog-body bg-white p-4">
              <div className="row g-4">
                {/* Left Col: Contact Info */}
                <div className="col-md-6 border-end pe-4">
                  <h6 className="erp-section-title mb-3">Contact Information</h6>
                  <div className="mb-3">
                    <div className="erp-meta-label">Primary Contact Person</div>
                    <div className="erp-meta-value">{selectedCustomer.contactPerson || "---"}</div>
                  </div>
                  <div className="mb-3">
                    <div className="erp-meta-label">Email Address</div>
                    <div className="erp-meta-value">{selectedCustomer.email || "---"}</div>
                  </div>
                  <div className="mb-3">
                    <div className="erp-meta-label">Phone Number</div>
                    <div className="erp-meta-value font-monospace">{selectedCustomer.phone || "---"}</div>
                  </div>
                  <div className="mb-3">
                    <div className="erp-meta-label">Registered Address</div>
                    <div className="erp-meta-value text-muted">
                      {selectedCustomer.address || "---"}<br/>
                      {selectedCustomer.city ? `${selectedCustomer.city}, ` : ''}{selectedCustomer.state} {selectedCustomer.zipCode}
                    </div>
                  </div>
                </div>

                {/* Right Col: Financials */}
                <div className="col-md-6 ps-4">
                  <h6 className="erp-section-title mb-3">Account & Financials</h6>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <div className="erp-meta-label">Customer Type</div>
                      <div className="erp-meta-value">
                        <span className="erp-status-tag tag-secondary fs-6 mt-1 px-2 py-1">{selectedCustomer.customerType}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="erp-meta-label">Payment Terms</div>
                      <div className="erp-meta-value font-monospace mt-1">{selectedCustomer.paymentTerms}</div>
                    </div>
                  </div>

                  <div className="erp-kpi-box mb-3" style={{ borderLeftColor: '#059669' }}>
                    <span className="erp-kpi-label">Authorized Credit Limit</span>
                    <span className="erp-kpi-value font-monospace text-success">
                      ₹{(selectedCustomer.creditLimit || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="erp-kpi-box" style={{ borderLeftColor: '#dc2626' }}>
                    <span className="erp-kpi-label">Current Outstanding Balance</span>
                    <span className="erp-kpi-value font-monospace text-danger">
                      ₹{(selectedCustomer.outstandingBalance || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-light border-top text-end">
              <button className="btn btn-secondary erp-btn px-4" onClick={() => setSelectedCustomer(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}

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
          padding: 10px 16px;
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
        
        .erp-table { font-size: 0.8rem; }
        .erp-table thead th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.7rem;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #cbd5e1;
          padding: 8px 12px;
          white-space: nowrap;
        }
        .erp-table tbody td {
          padding: 8px 12px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          white-space: nowrap;
        }
        .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
        .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

        /* Modals / Dialogs */
        .erp-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(38, 50, 56, 0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 1050;
        }
        .erp-dialog {
          background: var(--erp-surface);
          border-radius: 4px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .erp-dialog-lg { max-width: 800px; }
        .erp-dialog-header {
          background-color: var(--erp-primary);
          color: white;
          padding: 16px 24px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .erp-dialog-body {
          overflow-y: auto;
        }

        /* KPI Boxes */
        .erp-kpi-box {
          background: var(--erp-surface); 
          border: 1px solid var(--erp-border);
          padding: 12px 16px; 
          border-left: 4px solid var(--erp-primary);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .erp-kpi-label { 
          font-size: 0.7rem; 
          text-transform: uppercase; 
          color: var(--erp-text-muted); 
          font-weight: 700; 
          letter-spacing: 0.5px;
        }
        .erp-kpi-value { 
          font-size: 1.5rem; 
          font-weight: 700; 
          line-height: 1;
        }

        /* Detail Meta */
        .erp-meta-label { font-size: 0.7rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 700; margin-bottom: 2px; }
        .erp-meta-value { font-size: 0.95rem; font-weight: 500; color: #212529; }
      `}</style>
    </div>
  );
}