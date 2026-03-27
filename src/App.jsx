// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";
// import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
// import "./App.css";

// import Dashboard from "./forms/Dashboard";
// import Products from "./forms/Products";
// import Operations from "./forms/Operations";
// import CreateSalesOrder from "./forms/CreateSalesOrder";
// import Warehouses from "./forms/Warehouses";
// import Reports from "./forms/Reports";
// import Automation from "./forms/Automation";
// import PurchaseOrders from "./forms/PurchaseOrders";
// import AdminPanel from "./forms/AdminPanel";
// import VendorReturns from "./forms/VendorReturns";
// import Inventory from "./forms/Inventory";
// import Finance from "./forms/Finance";
// import Lots from "./forms/Lots";

// import Customers from "./forms/Customers";
// import Notifications from "./forms/Notifications";
// import LocalAIPage from "./pages/LocalAIPage";
// import SalesOrderList from "./forms/SalesOrderList";
// import Vendors from "./forms/Vendors";
// import StockAlerts from "./forms/StockAlerts";
// import ScannerDevicePage from "./pages/ScannerDevicePage";
// import SerialScanPage from "./pages/SerialScanPage";

// import { smartErpApi } from "./services/smartErpApi";
// import { LocalAIProvider } from "./context/LocalAIContext";

// const AUTO_LOGOUT_MS = 5 * 60 * 1000;
// const ROLE_MODULES_VERSION = 3;
// const ROLE_MODULES_KEY = "erp_role_modules";
// const ROLE_MODULES_VERSION_KEY = "erp_role_modules_version";

// const MODULE_CONFIG = [
//   { id: "dashboard", label: "Dashboard", path: "/dashboard" },
//   { id: "products", label: "Products", path: "/products" },
//   { id: "inventory", label: "Inventory", path: "/inventory" },
//   { id: "finance", label: "Finance", path: "/finance" },
//   { id: "operations", label: "Order Flow", path: "/operations" },
//   { id: "salesOrderList", label: "Sales Order List", path: "/sales-orders/list" },
//   { id: "createSalesOrder", label: "Create Sales Order", path: "/sales-orders/create" },
//   { id: "purchaseOrders", label: "Purchase Orders", path: "/purchase-orders" },
//   { id: "customers", label: "Customers", path: "/customers" },
//   {
//     id: "notifications",
//     label: ({ unreadCount }) =>
//       `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`,
//     path: "/notifications"
//   },
//   { id: "warehouses", label: "Warehouses", path: "/warehouses" },
//   { id: "lots", label: "Lot Tracking", path: "/lots" },
//   { id: "vendors", label: "Vendors", path: "/vendors" },
//   { id: "stockAlerts", label: "Stock Alerts", path: "/stock-alerts" },
//   { id: "reports", label: "Reports", path: "/reports" },
//   { id: "automation", label: "Automation", path: "/automation" },
//   { id: "vendorReturns", label: "Vendor Returns", path: "/vendor-returns" },
//   { id: "localAI", label: "Local AI", path: "/local-ai" },
//   { id: "scannerDevice", label: "Scanner Device", path: "/scanner-device" },
//   { id: "serialScan", label: "Serial Scan", path: "/serial-scan" },
//   { id: "admin", label: "Admin", path: "/admin" }
// ];

// const DEFAULT_ROLE_MODULES = {
//   Admin: MODULE_CONFIG.map((module) => module.id),
//   Manager: [
//     "dashboard",
//     "products",
//     "inventory",
//     "finance",
//     "operations",
//     "salesOrderList",
//     "createSalesOrder",
//     "purchaseOrders",
//     "customers",
//     "notifications",
//     "warehouses",
//     "lots",
//     "vendors",
//     "stockAlerts",
//     "reports",
//     "automation",
//     "vendorReturns",
//     "scannerDevice",
//     "serialScan"
//   ],
//   Operator: [
//     "operations",
//     "scannerDevice",
//     "serialScan"
//   ],
//   OperationsWorker: [
//     "dashboard",
//     "products",
//     "inventory",
//     "finance",
//     "operations",
//     "salesOrderList",
//     "createSalesOrder",
//     "purchaseOrders",
//     "customers",
//     "vendors",
//     "stockAlerts",
//     "notifications",
//     "reports",
//     "vendorReturns",
//     "scannerDevice",
//     "serialScan"
//   ],
//   ScannerWorker: [
//     "scannerDevice",
//     "serialScan"
//   ],
//   "Warehouse Manager": [
//     "dashboard",
//     "products",
//     "inventory",
//     "operations",
//     "purchaseOrders",
//     "customers",
//     "vendors",
//     "stockAlerts",
//     "warehouses",
//     "lots",
//     "notifications",
//     "vendorReturns",
//     "scannerDevice",
//     "serialScan"
//   ],
//   "Finance Manager": [
//     "dashboard",
//     "finance",
//     "reports",
//     "lots",
//     "notifications",
//     "salesOrderList",
//     "purchaseOrders",
//     "customers",
//     "vendors",
//     "stockAlerts",
//     "vendorReturns",
//     "scannerDevice",
//     "serialScan"
//   ],
//   "Robot Supervisor": ["dashboard", "operations", "automation", "localAI", "notifications", "scannerDevice"],
//   User: [
//     "dashboard",
//     "operations",
//     "salesOrderList",
//     "notifications",
//     "reports",
//     "scannerDevice",
//     "serialScan"
//   ]
// };

// export default function App() {
//   const isClient = typeof window !== "undefined";
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [role, setRole] = useState("");
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [toastMessage, setToastMessage] = useState("");
//   const [isMobile, setIsMobile] = useState(isClient ? window.innerWidth < 992 : false);
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const lastActivityRef = useRef(Date.now());
//   const normalizeRoleModules = useCallback(
//     (modules) => {
//       const normalized = { ...modules };
//       Object.entries(DEFAULT_ROLE_MODULES).forEach(([roleName, defaults]) => {
//         const existing = normalized[roleName] ?? [];
//         normalized[roleName] = Array.from(new Set([...existing, ...defaults]));
//       });
//       return normalized;
//     },
//     []
//   );

//   const initialRoleModules = useCallback(() => {
//     if (!isClient) return DEFAULT_ROLE_MODULES;
//     const storedText = window.localStorage.getItem(ROLE_MODULES_KEY);
//     const storedVersion = Number(window.localStorage.getItem(ROLE_MODULES_VERSION_KEY) ?? "0");
//     const raw = storedText ? JSON.parse(storedText) : DEFAULT_ROLE_MODULES;
//     const normalized = normalizeRoleModules(raw);
//     const normalizedText = JSON.stringify(normalized);
//     const needsPersist =
//       storedVersion < ROLE_MODULES_VERSION || storedText !== normalizedText;

//     if (needsPersist) {
//       window.localStorage.setItem(ROLE_MODULES_KEY, normalizedText);
//       window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
//     }

