import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import "./App.css";

import Dashboard from "./forms/Dashboard";
import Products from "./forms/Products";
import Operations from "./forms/Operations";
import CreateSalesOrder from "./forms/CreateSalesOrder";
import Warehouses from "./forms/Warehouses";
import Reports from "./forms/Reports";
import Automation from "./forms/Automation";
import PurchaseOrders from "./forms/PurchaseOrders";
import AdminPanel from "./forms/AdminPanel";
import VendorReturns from "./forms/VendorReturns";
import Inventory from "./forms/Inventory";
import Finance from "./forms/Finance";
import Lots from "./forms/Lots";

import Customers from "./forms/Customers";
import Notifications from "./forms/Notifications";
import LocalAIPage from "./pages/LocalAIPage";
import SalesOrderList from "./forms/SalesOrderList";
import Vendors from "./forms/Vendors";
import StockAlerts from "./forms/StockAlerts";
import ScannerDevicePage from "./pages/ScannerDevicePage";

import { smartErpApi } from "./services/smartErpApi";
import { LocalAIProvider } from "./context/LocalAIContext";

const AUTO_LOGOUT_MS = 5 * 60 * 1000;
const ROLE_MODULES_VERSION = 3;
const ROLE_MODULES_KEY = "erp_role_modules";
const ROLE_MODULES_VERSION_KEY = "erp_role_modules_version";

