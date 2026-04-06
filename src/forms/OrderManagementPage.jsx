// import React, { useState, useEffect, useCallback } from "react";
// import PackerManagement from "../components/PackerManagement";
// import { smartErpApi } from "../services/smartErpApi";
// import { packerApi } from "../services/packerApi";
// import "./Operations.css";

// const ORDER_STATUSES = ["Pending", "Picking", "Packed", "OutForDelivery", "Delivered", "Cancelled"];

// export default function OrderManagementPage() {
//   const [orders, setOrders] = useState([]);
//   const [packers, setPackers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [activeTab, setActiveTab] = useState("pending");
//   const [selectedOrder, setSelectedOrder] = useState(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
  
//   const [assignPackerForm, setAssignPackerForm] = useState({
//     orderId: "",
//     packerId: ""
//   });

//   // Load orders and packers
//   const loadData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [ordersRes, packersRes] = await Promise.allSettled([
//         smartErpApi.getCustomerOrders(),
//         packerApi.getAllPackers()
//       ]);

//       if (ordersRes.status === "fulfilled") {
//         const ordersList = Array.isArray(ordersRes.value.data) ? ordersRes.value.data : [];
//         setOrders(ordersList);
//       } else {
//         setMessage("Failed to load orders");
//       }

//       if (packersRes.status === "fulfilled") {
//         const packersList = Array.isArray(packersRes.value.data) ? packersRes.value.data : [];
//         setPackers(packersList);
//       }
//     } catch (error) {
//       setMessage("Error loading data: " + (error?.message || "Unknown error"));
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//     const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
//     return () => clearInterval(interval);
//   }, [loadData]);

//   // Filter orders by status
//   const getOrdersByStatus = (status) => {
//     return orders.filter(order => order.status === status);
//   };

//   // Assign packer to order
//   const handleAssignPacker = async (e) => {
//     e.preventDefault();

//     if (!assignPackerForm.orderId || !assignPackerForm.packerId) {
//       setMessage("Please select both an order and a packer");
//       return;
//     }

//     setLoading(true);
//     try {
//       const orderId = Number(assignPackerForm.orderId);
//       const packerId = Number(assignPackerForm.packerId);

//       // Update order with packer assignment
//       await smartErpApi.updateCustomerOrderStatus(orderId, {
//         assignedPackerId: packerId,
//         status: "Picking"
//       });

//       setMessage("✓ Packer assigned to order");
//       setAssignPackerForm({ orderId: "", packerId: "" });
//       await loadData();
//     } catch (error) {
//       setMessage("Error: " + (error?.response?.data?.message || error.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Update order status
//   const handleUpdateOrderStatus = async (orderId, newStatus) => {
//     setLoading(true);
//     try {
//       await smartErpApi.updateCustomerOrderStatus(Number(orderId), {
//         status: newStatus
//       });
//       setMessage(`✓ Order status updated to ${newStatus}`);
//       await loadData();
//     } catch (error) {
//       setMessage("Error: " + (error?.response?.data?.message || error.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const pendingOrders = getOrdersByStatus("Pending");
//   const pickingOrders = getOrdersByStatus("Picking");
//   const packedOrders = getOrdersByStatus("Packed");
//   const deliveryOrders = getOrdersByStatus("OutForDelivery");
//   const deliveredOrders = getOrdersByStatus("Delivered");

//   return (
//     <div className="order-management-page">
//       <div className="page-header">
//         <h1>📋 Order Management</h1>
//         <p className="subtitle">Manage customer orders and assign packers</p>
//       </div>

//       {message && (
//         <div className={`alert ${message.includes("Error") || message.includes("Failed") ? "alert-danger" : "alert-success"}`}>
//           {message}
//         </div>
//       )}

//       {/* Packer Management Section */}
//       <section className="section-card">
//         <PackerManagement 
//           onPackersLoaded={(p) => setPackers(p)}
//           onAssignPacker={(packerId, orderId) => {
//             setAssignPackerForm({ orderId: orderId.toString(), packerId: packerId.toString() });
//           }}
//         />
//       </section>

//       {/* Assign Packer to Order */}
//       <section className="section-card">
//         <div className="section-header">
//           <h3>🔗 Assign Packer to Order</h3>
//         </div>

