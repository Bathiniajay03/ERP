// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import * as signalR from "@microsoft/signalr";
// import { smartErpApi } from "../services/smartErpApi";

// const ACTIVE_ORDER_STATUSES = ["Pending", "Picking", "Packed", "OutForDelivery"];
// const PENDING_ORDER_STATUSES = ["Pending"];

// const PackerStatusLabels = ["Received", "Packing", "Packed", "Moving"];
// const WORKFLOW_COLUMNS = [
//   { key: "incoming", label: "Incoming", statuses: ["Pending"], tone: "tag-warning", helper: "Customer app orders waiting for a packer" },
//   { key: "packing", label: "Packing", statuses: ["Picking"], tone: "tag-info", helper: "Assigned to a packer" },
//   { key: "packed", label: "Packed", statuses: ["Packed"], tone: "tag-success", helper: "Ready for rider handoff" },
//   { key: "moving", label: "Moving", statuses: ["OutForDelivery"], tone: "tag-primary", helper: "With a rider" }
// ];

// const getStageLabel = (status) => {
//   const normalized = String(status || "").toLowerCase();
//   if (normalized === "pending") return "Pending";
//   if (normalized === "picking") return "Packing";
//   if (normalized === "packed") return "Ready to Move";
//   if (normalized === "outfordelivery") return "Moving";
//   if (normalized === "delivered") return "Delivered";
//   if (normalized === "cancelled") return "Cancelled";
//   return status || "Unknown";
// };

// const getStageClass = (status) => {
//   const normalized = String(status || "").toLowerCase();
//   if (normalized === "pending") return "tag-warning";
//   if (normalized === "picking") return "tag-info";
//   if (normalized === "packed") return "tag-success";
//   if (normalized === "outfordelivery") return "tag-primary";
//   if (normalized === "delivered") return "tag-success";
//   if (normalized === "cancelled") return "tag-danger";
//   return "tag-secondary";
// };

// const formatPerson = (person) => {
//   if (!person) return "---";
//   return person.riderName || person.username || person.name || person.email || `#${person.id || person.riderId || "---"}`;
// };

// const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

// const formatDateTime = (value) => {
//   if (!value) return "---";
//   const date = new Date(value);
//   return Number.isNaN(date.getTime()) ? "---" : date.toLocaleString();
// };

// const getOrderRiderId = (order) => order?.deliveryStatus?.riderId ?? order?.assignedRiderId ?? null;

// const getOrderItems = (order) => Array.isArray(order?.items) ? order.items : [];

// const getPrimaryItemLabel = (order) => {
//   const items = getOrderItems(order);
//   if (items.length === 0) return "No items";
//   if (items.length === 1) return items[0].productName || "Item";
//   return `${items[0].productName || "Item"} +${items.length - 1}`;
// };

// const getUserAssignedPages = (user) => {
//   if (!user) return [];
//   if (Array.isArray(user.assignedPages)) return user.assignedPages;
//   if (Array.isArray(user.pages)) return user.pages;
//   return [];
// };

// const isPackerUser = (user) => {
//   const role = String(user?.role || "").trim().toLowerCase();
//   const userType = String(user?.userType || "").trim().toUpperCase();
//   const pages = getUserAssignedPages(user);
//   const operationalPages = ["operations", "salesOrderList", "createSalesOrder", "purchaseOrders"];

//   return (
//     role === "packer" ||
//     role === "operator" ||
//     role === "operationsworker" ||
//     role === "warehouse manager" ||
//     userType === "WORKER" ||
//     pages.some((page) => operationalPages.includes(page))
//   );
// };

// const canLoadUserRoster = () => {
//   const role = String(window.localStorage.getItem("erp_role") || "").trim().toLowerCase();
//   return [
//     "admin",
//     "manager",
//     "sales admin",
//     "sales manager",
//     "warehouse manager",
//     "delivery manager",
//     "finance manager",
//     "scannerworker",
//     "operationsworker"
//   ].includes(role);
// };

// export default function OrderManagement() {
//   const [orders, setOrders] = useState([]);
//   const [orderFeedSource, setOrderFeedSource] = useState("customer");
//   const [packers, setPackers] = useState([]);
//   const [riders, setRiders] = useState([]);
//   const [selectedOrderId, setSelectedOrderId] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [assignForm, setAssignForm] = useState({ orderId: "", packerId: "" });
//   const [packerStatusForm, setPackerStatusForm] = useState({ orderId: "", status: "Received" });
//   const [riderForm, setRiderForm] = useState({ orderId: "", riderId: "" });
//   const hubConnectionRef = useRef(null);
//   const refreshTimerRef = useRef(null);
//   const orderDetailsRef = useRef(null);

//   const loadData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const usersRequest = canLoadUserRoster() ? smartErpApi.getUsers() : Promise.resolve({ data: [] });
//       const [customerOrdersRes, usersRes, ridersRes] = await Promise.allSettled([
//         smartErpApi.getCustomerOrders(),
//         usersRequest,
//         smartErpApi.getRiders()
//       ]);

//       const customerOrders = customerOrdersRes.status === "fulfilled" && Array.isArray(customerOrdersRes.value.data)
//         ? customerOrdersRes.value.data
//         : [];

//       setOrders(customerOrders);
//       setOrderFeedSource(customerOrders.length > 0 ? "customer" : "empty");

//       if (customerOrdersRes.status === "rejected") {
//         setMessage("Customer order feed is unavailable right now.");
//       }

//       if (usersRes.status === "fulfilled") {
//         const users = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
//         setPackers(users.filter(isPackerUser));
//       }

//       if (ridersRes.status === "fulfilled") {
//         setRiders(Array.isArray(ridersRes.value.data) ? ridersRes.value.data : []);
//       }

//       const hasFailure = [customerOrdersRes, usersRes, ridersRes].some((entry) => entry.status === "rejected");
//       setMessage(hasFailure ? "Some order data failed to load. Showing the available data." : "");
//     } catch (error) {
//       setMessage(error?.response?.data || "Failed to load order management data.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const scheduleRefresh = useCallback(() => {
//     if (refreshTimerRef.current) {
//       window.clearTimeout(refreshTimerRef.current);
//     }

//     refreshTimerRef.current = window.setTimeout(() => {
//       loadData();
//     }, 250);
//   }, [loadData]);

//   useEffect(() => {
//     loadData();
//     const timer = window.setInterval(loadData, 15000);
//     return () => window.clearInterval(timer);
//   }, [loadData]);

//   useEffect(() => {
//     const hubUrl = (() => {
//       const apiBase = (process.env.REACT_APP_API_BASE_URL || "http://localhost:5157/api").trim();
//       return apiBase.replace(/\/api\/?$/i, "") + "/deliveryhub";
//     })();

//     const connection = new signalR.HubConnectionBuilder()
//       .withUrl(hubUrl, {
//         accessTokenFactory: () => window.localStorage.getItem("erp_token") || ""
//       })
//       .withAutomaticReconnect()
//       .build();

//     connection.on("ReceiveOrderUpdate", scheduleRefresh);
//     hubConnectionRef.current = connection;

//     connection.start().catch(() => {
//       // Polling keeps the board alive if the hub is temporarily unavailable.
//     });

//     return () => {
//       connection.off("ReceiveOrderUpdate", scheduleRefresh);
//       connection.stop().catch(() => {});
//       hubConnectionRef.current = null;
//       if (refreshTimerRef.current) {
//         window.clearTimeout(refreshTimerRef.current);
//       }
//     };
//   }, [scheduleRefresh]);