//     return normalized;
//   }, [isClient, normalizeRoleModules]);

//   const [allowedModulesByRole, setAllowedModulesByRole] = useState(initialRoleModules);

//   const updateLastActivity = useCallback(() => {
//     const now = Date.now();
//     lastActivityRef.current = now;
//     if (isClient) {
//       window.localStorage.setItem("erp_last_activity", String(now));
//     }
//     return now;
//   }, [isClient]);

//   const persistRoleModules = useCallback(
//     (nextModules) => {
//       setAllowedModulesByRole(nextModules);
//       if (isClient) {
//         window.localStorage.setItem(ROLE_MODULES_KEY, JSON.stringify(nextModules));
//         window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
//       }
//     },
//     [isClient]
//   );

//   const handleLogout = useCallback(async () => {
//     try {
//       // Get login log ID from localStorage (set during login)
//       const loginLogId = window.localStorage.getItem("erp_login_log_id");
//       if (loginLogId) {
//         await smartErpApi.logout({ loginLogId: parseInt(loginLogId) });
//       }
//     } catch (err) {
//       console.error("Logout API failed:", err);
//     }

//     if (isClient) {
//       window.localStorage.removeItem("erp_token");
//       window.localStorage.removeItem("erp_role");
//       window.localStorage.removeItem("erp_last_activity");
//       window.localStorage.removeItem("erp_login_log_id");
//     }
//     lastActivityRef.current = 0;
//     setRole("");
//     setIsAuthenticated(false);
//   }, [isClient]);

//   const handleLoginSuccess = useCallback(
//     (payload) => {
//       if (isClient) {
//         window.localStorage.setItem("erp_token", payload.accessToken);
//         window.localStorage.setItem("erp_role", payload.role || "");
//         if (payload.loginLogId) {
//           window.localStorage.setItem("erp_login_log_id", payload.loginLogId.toString());
//         }
//       }
//       updateLastActivity();
//       setRole(payload.role || "");
//       setIsAuthenticated(true);
//     },
//     [isClient, updateLastActivity]
//   );

//   useEffect(() => {
//     if (!isClient) return;

//     const token = window.localStorage.getItem("erp_token");
//     const storedLastActivity = Number(window.localStorage.getItem("erp_last_activity") || "0");
//     const sessionActive = Boolean(token && Date.now() - storedLastActivity < AUTO_LOGOUT_MS);

//     if (sessionActive) {
//       setIsAuthenticated(true);
//       setRole(window.localStorage.getItem("erp_role") || "");
//       lastActivityRef.current = storedLastActivity || Date.now();
//     } else {
//       handleLogout();
//     }

//     const handleUnauthorized = () => {
//       handleLogout();
//     };

//     window.addEventListener("erp:unauthorized", handleUnauthorized);
//     return () => window.removeEventListener("erp:unauthorized", handleUnauthorized);
//   }, [handleLogout, isClient]);

//   useEffect(() => {
//     if (!isClient || !isAuthenticated) return;

//     updateLastActivity();
//     const activityEvents = ["click", "mousemove", "keydown", "scroll", "touchstart"];
//     const handleActivity = () => updateLastActivity();
//     activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity));

//     const intervalId = window.setInterval(() => {
//       if (Date.now() - lastActivityRef.current >= AUTO_LOGOUT_MS) {
//         handleLogout();
//       }
//     }, 1000);

//     return () => {
//       activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
//       window.clearInterval(intervalId);
//     };
//   }, [handleLogout, isAuthenticated, isClient, updateLastActivity]);

//   useEffect(() => {
//     if (!isClient) return;

//     const handleResize = () => {
//       const mobileView = window.innerWidth < 992;
//       setIsMobile(mobileView);
//       if (!mobileView) {
//         setSidebarOpen(true);
//       }
//     };

//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, [isClient]);

//   useEffect(() => {
//     if (!isClient) return;
//     const isSidebarVisible = !isMobile || sidebarOpen;
//     document.body.style.overflow = isSidebarVisible && isMobile ? "hidden" : "";
//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [isClient, isMobile, sidebarOpen]);

//   useEffect(() => {
//     let interval;
//     const fetchCount = async () => {
//       try {
//         const res = await smartErpApi.notificationsUnreadCount();
//         const c = res.data?.count ?? res.data?.Count ?? 0;
//         setUnreadCount(c);
//         if (c > unreadCount) {
//           setToastMessage(`You have ${c - unreadCount} new notification${c - unreadCount > 1 ? "s" : ""}`);
//         }
//       } catch (e) {
//         // ignore
//       }
//     };
//     if (isAuthenticated) {
//       fetchCount();
//       interval = window.setInterval(fetchCount, 30000);
//     }
//     return () => window.clearInterval(interval);
//   }, [isAuthenticated, unreadCount]);

//   const allowedIds = useMemo(() => {
//     const configured = allowedModulesByRole[role];
//     if (configured && configured.length) return configured;
//     if (DEFAULT_ROLE_MODULES[role]) return DEFAULT_ROLE_MODULES[role];
//     return DEFAULT_ROLE_MODULES.OperationsWorker;
//   }, [allowedModulesByRole, role]);

//   const fallbackPath = useMemo(() => {
//     if (!allowedIds || allowedIds.length === 0) return "/dashboard";
//     const allowedModule = MODULE_CONFIG.find((module) => allowedIds.includes(module.id));
//     return allowedModule?.path || "/dashboard";
//   }, [allowedIds]);

//   const defaultLandingPath = useMemo(() => {
//     if (role === "ScannerWorker") {
//       return "/scanner-device";
//     }
//     return fallbackPath;
//   }, [role, fallbackPath]);

//   const navItems = useMemo(
//     () =>
//       MODULE_CONFIG.filter((item) => allowedIds.includes(item.id)).map((item) => ({
//         path: item.path,
//         label: typeof item.label === "function" ? item.label({ unreadCount }) : item.label,
//         id: item.id
//       })),
//     [allowedIds, unreadCount]
//   );

//   const renderProtectedRoute = useCallback(
//     (moduleId, element) =>
//       allowedIds.includes(moduleId) ? element : <Navigate to={fallbackPath} replace />,
//     [allowedIds, fallbackPath]
//   );

//   const isSidebarVisible = !isMobile || sidebarOpen;
//   const canAccessAdminRoute = role === "Admin" && allowedIds.includes("admin");

