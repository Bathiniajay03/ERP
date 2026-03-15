import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/apiClient";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSync, setLastSync] = useState(null);

  const navigate = useNavigate();

  // Currency formatter (₹ Indian Rupee)
  const formatCurrency = (value) => {
    return `₹${(value ?? 0).toLocaleString("en-IN")}`;
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
  }, []);

  if (isOffline) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="bg-white p-5 rounded-4 shadow text-center">
          <h3 className="text-danger fw-bold">Connection Lost</h3>
          <p className="text-muted">
            ERP server is unreachable. Please check network.
          </p>

          {errorMessage && (
            <p className="text-danger small">{errorMessage}</p>
          )}

          <button className="btn btn-primary mt-3" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary mb-3"></div>
        <span className="text-muted">Loading ERP Dashboard...</span>
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
    <div className="container-fluid py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Smart ERP Dashboard</h2>
          <p className="text-muted mb-0">Live system overview</p>
        </div>

        <div>
          {lastSync && (
            <small className="text-muted me-3">
              Last Sync: {lastSync.toLocaleTimeString()}
            </small>
          )}
          <button className="btn btn-outline-primary btn-sm" onClick={fetchData}>
            Refresh
          </button>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <KpiCard label="Total Orders" value={sales.ordersPerDay ?? 0} sub="Today Orders" />

        <KpiCard label="Gross Revenue" value={formatCurrency(sales.revenue)} sub="Total Sales" />

        <KpiCard label="Low Stock Items" value={inventory.lowStockItems ?? 0} sub="Inventory Alerts" />
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <SectionCard title="Warehouse & Robotics">
            <DetailItem label="Active Warehouses" value={warehouse.activeWarehouses} />
            <DetailItem label="Storage Locations" value={warehouse.storageLocations} />
            <DetailItem label="Robots Online" value={robot.totalRobots} />
            <DetailItem label="Robot Utilization" value={`${robot.robotUtilization ?? 0}%`} />
          </SectionCard>
        </div>

        <div className="col-lg-6">
          <SectionCard title="Inventory & Finance">
            <DetailItem label="Total SKUs" value={inventory.totalSkus} />
            <DetailItem label="Low Stock Count" value={inventory.lowStockItems} />
            <DetailItem label="Receivables" value={formatCurrency(finance.receivables)} />
            <DetailItem label="Payments Received" value={formatCurrency(finance.paymentsReceived)} />
          </SectionCard>
        </div>
      </div>

      {/* AI Floating Button */}
      <div
        onClick={() => navigate("/local-ai")}
        className="position-fixed d-flex align-items-center justify-content-center shadow-lg"
        style={{
          bottom: "30px",
          right: "30px",
          width: "70px",
          height: "70px",
          background: "#111827",
          color: "white",
          borderRadius: "18px",
          cursor: "pointer",
        }}
      >
        <div className="text-center">
          <div style={{ fontWeight: "bold", fontSize: "18px" }}>AI</div>
          <div style={{ fontSize: "10px" }}>CORE</div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }) {
  return (
    <div className="col-md-4">
      <div className="card shadow-sm border-0 p-4">
        <p className="text-muted small mb-1">{label}</p>
        <h3 className="fw-bold">{value}</h3>
        <small className="text-muted">{sub}</small>
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="card shadow-sm border-0 p-4 h-100">
      <h5 className="fw-bold mb-4">{title}</h5>
      <div className="row g-3">{children}</div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="col-6">
      <div className="p-3 bg-light rounded">
        <small className="text-muted">{label}</small>
        <div className="fw-bold fs-5">{value ?? 0}</div>
      </div>
    </div>
  );
}