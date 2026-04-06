import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/apiClient";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSync, setLastSync] = useState(null);

  const navigate = useNavigate();

  // Number formatter (Currency symbols removed per request)
  const formatNumber = (value) => {
    return (value ?? 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const fetchData = async () => {
    try {
      const res = await api.get("/smart-erp/dashboard/realtime");
      setData(res.data);
      setIsOffline(false);
      setErrorMessage("");
      setLastSync(new Date());
    } catch (error) {
      setIsOffline(true);
      setErrorMessage(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Unable to connect to ERP server."
      );
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isOffline) {
    return (
      <div className="erp-app-wrapper d-flex justify-content-center align-items-center vh-100">
        <div className="erp-panel p-5 text-center shadow" style={{ maxWidth: '450px' }}>
          <div className="mb-3 text-danger" style={{ fontSize: '3rem' }}>🔌</div>
          <h4 className="fw-bold text-dark mb-2">Connection Lost</h4>
          <p className="text-muted small mb-4">
            ERP Gateway is unreachable. Please verify network connectivity and backend service status.
          </p>
          {errorMessage && (
            <div className="alert alert-danger py-2 small mb-4">{errorMessage}</div>
          )}
          <button className="btn btn-primary erp-btn w-100 fw-bold" onClick={fetchData}>
            Attempt Reconnection
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="erp-app-wrapper d-flex flex-column justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status"></div>
        <p className="text-muted fw-bold small text-uppercase" style={{letterSpacing: '1px'}}>Loading ERP Dashboard...</p>
      </div>
    );
  }

  const {
    salesDashboard: sales = {},
    inventoryDashboard: inventory = {},
    warehouseDashboard: warehouse = {},
    robotActivityDashboard: robot = {},
    financeDashboard: finance = {},
  } = data;

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Smart ERP Command Center</h4>
            <span className="erp-text-muted small text-uppercase">Live Systems Overview</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            {lastSync && (
              <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                Last Sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
            <button className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" onClick={fetchData}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* TOP KPI ROW */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#0f4c81' }}>
              <div className="d-flex justify-content-between align-items-start">
                <span className="erp-kpi-label">Total Orders</span>
                <span className="badge bg-light text-secondary border">Today</span>
              </div>
              <span className="erp-kpi-value text-dark mt-1">{sales.ordersPerDay ?? 0}</span>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#059669' }}>
              <div className="d-flex justify-content-between align-items-start">
                <span className="erp-kpi-label">Gross Revenue</span>
                <span className="badge bg-light text-secondary border">Total Sales</span>
              </div>
              <span className="erp-kpi-value text-success font-monospace mt-1">{formatNumber(sales.revenue)}</span>
            </div>
          </div>

          <div className="col-md-4">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#1d4ed8' }}>
              <div className="d-flex justify-content-between align-items-start">
                <span className="erp-kpi-label">Customer Sales</span>
                <span className="badge bg-light text-secondary border">Delivered</span>
              </div>
              <span className="erp-kpi-value text-info font-monospace mt-1">{formatNumber(sales.customerRevenue)}</span>
            </div>
          </div>

          <div className="col-md-4">
            <div className="erp-kpi-box" style={{ borderLeftColor: (inventory.lowStockItems ?? 0) > 0 ? '#dc2626' : '#94a3b8' }}>
              <div className="d-flex justify-content-between align-items-start">
                <span className="erp-kpi-label">Low Stock Items</span>
                <span className="badge bg-light text-secondary border">Alerts</span>
              </div>
              <span className={`erp-kpi-value mt-1 ${(inventory.lowStockItems ?? 0) > 0 ? 'text-danger' : 'text-dark'}`}>
                {inventory.lowStockItems ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* METRICS PANELS */}
        <div className="row g-4">
          {/* Warehouse & Robotics */}
          <div className="col-lg-6">
            <div className="erp-panel h-100 shadow-sm">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">Warehouse & Fleet Telemetry</span>
              </div>
              <div className="p-4 bg-white">
                <div className="row g-4">
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Active Warehouses</div>
                      <div className="erp-meta-value fs-4 fw-bold">{warehouse.activeWarehouses ?? 0}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Storage Locations</div>
                      <div className="erp-meta-value fs-4 fw-bold">{warehouse.storageLocations ?? 0}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Robots Online</div>
                      <div className="erp-meta-value fs-4 fw-bold text-primary">{robot.totalRobots ?? 0}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Fleet Utilization</div>
                      <div className="erp-meta-value fs-4 fw-bold text-info">{robot.robotUtilization ?? 0}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory & Finance */}
          <div className="col-lg-6">
            <div className="erp-panel h-100 shadow-sm">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">Inventory & Financial Health</span>
              </div>
              <div className="p-4 bg-white">
                <div className="row g-4">
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Total Active SKUs</div>
                      <div className="erp-meta-value fs-4 fw-bold">{inventory.totalSkus ?? 0}</div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100 border-start border-warning border-4">
                      <div className="erp-meta-label">Low Stock Alerts</div>
                      <div className={`erp-meta-value fs-4 fw-bold ${(inventory.lowStockItems ?? 0) > 0 ? 'text-danger' : 'text-dark'}`}>
                        {inventory.lowStockItems ?? 0}
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Total Receivables</div>
                      <div className="erp-meta-value fs-4 fw-bold font-monospace text-warning">
                        {formatNumber(finance.receivables)}
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Payments Received</div>
                      <div className="erp-meta-value fs-4 fw-bold font-monospace text-success">
                        {formatNumber(finance.paymentsReceived)}
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Customer Sales (Delivered)</div>
                      <div className="erp-meta-value fs-4 fw-bold font-monospace text-info">
                        {formatNumber(finance.customerSales)}
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="p-3 border rounded bg-light h-100">
                      <div className="erp-meta-label">Customer Receivables</div>
                      <div className="erp-meta-value fs-4 fw-bold font-monospace text-secondary">
                        {formatNumber(finance.customerReceivables)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Floating Button */}
      <div onClick={() => navigate("/local-ai")} className="ai-fab shadow-lg" title="Open AI Copilot">
        <div className="d-flex flex-column align-items-center justify-content-center lh-1">
          <span className="fw-bold" style={{ fontSize: '1.1rem' }}>AI</span>
          <span style={{ fontSize: '0.55rem', letterSpacing: '1px', marginTop: '2px' }}>CORE</span>
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
          padding: 20px; 
          border-left: 4px solid var(--erp-primary);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }
        .erp-kpi-label { 
          font-size: 0.75rem; 
          text-transform: uppercase; 
          color: var(--erp-text-muted); 
          font-weight: 700; 
          letter-spacing: 0.5px;
        }
        .erp-kpi-value { 
          font-size: 2rem; 
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

        /* Detail Items */
        .erp-meta-label { 
          font-size: 0.7rem; 
          text-transform: uppercase; 
          color: var(--erp-text-muted); 
          font-weight: 700; 
          margin-bottom: 4px; 
        }
        .erp-meta-value { 
          font-size: 1.25rem; 
          color: #212529; 
        }

        /* Buttons */
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.8rem;
          padding: 6px 14px;
        }

        /* FAB */
        .ai-fab {
          position: fixed; 
          bottom: 30px; 
          right: 30px; 
          width: 60px; 
          height: 60px;
          background: #111827; 
          color: #fff; 
          border-radius: 50%; 
          cursor: pointer;
          display: flex; 
          align-items: center; 
          justify-content: center;
          transition: transform 0.2s ease, background-color 0.2s ease; 
          z-index: 1000;
          border: 2px solid rgba(255,255,255,0.1);
        }
        .ai-fab:hover { 
          transform: scale(1.05); 
          background: var(--erp-primary);
        }
      `}</style>
    </div>
  );
}