//   return (
//     <LocalAIProvider>
//       <Router>
//         {!isAuthenticated ? (
//           <LoginPage onLoginSuccess={handleLoginSuccess} />
//         ) : (
//           <div className="app-shell" data-sidebar-open={isSidebarVisible ? "true" : "false"}>
//             <Sidebar
//               navItems={navItems}
//               role={role}
//               onLogout={handleLogout}
//               onClose={isMobile ? () => setSidebarOpen(false) : undefined}
//             />
//             {isMobile && isSidebarVisible && (
//               <div
//                 className="sidebar-backdrop"
//                 role="button"
//                 tabIndex={0}
//                 aria-label="Close navigation"
//                 onClick={() => setSidebarOpen(false)}
//                 onKeyDown={(event) => {
//                   if (event.key === "Escape" || event.key === "Enter") {
//                     setSidebarOpen(false);
//                   }
//                 }}
//               />
//             )}
//             <main className="app-main">
//               {isMobile && (
//                 <div className="mobile-top-bar">
//                   <button
//                     type="button"
//                     className="btn btn-outline-primary"
//                     onClick={() => setSidebarOpen(true)}
//                     aria-label="Open navigation menu"
//                     aria-expanded={sidebarOpen}
//                     aria-controls="erp-sidebar"
//                   >
//                     Menu
//                   </button>
//                   <span className="mobile-role text-truncate">{role || "ERP User"}</span>
//                 </div>
//               )}
//                 <Routes>
//                   <Route path="/" element={<Navigate to={defaultLandingPath} replace />} />
//                 <Route path="/dashboard" element={renderProtectedRoute("dashboard", <Dashboard />)} />
//                 <Route path="/products" element={renderProtectedRoute("products", <Products />)} />
//                 <Route path="/inventory" element={renderProtectedRoute("inventory", <Inventory />)} />
//                 <Route path="/finance" element={renderProtectedRoute("finance", <Finance />)} />
//                 <Route
//                   path="/admin"
//                   element={
//                     canAccessAdminRoute ? (
//                       <AdminPanel
//                         allowedModulesByRole={allowedModulesByRole}
//                         moduleOptions={MODULE_CONFIG}
//                         onUpdateRoleModules={persistRoleModules}
//                       />
//                     ) : (
//                       <Navigate to="/dashboard" replace />
//                     )
//                   }
//                 />
//                 <Route path="/operations" element={renderProtectedRoute("operations", <Operations />)} />
//                 <Route path="/purchase-orders" element={renderProtectedRoute("purchaseOrders", <PurchaseOrders />)} />
//                 <Route path="/po" element={renderProtectedRoute("purchaseOrders", <PurchaseOrders />)} />
//                 <Route path="/vendor-returns" element={renderProtectedRoute("vendorReturns", <VendorReturns />)} />
//                 <Route path="/sales-orders" element={<Navigate to="/sales-orders/list" replace />} />
//                 <Route path="/sales-orders/list" element={renderProtectedRoute("salesOrderList", <SalesOrderList />)} />
//                 <Route path="/sales-orders/create" element={renderProtectedRoute("createSalesOrder", <CreateSalesOrder />)} />
//                 <Route path="/customers" element={renderProtectedRoute("customers", <Customers />)} />
//                 <Route path="/notifications" element={renderProtectedRoute("notifications", <Notifications />)} />
//                 <Route path="/warehouses" element={renderProtectedRoute("warehouses", <Warehouses />)} />
//                 <Route path="/lots" element={renderProtectedRoute("lots", <Lots />)} />
//                 <Route path="/vendors" element={renderProtectedRoute("vendors", <Vendors />)} />
//                 <Route path="/stock-alerts" element={renderProtectedRoute("stockAlerts", <StockAlerts />)} />
//                 <Route path="/reports" element={renderProtectedRoute("reports", <Reports />)} />
//                   <Route path="/automation" element={renderProtectedRoute("automation", <Automation />)} />
//                 <Route path="/local-ai" element={renderProtectedRoute("localAI", <LocalAIPage />)} />
//                 <Route path="/scanner-device" element={renderProtectedRoute("scannerDevice", <Operations />)} />
//                 <Route path="/serial-scan" element={renderProtectedRoute("serialScan", <SerialScanPage />)} />
//               </Routes>
//               {toastMessage && (
//                 <div className="toast show position-fixed bottom-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true">
//                   <div className="toast-header">
//                     <strong className="me-auto">ERP</strong>
//                     <button type="button" className="btn-close" onClick={() => setToastMessage("")}></button>
//                   </div>
//                   <div className="toast-body">{toastMessage}</div>
//                 </div>
//               )}
//             </main>
//           </div>
//         )}
//       </Router>
//     </LocalAIProvider>
//   );
// }

// function LoginPage({ onLoginSuccess }) {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [otpCode, setOtpCode] = useState("");
//   const [requiresMfa, setRequiresMfa] = useState(false);
//   const [mfaMessage, setMfaMessage] = useState("");
//   const [devOtp, setDevOtp] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     smartErpApi.initialize().catch(() => {});
//   }, []);

//   const handleLogin = async (event) => {
//     event.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const res = await smartErpApi.login({ username, password });
//       if (res.data.requiresMfa) {
//         setRequiresMfa(true);
//         setMfaMessage(res.data.message || "MFA verification required. OTP sent to your email.");
//         setDevOtp(res.data.devOtp || "");
//       } else {
//         onLoginSuccess({ accessToken: res.data.accessToken, role: res.data.role });
//       }
//     } catch (e) {
//       setError(e?.response?.data || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerifyMfa = async (event) => {
//     event.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       const res = await smartErpApi.verifyMfa({ username, otpCode });
//       onLoginSuccess({ accessToken: res.data.accessToken, role: res.data.role });
//     } catch (e) {
//       setError(e?.response?.data || "MFA verification failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-page">
//       <div className="login-card">
//         <div className="login-brand">Smart ERP</div>
//         <h1 className="login-title">Enterprise Access</h1>
//         <p className="login-subtitle">Authenticate to open operations, automation, and analytics.</p>

//         {!requiresMfa ? (
//           <form onSubmit={handleLogin} className="login-form">
//             <label className="form-label" htmlFor="userId">
//               User ID
//             </label>
//             <input
//               id="userId"
//               type="text"
//               className="form-control"
//               value={username}
//               onChange={(event) => setUsername(event.target.value)}
//               autoComplete="username"
//             />

//             <label className="form-label mt-3" htmlFor="password">
//               Password
//             </label>
//             <input
//               id="password"
//               type="password"
//               className="form-control"
//               value={password}
//               onChange={(event) => setPassword(event.target.value)}
//               autoComplete="current-password"
//             />

//             {error && (
//               <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>
//             )}

//             <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
//               {loading ? "Signing in..." : "Login"}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleVerifyMfa} className="login-form">
//             <div className="alert alert-info py-2">
//               {mfaMessage || "MFA required. Check your email for OTP."} {devOtp ? `Fallback OTP: ${devOtp}` : ""}
//             </div>
//             <label className="form-label" htmlFor="otpCode">
//               OTP Code
//             </label>
//             <input
//               id="otpCode"
//               type="text"
//               className="form-control"
//               value={otpCode}
//               onChange={(event) => setOtpCode(event.target.value)}
//               placeholder="Enter OTP"
//             />
//             {error && (
//               <div className="alert alert-danger mt-3 mb-0 py-2">{error}</div>
//             )}
//             <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading}>
//               {loading ? "Verifying..." : "Verify MFA"}
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }

// function Sidebar({ navItems, role, onLogout, onClose }) {
//   return (
//     <aside className="app-sidebar" id="erp-sidebar">
//       <div className="sidebar-header">
//         <h4 className="fw-bold m-0">ERP Pro</h4>
//         <small>{role || "ERP User"}</small>
//       </div>

//       {onClose && (
//         <button
//           type="button"
//           className="btn-close sidebar-close-btn"
//           aria-label="Close navigation"
//           onClick={onClose}
//         />
//       )}

//       <ul className="nav flex-column gap-2 mt-3">
//         {navItems.map((item) => (
//           <li key={item.path} className="nav-item">
//             <Link className="nav-link sidebar-link" to={item.path}>
//               {item.label}
//             </Link>
//           </li>
//         ))}
//       </ul>

//       <button className="btn btn-outline-light mt-auto" onClick={onLogout}>
//         Logout
//       </button>
//     </aside>
//   );
// }







// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";
// import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

// // Form Imports
// import Dashboard from "./forms/Dashboard";
// import Products from "./forms/Products";
// import Operations from "./forms/Operations";
// import CreateSalesOrder from "./forms/CreateSalesOrder";
// import Warehouses from "./forms/Warehouses";
// import Reports from "./forms/Reports";
// import Automation from "./forms/Automation";
// import PurchaseOrders from "./forms/PurchaseOrders";
// import AdminPanel from "./forms/AdminPanel";
// import VendorReturns from "./forms/VendorReturns";
// import Inventory from "./forms/Inventory";
// import Finance from "./forms/Finance";
// import Lots from "./forms/Lots";
// import Customers from "./forms/Customers";
// import Notifications from "./forms/Notifications";
// import LocalAIPage from "./pages/LocalAIPage";
// import SalesOrderList from "./forms/SalesOrderList";
// import Vendors from "./forms/Vendors";
// import StockAlerts from "./forms/StockAlerts";
// import ScannerDevicePage from "./pages/ScannerDevicePage";
// import SerialScanPage from "./pages/SerialScanPage";

// import { LocalAIProvider } from "./context/LocalAIContext";

// // 1. Grouped Module Configuration
// const MODULE_CONFIG = [
//   { id: "dashboard", label: "Dashboard", path: "/dashboard" },
//   { id: "products", label: "Products", path: "/products" },
  
//   {
//     id: "salesGroup",
//     label: "Sales & CRM",
//     isGroup: true,
//     subModules: [
//       { id: "salesOrderList", label: "Sales Orders", path: "/sales-orders/list" },
//       { id: "createSalesOrder", label: "Create Order", path: "/sales-orders/create" },
//       { id: "customers", label: "Customers", path: "/customers" },
//     ]
//   },
//   {
//     id: "vendorGroup",
//     label: "Vendor Portal",
//     isGroup: true,
//     subModules: [
//       { id: "vendors", label: "Vendors", path: "/vendors" },
//       { id: "purchaseOrders", label: "Purchase Orders", path: "/purchase-orders" },
//       { id: "vendorReturns", label: "Returns", path: "/vendor-returns" },
//     ]
//   },
//   {
//     id: "inventoryGroup",
//     label: "Warehouse & Lots",
//     isGroup: true,
//     subModules: [
//       { id: "inventory", label: "Stock Inventory", path: "/inventory" },
//       { id: "lots", label: "Lot Tracking", path: "/lots" },
//       { id: "warehouses", label: "Warehouses", path: "/warehouses" },
//       { id: "operations", label: "Order Flow", path: "/operations" },
//     ]
//   },
//   {
//     id: "financeGroup",
//     label: "Finance & Data",
//     isGroup: true,
//     subModules: [
//       { id: "finance", label: "Finance", path: "/finance" },
//       { id: "reports", label: "Reports", path: "/reports" },
//       { id: "stockAlerts", label: "Stock Alerts", path: "/stock-alerts" },
//     ]
//   },
//   {
//     id: "scannerGroup",
//     label: "Scanner Hub",
//     isGroup: true,
//     subModules: [
//       { id: "scannerDevice", label: "Mobile Scanner", path: "/scanner-device" },
//       { id: "serialScan", label: "Serial Scan", path: "/serial-scan" },
//     ]
//   },
//   { id: "automation", label: "Automation", path: "/automation" },
//   { id: "localAI", label: "Local AI", path: "/local-ai" },
//   { id: "notifications", label: "Notifications", path: "/notifications" },
//   { id: "admin", label: "Admin", path: "/admin" }
// ];

// const DEFAULT_ROLE_MODULES = {
//   Admin: MODULE_CONFIG.flatMap(m => m.isGroup ? [m.id, ...m.subModules.map(s => s.id)] : [m.id]),
//   User: ["dashboard", "notifications"]
// };

// export default function App() {
//   return (
//     <LocalAIProvider>
//       <Router>
//         <style>{`
//           body { margin: 0; padding: 0; background: #f1f5f9; overflow-x: hidden; }
//           .erp-container { display: flex; min-height: 100vh; }

//           /* Sidebar Styling */
//           .sidebar-wrapper {
//             width: 260px; background: #0f172a; color: #f8fafc;
//             display: flex; flex-direction: column; position: fixed;
//             height: 100vh; left: 0; top: 0; z-index: 2000;
//             transition: transform 0.3s ease;
//           }

//           .sidebar-brand { padding: 25px 20px; border-bottom: 1px solid #1e293b; }
//           .sidebar-brand h3 { color: #38bdf8; font-weight: 800; margin: 0; font-size: 1.1rem; }

//           .sidebar-nav-container { flex-grow: 1; overflow-y: auto; padding: 15px 10px; }
//           .nav-group-header, .main-link {
//             padding: 10px 15px; color: #d8dfea; cursor: pointer; display: flex;
//             justify-content: space-between; align-items: center; border-radius: 8px;
//             text-decoration: none; font-size: 0.9rem; margin-bottom: 2px;
//           }
//           .main-link.active, .nav-group-header.active { background: #1e293b; color: #ffffff; }
//           .sidebar-submenu { padding-left: 10px; margin-top: 5px; border-left: 1px solid #334155; margin-left: 20px; }
//           .submenu-link { display: block; padding: 6px 15px; color: #beccdf; font-size: 0.85rem; text-decoration: none; }
//           .submenu-link.active { color: #38bdf8; font-weight: bold; }

//           .sidebar-footer { padding: 15px; border-top: 1px solid #1e293b; background: #0f172a; }

//           /* Layout Content */
//           .erp-main-content { margin-left: 260px; flex-grow: 1; padding: 20px; width: 100%; transition: 0.3s; }

//           .mobile-header {
//             display: none; background: #ffffff; padding: 12px 20px;
//             border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 1500;
//             justify-content: space-between; align-items: center;
//           }

