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

  const orderOptions = useMemo(() => orders.map((o) => ({ id: o.id, label: `${o.orderNumber} - ${o.customerName}` })), [orders]);

  return (
    <div className="container-fluid py-4 app-page-bg">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold m-0">Sales Order List</h3>
          <small className="text-muted">Track each order and trigger fulfillment actions.</small>
        </div>
        <button className="btn btn-outline-primary" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {message && (
        <div className={`alert py-2 ${message.includes("✓") ? "alert-success" : message.includes("⚠") ? "alert-warning" : "alert-info"}`}>
          {message}
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h5 className="fw-bold mb-3">Sales Order List</h5>
            <div className="mb-3">
              <label className="form-label">Select Order</label>
              <select className="form-select" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
                <option value="">-- Select --</option>
                {orderOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelectedOrderId(String(o.id))}>
                      <td>{o.orderNumber}</td>
                      <td>{o.status}</td>
                      <td>{o.paymentStatus}</td>
                      <td>{o.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h5 className="fw-bold mb-3">Order Actions</h5>

            {!selectedOrder ? (
              <div className="alert alert-warning py-3 text-center">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Please select an order from the list to view and perform actions
              </div>
            ) : (
              <>
                <div className="alert alert-info py-2 mb-3">
                  <strong>Current Status:</strong> <span className="badge bg-primary">{selectedOrder.status}</span> {" | "}
                  <strong>Payment:</strong>{" "}
                  <span className={`badge ${selectedOrder.paymentStatus === "Paid" ? "bg-success" : "bg-warning"}`}>{selectedOrder.paymentStatus}</span>
                </div>

                <form className="row g-2 mb-3" onSubmit={updateStatus}>
                  <div className="col-12">
                    <strong className="text-muted">Update Order Status</strong>
                  </div>
                  <div className="col-md-5">
                    <select
                      className="form-select"
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                      disabled={!canUpdateStatus()}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Remarks (optional)"
                      value={statusForm.remarks}
                      onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-outline-primary w-100" type="submit" disabled={!canUpdateStatus()}>
                      Update Status
                    </button>
                  </div>
                </form>

                <div className="d-flex gap-2 mb-3">
                  <button
                    className="btn btn-warning"
                    onClick={assignRobotPicking}
                    disabled={!selectedOrder || !["Confirmed", "Processing"].includes(selectedOrder.status)}
                  >
                    🤖 Assign Picking (Robot)
                  </button>
                  <small className="text-muted align-self-center">
                    {!selectedOrder
                      ? "Select an order first"
                      : ["Confirmed", "Processing"].includes(selectedOrder.status)
                      ? "Assign robot for automated picking"
                      : "Not available for this status"}
                  </small>
                </div>

                <form className="row g-2 mb-3" onSubmit={createShipment}>
                  <div className="col-12">
                    <strong className="text-muted">Create Shipment</strong>
                  </div>
                  <div className="col-md-4">
                    <input
                      className="form-control"
                      placeholder="Carrier (e.g., BlueDart)"
                      value={shipmentForm.carrier}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, carrier: e.target.value })}
                      disabled={!canCreateShipment()}
                    />
                  </div>
                  <div className="col-md-5">
                    <input
                      className="form-control"
                      placeholder="Tracking Number (optional)"
                      value={shipmentForm.trackingNumber}
                      onChange={(e) => setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })}
                      disabled={!canCreateShipment()}
                    />
                  </div>
                  <div className="col-md-3">
                    <button className="btn btn-outline-success w-100" type="submit" disabled={!canCreateShipment()}>
                      Create Shipment
                    </button>
                  </div>
                </form>

                <div className="d-flex gap-2 mb-3">
                  <button className="btn btn-outline-dark" onClick={generateInvoice} disabled={!canGenerateInvoice()}>
                    📄 Generate Invoice
                  </button>
                  {!canGenerateInvoice() && selectedOrder && (
                    <small className="text-muted align-self-center">
                      Available when order is Shipped/Delivered and not yet invoiced
                    </small>
                  )}
                </div>

                <form className="row g-2" onSubmit={recordPayment}>
                  <div className="col-12">
                    <strong className="text-muted">Record Payment</strong>
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      disabled={!canRecordPayment()}
                    >
                      <option>UPI</option>
                      <option>BankTransfer</option>
                      <option>CreditCard</option>
                      <option>Cash</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Amount"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      max={selectedOrder?.totalAmount}
                      disabled={!canRecordPayment()}
                    />
                  </div>
                  <div className="col-md-4">
                    <button className="btn btn-primary w-100" type="submit" disabled={!canRecordPayment()}>
                      Record Payment
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedOrder && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mt-4">
          <h5 className="fw-bold">Order Detail - {selectedOrder.orderNumber}</h5>
          <p className="mb-1">
            <b>Customer:</b> {selectedOrder.customerName}
          </p>
          <p className="mb-1">
            <b>Status:</b> {selectedOrder.status}
          </p>
          <p className="mb-1">
            <b>Payment Status:</b> {selectedOrder.paymentStatus}
          </p>
          <p className="mb-3">
            <b>Total:</b> {selectedOrder.totalAmount}
          </p>

          <h6 className="fw-bold">Items</h6>
          <div className="table-responsive mb-3">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Warehouse</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(selectedOrder.items || []).map((x) => (
                  <tr key={x.id}>
                    <td>{x.itemCode || x.itemId}</td>
                    <td>{x.warehouseName || x.warehouseId}</td>
                    <td>{x.quantity}</td>
                    <td>{x.unitPrice}</td>
                    <td>{x.lineTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h6 className="fw-bold">Status History</h6>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(selectedOrder.statusHistory || []).map((x) => (
                  <tr key={x.id}>
                    <td>{new Date(x.createdAt).toLocaleString()}</td>
                    <td>{x.status}</td>
                    <td>{x.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
