// import React, { useCallback, useEffect, useMemo, useState } from "react";
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
// import OrderManagement from "./forms/OrderManagement";
// import Vendors from "./forms/Vendors";
// import StockAlerts from "./forms/StockAlerts";
// import ScannerDevicePage from "./pages/ScannerDevicePage";
// import SerialScanPage from "./pages/SerialScanPage";

// import { LocalAIProvider } from "./context/LocalAIContext";
// import { smartErpApi } from "./services/smartErpApi";

// // 1. Grouped Module Configuration
// const ROLE_MODULES_VERSION = 3;
// const ROLE_MODULES_KEY = "erp_role_modules";
// const ROLE_MODULES_VERSION_KEY = "erp_role_modules_version";

// const MODULE_CONFIG = [
//   { id: "dashboard", label: "Dashboard", path: "/dashboard" },
//   { id: "products", label: "Products", path: "/products" },
  
//   {
//     id: "salesGroup",
//     label: "Sales & CRM",
//     isGroup: true,
//     subModules: [
//       { id: "orderManagement", label: "Order Management", path: "/order-management" },
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
//   Admin: MODULE_CONFIG.flatMap((module) => module.isGroup ? module.subModules.map((subModule) => subModule.id) : [module.id]),
//   Manager: [
//     "dashboard",
//     "products",
//     "orderManagement",
//     "salesOrderList",
//     "createSalesOrder",
//     "customers",
//     "vendors",
//     "purchaseOrders",
//     "vendorReturns",
//     "inventory",
//     "lots",
//     "warehouses",
//     "operations",
//     "finance",
//     "reports",
//     "stockAlerts",
//     "scannerDevice",
//     "serialScan",
//     "automation",
//     "notifications"
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
//     "operations",
//     "salesOrderList",
//     "createSalesOrder",
//     "customers",
//     "vendors",
//     "purchaseOrders",
//     "vendorReturns",
//     "stockAlerts",
//     "notifications",
//     "scannerDevice",
//     "serialScan"
//   ],
//   ScannerWorker: [
//     "scannerDevice",
//     "serialScan",
//     "operations"
//   ],
//   "Warehouse Manager": [
//     "dashboard",
//     "products",
//     "inventory",
//     "lots",
//     "warehouses",
//     "operations",
//     "purchaseOrders",
//     "vendors",
//     "vendorReturns",
//     "stockAlerts",
//     "notifications",
//     "scannerDevice",
//     "serialScan"
//   ],
//   "Finance Manager": [
//     "dashboard",
//     "finance",
//     "reports",
//     "salesOrderList",
//     "purchaseOrders",
//     "customers",
//     "vendors",
//     "vendorReturns",
//     "stockAlerts",
//     "notifications"
//   ],
//   "Robot Supervisor": [
//     "dashboard",
//     "operations",
//     "automation",
//     "localAI",
//     "notifications",
//     "scannerDevice"
//   ],
//   User: [
//     "dashboard",
//     "notifications"
//   ]
// };

// export default function App() {
//   return (
//     <LocalAIProvider>
//       <Router>
//         <style>{`
//           body { margin: 0; padding: 0; background: #f1f5f9; overflow-x: hidden; font-family: 'Inter', sans-serif; }
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

