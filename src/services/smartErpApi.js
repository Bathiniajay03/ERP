// import api from "./apiClient";

// const api= process.env.REACT_APP_API_BASE_URL;
// export const smartErpApi = {

//   // System & Authentication
//   initialize: () => api.post("/smart-erp/startup/initialize"),
//   health: () => api.get("/smart-erp/startup/health"),

//   login: (payload) =>
//     api.post("/smart-erp/auth/login", payload),

//   verifyMfa: (payload) =>
//     api.post("/smart-erp/auth/verify-mfa", payload),

//   registerUser: (payload) =>
//     api.post("/smart-erp/auth/register", payload),


//   // Product & Inventory
//   createProduct: (payload) =>
//     api.post("/smart-erp/products", payload),

//   receiveInventory: (payload) =>
//     api.post("/smart-erp/inventory/receive", payload),


//   // Orders Workflow
//   createOrder: (payload) =>
//     api.post("/smart-erp/orders", payload),

//   assignPicking: (orderId) =>
//     api.post(`/smart-erp/orders/${orderId}/assign-picking`),

//   verifyScan: (orderId, payload) =>
//     api.post(`/smart-erp/orders/${orderId}/verify-scan`, payload),

//   shipOrder: (orderId) =>
//     api.post(`/smart-erp/orders/${orderId}/ship`),


//   // Robot System
//   registerRobot: (payload) =>
//     api.post("/smart-erp/robots", payload),

//   updateRobotStatus: (robotId, payload) =>
//     api.put(`/smart-erp/robots/${robotId}/status`, payload),

//   robotFleet: () =>
//     api.get("/smart-erp/robots/fleet"),

//   robotTasks: () =>
//     api.get("/smart-erp/robots/tasks"),

//   robotTaskEvent: (taskId, payload) =>
//     api.post(`/smart-erp/robots/tasks/${taskId}/event`, payload),

//   completeRobotTask: (taskId) =>
//     api.post(`/smart-erp/robots/tasks/${taskId}/complete`),


//   // Device Integration
//   deviceEvent: (payload) =>
//     api.post("/smart-erp/devices/event", payload),


//   // Procurement
//   createVendor: (payload) =>
//     api.post("/smart-erp/procurement/vendors", payload),

//   getVendors: () =>
//     api.get("/smart-erp/procurement/vendors"),

//   createPurchaseOrder: (payload) =>
//     api.post("/smart-erp/procurement/purchase-orders", payload),

//   getPurchaseOrders: () =>
//     api.get("/smart-erp/procurement/purchase-orders"),

//   receivePurchaseOrder: (poId, payload) =>
//     api.post(`/smart-erp/procurement/purchase-orders/${poId}/receive`, payload),

//   runAiAutomation: () =>
//     api.post("/smart-erp/ai/automation/run"),


//   // Finance
//   capturePayment: (payload) =>
//     api.post("/smart-erp/finance/capture-payment", payload),


//   // Sales Orders
//   createSalesOrder: (payload) =>
//     api.post("/sales-orders", payload),

//   getSalesOrders: () =>
//     api.get("/sales-orders"),

//   getSalesOrder: (id) =>
//     api.get(`/sales-orders/${id}`),

//   updateSalesOrderStatus: (id, payload) =>
//     api.put(`/sales-orders/${id}/status`, payload),


//   // Shipments & Invoice
//   createShipment: (payload) =>
//     api.post("/shipments", payload),

//   generateInvoice: (payload) =>
//     api.post("/invoices", payload),

//   recordSalesPayment: (payload) =>
//     api.post("/payments", payload),


//   // Dashboard
//   notificationsUnreadCount: () =>
//     api.get("/smart-erp/notifications/unread-count"),

//   dashboard: () =>
//     api.get("/smart-erp/dashboard/realtime"),

//   analytics: () =>
//     api.get("/smart-erp/analytics/report"),

//   // Vendor Returns
//   createVendorReturn: (payload) =>
//     api.post("/vendor-returns", payload),

//   getVendorReturns: () =>
//     api.get("/vendor-returns"),

//   approveVendorReturn: (id, payload) =>
//     api.post(`/vendor-returns/${id}/approve`, payload),

//   shipVendorReturn: (id, payload) =>
//     api.post(`/vendor-returns/${id}/ship`, payload),

//   refundVendorReturn: (id, payload) =>
//     api.post(`/vendor-returns/${id}/refund`, payload),


//   // Warehouses
//   warehouses: () =>
//     api.get("/warehouses"),

//   createWarehouse: (code, name) =>
//     api.post(
//       `/warehouses?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`
//     ),


