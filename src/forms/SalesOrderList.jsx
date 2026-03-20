import React, { useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

const STATUS_OPTIONS = [
  "Draft",
  "Confirmed",
  "Processing",
  "Picking",
  "Packed",
  "Shipped",
  "Delivered",
  "Invoiced",
  "Paid",
  "Cancelled",
  "Backorder"
];

export default function SalesOrderList() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: "Confirmed", remarks: "" });
  const [shipmentForm, setShipmentForm] = useState({ carrier: "BlueDart", trackingNumber: "" });
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: "UPI", amount: 0 });
  
  // New state for viewing the invoice document
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      loadOrder(selectedOrderId);
    } else {
      setSelectedOrder(null);
    }
  }, [selectedOrderId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await smartErpApi.getSalesOrders();
      setOrders(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load sales order data.");
    } finally {
      setLoading(false);
    }
  };

  const loadOrder = async (id) => {
    try {
      const res = await smartErpApi.getSalesOrder(id);
      setSelectedOrder(res.data);
      setPaymentForm((prev) => ({
        ...prev,
        amount: Number(res.data?.totalAmount || 0)
      }));
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load order details.");
    }
  };

  const ensureOrder = () => {
    if (!selectedOrderId) {
      setMessage("⚠ Please select an order from the list first.");
      return false;
    }
    if (!selectedOrder) {
      setMessage("⚠ Order details not loaded. Please try again.");
      return false;
    }
    return true;
  };

  const canUpdateStatus = () => {
    if (!selectedOrder) return false;
    const blockedStatuses = ["Cancelled", "Paid", "Delivered"];
    return !blockedStatuses.includes(selectedOrder.status);
  };

  const canCreateShipment = () => {
    if (!selectedOrder) return false;
    return ["Confirmed", "Processing", "Picking", "Packed"].includes(selectedOrder.status);
  };

  const canGenerateInvoice = () => {
    if (!selectedOrder) return false;
    return ["Shipped", "Delivered"].includes(selectedOrder.status) && selectedOrder.paymentStatus !== "Invoiced";
  };

  const canRecordPayment = () => {
    if (!selectedOrder) return false;
    return !["Paid", "Cancelled"].includes(selectedOrder.status);
  };

  const updateStatus = async (e) => {
    e.preventDefault();
    if (!ensureOrder() || !canUpdateStatus()) {
      if (!canUpdateStatus()) setMessage(`⚠ Cannot update status of ${selectedOrder?.status} orders.`);
      return;
    }
    try {
      await smartErpApi.updateSalesOrderStatus(Number(selectedOrderId), statusForm);
      setMessage(`✓ Order status updated to ${statusForm.status}.`);
      setStatusForm({ status: "Confirmed", remarks: "" });
      await loadOrder(selectedOrderId);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || "Status update failed.");
    }
  };

  const assignRobotPicking = async () => {
    if (!ensureOrder()) return;
    if (selectedOrder.status !== "Confirmed" && selectedOrder.status !== "Processing") {
      setMessage("⚠ Picking can only be assigned to Confirmed or Processing orders.");
      return;
    }
    try {
      await smartErpApi.assignPicking(Number(selectedOrderId));
      setMessage("✓ Picking task assigned. Check Automation page for robot lifecycle.");
    } catch (err) {
      setMessage(err?.response?.data || "Assign picking failed.");
    }
  };

  const createShipment = async (e) => {
    e.preventDefault();
    if (!ensureOrder() || !canCreateShipment()) {
      if (!canCreateShipment()) setMessage(`⚠ Shipment can only be created for orders in Confirmed/Processing/Picking/Packed status.`);
      return;
    }
    if (!shipmentForm.carrier?.trim()) {
      setMessage("⚠ Carrier name is required.");
      return;
    }
    try {
      await smartErpApi.createShipment({
        salesOrderId: Number(selectedOrderId),
        carrier: shipmentForm.carrier.trim(),
        trackingNumber: shipmentForm.trackingNumber?.trim() || null
      });
      setMessage("✓ Shipment created successfully.");
      setShipmentForm({ carrier: "BlueDart", trackingNumber: "" });
      await loadOrder(selectedOrderId);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || "Shipment creation failed.");
    }
  };

  const generateInvoice = async () => {
    if (!ensureOrder() || !canGenerateInvoice()) {
      if (!canGenerateInvoice())
        setMessage("⚠ Invoice can only be generated for Shipped/Delivered orders that haven't been invoiced yet.");
      return;
    }
    try {
      await smartErpApi.generateInvoice({ salesOrderId: Number(selectedOrderId) });
      setMessage("✓ Invoice generated successfully.");
      await loadOrder(selectedOrderId);
      await loadData();
      
      // Automatically open the invoice view upon successful generation
      setShowInvoiceModal(true);
    } catch (err) {
      setMessage(err?.response?.data || "Invoice generation failed.");
    }
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    if (!ensureOrder() || !canRecordPayment()) {
      if (!canRecordPayment()) setMessage(`⚠ Payment cannot be recorded for ${selectedOrder?.status} orders.`);
      return;
    }
    if (paymentForm.amount <= 0) {
      setMessage("⚠ Payment amount must be greater than zero.");
      return;
    }
    if (paymentForm.amount > selectedOrder.totalAmount) {
      setMessage("⚠ Payment amount cannot exceed order total.");
      return;
    }
    try {
      await smartErpApi.recordSalesPayment({
        salesOrderId: Number(selectedOrderId),
        paymentMethod: paymentForm.paymentMethod,
        amount: Number(paymentForm.amount)
      });
      setMessage(`✓ Payment of ${paymentForm.amount} recorded successfully.`);
      setPaymentForm({ paymentMethod: "UPI", amount: 0 });
      await loadOrder(selectedOrderId);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || "Payment record failed.");
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (['delivered', 'paid', 'completed', 'invoiced'].includes(s)) return 'tag-success';
    if (['cancelled'].includes(s)) return 'tag-danger';
    if (['picking', 'packed', 'processing', 'shipped'].includes(s)) return 'tag-info';
    return 'tag-warning';
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-4 pt-3">
      <div className="container-fluid px-4">
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Sales Order Management</h4>
            <span className="erp-text-muted small text-uppercase">Fulfillment & Billing Ledger</span>
          </div>
          <button 
            className="btn btn-primary erp-btn d-flex align-items-center gap-2" 
            onClick={loadData} 
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            {loading ? "Syncing..." : "Refresh Ledger"}
          </button>
        </div>

        {message && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: message.includes("✓") ? '#f0fdf4' : message.includes("⚠") ? '#fffbeb' : '#fef2f2',
            color: message.includes("✓") ? '#166534' : message.includes("⚠") ? '#92400e' : '#991b1b',
            border: `1px solid ${message.includes("✓") ? '#bbf7d0' : message.includes("⚠") ? '#fde68a' : '#fecaca'}`
          }}>
            <span className="fw-semibold">{message}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage("")}></button>
          </div>
        )}

        <div className="row g-4">
          
          {/* LEFT COLUMN: ORDER LIST */}
          <div className="col-lg-5 col-xl-4">
            <div className="erp-panel d-flex flex-column shadow-sm" style={{ height: "calc(100vh - 160px)" }}>
              <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
                <span className="fw-bold">Active Orders</span>
                <span className="badge bg-secondary">{orders.length} Records</span>
              </div>
              
              <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
                <table className="table erp-table table-hover mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Order Info</th>
                      <th className="text-center">Status</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan="3" className="text-center py-4 text-muted">No orders found.</td></tr>
                    ) : (
                      orders.map((o) => (
                        <tr 
                          key={o.id} 
                          onClick={() => setSelectedOrderId(String(o.id))}
                          className={selectedOrderId === String(o.id) ? "table-primary" : ""}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <div className="fw-bold text-dark font-monospace">{o.orderNumber}</div>
                            <div className="text-truncate text-muted" style={{ maxWidth: '150px', fontSize: '0.75rem' }}>{o.customerName}</div>
                          </td>
                          <td className="text-center">
                            <span className={`erp-status-tag ${getStatusColor(o.status)} d-block mb-1`}>{o.status}</span>
                            <span className={`erp-status-tag ${getStatusColor(o.paymentStatus)} d-block`}>{o.paymentStatus}</span>
                          </td>
                          <td className="text-end fw-semibold font-monospace">{Number(o.totalAmount).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: WORKFLOW ACTIONS & DETAILS */}
          <div className="col-lg-7 col-xl-8">
            <div className="erp-panel shadow-sm h-100 d-flex flex-column">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">Order Fulfillment Operations</span>
              </div>
              
              <div className="p-4 flex-grow-1 overflow-auto bg-white">
                {!selectedOrder ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted opacity-50">
                    <div style={{ fontSize: '3rem' }}>📋</div>
                    <p className="mt-3 fw-bold text-uppercase" style={{ letterSpacing: '1px' }}>Select an order to manage workflow</p>
                  </div>
                ) : (
                  <>
                    {/* Header Info */}
                    <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
                      <div>
                        <h4 className="fw-bold m-0 font-monospace text-dark">{selectedOrder.orderNumber}</h4>
                        <div className="text-muted mt-1">{selectedOrder.customerName}</div>
                      </div>
                      <div className="text-end">
                        <div className="fs-3 fw-bold font-monospace text-success">{Number(selectedOrder.totalAmount).toFixed(2)}</div>
                        <div className="d-flex gap-2 justify-content-end mt-1">
                           <span className={`erp-status-tag ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span>
                           <span className={`erp-status-tag ${getStatusColor(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Grid */}
                    <div className="row g-3 mb-4">
                      
                      {/* Status Control */}
                      <div className="col-md-6">
                        <div className="p-3 border rounded bg-light h-100">
                          <h6 className="erp-section-title">Logistics Pipeline</h6>
                          <form onSubmit={updateStatus}>
                            <div className="mb-2">
                              <select className="form-select erp-input" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} disabled={!canUpdateStatus()}>
                                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                              </select>
                            </div>
                            <div className="mb-2">
                              <input className="form-control erp-input" placeholder="Transition remarks (optional)" value={statusForm.remarks} onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })} disabled={!canUpdateStatus()} />
                            </div>
                            <button className="btn btn-primary erp-btn w-100" type="submit" disabled={!canUpdateStatus()}>Commit Status Change</button>
                          </form>
                          
                          <hr className="my-3"/>
                          
                          <button className="btn btn-warning erp-btn w-100 d-flex justify-content-center align-items-center gap-2" onClick={assignRobotPicking} disabled={!["Confirmed", "Processing"].includes(selectedOrder.status)}>
                            🤖 Assign Auto-Picking (Robot)
                          </button>
                        </div>
                      </div>

                      {/* Shipment & Invoice */}
                      <div className="col-md-6">
                        <div className="p-3 border rounded bg-light h-100 d-flex flex-column">
                          <h6 className="erp-section-title">Fulfillment & Billing</h6>
                          
                          <form onSubmit={createShipment} className="mb-3">
                            <div className="row g-2 mb-2">
                              <div className="col-6">
                                <input className="form-control erp-input" placeholder="Carrier Name" value={shipmentForm.carrier} onChange={(e) => setShipmentForm({ ...shipmentForm, carrier: e.target.value })} disabled={!canCreateShipment()} />
                              </div>
                              <div className="col-6">
                                <input className="form-control erp-input" placeholder="Tracking #" value={shipmentForm.trackingNumber} onChange={(e) => setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })} disabled={!canCreateShipment()} />
                              </div>
                            </div>
                            <button className="btn btn-success erp-btn w-100" type="submit" disabled={!canCreateShipment()}>Generate Shipment</button>
                          </form>
                          
                          <div className="mt-auto pt-3 border-top">
                            {/* Toggle between Generating and Viewing Invoice based on status */}
                            {canGenerateInvoice() ? (
                              <button className="btn btn-dark erp-btn w-100" onClick={generateInvoice}>
                                📄 Generate Final Invoice
                              </button>
                            ) : (
                              <button 
                                className="btn btn-outline-dark bg-white erp-btn w-100 fw-bold" 
                                onClick={() => setShowInvoiceModal(true)} 
                                disabled={!["Invoiced", "Paid"].includes(selectedOrder.paymentStatus)}
                              >
                                👁 View Invoice Document
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment Control */}
                      <div className="col-12">
                        <div className="p-3 border rounded bg-light">
                          <h6 className="erp-section-title">Payment Reconciliation</h6>
                          <form className="row g-2 align-items-center" onSubmit={recordPayment}>
                            <div className="col-md-4">
                              <select className="form-select erp-input" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} disabled={!canRecordPayment()}>
                                <option>UPI</option><option>BankTransfer</option><option>CreditCard</option><option>Cash</option>
                              </select>
                            </div>
                            <div className="col-md-4">
                              <input type="number" step="0.01" className="form-control erp-input font-monospace text-end" placeholder="Amount" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} max={selectedOrder?.totalAmount} disabled={!canRecordPayment()} />
                            </div>
                            <div className="col-md-4">
                              <button className="btn btn-primary erp-btn w-100" type="submit" disabled={!canRecordPayment()}>Record Remittance</button>
                            </div>
                          </form>
                        </div>
                      </div>

                    </div>

                    {/* Details Tables */}
                    <div className="row g-4 mt-2">
                      <div className="col-md-7">
                        <h6 className="erp-section-title">Line Items</h6>
                        <div className="border rounded overflow-hidden">
                          <table className="table table-sm erp-table mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Item Code</th>
                                <th>Location</th>
                                <th className="text-end">Qty</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(selectedOrder.items || []).map((x) => (
                                <tr key={x.id}>
                                  <td className="fw-bold font-monospace">{x.itemCode || x.itemId}</td>
                                  <td className="text-muted">{x.warehouseName || x.warehouseId}</td>
                                  <td className="text-end font-monospace">{x.quantity}</td>
                                  <td className="text-end font-monospace">{Number(x.unitPrice).toFixed(2)}</td>
                                  <td className="text-end font-monospace fw-semibold">{Number(x.lineTotal).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <div className="col-md-5">
                        <h6 className="erp-section-title">Audit Trail</h6>
                        <div className="border rounded overflow-hidden">
                          <table className="table table-sm erp-table mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Date/Time</th>
                                <th>Status</th>
                                <th>Note</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(selectedOrder.statusHistory || []).map((x) => (
                                <tr key={x.id}>
                                  <td className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(x.createdAt).toLocaleString()}</td>
                                  <td><span className={`erp-status-tag ${getStatusColor(x.status)}`}>{x.status}</span></td>
                                  <td className="text-truncate" style={{ maxWidth: '100px', fontSize: '0.7rem' }} title={x.remarks}>{x.remarks || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INVOICE VIEW MODAL */}
      {showInvoiceModal && selectedOrder && (
        <div className="erp-modal-overlay" style={{ zIndex: 1060 }}>
          <div className="erp-dialog erp-dialog-lg" style={{ maxWidth: '800px' }}>
            <div className="erp-dialog-header d-print-none">
              <h6 className="m-0 fw-bold">Commercial Invoice Document</h6>
              <button className="btn-close btn-close-white" onClick={() => setShowInvoiceModal(false)}></button>
            </div>
            
            <div className="erp-dialog-body bg-white p-5 text-dark" id="printable-invoice-area">
              {/* Header */}
              <div className="d-flex justify-content-between mb-5 border-bottom pb-4">
                <div>
                  <h3 className="fw-bold mb-1" style={{ color: 'var(--erp-primary)' }}>NODE.STOCK</h3>
                  <div className="small text-muted">
                    Enterprise Order Management<br/>
                    100 System Way, Cloud City
                  </div>
                </div>
                <div className="text-end">
                  <h2 className="fw-light mb-1" style={{ letterSpacing: '2px', color: '#64748b' }}>INVOICE</h2>
                  <div className="fw-bold font-monospace fs-5">INV-{selectedOrder.orderNumber}</div>
                  <div className="small text-muted mt-1">Date Issued: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
              
              {/* Addresses */}
              <div className="row mb-5">
                <div className="col-sm-6">
                  <h6 className="fw-bold text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Bill To:</h6>
                  <div className="fs-6 fw-bold text-dark">{selectedOrder.customerName}</div>
                  <div className="small text-muted mt-1">Customer Ref: {selectedOrder.customerId || 'CUST-001'}</div>
                </div>
                <div className="col-sm-6 text-end">
                  <h6 className="fw-bold text-uppercase text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Order Reference:</h6>
                  <div className="fs-6 fw-bold font-monospace text-dark">{selectedOrder.orderNumber}</div>
                </div>
              </div>

              {/* Items Table */}
              <table className="table table-sm border-bottom mb-4">
                <thead className="table-light">
                  <tr>
                    <th className="text-uppercase text-muted py-2" style={{ fontSize: '0.7rem' }}>Description / Item Code</th>
                    <th className="text-center text-uppercase text-muted py-2" style={{ fontSize: '0.7rem' }}>Qty</th>
                    <th className="text-end text-uppercase text-muted py-2" style={{ fontSize: '0.7rem' }}>Unit Price</th>
                    <th className="text-end text-uppercase text-muted py-2" style={{ fontSize: '0.7rem' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map(item => (
                    <tr key={item.id}>
                      <td className="fw-bold py-2">{item.itemCode || item.itemId}</td>
                      <td className="text-center font-monospace py-2">{item.quantity}</td>
                      <td className="text-end font-monospace py-2">{Number(item.unitPrice).toFixed(2)}</td>
                      <td className="text-end font-monospace fw-semibold py-2">{Number(item.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="row justify-content-end">
                <div className="col-sm-5">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted fw-bold small text-uppercase">Subtotal:</span>
                    <span className="font-monospace">{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted fw-bold small text-uppercase">Tax (0%):</span>
                    <span className="font-monospace">0.00</span>
                  </div>
                  <div className="d-flex justify-content-between border-top pt-2 mt-2">
                    <span className="fw-bold fs-5">Total:</span>
                    <span className="font-monospace fw-bold fs-5">{Number(selectedOrder.totalAmount).toFixed(2)}</span>
                  </div>
                  
                  {selectedOrder.paymentStatus === "Paid" && (
                    <div className="mt-3 text-end">
                       <span className="badge bg-success border border-success text-white py-2 px-3 fw-bold fs-6 shadow-sm" style={{transform: 'rotate(-5deg)'}}>
                          PAID IN FULL
                       </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-light border-top d-flex justify-content-end gap-2 d-print-none">
              <button className="btn btn-light border erp-btn" onClick={() => setShowInvoiceModal(false)}>Close</button>
              <button className="btn btn-primary erp-btn" onClick={() => window.print()}>🖨 Print Invoice</button>
            </div>
          </div>
        </div>
      )}

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

        /* Panels */
        .erp-panel {
          background: var(--erp-surface);
          border: 1px solid var(--erp-border);
          border-radius: 4px;
          overflow: hidden;
        }
        .erp-panel-header {
          border-bottom: 1px solid var(--erp-border);
          padding: 10px 16px;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #34495e;
        }

        /* Inputs & Buttons */
        .erp-input {
          border-radius: 3px;
          border-color: #b0bec5;
          font-size: 0.85rem;
          padding: 6px 10px;
        }
        .erp-input:focus {
          border-color: var(--erp-primary);
          box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
        }
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.8rem;
          padding: 6px 14px;
        }
        .erp-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }
        .erp-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #90a4ae;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--erp-border);
          padding-bottom: 4px;
          margin-bottom: 12px;
        }

        /* Data Table */
        .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
        .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
        .erp-table { font-size: 0.8rem; }
        .erp-table thead th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.7rem;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #cbd5e1;
          padding: 8px 12px;
          white-space: nowrap;
        }
        .erp-table tbody td {
          padding: 8px 12px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }
        .table-primary { background-color: #e0f2fe !important; }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          white-space: nowrap;
        }
        .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }

        /* Modals / Dialogs */
        .erp-modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(38, 50, 56, 0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 1050;
        }
        .erp-dialog {
          background: var(--erp-surface);
          border-radius: 4px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .erp-dialog-md { max-width: 500px; }
        .erp-dialog-lg { max-width: 900px; }
        .erp-dialog-header {
          background-color: var(--erp-primary);
          color: white;
          padding: 12px 20px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .erp-dialog-body {
          padding: 20px;
          overflow-y: auto;
        }
        
        /* Print Styles */
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-area, #printable-invoice-area * {
            visibility: visible;
          }
          #printable-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            padding: 0 !important;
          }
          .d-print-none {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}