//   const activeOrders = useMemo(
//     () => orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)),
//     [orders]
//   );

//   const pendingOrders = useMemo(
//     () => orders.filter((order) => PENDING_ORDER_STATUSES.includes(order.status)),
//     [orders]
//   );

//   const packingOrders = useMemo(
//     () => orders.filter((order) => order.status === "Picking"),
//     [orders]
//   );

//   const readyToMoveOrders = useMemo(
//     () => orders.filter((order) => order.status === "Packed"),
//     [orders]
//   );

//   const movingOrders = useMemo(
//     () => orders.filter((order) => order.status === "OutForDelivery"),
//     [orders]
//   );

//   const pastOrders = useMemo(
//     () => orders.filter((order) => ["Delivered", "Cancelled"].includes(order.status)),
//     [orders]
//   );

//   const workflowColumnOrders = useMemo(
//     () =>
//       WORKFLOW_COLUMNS.map((column) => ({
//         ...column,
//         orders: orders.filter((order) => column.statuses.includes(order.status))
//       })),
//     [orders]
//   );

//   const selectedOrder = useMemo(
//     () => orders.find((order) => String(order.id) === String(selectedOrderId)) || null,
//     [orders, selectedOrderId]
//   );

//   useEffect(() => {
//     if (selectedOrder && orderDetailsRef.current) {
//       orderDetailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
//     }
//   }, [selectedOrder]);

//   const packerCountById = useMemo(() => {
//     return orders.reduce((acc, order) => {
//       if (!order.assignedPackerId) return acc;
//       const key = String(order.assignedPackerId);
//       acc[key] = (acc[key] || 0) + 1;
//       return acc;
//     }, {});
//   }, [orders]);

//   const riderCountById = useMemo(() => {
//     return orders.reduce((acc, order) => {
//       const riderId = getOrderRiderId(order);
//       if (!riderId) return acc;
//       const key = String(riderId);
//       acc[key] = (acc[key] || 0) + 1;
//       return acc;
//     }, {});
//   }, [orders]);

//   const getPersonNameById = useCallback((id, list, idKey = "id") => {
//     if (!id) return "---";
//     const match = list.find((item) => String(item[idKey]) === String(id));
//     return formatPerson(match);
//   }, []);

//   const showFeedback = (text, type = "info") => {
//     setMessage(text);
//     if (type !== "info") {
//       window.setTimeout(() => setMessage(""), 3500);
//     }
//   };

//   const assignOrderToPacker = async (event) => {
//     event.preventDefault();
//     if (!assignForm.orderId || !assignForm.packerId) {
//       showFeedback("Select both an order and a packer.");
//       return;
//     }

//     try {
//       await smartErpApi.updateCustomerOrderStatus(Number(assignForm.orderId), {
//         status: "Picking",
//         assignedPackerId: Number(assignForm.packerId)
//       });
//       setAssignForm({ orderId: "", packerId: "" });
//       showFeedback("Order assigned to packer and moved to Packing.");
//       await loadData();
//     } catch (error) {
//       showFeedback(error?.response?.data || "Failed to assign order to packer.");
//     }
//   };

//   const updatePackerStatus = async (event) => {
//     event.preventDefault();
//     if (!packerStatusForm.orderId) {
//       showFeedback("Select an order to update.");
//       return;
//     }

//     const statusMap = {
//       Received: "Picking",
//       Packing: "Picking",
//       Packed: "Packed",
//       Moving: "OutForDelivery"
//     };

//     try {
//       await smartErpApi.updateCustomerOrderStatus(Number(packerStatusForm.orderId), {
//         status: statusMap[packerStatusForm.status] || "Picking"
//       });
//       setPackerStatusForm({ orderId: "", status: "Received" });
//       showFeedback(`Order status updated to ${packerStatusForm.status}.`);
//       await loadData();
//     } catch (error) {
//       showFeedback(error?.response?.data || "Failed to update packer status.");
//     }
//   };

//   const assignOrderToRider = async (event) => {
//     event.preventDefault();
//     if (!riderForm.orderId || !riderForm.riderId) {
//       showFeedback("Select both an order and a rider.");
//       return;
//     }

//     try {
//       await smartErpApi.assignDelivery({
//         orderId: Number(riderForm.orderId),
//         riderId: Number(riderForm.riderId)
//       });
//       setRiderForm({ orderId: "", riderId: "" });
//       showFeedback("Order assigned to rider and marked as Moving.");
//       await loadData();
//     } catch (error) {
//       showFeedback(error?.response?.data || "Failed to assign rider.");
//     }
//   };

//   return (
//     <div className="erp-app-wrapper min-vh-100 pb-4 pt-3">
//       <div className="container-fluid px-4">
//         <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
//           <div>
//             <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: "-0.5px" }}>Customer Fulfillment Board</h4>
//             <span className="erp-text-muted small text-uppercase">Customer orders, packer steps, rider dispatch and live roster</span>
//             <div className="small text-muted mt-1">
//               {orderFeedSource === "customer"
//                 ? "Live customer-app orders feed"
//                 : "No incoming orders yet"}
//             </div>
//           </div>
//           <button
//             className="btn btn-primary erp-btn d-flex align-items-center gap-2"
//             onClick={loadData}
//             disabled={loading}
//           >
//             {loading ? <span className="spinner-border spinner-border-sm" /> : "↻"}
//               {loading ? "Syncing..." : "Refresh Board"}
//           </button>
//         </div>

//         {message && (
//           <div className="alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4" style={{
//             backgroundColor: message.includes("failed") ? "#fef2f2" : "#eff6ff",
//             color: message.includes("failed") ? "#991b1b" : "#075985",
//             border: `1px solid ${message.includes("failed") ? "#fecaca" : "#bfdbfe"}`
//           }}>
//             <span className="fw-semibold">{message}</span>
//             <button className="btn-close btn-sm" onClick={() => setMessage("")}></button>
//           </div>
//         )}