//         <form onSubmit={handleAssignPacker} className="assignment-form">
//           <div className="form-row">
//             <div className="form-group">
//               <label>Select Order *</label>
//               <select
//                 value={assignPackerForm.orderId}
//                 onChange={(e) => setAssignPackerForm(prev => ({ ...prev, orderId: e.target.value }))}
//                 required
//               >
//                 <option value="">-- Select an Order --</option>
//                 {pendingOrders.map(order => (
//                   <option key={order.id} value={order.id}>
//                     Order #{order.id} - {order.orderNumber} (₹{order.totalAmount})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Select Packer *</label>
//               <select
//                 value={assignPackerForm.packerId}
//                 onChange={(e) => setAssignPackerForm(prev => ({ ...prev, packerId: e.target.value }))}
//                 required
//               >
//                 <option value="">-- Select a Packer --</option>
//                 {packers.filter(p => p.isActive).map(packer => (
//                   <option key={packer.id} value={packer.id}>
//                     {packer.name} ({packer.employeeId}) - {packer.assignedOrders || 0} orders
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="form-group">
//               <button type="submit" className="btn btn-primary" disabled={loading}>
//                 {loading ? "Assigning..." : "Assign Packer"}
//               </button>
//             </div>
//           </div>
//         </form>
//       </section>

//       {/* Order Status Tabs */}
//       <section className="section-card">
//         <div className="section-header">
//           <h3>📦 Orders by Status</h3>
//         </div>

//         <div className="tabs">
//           <button 
//             className={`tab-button ${activeTab === "pending" ? "active" : ""}`}
//             onClick={() => setActiveTab("pending")}
//           >
//             Pending ({pendingOrders.length})
//           </button>
//           <button 
//             className={`tab-button ${activeTab === "picking" ? "active" : ""}`}
//             onClick={() => setActiveTab("picking")}
//           >
//             Packing ({pickingOrders.length})
//           </button>
//           <button 
//             className={`tab-button ${activeTab === "packed" ? "active" : ""}`}
//             onClick={() => setActiveTab("packed")}
//           >
//             Packed ({packedOrders.length})
//           </button>
//           <button 
//             className={`tab-button ${activeTab === "delivery" ? "active" : ""}`}
//             onClick={() => setActiveTab("delivery")}
//           >
//             Out for Delivery ({deliveryOrders.length})
//           </button>
//           <button 
//             className={`tab-button ${activeTab === "delivered" ? "active" : ""}`}
//             onClick={() => setActiveTab("delivered")}
//           >
//             Delivered ({deliveredOrders.length})
//           </button>
//         </div>

//         <div className="orders-grid">
//           {activeTab === "pending" && (
//             <OrdersList
//               orders={pendingOrders}
//               packers={packers}
//               onStatusChange={handleUpdateOrderStatus}
//               onViewDetails={(order) => {
//                 setSelectedOrder(order);
//                 setShowDetailsModal(true);
//               }}
//               loading={loading}
//             />
//           )}
//           {activeTab === "picking" && (
//             <OrdersList
//               orders={pickingOrders}
//               packers={packers}
//               onStatusChange={handleUpdateOrderStatus}
//               onViewDetails={(order) => {
//                 setSelectedOrder(order);
//                 setShowDetailsModal(true);
//               }}
//               loading={loading}
//             />
//           )}
//           {activeTab === "packed" && (
//             <OrdersList
//               orders={packedOrders}
//               packers={packers}
//               onStatusChange={handleUpdateOrderStatus}
//               onViewDetails={(order) => {
//                 setSelectedOrder(order);
//                 setShowDetailsModal(true);
//               }}
//               loading={loading}
//             />
//           )}
//           {activeTab === "delivery" && (
//             <OrdersList
//               orders={deliveryOrders}
//               packers={packers}
//               onStatusChange={handleUpdateOrderStatus}
//               onViewDetails={(order) => {
//                 setSelectedOrder(order);
//                 setShowDetailsModal(true);
//               }}
//               loading={loading}
//             />
//           )}
//           {activeTab === "delivered" && (
//             <OrdersList
//               orders={deliveredOrders}
//               packers={packers}
//               onStatusChange={handleUpdateOrderStatus}
//               onViewDetails={(order) => {
//                 setSelectedOrder(order);
//                 setShowDetailsModal(true);
//               }}
//               loading={loading}
//             />
//           )}
//         </div>

//         {/* Order Details Modal */}
//         {showDetailsModal && selectedOrder && (
//           <OrderDetailsModal
//             order={selectedOrder}
//             onClose={() => {
//               setShowDetailsModal(false);
//               setSelectedOrder(null);
//             }}
//           />
//         )}
//       </section>

//       {loading && <div className="loading-spinner">Loading...</div>}
//     </div>
//   );
// }

// // Orders List Component
// function OrdersList({ orders, packers, onStatusChange, onViewDetails, loading }) {
//   if (orders.length === 0) {
//     return <div className="empty-state">No orders in this status</div>;
//   }