//           @media (max-width: 992px) {
//             .sidebar-wrapper { transform: translateX(-260px); }
//             .sidebar-wrapper.mobile-open { transform: translateX(0); }
//             .erp-main-content { margin-left: 0; }
//             .mobile-header { display: flex; }
//             .sidebar-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1900; }
//           }
//         `}</style>
//         <AppContent />
//       </Router>
//     </LocalAIProvider>
//   );
// }

// function AppContent() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [role, setRole] = useState("");
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const location = useLocation();

//   useEffect(() => {
//     const token = window.localStorage.getItem("erp_token");
//     if (token) {
//       setIsAuthenticated(true);
//       setRole(window.localStorage.getItem("erp_role") || "Admin");
//     }
//   }, []);

//   const allowedIds = useMemo(() => DEFAULT_ROLE_MODULES[role] || DEFAULT_ROLE_MODULES.Admin, [role]);

//   const navItems = useMemo(() => {
//     return MODULE_CONFIG.filter(item => {
//       if (item.isGroup) return item.subModules.some(s => allowedIds.includes(s.id));
//       return allowedIds.includes(item.id);
//     }).map(item => {
//       if (item.isGroup) {
//         return { ...item, subModules: item.subModules.filter(s => allowedIds.includes(s.id)) };
//       }
//       return item;
//     });
//   }, [allowedIds]);

//   if (!isAuthenticated) return <LoginPage onLoginSuccess={(p) => {
//     window.localStorage.setItem("erp_token", p.accessToken);
//     window.localStorage.setItem("erp_role", p.role);
//     setIsAuthenticated(true);
//     setRole(p.role);
//   }} />;

//   return (
//     <div className="erp-container">
//       {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

//       <Sidebar 
//         navItems={navItems} role={role} isOpen={sidebarOpen} 
//         onClose={() => setSidebarOpen(false)}
//         onLogout={() => { window.localStorage.clear(); setIsAuthenticated(false); }}
//       />

//       <div className="erp-main-content">
//         <header className="mobile-header">
//           <button className="btn btn-dark btn-sm" onClick={() => setSidebarOpen(true)}>Menu</button>
//           <span className="fw-bold">ERP PRO</span>
//           <div style={{width: '45px'}}></div>
//         </header>

//         <Routes>
//           <Route path="/" element={<Navigate to="/dashboard" replace />} />
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/products" element={<Products />} />
          
//           {/* Sales Group */}
//           <Route path="/sales-orders/list" element={<SalesOrderList />} />
//           <Route path="/sales-orders/create" element={<CreateSalesOrder />} />
//           <Route path="/customers" element={<Customers />} />
          
//           {/* Vendor Group */}
//           <Route path="/vendors" element={<Vendors />} />
//           <Route path="/purchase-orders" element={<PurchaseOrders />} />
//           <Route path="/vendor-returns" element={<VendorReturns />} />
          
//           {/* Inventory & Warehousing Group */}
//           <Route path="/inventory" element={<Inventory />} />
//           <Route path="/lots" element={<Lots />} />
//           <Route path="/warehouses" element={<Warehouses />} />
//           <Route path="/operations" element={<Operations />} />
          
//           {/* Finance & Data Group */}
//           <Route path="/finance" element={<Finance />} />
//           <Route path="/reports" element={<Reports />} />
//           <Route path="/stock-alerts" element={<StockAlerts />} />
          
//           {/* Tools */}
//           <Route path="/scanner-device" element={<ScannerDevicePage />} />
//           <Route path="/serial-scan" element={<SerialScanPage />} />
//           <Route path="/automation" element={<Automation />} />
//           <Route path="/local-ai" element={<LocalAIPage />} />
//           <Route path="/notifications" element={<Notifications />} />
//           <Route path="/admin" element={role === "Admin" ? <AdminPanel /> : <Navigate to="/" />} />
//         </Routes>
//       </div>
//     </div>
//   );
// }

// function Sidebar({ navItems, role, isOpen, onClose, onLogout }) {
//   const [openGroup, setOpenGroup] = useState(null);
//   const location = useLocation();

//   return (
//     <aside className={`sidebar-wrapper ${isOpen ? 'mobile-open' : ''}`}>
//       <div className="sidebar-brand d-flex justify-content-between">
//         <h3>ERP PRO</h3>
//         <button className="btn btn-link text-white d-lg-none p-0" onClick={onClose}>✕</button>
//       </div>

//       <div className="sidebar-nav-container">
//         <ul className="nav flex-column p-0">
//           {navItems.map((item) => {
//             if (item.isGroup) {
//               const groupOpen = openGroup === item.id;
//               return (
//                 <li key={item.id} className="nav-item">
//                   <div className="nav-group-header" onClick={() => setOpenGroup(groupOpen ? null : item.id)}>
//                     <span>{item.label}</span>
//                     <span>{groupOpen ? '−' : '+'}</span>
//                   </div>
//                   {groupOpen && (
//                     <ul className="nav flex-column sidebar-submenu">
//                       {item.subModules.map(sub => (
//                         <li key={sub.id}>
//                           <Link to={sub.path} className={`submenu-link ${location.pathname === sub.path ? 'active' : ''}`} onClick={onClose}>
//                             {sub.label}
//                           </Link>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </li>
//               );
//             }
//             return (
//               <li key={item.id} className="nav-item">
//                 <Link to={item.path} className={`main-link ${location.pathname === item.path ? 'active' : ''}`} onClick={onClose}>
//                   {item.label}
//                 </Link>
//               </li>
//             );
//           })}
//         </ul>
//       </div>

//       <div className="sidebar-footer">
//         <button className="btn btn-danger btn-sm w-100 fw-bold" onClick={onLogout}>LOGOUT</button>
//       </div>
//     </aside>
//   );
// }

// function LoginPage({ onLoginSuccess }) {
//   return (
//     <div className="vh-100 d-flex align-items-center justify-content-center bg-dark p-3">
//       <div className="card p-5 shadow text-center w-100" style={{ maxWidth: '400px', borderRadius: '15px' }}>
//         <h2 className="mb-4 fw-bold">ERP ACCESS</h2>
//         <button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => onLoginSuccess({ accessToken: 'MOCK', role: 'Admin' })}>SIGN IN</button>
//       </div>
//     </div>
//   );
// }



















































import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";

// Form Imports
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
import SerialScanPage from "./pages/SerialScanPage";

import { LocalAIProvider } from "./context/LocalAIContext";
import { smartErpApi } from "./services/smartErpApi";

// 1. Grouped Module Configuration
const ROLE_MODULES_VERSION = 3;
const ROLE_MODULES_KEY = "erp_role_modules";
const ROLE_MODULES_VERSION_KEY = "erp_role_modules_version";