//         <div className="row g-3 mb-4">
//           <div className="col-md-3">
//             <div className="erp-kpi-box h-100" style={{ borderLeftColor: "#0f4c81" }}>
//               <div className="text-muted small text-uppercase">Customer App Requests</div>
//               <div className="fs-3 fw-bold">{activeOrders.length}</div>
//               <div className="text-muted small">Online orders waiting for packer flow</div>
//             </div>
//           </div>
//           <div className="col-md-3">
//             <div className="erp-kpi-box h-100" style={{ borderLeftColor: "#f59e0b" }}>
//               <div className="text-muted small text-uppercase">Pending</div>
//               <div className="fs-3 fw-bold">{pendingOrders.length}</div>
//               <div className="text-muted small">Waiting for packer assignment</div>
//             </div>
//           </div>
//           <div className="col-md-3">
//             <div className="erp-kpi-box h-100" style={{ borderLeftColor: "#14b8a6" }}>
//               <div className="text-muted small text-uppercase">Packing / Moving</div>
//               <div className="fs-3 fw-bold">{packingOrders.length + readyToMoveOrders.length + movingOrders.length}</div>
//               <div className="text-muted small">In packer or rider flow</div>
//             </div>
//           </div>
//           <div className="col-md-3">
//             <div className="erp-kpi-box h-100" style={{ borderLeftColor: "#8b5cf6" }}>
//               <div className="text-muted small text-uppercase">Riders</div>
//               <div className="fs-3 fw-bold">{riders.length}</div>
//               <div className="text-muted small">
//                 {riders.filter((rider) => String(rider.status || "").toLowerCase() === "busy").length} busy
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="erp-panel shadow-sm mb-4">
//           <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
//             <span className="fw-bold">Workflow Steps</span>
//                 <span className="text-muted small">Move each online customer request from intake to delivery</span>
//           </div>
//           <div className="p-3 bg-white">
//             <div className="row g-3">
//               {workflowColumnOrders.map((column) => (
//                 <div key={column.key} className="col-lg-3 col-md-6">
//                   <div className="border rounded h-100 bg-light">
//                     <div className="d-flex justify-content-between align-items-center border-bottom p-3">
//                       <div>
//                         <div className="fw-bold">{column.label}</div>
//                         <div className="small text-muted">{column.helper}</div>
//                       </div>
//                       <span className={`erp-status-tag ${column.tone}`}>{column.orders.length}</span>
//                     </div>
//                     <div className="p-2" style={{ maxHeight: "320px", overflowY: "auto" }}>
//                       {column.orders.length === 0 ? (
//                         <div className="text-center text-muted small py-4">No orders</div>
//                       ) : (
//                         column.orders.map((order) => (
//                           <div
//                             key={order.id}
//                             className="w-100 text-start border rounded bg-white p-2 mb-2"
//                             onClick={() => setSelectedOrderId(String(order.id))}
//                             onKeyDown={(event) => {
//                               if (event.key === "Enter" || event.key === " ") {
//                                 event.preventDefault();
//                                 setSelectedOrderId(String(order.id));
//                               }
//                             }}
//                             role="button"
//                             tabIndex={0}
//                             style={{ cursor: "pointer" }}
//                           >
//                             <div className="d-flex justify-content-between align-items-start">
//                               <div>
//                                 <button
//                                   type="button"
//                                   className="btn btn-link p-0 fw-bold font-monospace text-dark text-decoration-none"
//                                   onClick={(event) => {
//                                     event.stopPropagation();
//                                     setSelectedOrderId(String(order.id));
//                                   }}
//                                 >
//                                   {order.orderNumber}
//                                 </button>
//                                 <div className="small text-muted text-truncate" style={{ maxWidth: 160 }}>{order.customerName}</div>
//                               </div>
//                               <span className={`erp-status-tag ${getStageClass(order.status)}`}>{getStageLabel(order.status)}</span>
//                             </div>
//                             <div className="small text-muted mt-2 d-flex justify-content-between">
//                               <span>{getPersonNameById(order.assignedPackerId, packers)}</span>
//                               <span>{getPersonNameById(getOrderRiderId(order), riders, "riderId")}</span>
//                             </div>
//                           </div>
//                         ))
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         <div className="row g-4">
//           <div className="col-xl-7">
//             <div className="erp-panel shadow-sm h-100">
//               <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
//                 <span className="fw-bold">Customer Request Queue</span>
//                 <span className="badge bg-secondary">{activeOrders.length} records</span>
//               </div>
//               <div className="erp-table-container bg-white overflow-auto" style={{ maxHeight: "560px" }}>
//                 <table className="table erp-table table-hover align-middle mb-0">
//                   <thead className="table-light">
//                     <tr>
//                       <th>Customer Order</th>
//                       <th>Workflow Step</th>
//                       <th>Packer</th>
//                       <th>Rider</th>
//                       <th className="text-end">Total</th>
//                       <th className="text-end">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {activeOrders.length === 0 ? (
//                       <tr>
//                         <td colSpan="6" className="text-center py-4 text-muted">No customer app orders found.</td>
//                       </tr>
//                     ) : (
//                       activeOrders.map((order) => (
//                         <tr
//                           key={order.id}
//                           className={String(selectedOrderId) === String(order.id) ? "table-primary" : ""}
//                           style={{ cursor: "pointer" }}
//                           onClick={() => setSelectedOrderId(String(order.id))}
//                         >
//                           <td>
//                             <button
//                               type="button"
//                               className="btn btn-link p-0 fw-bold font-monospace text-dark text-decoration-none"
//                               onClick={(event) => {
//                                 event.stopPropagation();
//                                 setSelectedOrderId(String(order.id));
//                               }}
//                             >
//                               {order.orderNumber}
//                             </button>
//                             <div className="small text-muted text-truncate" style={{ maxWidth: 170 }}>{order.customerName}</div>
//                           </td>
//                           <td>
//                             <span className={`erp-status-tag ${getStageClass(order.status)}`}>{getStageLabel(order.status)}</span>
//                             <div className="small text-muted mt-1">{order.status}</div>
//                           </td>
//                           <td className="small">
//                             <div className="fw-semibold">
//                               {getPersonNameById(order.assignedPackerId, packers)}
//                             </div>
//                             <div className="text-muted">
//                               {order.assignedPackerId ? `Assigned #${order.assignedPackerId}` : "Not assigned"}
//                             </div>
//                           </td>
//                           <td className="small">
//                             <div className="fw-semibold">
//                               {getPersonNameById(getOrderRiderId(order), riders, "riderId")}
//                             </div>
//                             <div className="text-muted">
//                               {getOrderRiderId(order) ? `Assigned #${getOrderRiderId(order)}` : "Waiting"}
//                             </div>
//                           </td>
//                           <td className="text-end font-monospace fw-semibold">
//                             {Number(order.totalAmount || 0).toFixed(2)}
//                           </td>
//                           <td className="text-end">
//                             <div className="d-flex justify-content-end gap-2 flex-wrap">
//                               <button
//                                 type="button"
//                                 className="btn btn-sm btn-outline-primary erp-btn"
//                                 onClick={(event) => {
//                                   event.stopPropagation();
//                                   setAssignForm({
//                                     orderId: String(order.id),
//                                     packerId: String(order.assignedPackerId || "")
//                                   });
//                                   setSelectedOrderId(String(order.id));
//                                 }}
//                               >
//                                 Assign Packer
//                               </button>
//                               <button
//                                 type="button"
//                                 className="btn btn-sm btn-outline-success erp-btn"
//                                 onClick={(event) => {
//                                   event.stopPropagation();
//                                   setPackerStatusForm({ orderId: String(order.id), status: "Packed" });
//                                   setSelectedOrderId(String(order.id));
//                                 }}
//                               >
//                                 Mark Packed
//                               </button>
//                               <button
//                                 type="button"
//                                 className="btn btn-sm btn-outline-warning erp-btn"
//                                 onClick={(event) => {
//                                   event.stopPropagation();
//                                   setRiderForm({
//                                     orderId: String(order.id),
//                                     riderId: String(getOrderRiderId(order) || "")
//                                   });
//                                   setSelectedOrderId(String(order.id));
//                                 }}
//                               >
//                                 Assign Rider
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>