//   // Stock
//   stockAlerts: () =>
//     api.get("/smart-erp/stock-alerts"),

//   stockItems: () =>
//     api.get("/stock/items"),

//   stockInventory: () =>
//     api.get("/stock/inventory"),

//   stockTransactions: () =>
//     api.get("/stock/transactions")
// };

// import api from './apiClient';
// const api= process.env.REACT_APP_API_BASE_URL;
// export const smartErpApi = {
//   // System & Authentication
//   initialize: () => api.post('/smart-erp/startup/initialize'),
//   health: () => api.get('/smart-erp/startup/health'),
//   login: (payload) => api.post('/smart-erp/auth/login', payload),
//   verifyMfa: (payload) => api.post('/smart-erp/auth/verify-mfa', payload),
//   registerUser: (payload) => api.post('/smart-erp/auth/register', payload),

//   // Product & Inventory Management
//   createProduct: (payload) => api.post('/smart-erp/products', payload),
//   receiveInventory: (payload) => api.post('/smart-erp/inventory/receive', payload),

//   // Sales Order Workflow (Smart ERP)
//   createOrder: (payload) => api.post('/smart-erp/orders', payload),
//   assignPicking: (orderId) => api.post(`/smart-erp/orders/${orderId}/assign-picking`),
//   verifyScan: (orderId, payload) => api.post(`/smart-erp/orders/${orderId}/verify-scan`, payload),
//   shipOrder: (orderId) => api.post(`/smart-erp/orders/${orderId}/ship`),

//   // Robot & Automation
//   registerRobot: (payload) => api.post('/smart-erp/robots', payload),
//   updateRobotStatus: (robotId, payload) => api.put(`/smart-erp/robots/${robotId}/status`, payload),
//   robotFleet: () => api.get('/smart-erp/robots/fleet'),
//   robotTasks: () => api.get('/smart-erp/robots/tasks'),
//   robotTaskEvent: (taskId, payload) => api.post(`/smart-erp/robots/tasks/${taskId}/event`, payload),
//   completeRobotTask: (taskId) => api.post(`/smart-erp/robots/tasks/${taskId}/complete`),

//   // Device Integration
//   deviceEvent: (payload) => api.post('/smart-erp/devices/event', payload),

//   // Procurement & Vendors
//   createVendor: (payload) => api.post('/smart-erp/procurement/vendors', payload),
//   getVendors: () => api.get('/smart-erp/procurement/vendors'),
//   createPurchaseOrder: (payload) => api.post('/smart-erp/procurement/purchase-orders', payload),
//   getPurchaseOrders: () => api.get('/smart-erp/procurement/purchase-orders'),
//   receivePurchaseOrder: (poId, payload) => api.post(`/smart-erp/procurement/purchase-orders/${poId}/receive`, payload),
//   runAiAutomation: () => api.post('/smart-erp/ai/automation/run'),

//   // Finance & Payments
//   capturePayment: (payload) => api.post('/smart-erp/finance/capture-payment', payload),

//   // Sales Orders Module (Full CRUD)
//   createSalesOrder: (payload) => api.post('/sales-orders', payload),
//   getSalesOrders: () => api.get('/sales-orders'),
//   getSalesOrder: (id) => api.get(`/sales-orders/${id}`),
//   updateSalesOrderStatus: (id, payload) => api.put(`/sales-orders/${id}/status`, payload),
  
//   // Shipments & Invoices
//   createShipment: (payload) => api.post('/shipments', payload),
//   generateInvoice: (payload) => api.post('/invoices', payload),
//   recordSalesPayment: (payload) => api.post('/payments', payload),

//   // Dashboard & Analytics
//   notificationsUnreadCount: () => api.get('/smart-erp/notifications/unread-count'),
//   dashboard: () => api.get('/smart-erp/dashboard/realtime'),
//   analytics: () => api.get('/smart-erp/analytics/report'),

//   // Warehouses
//   warehouses: () => api.get('/warehouses'),
//   createWarehouse: (code, name) => api.post(`/warehouses?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`),

//   // Stock & Inventory
//   stockAlerts: () => api.get('/smart-erp/stock-alerts'),
//   stockItems: () => api.get('/stock/items'),
//   stockInventory: () => api.get('/stock/inventory'),
//   stockTransactions: () => api.get('/stock/transactions')
// };


import api from "./apiClient";