//           /* Login Page Specific Styles */
//           .login-page {
//             width: 100vw; height: 100vh;
//             background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
//             display: flex; align-items: center; justify-content: center;
//             position: fixed; top: 0; left: 0; z-index: 5000;
//           }
//           .login-card {
//             background: #ffffff; padding: 40px; border-radius: 16px;
//             width: 100%; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
//           }
//           .login-brand {
//             color: #0f172a; font-weight: 800; font-size: 1.5rem;
//             text-align: center; margin-bottom: 10px; letter-spacing: -0.5px;
//           }
//           .login-title {
//             font-size: 1.1rem; color: #475569; text-align: center;
//             font-weight: 600; margin-bottom: 8px;
//           }
//           .login-subtitle {
//             font-size: 0.85rem; color: #64748b; text-align: center;
//             margin-bottom: 30px;
//           }
//           .form-label { font-weight: 600; color: #334155; font-size: 0.85rem; }
//           .form-control {
//             padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;
//             font-size: 0.95rem; background: #f8fafc;
//           }
//           .form-control:focus {
//             background: #fff; border-color: #38bdf8; box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
//           }
//           .btn-primary {
//             background: #38bdf8; border: none; padding: 12px;
//             font-weight: 700; border-radius: 8px; transition: 0.2s;
//           }
//           .btn-primary:hover { background: #0ea5e9; transform: translateY(-1px); }

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
//   const isClient = typeof window !== "undefined";
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [role, setRole] = useState("");
//   const [userType, setUserType] = useState("");
//   const [userAssignedPages, setUserAssignedPages] = useState([]);
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const normalizeRoleModules = useCallback((modules) => {
//     const normalized = { ...modules };
//     Object.entries(DEFAULT_ROLE_MODULES).forEach(([roleName, defaults]) => {
//       const existing = normalized[roleName] ?? [];
//       normalized[roleName] = Array.from(new Set([...existing, ...defaults]));
//     });
//     return normalized;
//   }, []);

//   const initialRoleModules = useCallback(() => {
//     if (!isClient) return DEFAULT_ROLE_MODULES;
//     const storedText = window.localStorage.getItem(ROLE_MODULES_KEY);
//     const storedVersion = Number(window.localStorage.getItem(ROLE_MODULES_VERSION_KEY) ?? "0");
//     const raw = storedText ? JSON.parse(storedText) : DEFAULT_ROLE_MODULES;
//     const normalized = normalizeRoleModules(raw);
//     if (storedVersion < ROLE_MODULES_VERSION || storedText !== JSON.stringify(normalized)) {
//       window.localStorage.setItem(ROLE_MODULES_KEY, JSON.stringify(normalized));
//       window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
//     }
//     return normalized;
//   }, [isClient, normalizeRoleModules]);

//   const [allowedModulesByRole, setAllowedModulesByRole] = useState(initialRoleModules);
//   const persistRoleModules = useCallback(
//     (modules) => {
//       const normalized = normalizeRoleModules(modules);
//       if (isClient) {
//         window.localStorage.setItem(ROLE_MODULES_KEY, JSON.stringify(normalized));
//         window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
//       }
//       setAllowedModulesByRole(normalized);
//     },
//     [isClient, normalizeRoleModules]
//   );

//   const allModuleIds = useMemo(
//     () => MODULE_CONFIG.flatMap((item) => (item.isGroup ? item.subModules.map((subModule) => subModule.id) : [item.id])),
//     []
//   );

//   const [authToken, setAuthToken] = useState(() => (isClient ? window.localStorage.getItem("erp_token") || "" : ""));

//   const parseJwtPayload = useCallback((token) => {
//     if (!token || typeof token !== "string") return {};
//     const parts = token.split(".");
//     if (parts.length < 2) return {};

//     try {
//       const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
//       const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
//       const json = atob(normalized);
//       return JSON.parse(json);
//     } catch {
//       return {};
//     }
//   }, []);

//   const isAdminUser = useMemo(() => {
//     const normalizedRole = String(role || "").trim().toLowerCase();
//     const normalizedUserType = String(userType || "").trim().toUpperCase();
//     const tokenPayload = parseJwtPayload(authToken);
//     const tokenRole = String(tokenPayload.role || tokenPayload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "").trim().toLowerCase();
//     const tokenUserType = String(tokenPayload.userType || "").trim().toUpperCase();
//     return normalizedRole === "admin" || normalizedUserType === "ADMIN" || tokenRole === "admin" || tokenUserType === "ADMIN";
//   }, [authToken, parseJwtPayload, role, userType]);

//   useEffect(() => {
//     const token = window.localStorage.getItem("erp_token");
//     if (token) {
//       setIsAuthenticated(true);
//       setAuthToken(token);
//       setRole(window.localStorage.getItem("erp_role") || "Admin");
//       setUserType(window.localStorage.getItem("erp_user_type") || "");
//       try {
//         setUserAssignedPages(JSON.parse(window.localStorage.getItem("erp_assigned_pages") || "[]"));
//       } catch {
//         setUserAssignedPages([]);
//       }
//     }
//   }, []);

//   const handleLoginSuccess = useCallback(({ accessToken, role, loginLogId, userType, assignedPages }) => {
//     if (accessToken) {
//       window.localStorage.setItem("erp_token", accessToken);
//       setAuthToken(accessToken);
//     }
//     if (role) {
//       window.localStorage.setItem("erp_role", String(role).trim());
//     }
//     if (userType) {
//       window.localStorage.setItem("erp_user_type", String(userType).trim().toUpperCase());
//     }
//     if (loginLogId) {
//       window.localStorage.setItem("erp_login_log_id", loginLogId.toString());
//     }
//     window.localStorage.setItem("erp_assigned_pages", JSON.stringify(assignedPages || []));
//     setIsAuthenticated(true);
//     setRole(role || "Admin");
//     setUserType(userType || "");
//     setUserAssignedPages(Array.isArray(assignedPages) ? assignedPages : []);
//   }, []);

//   const handleLogout = useCallback(async () => {
//     const loginLogId = window.localStorage.getItem("erp_login_log_id");
//     if (loginLogId) {
//       try {
//         await smartErpApi.logout({ loginLogId: Number(loginLogId) });
//       } catch (error) {
//         // ignore logout errors
//       }
//     }
//     window.localStorage.removeItem("erp_token");
//     window.localStorage.removeItem("erp_role");
//     window.localStorage.removeItem("erp_user_type");
//     window.localStorage.removeItem("erp_assigned_pages");
//     window.localStorage.removeItem("erp_login_log_id");
//     setIsAuthenticated(false);
//     setRole("");
//     setUserType("");
//     setUserAssignedPages([]);
//   }, []);

//   useEffect(() => {
//     const handleUnauthorized = () => handleLogout();
//     window.addEventListener("erp:unauthorized", handleUnauthorized);
//     return () => window.removeEventListener("erp:unauthorized", handleUnauthorized);
//   }, [handleLogout]);

//   const refreshCurrentAccess = useCallback(async () => {
//     if (!window.localStorage.getItem("erp_token")) return;

//     try {
//       const res = await smartErpApi.getCurrentAccess();
//       const access = res.data || {};
//       const nextPages = Array.isArray(access.assignedPages) ? access.assignedPages : [];

//       if (access.role) {
//         setRole(access.role);
//         window.localStorage.setItem("erp_role", access.role);
//       }

//       if (access.userType) {
//         setUserType(access.userType);
//         window.localStorage.setItem("erp_user_type", access.userType);
//       }

//       setUserAssignedPages(nextPages);
//       window.localStorage.setItem("erp_assigned_pages", JSON.stringify(nextPages));
//     } catch (error) {
//       if (error?.response?.status === 401 || error?.response?.status === 403) {
//         handleLogout();
//       }
//     }
//   }, [handleLogout]);

//   useEffect(() => {
//     if (!isAuthenticated) return;

//     refreshCurrentAccess();
//     const intervalId = window.setInterval(refreshCurrentAccess, 15000);
//     return () => window.clearInterval(intervalId);
//   }, [isAuthenticated, refreshCurrentAccess]);

//   const allowedIds = useMemo(
//     () => {
//       if (isAdminUser) {
//         return allModuleIds;
//       }
//       if (userAssignedPages.length) {
//         return userAssignedPages;
//       }
//       return allowedModulesByRole[role] || DEFAULT_ROLE_MODULES.Admin;
//     },
//     [allModuleIds, userAssignedPages, role, allowedModulesByRole, isAdminUser]
//   );

//   const fallbackPath = useMemo(() => {
//     const firstAllowed = MODULE_CONFIG
//       .flatMap((item) => (item.isGroup ? item.subModules : [item]))
//       .find((item) => allowedIds.includes(item.id));
//     return firstAllowed?.path || "/dashboard";
//   }, [allowedIds]);

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

//   const renderProtectedRoute = useCallback(
//     (moduleId, element) => allowedIds.includes(moduleId) ? element : <AccessDenied moduleId={moduleId} />,
//     [allowedIds]
//   );

//   if (!isAuthenticated) {
//     return <LoginPage onLoginSuccess={handleLoginSuccess} />;
//   }

//   return (
//     <div className="erp-container">
//       {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

//       <Sidebar
//         navItems={navItems}
//         role={role}
//         isOpen={sidebarOpen}
//         onClose={() => setSidebarOpen(false)}
//         onLogout={handleLogout}
//       />

//       <div className="erp-main-content">
//         <header className="mobile-header">
//           <button className="btn btn-dark btn-sm" onClick={() => setSidebarOpen(true)}>Menu</button>
//           <span className="fw-bold">ERP PRO</span>
//           <div style={{ width: '45px' }}></div>
//         </header>

//         <Routes>
//           <Route path="/" element={<Navigate to={fallbackPath} replace />} />
//           <Route path="/dashboard" element={renderProtectedRoute("dashboard", <Dashboard />)} />
//           <Route path="/products" element={renderProtectedRoute("products", <Products />)} />

//           <Route path="/order-management" element={renderProtectedRoute("orderManagement", <OrderManagement />)} />
//           <Route path="/sales-orders/list" element={renderProtectedRoute("salesOrderList", <SalesOrderList />)} />
//           <Route path="/sales-orders/create" element={renderProtectedRoute("createSalesOrder", <CreateSalesOrder />)} />
//           <Route path="/customers" element={renderProtectedRoute("customers", <Customers />)} />

//           <Route path="/vendors" element={renderProtectedRoute("vendors", <Vendors />)} />
//           <Route path="/purchase-orders" element={renderProtectedRoute("purchaseOrders", <PurchaseOrders />)} />
//           <Route path="/vendor-returns" element={renderProtectedRoute("vendorReturns", <VendorReturns />)} />

//           <Route path="/inventory" element={renderProtectedRoute("inventory", <Inventory />)} />
//           <Route path="/lots" element={renderProtectedRoute("lots", <Lots />)} />
//           <Route path="/warehouses" element={renderProtectedRoute("warehouses", <Warehouses />)} />
//           <Route path="/operations" element={renderProtectedRoute("operations", <Operations />)} />

//           <Route path="/finance" element={renderProtectedRoute("finance", <Finance />)} />
//           <Route path="/reports" element={renderProtectedRoute("reports", <Reports />)} />
//           <Route path="/stock-alerts" element={renderProtectedRoute("stockAlerts", <StockAlerts />)} />

//           <Route path="/scanner-device" element={renderProtectedRoute("scannerDevice", <ScannerDevicePage />)} />
//           <Route path="/serial-scan" element={renderProtectedRoute("serialScan", <SerialScanPage />)} />
//           <Route path="/automation" element={renderProtectedRoute("automation", <Automation />)} />
//           <Route path="/local-ai" element={renderProtectedRoute("localAI", <LocalAIPage />)} />
//           <Route path="/notifications" element={renderProtectedRoute("notifications", <Notifications />)} />
//           <Route
//             path="/admin"
//             element={
//               isAdminUser && allowedIds.includes("admin") ? (
//                 <AdminPanel
//                   allowedModulesByRole={allowedModulesByRole}
//                   moduleOptions={MODULE_CONFIG}
//                   onUpdateRoleModules={persistRoleModules}
//                 />
//               ) : (
//                 <Navigate to="/" />
//               )
//             }
//           />
//         </Routes>
//       </div>
//     </div>
//   );
// }

// function AccessDenied({ moduleId }) {
//   return (
//     <div className="container py-5">
//       <div className="card shadow-sm border-0 mx-auto" style={{ maxWidth: 520 }}>
//         <div className="card-body p-4 text-center">
//           <h3 className="fw-bold mb-2">Access Denied</h3>
//           <p className="text-muted mb-0">
//             You do not currently have permission to open `{moduleId}`. Please contact your admin.
//           </p>
//         </div>
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
//   const [username, setUsername] = useState("admin");
//   const [password, setPassword] = useState("admin123");
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
//         onLoginSuccess({
//           accessToken: res.data.accessToken,
//           role: res.data.role,
//           loginLogId: res.data.loginLogId,
//           userType: res.data.userType,
//           assignedPages: res.data.assignedPages
//         });
//       }
//     } catch (err) {
//       const message = err?.response?.data?.message || err?.response?.data || err.message || "Login failed";
//       setError(message);
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
//       onLoginSuccess({
//         accessToken: res.data.accessToken,
//         role: res.data.role,
//         loginLogId: res.data.loginLogId,
//         userType: res.data.userType,
//         assignedPages: res.data.assignedPages
//       });
//     } catch (err) {
//       const message = err?.response?.data?.message || err?.response?.data || err.message || "MFA verification failed";
//       setError(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-page">
//       <div className="login-card">
//         <div className="login-brand">Smart ERP</div>
//         <h1 className="login-title">Enterprise Access</h1>
//         <p className="login-subtitle">Authenticate to open operations and analytics.</p>

//         {!requiresMfa ? (
//           <form onSubmit={handleLogin} className="login-form">
//             <div className="mb-3">
//               <label className="form-label" htmlFor="userId">User ID</label>
//               <input
//                 id="userId"
//                 type="text"
//                 className="form-control"
//                 value={username}
//                 onChange={(event) => setUsername(event.target.value)}
//                 autoComplete="username"
//               />
//             </div>

//             <div className="mb-3">
//               <label className="form-label" htmlFor="password">Password</label>
//               <input
//                 id="password"
//                 type="password"
//                 className="form-control"
//                 value={password}
//                 onChange={(event) => setPassword(event.target.value)}
//                 autoComplete="current-password"
//               />
//             </div>

//             {error && <div className="alert alert-danger py-2 small">{error}</div>}

//             <button type="submit" className="btn btn-primary w-100" disabled={loading}>
//               {loading ? "Signing in..." : "Login"}
//             </button>
//           </form>
//         ) : (
//           <form onSubmit={handleVerifyMfa} className="login-form">
//             <div className="alert alert-info py-2 small">
//               {mfaMessage} {devOtp && <strong>OTP: {devOtp}</strong>}
//             </div>

//             <div className="mb-3">
//               <label className="form-label" htmlFor="otpCode">OTP Code</label>
//               <input
//                 id="otpCode"
//                 type="text"
//                 className="form-control text-center fw-bold"
//                 value={otpCode}
//                 onChange={(event) => setOtpCode(event.target.value)}
//                 placeholder="000000"
//               />
//             </div>

//             {error && <div className="alert alert-danger py-2 small">{error}</div>}

//             <button type="submit" className="btn btn-primary w-100" disabled={loading}>
//               {loading ? "Verifying..." : "Verify MFA"}
//             </button>
//           </form>
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import OrderManagement from "./forms/OrderManagement";
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
      { id: "orderManagement", label: "Order Management", path: "/order-management" },
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
    "dashboard", "products", "orderManagement", "salesOrderList", "createSalesOrder", "customers", "vendors", 
    "purchaseOrders", "vendorReturns", "inventory", "lots", "warehouses", "operations", "finance", "reports", 
    "stockAlerts", "scannerDevice", "serialScan", "automation", "notifications"
  ],
  Operator: ["operations", "scannerDevice", "serialScan"],
  OperationsWorker: [
    "dashboard", "products", "inventory", "operations", "salesOrderList", "createSalesOrder", "customers", 
    "vendors", "purchaseOrders", "vendorReturns", "stockAlerts", "notifications", "scannerDevice", "serialScan"
  ],
  ScannerWorker: ["scannerDevice", "serialScan", "operations"],
  "Warehouse Manager": [
    "dashboard", "products", "inventory", "lots", "warehouses", "operations", "purchaseOrders", "vendors", 
    "vendorReturns", "stockAlerts", "notifications", "scannerDevice", "serialScan"
  ],
  "Finance Manager": [
    "dashboard", "finance", "reports", "salesOrderList", "purchaseOrders", "customers", "vendors", 
    "vendorReturns", "stockAlerts", "notifications"
  ],
  "Robot Supervisor": ["dashboard", "operations", "automation", "localAI", "notifications", "scannerDevice"],
  User: ["dashboard", "notifications"]
};

