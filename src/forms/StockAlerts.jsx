import React, { useEffect, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

export default function StockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await smartErpApi.stockAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load stock alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <span className="erp-status-tag tag-danger">CRITICAL</span>;
      case 'high':
        return <span className="erp-status-tag tag-warning">HIGH</span>;
      case 'medium':
        return <span className="erp-status-tag tag-info">MEDIUM</span>;
      case 'low':
        return <span className="erp-status-tag tag-secondary">LOW</span>;
      default:
        return <span className="erp-status-tag tag-secondary">{severity?.toUpperCase() || 'UNKNOWN'}</span>;
    }
  };

  const getAlertTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'low_stock':
        return <span className="erp-status-tag tag-warning">LOW STOCK</span>;
      case 'out_of_stock':
        return <span className="erp-status-tag tag-danger">OUT OF STOCK</span>;
      case 'overstock':
        return <span className="erp-status-tag tag-info">OVERSTOCK</span>;
      case 'reorder':
        return <span className="erp-status-tag tag-primary">REORDER</span>;
      default:
        return <span className="erp-status-tag tag-secondary">{type?.toUpperCase() || 'UNKNOWN'}</span>;
    }
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Stock Alerts & Triggers</h4>
            <span className="erp-text-muted small text-uppercase">Inventory Threshold Monitoring</span>
          </div>
          <button 
            className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
            onClick={fetchAlerts} 
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            Refresh Alerts
          </button>
        </div>

        {/* ALERT */}
        {message && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: message.includes("success") ? '#f0fdf4' : '#fef2f2',
            color: message.includes("success") ? '#166534' : '#991b1b',
            border: `1px solid ${message.includes("success") ? '#bbf7d0' : '#fecaca'}`
          }}>
            <span className="fw-semibold">{message}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage("")}></button>
          </div>
        )}

        {/* KPI DASHBOARD */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#0f4c81' }}>
              <span className="erp-kpi-label">Total Monitored Rules</span>
              <span className="erp-kpi-value text-dark">{alerts.length}</span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#dc2626' }}>
              <span className="erp-kpi-label">Currently Triggered</span>
              <span className="erp-kpi-value text-danger">{alerts.filter(a => a.isTriggered).length}</span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#059669' }}>
              <span className="erp-kpi-label">Active (Not Triggered)</span>
              <span className="erp-kpi-value text-success">{alerts.filter(a => a.isActive && !a.isTriggered).length}</span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#f59e0b' }}>
              <span className="erp-kpi-label">Critical / High Severity</span>
              <span className="erp-kpi-value text-warning">
                {alerts.filter(a => a.severity?.toLowerCase() === 'critical' || a.severity?.toLowerCase() === 'high').length}
              </span>
            </div>
          </div>
        </div>

        {/* DATA GRID */}
        <div className="erp-panel d-flex flex-column shadow-sm mb-4" style={{ height: "calc(100vh - 220px)", minHeight: '400px' }}>
          <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Active Alert Configurations</span>
            <span className="badge bg-secondary">{alerts.length} Records</span>
          </div>
          
          <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100">
                <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }}></div>
              </div>
            ) : (
              <table className="table erp-table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Item Context</th>
                    <th>Warehouse Location</th>
                    <th>Alert Type</th>
                    <th>Severity</th>
                    <th className="text-end">Current Stock</th>
                    <th className="text-end">Threshold</th>
                    <th>System Message</th>
                    <th>Last Checked</th>
                    <th className="text-center" style={{ width: '120px' }}>State</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-5 text-muted">No stock alerts configured. Set up reorder points and minimum stock levels to receive alerts.</td></tr>
                  ) : (
                    alerts.map((alert) => (
                      <tr key={alert.id} className={alert.isTriggered ? "table-danger" : ""}>
                        <td>
                          <div className="fw-bold font-monospace text-dark">{alert.itemCode}</div>
                          <div className="text-muted text-truncate" style={{ maxWidth: '200px', fontSize: '0.75rem' }}>{alert.itemName}</div>
                        </td>
                        <td>{alert.warehouseName || 'Global/Any'}</td>
                        <td>{getAlertTypeBadge(alert.alertType)}</td>
                        <td>{getSeverityBadge(alert.severity)}</td>
                        <td className={`text-end font-monospace fw-bold ${alert.currentStock <= alert.reorderPoint ? 'text-danger' : 'text-dark'}`}>
                          {alert.currentStock ?? 0}
                        </td>
                        <td className="text-end font-monospace text-muted">{alert.reorderPoint ?? 0}</td>
                        <td>
                          <div className="text-truncate text-muted" style={{ maxWidth: '250px', fontSize: '0.75rem' }} title={alert.message}>
                            {alert.message || '-'}
                          </div>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {alert.lastChecked ? new Date(alert.lastChecked).toLocaleString() : 'Never'}
                        </td>
                        <td className="text-center">
                          <div className="d-flex flex-column gap-1 align-items-center">
                            {alert.isTriggered ? (
                              <span className="erp-status-tag tag-danger w-100">TRIGGERED</span>
                            ) : (
                              <span className="erp-status-tag tag-success w-100 text-muted bg-light border-light">STANDBY</span>
                            )}
                            {alert.isActive ? (
                              <span className="erp-status-tag tag-success w-100">ENABLED</span>
                            ) : (
                              <span className="erp-status-tag tag-secondary w-100">DISABLED</span>
                            )}
                          </div>
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

        /* KPI Boxes */
        .erp-kpi-box {
          background: var(--erp-surface); 
          border: 1px solid var(--erp-border);
          padding: 16px 20px; 
          border-left: 4px solid var(--erp-primary);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .erp-kpi-label { 
          font-size: 0.75rem; 
          text-transform: uppercase; 
          color: var(--erp-text-muted); 
          font-weight: 700; 
          letter-spacing: 0.5px;
        }
        .erp-kpi-value { 
          font-size: 1.75rem; 
          font-weight: 700; 
          line-height: 1;
        }

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

        /* Buttons */
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.8rem;
          padding: 6px 14px;
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
        .table-danger { background-color: #fef2f2 !important; }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          white-space: nowrap;
          text-align: center;
        }
        .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
        .tag-primary { background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
        .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
      `}</style>
    </div>
  );
}