//           <div className="col-xl-5">
//             <div className="erp-panel shadow-sm mb-4">
//               <div className="erp-panel-header bg-light">
//                 <span className="fw-bold">Packing Steps</span>
//               </div>
//               <div className="p-4 bg-white">
//                 <div className="mb-3">
//                   <label className="erp-label">Assign Order to Packer</label>
//                   <form className="row g-2" onSubmit={assignOrderToPacker}>
//                     <div className="col-6">
//                       <select
//                         className="form-select erp-input"
//                         value={assignForm.orderId}
//                         onChange={(event) => setAssignForm((prev) => ({ ...prev, orderId: event.target.value }))}
//                       >
//                         <option value="">Select Customer Order</option>
//                         {pendingOrders.map((order) => (
//                           <option key={order.id} value={order.id}>{order.orderNumber}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-6">
//                       <select
//                         className="form-select erp-input"
//                         value={assignForm.packerId}
//                         onChange={(event) => setAssignForm((prev) => ({ ...prev, packerId: event.target.value }))}
//                       >
//                         <option value="">Select Packer</option>
//                         {packers.map((packer) => (
//                           <option key={packer.id} value={packer.id}>{formatPerson(packer)}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-12">
//                       <button type="submit" className="btn btn-primary erp-btn w-100">Start Packing</button>
//                     </div>
//                   </form>
//                 </div>

//                 <hr className="my-4" />

//                 <div className="mb-3">
//                   <label className="erp-label">Packer Status Update</label>
//                   <form className="row g-2" onSubmit={updatePackerStatus}>
//                     <div className="col-6">
//                       <select
//                         className="form-select erp-input"
//                         value={packerStatusForm.orderId}
//                         onChange={(event) => setPackerStatusForm((prev) => ({ ...prev, orderId: event.target.value }))}
//                       >
//                         <option value="">Select Order</option>
//                         {packingOrders.concat(readyToMoveOrders).map((order) => (
//                           <option key={order.id} value={order.id}>{order.orderNumber}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-6">
//                       <select
//                         className="form-select erp-input"
//                         value={packerStatusForm.status}
//                         onChange={(event) => setPackerStatusForm((prev) => ({ ...prev, status: event.target.value }))}
//                       >
//                         {PackerStatusLabels.map((status) => (
//                           <option key={status} value={status}>{status}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-12">
//                       <button type="submit" className="btn btn-success erp-btn w-100">Update Packing Step</button>
//                     </div>
//                   </form>
//                 </div>

//                 <hr className="my-4" />

//                 <div>
//                   <label className="erp-label">Assign Rider</label>
//                   <form className="row g-2" onSubmit={assignOrderToRider}>
//                     <div className="col-6">
//                       <select
//                         className="form-select erp-input"
//                         value={riderForm.orderId}
//                         onChange={(event) => setRiderForm((prev) => ({ ...prev, orderId: event.target.value }))}
//                       >
//                         <option value="">Select Customer Order</option>
//                         {readyToMoveOrders.concat(movingOrders).map((order) => (
//                           <option key={order.id} value={order.id}>{order.orderNumber}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-6">
//                       <select
//                         className="form-select erp-input"
//                         value={riderForm.riderId}
//                         onChange={(event) => setRiderForm((prev) => ({ ...prev, riderId: event.target.value }))}
//                       >
//                         <option value="">Select Rider</option>
//                         {riders.map((rider) => (
//                           <option key={rider.riderId} value={rider.riderId}>{formatPerson(rider)}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-12">
//                       <button type="submit" className="btn btn-warning erp-btn w-100">Dispatch Rider</button>
//                     </div>
//                   </form>
//                 </div>
//               </div>
//             </div>

//             <div className="erp-panel shadow-sm mb-4">
//               <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
//                 <span className="fw-bold">Packer Roster</span>
//                 <span className="badge bg-secondary">{packers.length} packers</span>
//               </div>
//               <div className="p-3 bg-white">
//                 {packers.length === 0 ? (
//                   <div className="text-muted small">No packers found. Create or assign worker accounts from Admin.</div>
//                 ) : (
//                   <div className="d-grid gap-2">
//                     {packers.map((packer) => (
//                       <div key={packer.id} className="d-flex justify-content-between align-items-center border rounded p-2">
//                         <div>
//                           <div className="fw-semibold">{formatPerson(packer)}</div>
//                           <div className="small text-muted">
//                             {packer.role || "OperationsWorker"} {packer.userType ? `• ${packer.userType}` : ""}
//                           </div>
//                         </div>
//                         <div className="text-end">
//                           <span className={`erp-status-tag ${String(packer.status || "").toLowerCase() === "active" ? "tag-success" : "tag-warning"}`}>
//                             {packer.status || "Active"}
//                           </span>
//                           <div className="small text-muted mt-1">
//                             {packerCountById[String(packer.id)] || 0} assigned
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="erp-panel shadow-sm">
//               <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
//                 <span className="fw-bold">Rider Roster</span>
//                 <span className="badge bg-secondary">{riders.length} riders</span>
//               </div>
//               <div className="erp-table-container overflow-auto bg-white" style={{ maxHeight: "360px" }}>
//                 <table className="table erp-table table-hover align-middle mb-0">
//                   <thead className="table-light">
//                     <tr>
//                       <th>Rider</th>
//                       <th>Status</th>
//                       <th className="text-center">Accepted</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {riders.length === 0 ? (
//                       <tr>
//                         <td colSpan="3" className="text-center py-4 text-muted">No riders found.</td>
//                       </tr>
//                     ) : (
//                       riders.map((rider) => (
//                         <tr key={rider.riderId}>
//                           <td>
//                             <div className="fw-semibold">{formatPerson(rider)}</div>
//                             <div className="small text-muted">{rider.email || "---"}</div>
//                           </td>
//                           <td>
//                             <span className={`erp-status-tag ${String(rider.status || "").toLowerCase() === "busy" ? "tag-warning" : "tag-success"}`}>
//                               {rider.status || "Active"}
//                             </span>
//                             <div className="small text-muted mt-1">
//                               {rider.lastSeen ? new Date(rider.lastSeen).toLocaleString() : "---"}
//                             </div>
//                           </td>
//                           <td className="text-center fw-semibold">
//                             {rider.activeOrders ?? riderCountById[String(rider.riderId)] ?? 0}
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>

//           <div className="col-12">
//             <div className="erp-panel shadow-sm">
//               <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
//                 <span className="fw-bold">Incoming Customer App Orders</span>
//                 <span className="badge bg-secondary">{pendingOrders.length} waiting</span>
//               </div>
//               <div className="erp-table-container bg-white overflow-auto" style={{ maxHeight: "320px" }}>
//                 <table className="table erp-table table-hover align-middle mb-0">
//                   <thead className="table-light">
//                     <tr>
//                       <th>Order</th>
//                       <th>Customer</th>
//                       <th>Status</th>
//                       <th>Packer</th>
//                       <th>Rider</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {pendingOrders.length === 0 ? (
//                       <tr>
//                         <td colSpan="5" className="text-center py-4 text-muted">No incoming customer app orders right now.</td>
//                       </tr>
//                     ) : (
//                       pendingOrders.map((order) => (
//                         <tr key={order.id} onClick={() => setSelectedOrderId(String(order.id))} style={{ cursor: "pointer" }}>
//                           <td>
//                             <button
//                               type="button"
//                               className="btn btn-link p-0 fw-bold font-monospace text-dark text-decoration-none"
//                               onClick={(event) => {
//                                 event.stopPropagation();
//                                 setSelectedOrderId(String(order.id));
//                               }}
//                             >
//                               {order.orderNumber}
//                             </button>
//                           </td>
//                           <td>
//                             <div className="fw-semibold">{order.customerName || "---"}</div>
//                             <div className="small text-muted">{getPrimaryItemLabel(order)}</div>
//                           </td>
//                           <td><span className={`erp-status-tag ${getStageClass(order.status)}`}>{getStageLabel(order.status)}</span></td>
//                           <td>{getPersonNameById(order.assignedPackerId, packers)}</td>
//                           <td>{getPersonNameById(getOrderRiderId(order), riders, "riderId")}</td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>