export default function App() {
  return (
    <LocalAIProvider>
      <Router>
        <style>{`
          body { margin: 0; padding: 0; background: #f1f5f9; overflow-x: hidden; font-family: 'Inter', sans-serif; }
          .erp-container { display: flex; min-height: 100vh; }
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
          .erp-main-content { margin-left: 260px; flex-grow: 1; padding: 20px; width: 100%; transition: 0.3s; }
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
          .login-brand { color: #0f172a; font-weight: 800; font-size: 1.5rem; text-align: center; margin-bottom: 10px; letter-spacing: -0.5px; }
          .login-title { font-size: 1.1rem; color: #475569; text-align: center; font-weight: 600; margin-bottom: 8px; }
          .login-subtitle { font-size: 0.85rem; color: #64748b; text-align: center; margin-bottom: 30px; }
          .form-label { font-weight: 600; color: #334155; font-size: 0.85rem; }
          .form-control { padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.95rem; background: #f8fafc; }
          .form-control:focus { background: #fff; border-color: #38bdf8; box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1); }
          .btn-primary { background: #38bdf8; border: none; padding: 12px; font-weight: 700; border-radius: 8px; transition: 0.2s; }
          .btn-primary:hover { background: #0ea5e9; transform: translateY(-1px); }
          .mobile-header { display: none; background: #ffffff; padding: 12px 20px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 1500; justify-content: space-between; align-items: center; }
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

  // 1. UPDATED: Initialize authentication state directly from storage to prevent Dashboard flicker
  const [isAuthenticated, setIsAuthenticated] = useState(() => (isClient ? !!window.localStorage.getItem("erp_token") : false));
  const [authToken, setAuthToken] = useState(() => (isClient ? window.localStorage.getItem("erp_token") || "" : ""));
  const [role, setRole] = useState(() => (isClient ? window.localStorage.getItem("erp_role") || "" : ""));
  const [userType, setUserType] = useState(() => (isClient ? window.localStorage.getItem("erp_user_type") || "" : ""));
  const [userAssignedPages, setUserAssignedPages] = useState(() => {
    if (!isClient) return [];
    try {
      return JSON.parse(window.localStorage.getItem("erp_assigned_pages") || "[]");
    } catch { return []; }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Utility Functions ---
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

  const persistRoleModules = useCallback((modules) => {
    const normalized = normalizeRoleModules(modules);
    if (isClient) {
      window.localStorage.setItem(ROLE_MODULES_KEY, JSON.stringify(normalized));
      window.localStorage.setItem(ROLE_MODULES_VERSION_KEY, String(ROLE_MODULES_VERSION));
    }
    setAllowedModulesByRole(normalized);
  }, [isClient, normalizeRoleModules]);

  const parseJwtPayload = useCallback((token) => {
    if (!token || typeof token !== "string") return {};
    try {
      const parts = token.split(".");
      if (parts.length < 2) return {};
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    } catch { return {}; }
  }, []);

  const isAdminUser = useMemo(() => {
    const normalizedRole = String(role || "").trim().toLowerCase();
    const normalizedUserType = String(userType || "").trim().toUpperCase();
    const tokenPayload = parseJwtPayload(authToken);
    const tokenRole = String(tokenPayload.role || tokenPayload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "").trim().toLowerCase();
    const tokenUserType = String(tokenPayload.userType || "").trim().toUpperCase();
    return normalizedRole === "admin" || normalizedUserType === "ADMIN" || tokenRole === "admin" || tokenUserType === "ADMIN";
  }, [authToken, parseJwtPayload, role, userType]);

  // --- LOGOUT LOGIC ---
  const handleLogout = useCallback(async () => {
    const loginLogId = window.localStorage.getItem("erp_login_log_id");
    if (loginLogId) {
      try {
        await smartErpApi.logout({ loginLogId: Number(loginLogId) });
      } catch (error) {}
    }
    // Clear all local storage related to session
    window.localStorage.removeItem("erp_token");
    window.localStorage.removeItem("erp_role");
    window.localStorage.removeItem("erp_user_type");
    window.localStorage.removeItem("erp_assigned_pages");
    window.localStorage.removeItem("erp_login_log_id");

    setIsAuthenticated(false);
    setAuthToken("");
    setRole("");
    setUserType("");
    setUserAssignedPages([]);
  }, []);

  // --- INACTIVITY TRACKER (Auto Logout) ---
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn("Session expired due to inactivity.");
        handleLogout();
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer(); // Start timer initially

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isAuthenticated, handleLogout]);

  // --- Auth & Access Sync ---
  const handleLoginSuccess = useCallback(({ accessToken, role, loginLogId, userType, assignedPages }) => {
    window.localStorage.setItem("erp_token", accessToken);
    window.localStorage.setItem("erp_role", String(role).trim());
    window.localStorage.setItem("erp_user_type", String(userType).trim().toUpperCase());
    if (loginLogId) window.localStorage.setItem("erp_login_log_id", loginLogId.toString());
    window.localStorage.setItem("erp_assigned_pages", JSON.stringify(assignedPages || []));

    setAuthToken(accessToken);
    setRole(role || "Admin");
    setUserType(userType || "");
    setUserAssignedPages(Array.isArray(assignedPages) ? assignedPages : []);
    setIsAuthenticated(true);
  }, []);

  const refreshCurrentAccess = useCallback(async () => {
    if (!window.localStorage.getItem("erp_token")) return;
    try {
      const res = await smartErpApi.getCurrentAccess();
      const access = res.data || {};
      if (access.role) {
        setRole(access.role);
        window.localStorage.setItem("erp_role", access.role);
      }
      if (access.userType) {
        setUserType(access.userType);
        window.localStorage.setItem("erp_user_type", access.userType);
      }
      const nextPages = Array.isArray(access.assignedPages) ? access.assignedPages : [];
      setUserAssignedPages(nextPages);
      window.localStorage.setItem("erp_assigned_pages", JSON.stringify(nextPages));
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) handleLogout();
    }
  }, [handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshCurrentAccess();
    const intervalId = window.setInterval(refreshCurrentAccess, 15000);
    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refreshCurrentAccess]);

  // --- Routing Logic ---
  const allModuleIds = useMemo(() => MODULE_CONFIG.flatMap(i => i.isGroup ? i.subModules.map(s => s.id) : [i.id]), []);
  const allowedIds = useMemo(() => {
    if (isAdminUser) return allModuleIds;
    if (userAssignedPages.length) return userAssignedPages;
    return allowedModulesByRole[role] || DEFAULT_ROLE_MODULES.Admin;
  }, [allModuleIds, userAssignedPages, role, allowedModulesByRole, isAdminUser]);

  const fallbackPath = useMemo(() => {
    const firstAllowed = MODULE_CONFIG.flatMap(i => i.isGroup ? i.subModules : [i]).find(i => allowedIds.includes(i.id));
    return firstAllowed?.path || "/dashboard";
  }, [allowedIds]);

  const navItems = useMemo(() => {
    return MODULE_CONFIG.filter(item => item.isGroup ? item.subModules.some(s => allowedIds.includes(s.id)) : allowedIds.includes(item.id))
      .map(item => item.isGroup ? { ...item, subModules: item.subModules.filter(s => allowedIds.includes(s.id)) } : item);
  }, [allowedIds]);

  const renderProtectedRoute = useCallback((moduleId, element) => allowedIds.includes(moduleId) ? element : <AccessDenied moduleId={moduleId} />, [allowedIds]);

  // 2. UPDATED: If not authenticated, always show Login. No dashboard will render.
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="erp-container">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <Sidebar navItems={navItems} role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />

      <div className="erp-main-content">
        <header className="mobile-header">
          <button className="btn btn-dark btn-sm" onClick={() => setSidebarOpen(true)}>Menu</button>
          <span className="fw-bold">ERP PRO</span>
          <div style={{ width: '45px' }}></div>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to={fallbackPath} replace />} />
          <Route path="/dashboard" element={renderProtectedRoute("dashboard", <Dashboard />)} />
          <Route path="/products" element={renderProtectedRoute("products", <Products />)} />
          <Route path="/order-management" element={renderProtectedRoute("orderManagement", <OrderManagement />)} />
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
          <Route path="/admin" element={isAdminUser && allowedIds.includes("admin") ? <AdminPanel allowedModulesByRole={allowedModulesByRole} moduleOptions={MODULE_CONFIG} onUpdateRoleModules={persistRoleModules} /> : <Navigate to="/" />} />
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
          <p className="text-muted mb-0">You do not currently have permission to open `{moduleId}`. Please contact your admin.</p>
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
                          <Link to={sub.path} className={`submenu-link ${location.pathname === sub.path ? 'active' : ''}`} onClick={onClose}>{sub.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }
            return (
              <li key={item.id} className="nav-item">
                <Link to={item.path} className={`main-link ${location.pathname === item.path ? 'active' : ''}`} onClick={onClose}>{item.label}</Link>
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
        setMfaMessage(res.data.message || "MFA verification required.");
        setDevOtp(res.data.devOtp || "");
      } else {
        onLoginSuccess(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  const handleVerifyMfa = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await smartErpApi.verifyMfa({ username, otpCode });
      onLoginSuccess(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "MFA verification failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">Smart ERP</div>
        <h1 className="login-title">Enterprise Access</h1>
        <p className="login-subtitle">Authenticate to open operations and analytics.</p>
        {!requiresMfa ? (
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label" htmlFor="userId">User ID</label>
              <input id="userId" type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyMfa}>
            <div className="alert alert-info py-2 small">{mfaMessage} {devOtp && <strong>OTP: {devOtp}</strong>}</div>
            <div className="mb-3">
              <label className="form-label" htmlFor="otpCode">OTP Code</label>
              <input id="otpCode" type="text" className="form-control text-center fw-bold" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="000000" />
            </div>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? "Verifying..." : "Verify MFA"}</button>
          </form>
        )}
      </div>
    </div>
  );
}