//   const getPackerName = (packerId) => {
//     const packer = packers.find(p => p.id === packerId);
//     return packer ? packer.name : "Unassigned";
//   };

//   return (
//     <table className="table orders-table">
//       <thead>
//         <tr>
//           <th>Order ID</th>
//           <th>Amount</th>
//           <th>Status</th>
//           <th>Assigned Packer</th>
//           <th>Created</th>
//           <th>Actions</th>
//         </tr>
//       </thead>
//       <tbody>
//         {orders.map(order => (
//           <tr key={order.id} className="order-row">
//             <td>
//               <strong>#{order.id}</strong><br />
//               <small>{order.orderNumber}</small>
//             </td>
//             <td>₹{Number(order.totalAmount || 0).toFixed(2)}</td>
//             <td>
//               <select
//                 className="status-select"
//                 value={order.status}
//                 onChange={(e) => onStatusChange(order.id, e.target.value)}
//                 disabled={loading}
//               >
//                 {ORDER_STATUSES.map(status => (
//                   <option key={status} value={status}>{status}</option>
//                 ))}
//               </select>
//             </td>
//             <td>
//               <span className={`badge ${order.assignedPackerId ? "badge-success" : "badge-secondary"}`}>
//                 {getPackerName(order.assignedPackerId)}
//               </span>
//             </td>
//             <td>
//               <small>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "---"}</small>
//             </td>
//             <td className="actions-cell">
//               <button
//                 className="btn btn-sm btn-info"
//                 onClick={() => onViewDetails(order)}
//                 title="View Item & Inventory Mapping"
//               >
//                 👁️
//               </button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

// // Order Details Modal Component - Shows Item & Inventory Mapping
// function OrderDetailsModal({ order, onClose }) {
//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-header">
//           <h2>📦 Item & Inventory Mapping</h2>
//           <button className="close-btn" onClick={onClose}>✕</button>
//         </div>

//         <div className="modal-body">
//           <div className="order-info">
//             <div className="info-row">
//               <span className="label">Order ID:</span>
//               <span className="value">#{order.id}</span>
//             </div>
//             <div className="info-row">
//               <span className="label">Order Number:</span>
//               <span className="value">{order.orderNumber}</span>
//             </div>
//             <div className="info-row">
//               <span className="label">Customer:</span>
//               <span className="value">{order.customerName}</span>
//             </div>
//             <div className="info-row">
//               <span className="label">Status:</span>
//               <span className={`badge badge-${getStatusColor(order.status)}`}>{order.status}</span>
//             </div>
//           </div>

//           <div className="items-section">
//             <h3>Items with Inventory Mapping</h3>
//             {order.items && order.items.length > 0 ? (
//               <table className="items-mapping-table">
//                 <thead>
//                   <tr>
//                     <th>Product</th>
//                     <th>Qty</th>
//                     <th>Price</th>
//                     <th>Warehouse</th>
//                     <th>Lot Number</th>
//                     <th>Serial Numbers</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {order.items.map((item, idx) => (
//                     <tr key={idx}>
//                       <td>
//                         <div className="product-col">
//                           <strong>{item.productName}</strong>
//                           <small className="text-muted">ID: {item.productId}</small>
//                         </div>
//                       </td>
//                       <td className="number">{item.quantity}</td>
//                       <td className="number">₹{Number(item.price || 0).toFixed(2)}</td>
//                       <td>
//                         <span className="warehouse-badge">
//                           {item.warehouseName || "Not Allocated"}
//                         </span>
//                       </td>
//                       <td>
//                         <span className="lot-badge">
//                           {item.lotNumber || "General"}
//                         </span>
//                       </td>
//                       <td>
//                         {item.serialNumbers && item.serialNumbers.length > 0 ? (
//                           <div className="serial-numbers">
//                             {item.serialNumbers.map((sn, i) => (
//                               <span key={i} className="serial-badge">{sn}</span>
//                             ))}
//                           </div>
//                         ) : (
//                           <span className="text-muted">No serials</span>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : (
//               <p className="empty-state">No items in this order</p>
//             )}
//           </div>

//           <div className="order-total">
//             <strong>Total Amount:</strong>
//             <strong className="amount">₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
//           </div>
//         </div>

//         <div className="modal-footer">
//           <button className="btn btn-secondary" onClick={onClose}>Close</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function getStatusColor(status) {
//   const statusMap = {
//     "Pending": "warning",
//     "Picking": "info",
//     "Packed": "success",
//     "OutForDelivery": "primary",
//     "Delivered": "success",
//     "Cancelled": "danger"
//   };
//   return statusMap[status] || "secondary";
// }