const MODULE_CONFIG = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard" },
  { id: "products", label: "Products", path: "/products" },
  
  {
    id: "salesGroup",
    label: "Sales & CRM",
    isGroup: true,
    subModules: [
      { id: "salesOrderList", label: "Sales Orders", path: "/sales-orders/list" },
      { id: "createSalesOrder", label: "Create Order", path: "/sales-orders/create" },
      { id: "customers", label: "Customers", path: "/customers" },
    ]
  },
  {
    id: "vendorGroup",
    label: "Vendor Portal",
    isGroup: true,
    subModules: [
      { id: "vendors", label: "Vendors", path: "/vendors" },
      { id: "purchaseOrders", label: "Purchase Orders", path: "/purchase-orders" },
      { id: "vendorReturns", label: "Returns", path: "/vendor-returns" },
    ]
  },
  {
    id: "inventoryGroup",
    label: "Warehouse & Lots",
    isGroup: true,
    subModules: [
      { id: "inventory", label: "Stock Inventory", path: "/inventory" },
      { id: "lots", label: "Lot Tracking", path: "/lots" },
      { id: "warehouses", label: "Warehouses", path: "/warehouses" },
      { id: "operations", label: "Order Flow", path: "/operations" },
    ]
  },
  {
    id: "financeGroup",
    label: "Finance & Data",
    isGroup: true,
    subModules: [
      { id: "finance", label: "Finance", path: "/finance" },
      { id: "reports", label: "Reports", path: "/reports" },
      { id: "stockAlerts", label: "Stock Alerts", path: "/stock-alerts" },
    ]
  },
  {
    id: "scannerGroup",
    label: "Scanner Hub",
    isGroup: true,
    subModules: [
      { id: "scannerDevice", label: "Mobile Scanner", path: "/scanner-device" },
      { id: "serialScan", label: "Serial Scan", path: "/serial-scan" },
    ]
  },
  { id: "automation", label: "Automation", path: "/automation" },
  { id: "localAI", label: "Local AI", path: "/local-ai" },
  { id: "notifications", label: "Notifications", path: "/notifications" },
  { id: "admin", label: "Admin", path: "/admin" }
];

const DEFAULT_ROLE_MODULES = {
  Admin: MODULE_CONFIG.flatMap((module) => module.isGroup ? module.subModules.map((subModule) => subModule.id) : [module.id]),
  Manager: [
    "dashboard",
    "products",
    "salesOrderList",
    "createSalesOrder",
    "customers",
    "vendors",
    "purchaseOrders",
    "vendorReturns",
    "inventory",
    "lots",
    "warehouses",
    "operations",
    "finance",
    "reports",
    "stockAlerts",
    "scannerDevice",
    "serialScan",
    "automation",
    "notifications"
  ],
  Operator: [
    "operations",
    "scannerDevice",
    "serialScan"
  ],
  OperationsWorker: [
    "dashboard",
    "products",
    "inventory",
    "operations",
    "salesOrderList",
    "createSalesOrder",
    "customers",
    "vendors",
    "purchaseOrders",
    "vendorReturns",
    "stockAlerts",
    "notifications",
    "scannerDevice",
    "serialScan"
  ],
  ScannerWorker: [
    "scannerDevice",
    "serialScan",
    "operations"
  ],
  "Warehouse Manager": [
    "dashboard",
    "products",
    "inventory",
    "lots",
    "warehouses",
    "operations",
    "purchaseOrders",
    "vendors",
    "vendorReturns",
    "stockAlerts",
    "notifications",
    "scannerDevice",
    "serialScan"
  ],
  "Finance Manager": [
    "dashboard",
    "finance",
    "reports",
    "salesOrderList",
    "purchaseOrders",
    "customers",
    "vendors",
    "vendorReturns",
    "stockAlerts",
    "notifications"
  ],
  "Robot Supervisor": [
    "dashboard",
    "operations",
    "automation",
    "localAI",
    "notifications",
    "scannerDevice"
  ],
  User: [
    "dashboard",
    "notifications"
  ]
};

export default function App() {
  return (
    <LocalAIProvider>
      <Router>
        <style>{`
          body { margin: 0; padding: 0; background: #f1f5f9; overflow-x: hidden; font-family: 'Inter', sans-serif; }
          .erp-container { display: flex; min-height: 100vh; }

          /* Sidebar Styling */
          .sidebar-wrapper {
            width: 260px; background: #0f172a; color: #f8fafc;
            display: flex; flex-direction: column; position: fixed;
            height: 100vh; left: 0; top: 0; z-index: 2000;
            transition: transform 0.3s ease;
          }

          .sidebar-brand { padding: 25px 20px; border-bottom: 1px solid #1e293b; }
          .sidebar-brand h3 { color: #38bdf8; font-weight: 800; margin: 0; font-size: 1.1rem; }

          .sidebar-nav-container { flex-grow: 1; overflow-y: auto; padding: 15px 10px; }
          .nav-group-header, .main-link {
            padding: 10px 15px; color: #d8dfea; cursor: pointer; display: flex;
            justify-content: space-between; align-items: center; border-radius: 8px;
            text-decoration: none; font-size: 0.9rem; margin-bottom: 2px;
          }
          .main-link.active, .nav-group-header.active { background: #1e293b; color: #ffffff; }
          .sidebar-submenu { padding-left: 10px; margin-top: 5px; border-left: 1px solid #334155; margin-left: 20px; }
          .submenu-link { display: block; padding: 6px 15px; color: #beccdf; font-size: 0.85rem; text-decoration: none; }
          .submenu-link.active { color: #38bdf8; font-weight: bold; }

          .sidebar-footer { padding: 15px; border-top: 1px solid #1e293b; background: #0f172a; }

          /* Layout Content */
          .erp-main-content { margin-left: 260px; flex-grow: 1; padding: 20px; width: 100%; transition: 0.3s; }

          /* Login Page Specific Styles */
          .login-page {
            width: 100vw; height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            display: flex; align-items: center; justify-content: center;
            position: fixed; top: 0; left: 0; z-index: 5000;
          }
          .login-card {
            background: #ffffff; padding: 40px; border-radius: 16px;
            width: 100%; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .login-brand {
            color: #0f172a; font-weight: 800; font-size: 1.5rem;
            text-align: center; margin-bottom: 10px; letter-spacing: -0.5px;
          }
          .login-title {
            font-size: 1.1rem; color: #475569; text-align: center;
            font-weight: 600; margin-bottom: 8px;
          }
          .login-subtitle {
            font-size: 0.85rem; color: #64748b; text-align: center;
            margin-bottom: 30px;
          }
          .form-label { font-weight: 600; color: #334155; font-size: 0.85rem; }
          .form-control {
            padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;
            font-size: 0.95rem; background: #f8fafc;
          }
          .form-control:focus {
            background: #fff; border-color: #38bdf8; box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
          }
          .btn-primary {
            background: #38bdf8; border: none; padding: 12px;
            font-weight: 700; border-radius: 8px; transition: 0.2s;
          }
          .btn-primary:hover { background: #0ea5e9; transform: translateY(-1px); }

          .mobile-header {
            display: none; background: #ffffff; padding: 12px 20px;
            border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 1500;
            justify-content: space-between; align-items: center;
          }

          @media (max-width: 992px) {
            .sidebar-wrapper { transform: translateX(-260px); }
            .sidebar-wrapper.mobile-open { transform: translateX(0); }
            .erp-main-content { margin-left: 0; }
            .mobile-header { display: flex; }
            .sidebar-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1900; }
          }
        `}</style>
        <AppContent />
      </Router>
    </LocalAIProvider>
  );
}

