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
        return <span className="badge bg-danger">Critical</span>;
      case 'high':
        return <span className="badge bg-warning text-dark">High</span>;
      case 'medium':
        return <span className="badge bg-info">Medium</span>;
      case 'low':
        return <span className="badge bg-secondary">Low</span>;
      default:
        return <span className="badge bg-light text-dark">{severity || 'Unknown'}</span>;
    }
  };

  const getAlertTypeBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'low_stock':
        return <span className="badge bg-warning text-dark">Low Stock</span>;
      case 'out_of_stock':
        return <span className="badge bg-danger">Out of Stock</span>;
      case 'overstock':
        return <span className="badge bg-info">Overstock</span>;
      case 'reorder':
        return <span className="badge bg-primary">Reorder</span>;
      default:
        return <span className="badge bg-light text-dark">{type || 'Unknown'}</span>;
    }
  };

  return (
    <div className="container-fluid py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Stock Alerts</h2>
          <p className="text-muted mb-0">Monitor inventory levels and automated alerts</p>
        </div>
        <button className="btn btn-primary" onClick={fetchAlerts} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {message && <div className={`alert alert-${message.includes("success") ? "success" : "info"} py-2`}>{message}</div>}

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h5 className="fw-bold mb-3">Active Stock Alerts</h5>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Item</th>
                  <th>Warehouse</th>
                  <th>Alert Type</th>
                  <th>Severity</th>
                  <th>Current Stock</th>
                  <th>Reorder Point</th>
                  <th>Message</th>
                  <th>Last Checked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <div>
                        <div className="fw-semibold">{alert.itemCode}</div>
                        <small className="text-muted">{alert.itemName}</small>
                      </div>
                    </td>
                    <td>{alert.warehouseName || 'N/A'}</td>
                    <td>{getAlertTypeBadge(alert.alertType)}</td>
                    <td>{getSeverityBadge(alert.severity)}</td>
                    <td className="fw-semibold">{alert.currentStock ?? 0}</td>
                    <td>{alert.reorderPoint ?? 0}</td>
                    <td>
                      <small className="text-muted">{alert.message}</small>
                    </td>
                    <td>
                      {alert.lastChecked ? new Date(alert.lastChecked).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <div>
                        {alert.isTriggered ? (
                          <span className="badge bg-danger">Triggered</span>
                        ) : (
                          <span className="badge bg-success">Active</span>
                        )}
                        {alert.isActive ? (
                          <span className="badge bg-success ms-1">Enabled</span>
                        ) : (
                          <span className="badge bg-secondary ms-1">Disabled</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      No stock alerts configured. Set up reorder points and minimum stock levels to receive alerts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-2">Alert Summary</h6>
            <div className="d-flex justify-content-between">
              <span>Total Alerts:</span>
              <span className="fw-semibold">{alerts.length}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Triggered:</span>
              <span className="fw-semibold text-danger">{alerts.filter(a => a.isTriggered).length}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Active:</span>
              <span className="fw-semibold text-success">{alerts.filter(a => a.isActive).length}</span>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <h6 className="fw-bold mb-2">Severity Breakdown</h6>
            <div className="d-flex justify-content-between">
              <span>Critical:</span>
              <span className="fw-semibold text-danger">{alerts.filter(a => a.severity?.toLowerCase() === 'critical').length}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>High:</span>
              <span className="fw-semibold text-warning">{alerts.filter(a => a.severity?.toLowerCase() === 'high').length}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span>Medium:</span>
              <span className="fw-semibold text-info">{alerts.filter(a => a.severity?.toLowerCase() === 'medium').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}