//           <div className="col-12">
//             <div className="erp-panel shadow-sm mb-4">
//               <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
//                 <span className="fw-bold">Past Orders</span>
//                 <span className="badge bg-secondary">{pastOrders.length} records</span>
//               </div>
//               <div className="erp-table-container bg-white overflow-auto" style={{ maxHeight: "320px" }}>
//                 <table className="table erp-table table-hover align-middle mb-0">
//                   <thead className="table-light">
//                     <tr>
//                       <th>Order Number</th>
//                       <th>Customer</th>
//                       <th>Status</th>
//                       <th>Items</th>
//                       <th className="text-end">Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {pastOrders.length === 0 ? (
//                       <tr>
//                         <td colSpan="5" className="text-center py-4 text-muted">No past orders found.</td>
//                       </tr>
//                     ) : (
//                       pastOrders.map((order) => (
//                         <tr
//                           key={order.id}
//                           className={String(selectedOrderId) === String(order.id) ? "table-primary" : ""}
//                           style={{ cursor: "pointer" }}
//                           onClick={() => setSelectedOrderId(String(order.id))}
//                         >
//                           <td>
//                             <button
//                               type="button"
//                               className="btn btn-link p-0 fw-bold font-monospace text-dark text-decoration-none"
//                               onClick={(event) => {
//                                 event.stopPropagation();
//                                 setSelectedOrderId(String(order.id));
//                               }}
//                             >
//                               {order.orderNumber}
//                             </button>
//                           </td>
//                           <td>
//                             <div className="fw-semibold">{order.customerName || "---"}</div>
//                             <div className="small text-muted">{formatDateTime(order.createdAt)}</div>
//                           </td>
//                           <td>
//                             <span className={`erp-status-tag ${getStageClass(order.status)}`}>{getStageLabel(order.status)}</span>
//                             <div className="small text-muted mt-1">{order.deliveryStatus?.status || order.status}</div>
//                           </td>
//                           <td>
//                             <div className="fw-semibold">{getPrimaryItemLabel(order)}</div>
//                             <div className="small text-muted">{getOrderItems(order).length} item lines</div>
//                           </td>
//                           <td className="text-end font-monospace fw-semibold">{formatCurrency(order.totalAmount)}</td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>

//           {selectedOrder && (
//             <div className="col-12" ref={orderDetailsRef}>
//               <div className="erp-panel shadow-sm">
//                 <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
//                   <span className="fw-bold">Selected Customer Order</span>
//                   <span className={`erp-status-tag ${getStageClass(selectedOrder.status)}`}>{getStageLabel(selectedOrder.status)}</span>
//                 </div>
//                 <div className="p-3 bg-white">
//                     <div className="row g-3">
//                     <div className="col-md-3">
//                       <div className="border rounded p-3 bg-light h-100">
//                         <div className="small text-muted text-uppercase">Order</div>
//                         <div className="fw-bold font-monospace">{selectedOrder.orderNumber}</div>
//                         <div className="small text-muted">{selectedOrder.customerName || "---"}</div>
//                       </div>
//                     </div>
//                     <div className="col-md-3">
//                       <div className="border rounded p-3 bg-light h-100">
//                         <div className="small text-muted text-uppercase">Current Stage</div>
//                         <div className="fw-bold">{selectedOrder.status}</div>
//                         <div className="small text-muted">{getStageLabel(selectedOrder.status)}</div>
//                       </div>
//                     </div>
//                     <div className="col-md-3">
//                       <div className="border rounded p-3 bg-light h-100">
//                         <div className="small text-muted text-uppercase">Packer</div>
//                         <div className="fw-bold">{getPersonNameById(selectedOrder.assignedPackerId, packers)}</div>
//                         <div className="small text-muted">
//                           {selectedOrder.assignedPackerId ? `#${selectedOrder.assignedPackerId}` : "Not assigned"}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="col-md-3">
//                       <div className="border rounded p-3 bg-light h-100">
//                         <div className="small text-muted text-uppercase">Rider</div>
//                         <div className="fw-bold">{getPersonNameById(getOrderRiderId(selectedOrder), riders, "riderId")}</div>
//                         <div className="small text-muted">
//                           {getOrderRiderId(selectedOrder) ? `#${getOrderRiderId(selectedOrder)}` : "Waiting"}
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="row g-3 mt-1">
//                     <div className="col-lg-7">
//                       <div className="border rounded p-3 h-100">
//                         <div className="d-flex justify-content-between align-items-center mb-3">
//                           <div>
//                             <div className="fw-bold">Received Items</div>
//                             <div className="small text-muted">Full item list from the customer order</div>
//                           </div>
//                           <span className="badge bg-light text-dark">{getOrderItems(selectedOrder).length} items</span>
//                         </div>
//                         <div className="table-responsive">
//                           <table className="table table-sm align-middle mb-0">
//                             <thead className="table-light">
//                               <tr>
//                                 <th>Product</th>
//                                 <th className="text-center">Qty</th>
//                                 <th className="text-end">Price</th>
//                                 <th className="text-end">Total</th>
//                               </tr>
//                             </thead>
//                             <tbody>
//                               {getOrderItems(selectedOrder).length === 0 ? (
//                                 <tr>
//                                   <td colSpan="4" className="text-center text-muted py-3">No item details available.</td>
//                                 </tr>
//                               ) : (
//                                 getOrderItems(selectedOrder).map((item, index) => (
//                                   <tr key={`${item.productId || index}-${index}`}>
//                                     <td>
//                                       <div className="fw-semibold">{item.productName || "Unknown Product"}</div>
//                                       <div className="small text-muted">Product ID #{item.productId || "---"}</div>
//                                     </td>
//                                     <td className="text-center font-monospace">{item.quantity ?? 0}</td>
//                                     <td className="text-end font-monospace">{formatCurrency(item.price)}</td>
//                                     <td className="text-end font-monospace fw-semibold">{formatCurrency(item.totalPrice)}</td>
//                                   </tr>
//                                 ))
//                               )}
//                             </tbody>
//                           </table>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="col-lg-5">
//                       <div className="border rounded p-3 h-100 bg-light">
//                         <div className="fw-bold mb-3">Delivery Details</div>
//                         <div className="d-grid gap-3">
//                           <div>
//                             <div className="small text-muted text-uppercase">Delivery Status</div>
//                             <div className="fw-semibold">{selectedOrder.deliveryStatus?.status || "Pending"}</div>
//                           </div>
//                           <div>
//                             <div className="small text-muted text-uppercase">Rider</div>
//                             <div className="fw-semibold">{getPersonNameById(getOrderRiderId(selectedOrder), riders, "riderId")}</div>
//                           </div>
//                           <div>
//                             <div className="small text-muted text-uppercase">Assigned At</div>
//                             <div className="fw-semibold">{formatDateTime(selectedOrder.deliveryStatus?.assignedAt)}</div>
//                           </div>
//                           <div>
//                             <div className="small text-muted text-uppercase">Delivered At</div>
//                             <div className="fw-semibold">{formatDateTime(selectedOrder.deliveryStatus?.deliveredAt)}</div>
//                           </div>
//                           <div>
//                             <div className="small text-muted text-uppercase">Delivery Record</div>
//                             <div className="fw-semibold">#{selectedOrder.deliveryStatus?.id || "---"}</div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       <style>{`
//         :root {
//           --erp-primary: #0f4c81;
//           --erp-surface: #ffffff;
//           --erp-border: #cfd8dc;
//           --erp-text-muted: #607d8b;
//         }