function AppContent() {
  const isClient = typeof window !== "undefined";
  const warningTimeoutMs = 2 * 60 * 1000;
  const logoutTimeoutMs = 5 * 60 * 1000;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("");
  const [userAssignedPages, setUserAssignedPages] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionWarningOpen, setSessionWarningOpen] = useState(false);
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);

  const normalizeRoleModules = useCallback((modules) => {
    const normalized = { ...modules };
    Object.entries(DEFAULT_ROLE_MODULES).forEach(([roleName, defaults]) => {
      const existing = normalized[roleName] ?? [];
      normalized[roleName] = Array.from(new Set([...existing, ...defaults]));
    });
    return normalized;
  }, []);

  const initialRoleModules = useCallback(() => {
    if (!isClient) return DEFAULT_ROLE_MODULES;
    const storedText = window.localStorage.getItem(ROLE_MODULES_KEY);
    const storedVersion = Number(window.localStorage.getItem(ROLE_MODULES_VERSION_KEY) ?? "0");
    const raw = storedText ? JSON.parse(storedText) : DEFAULT_ROLE_MODULES;
    const normalized = normalizeRoleModules(raw);
    if (storedVersion < ROLE_MODULES_VERSION || storedText !== JSON.stringify(normalized)) {
      window.localStorage.setItem(ROLE_MODULES_KEY, JSON.stringify(normalized));
      window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
    }
    return normalized;
  }, [isClient, normalizeRoleModules]);

  const [allowedModulesByRole, setAllowedModulesByRole] = useState(initialRoleModules);
  const persistRoleModules = useCallback(
    (modules) => {
      const normalized = normalizeRoleModules(modules);
      if (isClient) {
        window.localStorage.setItem(ROLE_MODULES_KEY, JSON.stringify(normalized));
        window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
      }
      setAllowedModulesByRole(normalized);
    },
    [isClient, normalizeRoleModules]
  );

  useEffect(() => {
    const token = window.localStorage.getItem("erp_token");
    if (token) {
      setIsAuthenticated(true);
      setRole(window.localStorage.getItem("erp_role") || "Admin");
      try {
        setUserAssignedPages(JSON.parse(window.localStorage.getItem("erp_assigned_pages") || "[]"));
      } catch {
        setUserAssignedPages([]);
      }
    }
  }, []);

  const handleLoginSuccess = useCallback(({ accessToken, role, loginLogId, userType, assignedPages }) => {
    if (accessToken) {
      window.localStorage.setItem("erp_token", accessToken);
    }
    if (role) {
      window.localStorage.setItem("erp_role", role);
    }
    if (userType) {
      window.localStorage.setItem("erp_user_type", userType);
    }
    if (loginLogId) {
      window.localStorage.setItem("erp_login_log_id", loginLogId.toString());
    }
    window.localStorage.setItem("erp_assigned_pages", JSON.stringify(assignedPages || []));
    setIsAuthenticated(true);
    setRole(role || "Admin");
    setUserAssignedPages(Array.isArray(assignedPages) ? assignedPages : []);
  }, []);

  const handleLogout = useCallback(async () => {
    const loginLogId = window.localStorage.getItem("erp_login_log_id");
    if (loginLogId) {
      try {
        await smartErpApi.logout({ loginLogId: Number(loginLogId) });
      } catch (error) {
        // ignore logout errors
      }
    }
    window.localStorage.removeItem("erp_token");
    window.localStorage.removeItem("erp_role");
    window.localStorage.removeItem("erp_user_type");
    window.localStorage.removeItem("erp_assigned_pages");
    window.localStorage.removeItem("erp_login_log_id");
    setIsAuthenticated(false);
    setRole("");
    setUserAssignedPages([]);
    setSessionWarningOpen(false);
  }, []);

  const clearSessionTimers = useCallback(() => {
    if (warningTimerRef.current) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const resetSessionTimers = useCallback(() => {
    if (!isAuthenticated) return;

    clearSessionTimers();
    setSessionWarningOpen(false);

    warningTimerRef.current = window.setTimeout(() => {
      setSessionWarningOpen(true);
    }, warningTimeoutMs);

    logoutTimerRef.current = window.setTimeout(() => {
      setSessionWarningOpen(false);
      handleLogout();
    }, logoutTimeoutMs);
  }, [clearSessionTimers, handleLogout, isAuthenticated, logoutTimeoutMs, warningTimeoutMs]);

  useEffect(() => {
    const handleUnauthorized = () => handleLogout();
    window.addEventListener("erp:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("erp:unauthorized", handleUnauthorized);
  }, [handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearSessionTimers();
      return;
    }

    const activityEvents = ["mousemove", "mousedown", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => resetSessionTimers();

    resetSessionTimers();
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, true));

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity, true));
      clearSessionTimers();
    };
  }, [clearSessionTimers, isAuthenticated, resetSessionTimers]);

  const refreshCurrentAccess = useCallback(async () => {
    if (!window.localStorage.getItem("erp_token")) return;

    try {
      const res = await smartErpApi.getCurrentAccess();
      const access = res.data || {};
      const nextPages = Array.isArray(access.assignedPages) ? access.assignedPages : [];

      if (access.role) {
        setRole(access.role);
        window.localStorage.setItem("erp_role", access.role);
      }

      if (access.userType) {
        window.localStorage.setItem("erp_user_type", access.userType);
      }

      setUserAssignedPages(nextPages);
      window.localStorage.setItem("erp_assigned_pages", JSON.stringify(nextPages));
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        handleLogout();
      }
    }
  }, [handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshCurrentAccess();
    const intervalId = window.setInterval(refreshCurrentAccess, 15000);
    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refreshCurrentAccess]);

  const allowedIds = useMemo(
    () => {
      if (userAssignedPages.length) {
        return userAssignedPages;
      }
      return allowedModulesByRole[role] || DEFAULT_ROLE_MODULES.Admin;
    },
    [userAssignedPages, role, allowedModulesByRole]
  );

  const flatModules = useMemo(
    () => MODULE_CONFIG.flatMap((item) => item.isGroup ? item.subModules : [item]),
    []
  );

  const fallbackPath = useMemo(() => {
    const firstAllowed = flatModules.find((item) => allowedIds.includes(item.id));
    return firstAllowed?.path || "/dashboard";
  }, [allowedIds, flatModules]);

  const navItems = useMemo(() => {
    return MODULE_CONFIG.filter(item => {
      if (item.isGroup) return item.subModules.some(s => allowedIds.includes(s.id));
      return allowedIds.includes(item.id);
    }).map(item => {
      if (item.isGroup) {
        return { ...item, subModules: item.subModules.filter(s => allowedIds.includes(s.id)) };
      }
      return item;
    });
  }, [allowedIds]);

  const renderProtectedRoute = useCallback(
    (moduleId, element) => allowedIds.includes(moduleId) ? element : <AccessDenied moduleId={moduleId} />,
    [allowedIds]
  );

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="erp-container">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <Sidebar
        navItems={navItems}
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="erp-main-content">
        <header className="mobile-header">
          <button className="btn btn-dark btn-sm" onClick={() => setSidebarOpen(true)}>Menu</button>
          <span className="fw-bold">ERP PRO</span>
          <div style={{ width: '45px' }}></div>
        </header>

        {sessionWarningOpen && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "rgba(15, 23, 42, 0.45)", zIndex: 1080 }}>
            <div className="card shadow border-0" style={{ width: "100%", maxWidth: 420 }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-2">Session Timeout Warning</h5>
                <p className="text-muted mb-3">
                  No activity detected for 2 minutes. You will be logged out automatically after 5 minutes of inactivity.
                </p>
                <div className="d-flex justify-content-end gap-2">
                  <button className="btn btn-outline-secondary" onClick={handleLogout}>Logout Now</button>
                  <button className="btn btn-primary" onClick={resetSessionTimers}>Stay Signed In</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Navigate to={fallbackPath} replace />} />
          <Route path="/dashboard" element={renderProtectedRoute("dashboard", <Dashboard />)} />
          <Route path="/products" element={renderProtectedRoute("products", <Products />)} />

          <Route path="/sales-orders/list" element={renderProtectedRoute("salesOrderList", <SalesOrderList />)} />
          <Route path="/sales-orders/create" element={renderProtectedRoute("createSalesOrder", <CreateSalesOrder />)} />
          <Route path="/customers" element={renderProtectedRoute("customers", <Customers />)} />

          <Route path="/vendors" element={renderProtectedRoute("vendors", <Vendors />)} />
          <Route path="/purchase-orders" element={renderProtectedRoute("purchaseOrders", <PurchaseOrders />)} />
          <Route path="/vendor-returns" element={renderProtectedRoute("vendorReturns", <VendorReturns />)} />

          <Route path="/inventory" element={renderProtectedRoute("inventory", <Inventory />)} />
          <Route path="/lots" element={renderProtectedRoute("lots", <Lots />)} />
          <Route path="/warehouses" element={renderProtectedRoute("warehouses", <Warehouses />)} />
          <Route path="/operations" element={renderProtectedRoute("operations", <Operations />)} />

          <Route path="/finance" element={renderProtectedRoute("finance", <Finance />)} />
          <Route path="/reports" element={renderProtectedRoute("reports", <Reports />)} />
          <Route path="/stock-alerts" element={renderProtectedRoute("stockAlerts", <StockAlerts />)} />

          <Route path="/scanner-device" element={renderProtectedRoute("scannerDevice", <ScannerDevicePage />)} />
          <Route path="/serial-scan" element={renderProtectedRoute("serialScan", <SerialScanPage />)} />
          <Route path="/automation" element={renderProtectedRoute("automation", <Automation />)} />
          <Route path="/local-ai" element={renderProtectedRoute("localAI", <LocalAIPage />)} />
          <Route path="/notifications" element={renderProtectedRoute("notifications", <Notifications />)} />
          <Route
            path="/admin"
            element={
              role === "Admin" && allowedIds.includes("admin") ? (
                <AdminPanel
                  allowedModulesByRole={allowedModulesByRole}
                  moduleOptions={MODULE_CONFIG}
                  onUpdateRoleModules={persistRoleModules}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function AccessDenied({ moduleId }) {
  return (
    <div className="container py-5">
      <div className="card shadow-sm border-0 mx-auto" style={{ maxWidth: 520 }}>
        <div className="card-body p-4 text-center">
          <h3 className="fw-bold mb-2">Access Denied</h3>
          <p className="text-muted mb-0">
            You do not currently have permission to open `{moduleId}`. Please contact your admin.
          </p>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ navItems, role, isOpen, onClose, onLogout }) {
  const [openGroup, setOpenGroup] = useState(null);
  const location = useLocation();

  return (
    <aside className={`sidebar-wrapper ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand d-flex justify-content-between">
        <h3>ERP PRO</h3>
        <button className="btn btn-link text-white d-lg-none p-0" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-nav-container">
        <ul className="nav flex-column p-0">
          {navItems.map((item) => {
            if (item.isGroup) {
              const groupOpen = openGroup === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <div className="nav-group-header" onClick={() => setOpenGroup(groupOpen ? null : item.id)}>
                    <span>{item.label}</span>
                    <span>{groupOpen ? '−' : '+'}</span>
                  </div>
                  {groupOpen && (
                    <ul className="nav flex-column sidebar-submenu">
                      {item.subModules.map(sub => (
                        <li key={sub.id}>
                          <Link to={sub.path} className={`submenu-link ${location.pathname === sub.path ? 'active' : ''}`} onClick={onClose}>
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            return (
              <li key={item.id} className="nav-item">
                <Link to={item.path} className={`main-link ${location.pathname === item.path ? 'active' : ''}`} onClick={onClose}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-danger btn-sm w-100 fw-bold" onClick={onLogout}>LOGOUT</button>
      </div>
    </aside>
  );
}

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
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
        onLoginSuccess({
          accessToken: res.data.accessToken,
          role: res.data.role,
          loginLogId: res.data.loginLogId,
          userType: res.data.userType,
          assignedPages: res.data.assignedPages
        });
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || err.message || "Login failed";
      setError(message);
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
      onLoginSuccess({
        accessToken: res.data.accessToken,
        role: res.data.role,
        loginLogId: res.data.loginLogId,
        userType: res.data.userType,
        assignedPages: res.data.assignedPages
      });
    } catch (err) {
      const message = err?.response?.data?.message || err?.response?.data || err.message || "MFA verification failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">Smart ERP</div>
        <h1 className="login-title">Enterprise Access</h1>
        <p className="login-subtitle">Authenticate to open operations and analytics.</p>

        {!requiresMfa ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="mb-3">
              <label className="form-label" htmlFor="userId">User ID</label>
              <input
                id="userId"
                type="text"
                className="form-control"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyMfa} className="login-form">
            <div className="alert alert-info py-2 small">
              {mfaMessage} {devOtp && <strong>OTP: {devOtp}</strong>}
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="otpCode">OTP Code</label>
              <input
                id="otpCode"
                type="text"
                className="form-control text-center fw-bold"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                placeholder="000000"
              />
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Verifying..." : "Verify MFA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