const MODULE_CONFIG = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard" },
  { id: "products", label: "Products", path: "/products" },
  { id: "inventory", label: "Inventory", path: "/inventory" },
  { id: "finance", label: "Finance", path: "/finance" },
  { id: "operations", label: "Order Flow", path: "/operations" },
  { id: "salesOrderList", label: "Sales Order List", path: "/sales-orders/list" },
  { id: "createSalesOrder", label: "Create Sales Order", path: "/sales-orders/create" },
  { id: "purchaseOrders", label: "Purchase Orders", path: "/purchase-orders" },
  { id: "customers", label: "Customers", path: "/customers" },
  {
    id: "notifications",
    label: ({ unreadCount }) =>
      `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
    path: "/notifications"
  },
  { id: "warehouses", label: "Warehouses", path: "/warehouses" },
  { id: "lots", label: "Lot Tracking", path: "/lots" },
  { id: "vendors", label: "Vendors", path: "/vendors" },
  { id: "stockAlerts", label: "Stock Alerts", path: "/stock-alerts" },
  { id: "reports", label: "Reports", path: "/reports" },
  { id: "automation", label: "Automation", path: "/automation" },
  { id: "vendorReturns", label: "Vendor Returns", path: "/vendor-returns" },
  { id: "localAI", label: "Local AI", path: "/local-ai" },
  { id: "scannerDevice", label: "Scanner Device", path: "/scanner-device" },
  { id: "admin", label: "Admin", path: "/admin" }
];

const DEFAULT_ROLE_MODULES = {
  Admin: MODULE_CONFIG.map((module) => module.id),
  Manager: [
    "dashboard",
    "products",
    "inventory",
    "finance",
    "operations",
    "salesOrderList",
    "createSalesOrder",
    "purchaseOrders",
    "customers",
    "notifications",
    "warehouses",
    "lots",
    "vendors",
    "stockAlerts",
    "reports",
    "automation",
    "vendorReturns",
    "scannerDevice"
  ],
  Operator: [
    "operations",
    "scannerDevice"
  ],
  OperationsWorker: [
    "dashboard",
    "products",
    "inventory",
    "finance",
    "operations",
    "salesOrderList",
    "createSalesOrder",
    "purchaseOrders",
    "customers",
    "vendors",
    "stockAlerts",
    "notifications",
    "reports",
    "vendorReturns",
    "scannerDevice"
  ],
  ScannerWorker: [
    "scannerDevice"
  ],
  "Warehouse Manager": [
    "dashboard",
    "products",
    "inventory",
    "operations",
    "purchaseOrders",
    "customers",
    "vendors",
    "stockAlerts",
    "warehouses",
    "lots",
    "notifications",
    "vendorReturns",
    "scannerDevice"
  ],
  "Finance Manager": [
    "dashboard",
    "finance",
    "reports",
    "lots",
    "notifications",
    "salesOrderList",
    "purchaseOrders",
    "customers",
    "vendors",
    "stockAlerts",
    "vendorReturns",
    "scannerDevice"
  ],
  "Robot Supervisor": ["dashboard", "operations", "automation", "localAI", "notifications", "scannerDevice"],
  User: [
    "dashboard",
    "operations",
    "salesOrderList",
    "notifications",
    "reports",
    "scannerDevice"
  ]
};

export default function App() {
  const isClient = typeof window !== "undefined";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [isMobile, setIsMobile] = useState(isClient ? window.innerWidth < 992 : false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const lastActivityRef = useRef(Date.now());
  const normalizeRoleModules = useCallback(
    (modules) => {
      const normalized = { ...modules };
      Object.entries(DEFAULT_ROLE_MODULES).forEach(([roleName, defaults]) => {
        const existing = normalized[roleName] ?? [];
        normalized[roleName] = Array.from(new Set([...existing, ...defaults]));
      });
      return normalized;
    },
    []
  );

  const initialRoleModules = useCallback(() => {
    if (!isClient) return DEFAULT_ROLE_MODULES;
    const storedText = window.localStorage.getItem(ROLE_MODULES_KEY);
    const storedVersion = Number(window.localStorage.getItem(ROLE_MODULES_VERSION_KEY) ?? "0");
    const raw = storedText ? JSON.parse(storedText) : DEFAULT_ROLE_MODULES;
    if (storedVersion >= ROLE_MODULES_VERSION) {
      return raw;
    }
    const normalized = normalizeRoleModules(raw);
    window.localStorage.setItem(ROLE_MODULES_KEY, JSON.stringify(normalized));
    window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
    return normalized;
  }, [isClient, normalizeRoleModules]);

  const [allowedModulesByRole, setAllowedModulesByRole] = useState(initialRoleModules);

  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    if (isClient) {
      window.localStorage.setItem("erp_last_activity", String(now));
    }
    return now;
  }, [isClient]);

  const persistRoleModules = useCallback(
    (nextModules) => {
      setAllowedModulesByRole(nextModules);
      if (isClient) {
        window.localStorage.setItem(ROLE_MODULES_KEY, JSON.stringify(nextModules));
        window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
      }
    },
    [isClient]
  );

  const handleLogout = useCallback(async () => {
    try {
      // Get login log ID from localStorage (set during login)
      const loginLogId = window.localStorage.getItem("erp_login_log_id");
      if (loginLogId) {
        await smartErpApi.logout({ loginLogId: parseInt(loginLogId) });
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    }

    if (isClient) {
      window.localStorage.removeItem("erp_token");
      window.localStorage.removeItem("erp_role");
      window.localStorage.removeItem("erp_last_activity");
      window.localStorage.removeItem("erp_login_log_id");
    }
    lastActivityRef.current = 0;
    setRole("");
    setIsAuthenticated(false);
  }, [isClient]);

  const handleLoginSuccess = useCallback(
    (payload) => {
      if (isClient) {
        window.localStorage.setItem("erp_token", payload.accessToken);
        window.localStorage.setItem("erp_role", payload.role || "");
        if (payload.loginLogId) {
          window.localStorage.setItem("erp_login_log_id", payload.loginLogId.toString());
        }
      }
      updateLastActivity();
      setRole(payload.role || "");
      setIsAuthenticated(true);
    },
    [isClient, updateLastActivity]
  );

  useEffect(() => {
    if (!isClient) return;

    const token = window.localStorage.getItem("erp_token");
    const storedLastActivity = Number(window.localStorage.getItem("erp_last_activity") || "0");
    const sessionActive = Boolean(token && Date.now() - storedLastActivity < AUTO_LOGOUT_MS);

    if (sessionActive) {
      setIsAuthenticated(true);
      setRole(window.localStorage.getItem("erp_role") || "");
      lastActivityRef.current = storedLastActivity || Date.now();
    } else {
      handleLogout();
    }

    const handleUnauthorized = () => {
      handleLogout();
    };

    window.addEventListener("erp:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("erp:unauthorized", handleUnauthorized);
  }, [handleLogout, isClient]);

  useEffect(() => {
    if (!isClient || !isAuthenticated) return;

    updateLastActivity();
    const activityEvents = ["click", "mousemove", "keydown", "scroll", "touchstart"];
    const handleActivity = () => updateLastActivity();
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity));

    const intervalId = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= AUTO_LOGOUT_MS) {
        handleLogout();
      }
    }, 1000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      window.clearInterval(intervalId);
    };
  }, [handleLogout, isAuthenticated, isClient, updateLastActivity]);

  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      const mobileView = window.innerWidth < 992;
      setIsMobile(mobileView);
      if (!mobileView) {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const isSidebarVisible = !isMobile || sidebarOpen;
    document.body.style.overflow = isSidebarVisible && isMobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isClient, isMobile, sidebarOpen]);

  useEffect(() => {
    let interval;
    const fetchCount = async () => {
      try {
        const res = await smartErpApi.notificationsUnreadCount();
        const c = res.data?.count ?? res.data?.Count ?? 0;
        setUnreadCount(c);
        if (c > unreadCount) {
          setToastMessage(`You have ${c - unreadCount} new notification${c - unreadCount > 1 ? "s" : ""}`);
        }
      } catch (e) {
        // ignore
      }
    };
    if (isAuthenticated) {
      fetchCount();
      interval = window.setInterval(fetchCount, 30000);
    }
    return () => window.clearInterval(interval);
  }, [isAuthenticated, unreadCount]);

  const allowedIds = useMemo(() => {
    const configured = allowedModulesByRole[role];
    if (configured && configured.length) return configured;
    if (DEFAULT_ROLE_MODULES[role]) return DEFAULT_ROLE_MODULES[role];
    return DEFAULT_ROLE_MODULES.OperationsWorker;
  }, [allowedModulesByRole, role]);

  const fallbackPath = useMemo(() => {
    if (!allowedIds || allowedIds.length === 0) return "/dashboard";
    const allowedModule = MODULE_CONFIG.find((module) => allowedIds.includes(module.id));
    return allowedModule?.path || "/dashboard";
  }, [allowedIds]);

  const defaultLandingPath = useMemo(() => {
    if (role === "ScannerWorker") {
      return "/scanner-device";
    }
    return fallbackPath;
  }, [role, fallbackPath]);

  const navItems = useMemo(
    () =>
      MODULE_CONFIG.filter((item) => allowedIds.includes(item.id)).map((item) => ({
        path: item.path,
        label: typeof item.label === "function" ? item.label({ unreadCount }) : item.label,
        id: item.id
      })),
    [allowedIds, unreadCount]
  );

  const renderProtectedRoute = useCallback(
    (moduleId, element) =>
      allowedIds.includes(moduleId) ? element : <Navigate to={fallbackPath} replace />,
    [allowedIds, fallbackPath]
  );

  const isSidebarVisible = !isMobile || sidebarOpen;
  const canAccessAdminRoute = role === "Admin" && allowedIds.includes("admin");

  return (
    <LocalAIProvider>
      <Router>
        {!isAuthenticated ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div className="app-shell" data-sidebar-open={isSidebarVisible ? "true" : "false"}>
            <Sidebar
              navItems={navItems}
              role={role}
              onLogout={handleLogout}
              onClose={isMobile ? () => setSidebarOpen(false) : undefined}
            />
            {isMobile && isSidebarVisible && (
              <div
                className="sidebar-backdrop"
                role="button"
                tabIndex={0}
                aria-label="Close navigation"
                onClick={() => setSidebarOpen(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" || event.key === "Enter") {
                    setSidebarOpen(false);
                  }
                }}
              />
            )}
            <main className="app-main">
              {isMobile && (
                <div className="mobile-top-bar">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={sidebarOpen}
                    aria-controls="erp-sidebar"
                  >
                    Menu
                  </button>
                  <span className="mobile-role text-truncate">{role || "ERP User"}</span>
                </div>
              )}
                <Routes>
                  <Route path="/" element={<Navigate to={defaultLandingPath} replace />} />
                <Route path="/dashboard" element={renderProtectedRoute("dashboard", <Dashboard />)} />
                <Route path="/products" element={renderProtectedRoute("products", <Products />)} />
                <Route path="/inventory" element={renderProtectedRoute("inventory", <Inventory />)} />
                <Route path="/finance" element={renderProtectedRoute("finance", <Finance />)} />
                <Route
                  path="/admin"
                  element={
                    canAccessAdminRoute ? (
                      <AdminPanel
                        allowedModulesByRole={allowedModulesByRole}
                        moduleOptions={MODULE_CONFIG}
                        onUpdateRoleModules={persistRoleModules}
                      />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route path="/operations" element={renderProtectedRoute("operations", <Operations />)} />
                <Route path="/purchase-orders" element={renderProtectedRoute("purchaseOrders", <PurchaseOrders />)} />
                <Route path="/po" element={renderProtectedRoute("purchaseOrders", <PurchaseOrders />)} />
                <Route path="/vendor-returns" element={renderProtectedRoute("vendorReturns", <VendorReturns />)} />
                <Route path="/sales-orders" element={<Navigate to="/sales-orders/list" replace />} />
                <Route path="/sales-orders/list" element={renderProtectedRoute("salesOrderList", <SalesOrderList />)} />
                <Route path="/sales-orders/create" element={renderProtectedRoute("createSalesOrder", <CreateSalesOrder />)} />
                <Route path="/customers" element={renderProtectedRoute("customers", <Customers />)} />
                <Route path="/notifications" element={renderProtectedRoute("notifications", <Notifications />)} />
                <Route path="/warehouses" element={renderProtectedRoute("warehouses", <Warehouses />)} />
                <Route path="/lots" element={renderProtectedRoute("lots", <Lots />)} />
                <Route path="/vendors" element={renderProtectedRoute("vendors", <Vendors />)} />
                <Route path="/stock-alerts" element={renderProtectedRoute("stockAlerts", <StockAlerts />)} />
                <Route path="/reports" element={renderProtectedRoute("reports", <Reports />)} />
                  <Route path="/automation" element={renderProtectedRoute("automation", <Automation />)} />
                  <Route path="/local-ai" element={renderProtectedRoute("localAI", <LocalAIPage />)} />
                  <Route path="/scanner-device" element={renderProtectedRoute("scannerDevice", <Operations />)} />
              </Routes>
              {toastMessage && (
                <div className="toast show position-fixed bottom-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true">
                  <div className="toast-header">
                    <strong className="me-auto">ERP</strong>
                    <button type="button" className="btn-close" onClick={() => setToastMessage("")}></button>
                  </div>
                  <div className="toast-body">{toastMessage}</div>
                </div>
              )}
            </main>
          </div>
        )}
      </Router>
    </LocalAIProvider>
  );
}

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaMessage, setMfaMessage] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    smartErpApi.initialize().catch(() => {});
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await smartErpApi.login({ username, password });
      if (res.data.requiresMfa) {
        setRequiresMfa(true);
        setMfaMessage(res.data.message || "MFA verification required. OTP sent to your email.");
        setDevOtp(res.data.devOtp || "");
      } else {
        onLoginSuccess({ accessToken: res.data.accessToken, role: res.data.role });
      }
    } catch (e) {
      setError(e?.response?.data || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await smartErpApi.verifyMfa({ username, otpCode });
      onLoginSuccess({ accessToken: res.data.accessToken, role: res.data.role });
    } catch (e) {
      setError(e?.response?.data || "MFA verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">Smart ERP</div>
        <h1 className="login-title">Enterprise Access</h1>
        <p className="login-subtitle">Authenticate to open operations, automation, and analytics.</p>

        {!requiresMfa ? (
          <form onSubmit={handleLogin} className="login-form">
            <label className="form-label" htmlFor="userId">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              className="form-control"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />

            <label className="form-label mt-3" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />

            {error && (
              <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>
            )}

            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyMfa} className="login-form">
            <div className="alert alert-info py-2">
              {mfaMessage || "MFA required. Check your email for OTP."} {devOtp ? `Fallback OTP: ${devOtp}` : ""}
            </div>
            <label className="form-label" htmlFor="otpCode">
              OTP Code
            </label>
            <input
              id="otpCode"
              type="text"
              className="form-control"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value)}
              placeholder="Enter OTP"
            />
            {error && (
              <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>
            )}
            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
              {loading ? "Verifying..." : "Verify MFA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Sidebar({ navItems, role, onLogout, onClose }) {
  return (
    <aside className="app-sidebar" id="erp-sidebar">
      <div className="sidebar-header">
        <h4 className="fw-bold m-0">ERP Pro</h4>
        <small>{role || "ERP User"}</small>
      </div>

      {onClose && (
        <button
          type="button"
          className="btn-close sidebar-close-btn"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <ul className="nav flex-column gap-2 mt-3">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link className="nav-link sidebar-link" to={item.path}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <button className="btn btn-outline-light mt-auto" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}
