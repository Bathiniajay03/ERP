import api from "./apiClient";

export const smartErpApi = {

  // System & Authentication
  initialize: () => api.post("/smart-erp/startup/initialize"),
  health: () => api.get("/smart-erp/startup/health"),

  login: (payload) =>
    api.post("/smart-erp/auth/login", payload),

  verifyMfa: (payload) =>
    api.post("/smart-erp/auth/verify-mfa", payload),

  registerUser: (payload) =>
    api.post("/admin/create-user", payload),

  logout: (payload) =>
    api.post("/smart-erp/auth/logout", payload),

  getUsers: () =>
    api.get("/admin/users"),

  getRiders: () =>
    api.get("/rider/all"),

  getCurrentAccess: () =>
    api.get("/admin/me/access"),

  updateUserPermissions: (payload) =>
    api.post("/admin/update-permissions", payload),

  updateUser: (id, payload) =>
    api.put(`/users/${id}`, payload),

  deleteUser: (id) =>
    api.delete(`/users/${id}`),

  blockUser: (id) =>
    api.post(`/users/${id}/block`),

  unblockUser: (id) =>
    api.post(`/users/${id}/unblock`),

  getWorkerMonitor: (params = {}) =>
    api.get("/useractivitylogs/worker-monitor", { params }),

  getScannerOperations: (params = {}) =>
    api.get("/scanneroperations", { params }),


  // Product & Inventory
  createProduct: (payload) =>
    api.post("/smart-erp/products", payload),

  receiveInventory: (payload) =>
    api.post("/stock/in", payload),

  dispatchInventory: (payload) =>
    api.post("/stock/out", payload),


  // Orders Workflow
  createOrder: (payload) =>
    api.post("/smart-erp/orders", payload),

  getCustomerOrders: () =>
    api.get("/public/orders"),

  updateCustomerOrderStatus: (id, payload) =>
    api.put(`/public/orders/${id}/status`, payload),

  assignDelivery: (payload) =>
    api.post("/delivery/assign", payload),

  updateDeliveryStatus: (payload) =>
    api.post("/delivery/update-status", payload),

  assignPicking: (orderId) =>
    api.post(`/smart-erp/orders/${orderId}/assign-picking`),

  verifyScan: (orderId, payload) =>
    api.post(`/smart-erp/orders/${orderId}/verify-scan`, payload),

  shipOrder: (orderId) =>
    api.post(`/smart-erp/orders/${orderId}/ship`),


  // Robot System
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


  // Device Integration
  deviceEvent: (payload) =>
    api.post("/smart-erp/devices/event", payload),


  // Procurement
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


  // Finance
  capturePayment: (payload) =>
    api.post("/smart-erp/finance/capture-payment", payload),


  // Sales Orders
  createSalesOrder: (payload) =>
    api.post("/sales-orders", payload),

  getSalesOrders: () =>
    api.get("/sales-orders"),

  getSalesOrder: (id) =>
    api.get(`/sales-orders/${id}`),

  updateSalesOrderStatus: (id, payload) =>
    api.put(`/sales-orders/${id}/status`, payload),


  // Shipments & Invoice
  createShipment: (payload) =>
    api.post("/shipments", payload),

  generateInvoice: (payload) =>
    api.post("/invoices", payload),

  recordSalesPayment: (payload) =>
    api.post("/payments", payload),

  getInvoices: () =>
    api.get("/invoices"),


  // Dashboard
  notificationsUnreadCount: () =>
    api.get("/smart-erp/notifications/unread-count"),

  dashboard: () =>
    api.get("/smart-erp/dashboard/realtime"),

  analytics: () =>
    api.get("/smart-erp/analytics/report"),


  // Warehouses
  warehouses: () =>
    api.get("/warehouses"),

  createWarehouse: (code, name, location = '') => {
    const locationParam = location ? `&location=${encodeURIComponent(location)}` : "";
    return api.post(
      `/warehouses?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}${locationParam}`
    );
  },


  // Stock
  stockAlerts: () =>
    api.get("/smart-erp/stock-alerts"),

  stockItems: () =>
    api.get("/stock/items"),

  stockInventory: () =>
    api.get("/stock/inventory"),

  stockSerials: (params = {}) => api.get("/stock/serials", { params }),

  stockTransactions: () =>
    api.get("/stock/transactions"),

  reportsTransactions: () =>
    api.get("/reports/transactions"),

  getItemByBarcode: (barcode) =>
    api.get(`/items/barcode/${encodeURIComponent(barcode)}`),

  checkItemBarcode: (barcode) =>
    api.get(`/items/barcode-check/${encodeURIComponent(barcode)}`),


  // Vendor Returns
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

  listDocuments: (entityType, entityId) =>
    api.get(`/documents/${entityType}/${entityId}`),

  uploadDocument: (entityType, entityId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/documents/${entityType}/${entityId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  deleteDocument: (documentId) =>
    api.delete(`/documents/${documentId}`),

  documentDownloadUrl: (documentId) => {
    const baseUrl = api.defaults.baseURL || "";
    const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${base}/documents/${documentId}/download`;
  }
};

//   shipOrder: (orderId) =>
//     api.post(`/smart-erp/orders/${orderId}/ship`),


//   // =========================
//   // Robot System
//   // =========================
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


//   // =========================
//   // Device Integration
//   // =========================
//   deviceEvent: (payload) =>
//     api.post("/smart-erp/devices/event", payload),


//   // =========================
//   // Procurement
//   // =========================
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


//   // =========================
//   // Finance
//   // =========================
//   capturePayment: (payload) =>
//     api.post("/smart-erp/finance/capture-payment", payload),


//   // =========================
//   // Sales Orders
//   // =========================
//   createSalesOrder: (payload) =>
//     api.post("/sales-orders", payload),

//   getSalesOrders: () =>
//     api.get("/sales-orders"),

//   getSalesOrder: (id) =>
//     api.get(`/sales-orders/${id}`),

//   updateSalesOrderStatus: (id, payload) =>
//     api.put(`/sales-orders/${id}/status`, payload),


//   // =========================
//   // Shipments & Invoice
//   // =========================
//   createShipment: (payload) =>
//     api.post("/shipments", payload),

//   generateInvoice: (payload) =>
//     api.post("/invoices", payload),

//   recordSalesPayment: (payload) =>
//     api.post("/payments", payload),


//   // =========================
//   // Dashboard
//   // =========================
//   notificationsUnreadCount: () =>
//     api.get("/smart-erp/notifications/unread-count"),

//   dashboard: () =>
//     api.get("/smart-erp/dashboard/realtime"),

//   analytics: () =>
//     api.get("/smart-erp/analytics/report"),


//   // =========================
//   // Vendor Returns
//   // =========================
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


//   // =========================
//   // Warehouses
//   // =========================
//   warehouses: () =>
//     api.get("/warehouses"),

//   createWarehouse: (code, name) =>
//     api.post(
//       `/warehouses?code=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`
//     ),


//   // =========================
//   // Stock
//   // =========================
//   stockAlerts: () =>
//     api.get("/smart-erp/stock-alerts"),

//   stockItems: () =>
//     api.get("/stock/items"),

//   stockInventory: () =>
//     api.get("/stock/inventory"),

//   stockTransactions: () =>
//     api.get("/stock/transactions")
// };