//         .erp-text-muted {
//           color: var(--erp-text-muted) !important;
//         }

//         .erp-panel {
//           background: var(--erp-surface);
//           border: 1px solid var(--erp-border);
//           border-radius: 6px;
//           overflow: hidden;
//         }

//         .erp-panel-header {
//           border-bottom: 1px solid var(--erp-border);
//           padding: 12px 16px;
//           font-size: 0.85rem;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//           color: #34495e;
//         }

//         .erp-input {
//           border-radius: 4px;
//           border-color: #b0bec5;
//           font-size: 0.85rem;
//         }

//         .erp-input:focus {
//           border-color: var(--erp-primary);
//           box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
//         }

//         .erp-btn {
//           border-radius: 4px;
//           font-weight: 600;
//           letter-spacing: 0.2px;
//           font-size: 0.8rem;
//         }

//         .erp-status-tag {
//           display: inline-block;
//           padding: 4px 8px;
//           border-radius: 4px;
//           font-size: 0.7rem;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: 0.4px;
//           line-height: 1;
//         }

//         .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
//         .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
//         .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
//         .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
//         .tag-primary { background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
//         .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

//         .erp-kpi-box {
//           background: white;
//           border: 1px solid #e2e8f0;
//           border-left: 4px solid var(--erp-primary);
//           border-radius: 10px;
//           padding: 1rem;
//           box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
//         }
//         .erp-label {
//           font-size: 0.8rem;
//           font-weight: 700;
//           text-transform: uppercase;
//           color: #475569;
//           margin-bottom: 0.35rem;
//         }
//       `}</style>
//     </div>
//   );
// }


import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { smartErpApi } from "../services/smartErpApi";
import { packerApi } from "../services/packerApi";

/** * HELPER FUNCTIONS 
 * Defined at the top level to avoid "no-undef" errors
 */
const formatPerson = (person) => {
  if (!person) return "---";
  return person.riderName || person.username || person.name || person.email || `#${person.id || person.riderId || "---"}`;
};

const formatCurrency = (v) => `₹${Number(v || 0).toFixed(2)}`;

const formatDateTime = (v) => {
  if (!v) return "---";
  const date = new Date(v);
  return Number.isNaN(date.getTime()) ? "---" : date.toLocaleString('en-IN', { hour12: true });
};

const getStageClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "tag-warning";
  if (s === "picking") return "tag-info";
  if (s === "packed") return "tag-success";
  if (s === "outfordelivery") return "tag-primary";
  if (s === "delivered") return "tag-success";
  if (s === "cancelled") return "tag-danger";
  return "tag-secondary";
};