export const smartErpApi = {

  // =========================
  // System & Authentication
  // =========================
  initialize: () => api.post("/smart-erp/startup/initialize"),

  health: () => api.get("/smart-erp/startup/health"),

  login: (payload) =>
    api.post("/smart-erp/auth/login", payload),

  verifyMfa: (payload) =>
    api.post("/smart-erp/auth/verify-mfa", payload),

  registerUser: (payload) =>
    api.post("/smart-erp/auth/register", payload),


  // =========================
  // Product & Inventory
  // =========================
  createProduct: (payload) =>
    api.post("/smart-erp/products", payload),

  receiveInventory: (payload) =>
    api.post("/smart-erp/inventory/receive", payload),


  // =========================
  // Orders Workflow
  // =========================
  createOrder: (payload) =>
    api.post("/smart-erp/orders", payload),

  assignPicking: (orderId) =>
    api.post(`/smart-erp/orders/${orderId}/assign-picking`),

  verifyScan: (orderId, payload) =>
    api.post(`/smart-erp/orders/${orderId}/verify-scan`, payload),

  shipOrder: (orderId) =>
    api.post(`/smart-erp/orders/${orderId}/ship`),


  // =========================
  // Robot System
  // =========================
  registerRobot: (payload) =>
    api.post("/smart-erp/robots", payload),

  updateRobotStatus: (robotId, payload) =>
    api.put(`/smart-erp/robots/${robotId}/status`, payload),

  robotFleet: () =>
    api.get("/smart-erp/robots/fleet"),

  robotTasks: () =>
    api.get("/smart-erp/robots/tasks"),

  robotTaskEvent: (taskId, payload) =>
    api.post(`/smart-erp/robots/tasks/${taskId}/event`, payload),

  completeRobotTask: (taskId) =>
    api.post(`/smart-erp/robots/tasks/${taskId}/complete`),


  // =========================
  // Device Integration
  // =========================
  deviceEvent: (payload) =>
    api.post("/smart-erp/devices/event", payload),


  // =========================
  // Procurement
  // =========================
  createVendor: (payload) =>
    api.post("/smart-erp/procurement/vendors", payload),

  getVendors: () =>
    api.get("/smart-erp/procurement/vendors"),

  createPurchaseOrder: (payload) =>
    api.post("/smart-erp/procurement/purchase-orders", payload),

  getPurchaseOrders: () =>
    api.get("/smart-erp/procurement/purchase-orders"),

  receivePurchaseOrder: (poId, payload) =>
    api.post(`/smart-erp/procurement/purchase-orders/${poId}/receive`, payload),

  runAiAutomation: () =>
    api.post("/smart-erp/ai/automation/run"),


  // =========================
  // Finance
  // =========================
  capturePayment: (payload) =>
    api.post("/smart-erp/finance/capture-payment", payload),


  // =========================
  // Sales Orders
  // =========================
  createSalesOrder: (payload) =>
    api.post("/sales-orders", payload),

  getSalesOrders: () =>
    api.get("/sales-orders"),

  getSalesOrder: (id) =>
    api.get(`/sales-orders/${id}`),

  updateSalesOrderStatus: (id, payload) =>
    api.put(`/sales-orders/${id}/status`, payload),


  // =========================
  // Shipments & Invoice
  // =========================
  createShipment: (payload) =>
    api.post("/shipments", payload),

  generateInvoice: (payload) =>
    api.post("/invoices", payload),

  recordSalesPayment: (payload) =>
    api.post("/payments", payload),


  // =========================
  // Dashboard
  // =========================
  notificationsUnreadCount: () =>
    api.get("/smart-erp/notifications/unread-count"),

  dashboard: () =>
    api.get("/smart-erp/dashboard/realtime"),

  analytics: () =>
    api.get("/smart-erp/analytics/report"),


  // =========================
  // Vendor Returns
  // =========================
  createVendorReturn: (payload) =>
    api.post("/vendor-returns", payload),

  getVendorReturns: () =>
    api.get("/vendor-returns"),

  approveVendorReturn: (id, payload) =>
    api.post(`/vendor-returns/${id}/approve`, payload),

  shipVendorReturn: (id, payload) =>
    api.post(`/vendor-returns/${id}/ship`, payload),

  refundVendorReturn: (id, payload) =>
    api.post(`/vendor-returns/${id}/refund`, payload),


  // =========================
  // Warehouses
  // =========================
  warehouses: () =>
    api.get("/warehouses"),

  createWarehouse: (code, name) =>
    api.post(
      `/warehouses?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`
    ),


  // =========================
  // Stock
  // =========================
  stockAlerts: () =>
    api.get("/smart-erp/stock-alerts"),

  stockItems: () =>
    api.get("/stock/items"),

  stockInventory: () =>
    api.get("/stock/inventory"),

  stockTransactions: () =>
    api.get("/stock/transactions")
};