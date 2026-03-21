import React, { useEffect, useState } from 'react';
import api from '../services/apiClient';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', location: '' });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => { fetchWarehouses(); }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warehouses');
      setWarehouses(res.data);
    } catch (e) {
      console.error(e);
      setMessage({ text: "Failed to load warehouses.", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const sanitize = (str) => str.replace(/[^A-Za-z0-9\- ]/g, '').trim();

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    const code = sanitize(form.code).toUpperCase().replace(/\s+/g, '-');
    const name = sanitize(form.name);
    const location = sanitize(form.location);

    if (!/[A-Z]/.test(code)) {
      setMessage({ text: "Warehouse code must include at least one letter.", type: "warning" });
      return;
    }

    const exists = warehouses.some((w) =>
      w.code.toLowerCase() === code.toLowerCase() ||
      w.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      setMessage({ text: "A warehouse with that code or name already exists.", type: "warning" });
      return;
    }

    setLoading(true);
    try {
      const locationParam = location ? `&location=${encodeURIComponent(location)}` : '';
      await api.post(`/warehouses?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}${locationParam}`);
      const locationSuffix = location ? ` at ${location}` : '';
      setMessage({ text: `✓ Warehouse ${code} created successfully${locationSuffix}.`, type: "success" });
      setForm({ code: '', name: '', location: '' });
      fetchWarehouses();
    } catch (e) {
      console.error(e);
      setMessage({ text: "Failed to create warehouse.", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = warehouses.filter((w) => w.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1200px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Warehouse Locations</h4>
            <span className="erp-text-muted small text-uppercase">Facility Master Data</span>
          </div>
          <button 
            className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
            onClick={fetchWarehouses} 
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            Refresh Data
          </button>
        </div>

        {/* ALERT */}
        {message.text && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: message.type === 'success' ? '#f0fdf4' : message.type === 'warning' ? '#fffbeb' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : message.type === 'warning' ? '#92400e' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : message.type === 'warning' ? '#fde68a' : '#fecaca'}`
          }}>
            <span className="fw-semibold">{message.text}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage({ text: "", type: "" })}></button>
          </div>
        )}

        <div className="row g-4">
          
          {/* LEFT: CREATE WAREHOUSE */}
          <div className="col-md-5 col-lg-4">
            <div className="erp-panel shadow-sm h-100">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">Register Facility</span>
              </div>
              <div className="p-4 bg-white">
                <form onSubmit={handleAdd}>
                  <div className="mb-3">
                    <label className="erp-label">Facility Code <span className="text-danger">*</span></label>
                    <input
                      className="form-control erp-input font-monospace"
                      placeholder="e.g. KNR-MAIN"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      required
                      disabled={loading}
                    />
                    <small className="text-muted mt-1 d-block" style={{ fontSize: '0.7rem' }}>Must contain at least one letter.</small>
                  </div>

                  <div className="mb-4">
                    <label className="erp-label">Facility Name <span className="text-danger">*</span></label>
                    <input
                      className="form-control erp-input"
                      placeholder="e.g. Karimnagar Main"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="erp-label">Facility Location <span className="text-muted">(Optional)</span></label>
                    <input
                      className="form-control erp-input"
                      placeholder="e.g. East Campus - Block C"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      disabled={loading}
                    />
                    <small className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>This helps the warehouse overview show precise addresses or zones.</small>
                  </div>

                  <div className="pt-3 border-top">
                    <button type="submit" className="btn btn-primary erp-btn w-100 fw-bold" disabled={loading || !form.code || !form.name}>
                      {loading ? "Processing..." : "+ Add Warehouse"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT: WAREHOUSE LIST */}
          <div className="col-md-7 col-lg-8">
            <div className="erp-panel d-flex flex-column shadow-sm" style={{ height: "calc(100vh - 180px)", minHeight: '400px' }}>
              <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
                <span className="fw-bold">Active Locations</span>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Filter:</span>
                  <input
                    className="form-control form-control-sm erp-input"
                    style={{ width: '200px' }}
                    placeholder="Search by name..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
                {loading && warehouses.length === 0 ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100">
                    <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }}></div>
                  </div>
                ) : (
                  <table className="table erp-table table-hover mb-0 align-middle">
                    <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Facility Code</th>
                      <th>Facility Name</th>
                      <th>Facility Location</th>
                      <th className="text-center" style={{ width: '100px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((w) => (
                        <tr key={w.id}>
                          <td className="fw-bold font-monospace text-dark">{w.code}</td>
                          <td className="text-dark fw-semibold">{w.name}</td>
                          <td className="text-muted">{w.location || 'Not set'}</td>
                          <td className="text-center">
                            <span className="erp-status-tag tag-success">ACTIVE</span>
                          </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center py-5 text-muted">
                            No warehouse facilities found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
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
          padding: 8px 10px;
        }
        .erp-input:focus {
          border-color: var(--erp-primary);
          box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
        }
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.85rem;
          padding: 8px 16px;
        }
        .erp-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
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
      `}</style>
    </div>
  );
}