const ACTIVE_ORDER_STATUSES = ["Pending", "Picking", "Packed", "OutForDelivery"];
const PackerStatusLabels = ["Received", "Packing", "Packed", "Moving"];

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [packers, setPackers] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPackerForm, setShowPackerForm] = useState(false);
  const [newPacker, setNewPacker] = useState({
    name: "",
    employeeId: "",
    phone: "",
    email: "",
    department: "Packing",
    isActive: true
  });
  
  // UI States
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [viewingRider, setViewingRider] = useState(null); 

  // Form States
  const [assignForm, setAssignForm] = useState({ orderId: "", packerId: "" });
  const [packerStatusForm, setPackerStatusForm] = useState({ orderId: "", status: "Received" });
  const [riderForm, setRiderForm] = useState({ orderId: "", riderId: "" });
  
  const orderDetailsRef = useRef(null);

  // --- Data Sync ---
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, packersRes, ridRes] = await Promise.allSettled([
        smartErpApi.getCustomerOrders(),
        packerApi.getAllPackers(),
        smartErpApi.getRiders()
      ]);

      if (ordRes.status === "fulfilled") setOrders(ordRes.value.data || []);

      if (packersRes.status === "fulfilled") {
        const loadedPackers = Array.isArray(packersRes.value.data) ? packersRes.value.data : [];
        setPackers(loadedPackers);
      }

      if (ridRes.status === "fulfilled") setRiders(ridRes.value.data || []);
    } catch (e) {
      setMessage("Sync Error. Check API connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 20000); // Auto-refresh every 20s
    return () => clearInterval(t);
  }, [loadData]);

  // --- Memoized Calculations ---
  const activeOrders = useMemo(() => orders.filter(o => ACTIVE_ORDER_STATUSES.includes(o.status)), [orders]);
  const pastOrders = useMemo(() => orders.filter(o => ["Delivered", "Cancelled"].includes(o.status)), [orders]);
  const selectedOrder = useMemo(() => orders.find(o => String(o.id) === String(selectedOrderId)), [orders, selectedOrderId]);

  const riderTotalStats = useMemo(() => {
    const stats = {};
    orders.forEach(o => {
      const rid = o.deliveryStatus?.riderId || o.assignedRiderId;
      if (rid) stats[rid] = (stats[rid] || 0) + 1;
    });
    return stats;
  }, [orders]);

  // --- Logic Handlers ---
  const handleAction = async (type, payload) => {
    try {
      if (type === 'assign') {
        await smartErpApi.updateCustomerOrderStatus(Number(payload.id), { status: "Picking", assignedPackerId: Number(payload.pId) });
      } else if (type === 'status') {
        const statusMap = { Received: "Picking", Packing: "Picking", Packed: "Packed", Moving: "OutForDelivery" };
        await smartErpApi.updateCustomerOrderStatus(Number(payload.id), { status: statusMap[payload.status] });
      } else if (type === 'dispatch') {
        await smartErpApi.assignDelivery({ orderId: Number(payload.id), riderId: Number(payload.rId) });
      }
      setMessage("Operation Successful");
      loadData();
    } catch (err) {
      setMessage("Operation Failed: " + (err.response?.data || "Server Error"));
    }
  };

  const handleCreatePacker = async () => {
    if (!newPacker.name.trim() || !newPacker.employeeId.trim()) {
      setMessage("Packer name and Employee ID are required.");
      return;
    }

    setLoading(true);
    try {
      await packerApi.createPacker(newPacker);
      setMessage("Packer created successfully.");
      setShowPackerForm(false);
      setNewPacker({ name: "", employeeId: "", phone: "", email: "", department: "Packing", isActive: true });
      await loadData();
    } catch (err) {
      setMessage("Create packer failed: " + (err?.response?.data?.message || err?.message || "Server Error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOrder && orderDetailsRef.current) {
      orderDetailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedOrder]);

  return (
    <div className="erp-app-wrapper bg-light min-vh-100 pb-5">
      
      {/* 1. TOP HEADER */}
      <div className="bg-white border-bottom py-3 px-4 sticky-top shadow-sm mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold m-0 text-dark">Order Fulfillment Control</h4>
            <div className="extra-small text-uppercase fw-bold text-muted">End-to-End Tracking & Inventory Traceability</div>
          </div>
          <button className="btn btn-primary erp-btn px-4 shadow-sm" onClick={loadData} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm me-2"/> : "Refresh Board"}
          </button>
        </div>
      </div>

      <div className="container-fluid px-4">
        
        {/* 2. KPI METRICS */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="erp-kpi-box border-start-blue">
              <label className="erp-label">Live Queue</label>
              <div className="h3 fw-bold">{activeOrders.length}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box border-start-orange">
              <label className="erp-label">In Packing</label>
              <div className="h3 fw-bold">{orders.filter(o=>o.status==="Picking").length}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box border-start-green">
              <label className="erp-label">Out for Delivery</label>
              <div className="h3 fw-bold">{orders.filter(o=>o.status==="OutForDelivery").length}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box border-start-purple">
              <label className="erp-label">Rider Fleet</label>
              <div className="h3 fw-bold">{riders.length}</div>
            </div>
          </div>
        </div>

        {message && <div className="alert alert-info py-2 small mb-4">{message}</div>}

        <div className="row g-4">
          {/* 3. MAIN WORK AREA */}
          <div className="col-xl-8">
            <div className="erp-panel shadow-sm mb-4">
              <div className="erp-panel-header bg-white fw-bold">Active Customer Requests</div>
              <div className="table-responsive bg-white" style={{maxHeight: '400px'}}>
                <table className="table erp-table align-middle m-0 table-hover">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Process Stage</th>
                      <th className="text-end">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrders.map(o => (
                      <tr 
                        key={o.id} 
                        onClick={() => setSelectedOrderId(String(o.id))} 
                        className={selectedOrderId === String(o.id) ? "table-primary cursor-pointer" : "cursor-pointer"}
                      >
                        <td className="font-monospace fw-bold">{o.orderNumber}</td>
                        <td className="small">{o.customerName}</td>
                        <td><span className={`erp-status-tag ${getStageClass(o.status)}`}>{o.status}</span></td>
                        <td className="text-end font-monospace">{formatCurrency(o.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. DETAILED ORDER VIEW (TIMELINE & INVENTORY) */}
            {selectedOrder && (
              <div className="erp-panel shadow-sm border-primary" ref={orderDetailsRef}>
                <div className="erp-panel-header bg-dark text-white d-flex justify-content-between align-items-center">
                  <span className="fw-bold">ORDER TRACEABILITY: {selectedOrder.orderNumber}</span>
                  <button className="btn btn-sm btn-outline-light" onClick={() => setSelectedOrderId("")}>Close</button>
                </div>
                <div className="card-body bg-white p-4">
                  
                  {/* FULFILLMENT TIMELINE */}
                  <div className="mb-4">
                    <label className="erp-label text-primary border-bottom pb-1 mb-3 w-100">End-to-End Processing Timeline</label>
                    <div className="d-flex justify-content-between position-relative timeline-container">
                      <div className="text-center">
                        <div className="timeline-dot bg-success"></div>
                        <div className="extra-small fw-bold mt-2">PLACED</div>
                        <div className="extra-small text-muted">{formatDateTime(selectedOrder.createdAt)}</div>
                      </div>
                      <div className="text-center">
                        <div className={`timeline-dot ${selectedOrder.assignedAt || selectedOrder.status !== 'Pending' ? 'bg-success' : 'bg-secondary'}`}></div>
                        <div className="extra-small fw-bold mt-2">RECEIVED</div>
                        <div className="extra-small text-muted">{formatDateTime(selectedOrder.assignedAt)}</div>
                      </div>
                      <div className="text-center">
                        <div className={`timeline-dot ${['Packed', 'OutForDelivery', 'Delivered'].includes(selectedOrder.status) ? 'bg-success' : 'bg-secondary'}`}></div>
                        <div className="extra-small fw-bold mt-2">PACKED</div>
                        <div className="extra-small text-muted">{formatDateTime(selectedOrder.packedAt)}</div>
                      </div>
                      <div className="text-center">
                        <div className={`timeline-dot ${selectedOrder.status === 'Delivered' ? 'bg-success' : 'bg-secondary'}`}></div>
                        <div className="extra-small fw-bold mt-2">DELIVERED</div>
                        <div className="extra-small text-muted">{formatDateTime(selectedOrder.deliveryStatus?.deliveredAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* ITEM BREAKDOWN */}
                  <div className="mb-4">
                    <label className="erp-label text-primary border-bottom pb-1 mb-3 w-100">Item & Inventory Mapping</label>
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm small">
                        <thead className="table-light">
                          <tr>
                            <th>Product Name</th>
                            <th>Warehouse</th>
                            <th>Lot #</th>
                            <th>Serial Number</th>
                            <th className="text-center">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedOrder.items || []).map((item, i) => (
                            <tr key={i}>
                              <td className="fw-bold">{item.productName}</td>
                              <td className="text-primary fw-semibold">{item.warehouseName || "Primary Whse"}</td>
                              <td><span className="badge bg-light text-dark border">{item.lotNumber || "No Lot"}</span></td>
                              <td>
                                {item.serialNumbers && item.serialNumbers.length > 0 ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {item.serialNumbers.slice(0, 3).map((sn, idx) => (
                                      <code key={idx} className="text-danger fw-bold badge bg-light text-danger border">
                                        {sn}
                                      </code>
                                    ))}
                                    {item.serialNumbers.length > 3 && (
                                      <span className="badge bg-secondary">+{item.serialNumbers.length - 3}</span>
                                    )}
                                  </div>
                                ) : (
                                  <code className="text-muted fw-bold">---</code>
                                )}
                              </td>
                              <td className="text-center">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* LOGISTICS STAFF */}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 border rounded bg-light">
                        <label className="erp-label">Assigned Packer</label>
                        <div className="fw-bold">{formatPerson(packers.find(p => p.id === selectedOrder.assignedPackerId))}</div>
                        <div className="extra-small text-muted">Worker ID: {selectedOrder.assignedPackerId || "N/A"}</div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="p-3 border rounded bg-light d-flex justify-content-between align-items-center">
                        <div>
                          <label className="erp-label">Assigned Rider</label>
                          <div className="fw-bold">{formatPerson(riders.find(r => r.riderId === selectedOrder.deliveryStatus?.riderId))}</div>
                          <div className="extra-small text-muted">Dispatched: {formatDateTime(selectedOrder.deliveryStatus?.assignedAt)}</div>
                        </div>
                        {selectedOrder.deliveryStatus?.riderId && (
                           <button className="btn btn-sm btn-dark" onClick={() => setViewingRider(riders.find(r => r.riderId === selectedOrder.deliveryStatus.riderId))}>
                             Rider Profile
                           </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. OPERATIONS HUB (SIDEBAR) */}
          <div className="col-xl-4">
            <div className="erp-panel p-4 bg-white shadow-sm mb-4">
              <h6 className="fw-bold border-bottom pb-2 mb-3">Operations Dispatch</h6>
              
              {/* Create New Packer */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="erp-label mb-0">Packer Management</label>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => setShowPackerForm(!showPackerForm)}>
                    {showPackerForm ? "Hide" : "Create New Packer"}
                  </button>
                </div>
                {showPackerForm && (
                  <div className="p-2 border rounded bg-light">
                    <div className="mb-2">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Packer Name"
                        value={newPacker.name}
                        onChange={(e) => setNewPacker(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Employee ID"
                        value={newPacker.employeeId}
                        onChange={(e) => setNewPacker(prev => ({ ...prev, employeeId: e.target.value }))}
                      />
                    </div>
                    <div className="mb-2 row g-2">
                      <div className="col-6">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Phone"
                          value={newPacker.phone}
                          onChange={(e) => setNewPacker(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="col-6">
                        <input
                          className="form-control form-control-sm"
                          placeholder="Email"
                          value={newPacker.email}
                          onChange={(e) => setNewPacker(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <select
                        className="form-select form-select-sm"
                        value={newPacker.department}
                        onChange={(e) => setNewPacker(prev => ({ ...prev, department: e.target.value }))}
                      >
                        <option value="Packing">Packing</option>
                        <option value="Shipping">Shipping</option>
                        <option value="Quality Check">Quality Check</option>
                        <option value="Warehouse">Warehouse</option>
                      </select>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={newPacker.isActive}
                        id="packerIsActive"
                        onChange={(e) => setNewPacker(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="packerIsActive">Active</label>
                    </div>
                    <button className="btn btn-sm btn-success w-100" onClick={handleCreatePacker} disabled={loading}>
                      {loading ? "Saving..." : "Save Packer"}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Start Packing */}
              <div className="mb-4">
                <label className="erp-label">Step 1: Start Packing</label>
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm" value={assignForm.orderId} onChange={e => setAssignForm({...assignForm, orderId: e.target.value})}>
                    <option value="">Select Order</option>
                    {orders.filter(o=>o.status==="Pending").map(o=><option key={o.id} value={o.id}>{o.orderNumber}</option>)}
                  </select>
                  <select className="form-select form-select-sm" value={assignForm.packerId} onChange={e => setAssignForm({...assignForm, packerId: e.target.value})}>
                    <option value="">Select Packer</option>
                    {packers.map(p=><option key={p.id} value={p.id}>{p.name || p.username || p.employeeId || "Packer"}</option>)}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={() => handleAction('assign', {id: assignForm.orderId, pId: assignForm.packerId})}>Assign</button>
                </div>
              </div>

              {/* Mark Packed */}
              <div className="mb-4">
                <label className="erp-label">Step 2: Complete Packing</label>
                <div className="d-flex gap-2">
                  <select className="form-select form-select-sm" value={packerStatusForm.orderId} onChange={e => setPackerStatusForm({...packerStatusForm, orderId: e.target.value})}>
                    <option value="">Select Order</option>
                    {orders.filter(o=>o.status==="Picking").map(o=><option key={o.id} value={o.id}>{o.orderNumber}</option>)}
                  </select>
                  <button className="btn btn-sm btn-success w-100" onClick={() => handleAction('status', {id: packerStatusForm.orderId, status: 'Packed'})}>Mark Packed</button>
                </div>
              </div>

              {/* Rider Dispatch */}
              <div>
                <label className="erp-label">Step 3: Rider Dispatch</label>
                <div className="d-flex gap-2 mb-2">
                  <select className="form-select form-select-sm" value={riderForm.orderId} onChange={e => setRiderForm({...riderForm, orderId: e.target.value})}>
                    <option value="">Select Order</option>
                    {orders.filter(o=>o.status==="Packed").map(o=><option key={o.id} value={o.id}>{o.orderNumber}</option>)}
                  </select>
                  <select className="form-select form-select-sm" value={riderForm.riderId} onChange={e => setRiderForm({...riderForm, riderId: e.target.value})}>
                    <option value="">Select Rider</option>
                    {riders.map(r=><option key={r.riderId} value={r.riderId}>{r.riderName}</option>)}
                  </select>
                </div>
                <button className="btn btn-sm btn-warning w-100 fw-bold" onClick={() => handleAction('dispatch', {id: riderForm.orderId, rId: riderForm.riderId})}>DISPATCH RIDER</button>
              </div>
            </div>
          </div>

          {/* 6. TRANSACTION ARCHIVE (PAST ORDERS) */}
          <div className="col-12">
            <div className="erp-panel shadow-sm">
              <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
                <span className="fw-bold">Completed Transactions Archive ({pastOrders.length})</span>
                <button className="btn btn-sm btn-outline-secondary px-3 fw-bold" onClick={() => setShowPastOrders(!showPastOrders)}>
                  {showPastOrders ? "Collapse View" : "View History"}
                </button>
              </div>
              {showPastOrders && (
                <div className="table-responsive bg-white" style={{maxHeight: '400px'}}>
                   <table className="table erp-table align-middle m-0 table-hover small">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Order #</th>
                        <th>Customer</th>
                        <th>Delivered On</th>
                        <th>Process Time</th>
                        <th className="text-end">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastOrders.map(o => (
                        <tr key={o.id} onClick={() => setSelectedOrderId(String(o.id))} className="cursor-pointer">
                          <td className="fw-bold font-monospace">{o.orderNumber}</td>
                          <td>{o.customerName}</td>
                          <td>{formatDateTime(o.deliveryStatus?.deliveredAt)}</td>
                          <td>{o.status}</td>
                          <td className="text-end fw-bold font-monospace">{formatCurrency(o.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                   </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIDER STATS MODAL */}
      {viewingRider && (
        <div className="rider-modal-overlay">
          <div className="rider-modal-card p-4 shadow-lg border">
            <h5 className="fw-bold border-bottom pb-2">Rider Performance Card</h5>
            <div className="mt-3">
              <p className="mb-1"><strong>Name:</strong> {viewingRider.riderName}</p>
              <p className="mb-1"><strong>Email:</strong> {viewingRider.email}</p>
              <p className="mb-1"><strong>Device ID:</strong> {viewingRider.riderId}</p>
              <hr/>
              <div className="text-center p-3 bg-light rounded">
                <div className="erp-label">Lifetime Successful Orders</div>
                <div className="h2 fw-bold text-primary mb-0">{riderTotalStats[viewingRider.riderId] || 0}</div>
              </div>
            </div>
            <button className="btn btn-dark w-100 mt-4 fw-bold" onClick={() => setViewingRider(null)}>Close Profile</button>
          </div>
        </div>
      )}

      {/* CSS STYLES */}
      <style>{`
        .extra-small { font-size: 0.65rem; }
        .cursor-pointer { cursor: pointer; }
        .erp-kpi-box { background: white; padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0; border-left-width: 5px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .border-start-blue { border-left-color: #0d6efd; }
        .border-start-orange { border-left-color: #fd7e14; }
        .border-start-green { border-left-color: #198754; }
        .border-start-purple { border-left-color: #6f42c1; }
        .erp-panel { border-radius: 8px; border: 1px solid #cfd8dc; overflow: hidden; }
        .erp-panel-header { padding: 10px 16px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
        .erp-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 2px; display: block; }
        .erp-status-tag { padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; display: inline-block; }
        .tag-success { background: #dcfce7; color: #166534; }
        .tag-warning { background: #fff9db; color: #854d0e; }
        .tag-info { background: #e0f2fe; color: #075985; }
        .tag-primary { background: #f3f0ff; color: #6f42c1; }
        .timeline-container::before { content: ''; position: absolute; top: 10px; left: 10%; right: 10%; height: 2px; background: #e2e8f0; z-index: 1; }
        .timeline-dot { width: 20px; height: 20px; border-radius: 50%; margin: 0 auto; position: relative; z-index: 2; border: 3px solid white; box-shadow: 0 0 0 1px #cbd5e1; }
        .rider-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
        .rider-modal-card { background: white; width: 100%; max-width: 380px; border-radius: 12px; }
      `}</style>
    </div>
  );
}