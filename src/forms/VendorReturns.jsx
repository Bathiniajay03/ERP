import React, { useCallback, useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

const DEFAULT_LINE = () => ({
  itemId: "",
  warehouseId: "",
  quantity: 1,
  unitCost: 0,
  barcode: "",
  lotNumber: "",
  serialNumbers: ""
});

const reasonOptions = ["Damaged", "Expired", "Wrong Item", "Quality Issue"];
const returnTypeOptions = ["Refund", "Replacement", "CreditNote"];

export default function VendorReturns() {
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [actionState, setActionState] = useState({ id: null, action: "" });
  const [returnForm, setReturnForm] = useState({
    vendorId: "",
    purchaseOrderId: "",
    returnType: "Refund",
    returnReason: "Damaged",
    notes: "",
    lines: [DEFAULT_LINE()]
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorRes, poRes, itemRes, whRes, returnsRes] = await Promise.all([
        smartErpApi.getVendors(),
        smartErpApi.getPurchaseOrders(),
        smartErpApi.stockItems(),
        smartErpApi.warehouses(),
        smartErpApi.getVendorReturns()
      ]);

      setVendors(vendorRes.data || []);
      setPurchaseOrders(poRes.data || []);
      setItems(itemRes.data || []);
      setWarehouses(whRes.data || []);
      setReturns(returnsRes.data || []);
      setMessage("");
    } catch (err) {
      setMessage(err?.response?.data || "Unable to load vendor return data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addLine = () =>
    setReturnForm((prev) => ({
      ...prev,
      lines: [...prev.lines, DEFAULT_LINE()]
    }));

  const updateLine = (index, patch) =>
    setReturnForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, idx) => (idx === index ? { ...line, ...patch } : line))
    }));

  const removeLine = (index) =>
    setReturnForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index)
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormLoading(true);
    setMessage("");

    try {
      if (!returnForm.vendorId || !returnForm.purchaseOrderId) {
        setMessage("Select vendor and purchase order before submitting.");
        setFormLoading(false);
        return;
      }

      const lines = returnForm.lines
        .map((line) => ({
          itemId: Number(line.itemId),
          warehouseId: Number(line.warehouseId),
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
          barcode: line.barcode,
          lotNumber: line.lotNumber,
          serialNumbers: line.serialNumbers
        }))
        .filter((line) => line.itemId > 0 && line.warehouseId > 0 && line.quantity > 0);

      if (lines.length === 0) {
        setMessage("Add at least one valid return line.");
        setFormLoading(false);
        return;
      }

      await smartErpApi.createVendorReturn({
        vendorId: Number(returnForm.vendorId),
        purchaseOrderId: Number(returnForm.purchaseOrderId),
        returnType: returnForm.returnType,
        returnReason: returnForm.returnReason,
        notes: returnForm.notes,
        items: lines
      });

      setMessage("Vendor return request submitted.");
      setReturnForm({
        vendorId: "",
        purchaseOrderId: "",
        returnType: "Refund",
        returnReason: "Damaged",
        notes: "",
        lines: [DEFAULT_LINE()]
      });
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || "Vendor return creation failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionState({ id, action: "approve" });
    setMessage("");
    try {
      await smartErpApi.approveVendorReturn(id, { isApproved: true });
      setMessage("Return approved.");
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || "Approval failed.");
    } finally {
      setActionState({ id: null, action: "" });
    }
  };

  const handleShip = async (id) => {
    setActionState({ id, action: "ship" });
    setMessage("");
    try {
      await smartErpApi.shipVendorReturn(id, { notes: "Shipped from portal" });
      setMessage("Return marked as shipped.");
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || "Shipping failed.");
    } finally {
      setActionState({ id: null, action: "" });
    }
  };

  const handleRefund = async (id) => {
    setActionState({ id, action: "refund" });
    setMessage("");
    try {
      await smartErpApi.refundVendorReturn(id, {});
      setMessage("Refund processed.");
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || "Refund failed.");
    } finally {
      setActionState({ id: null, action: "" });
    }
  };

  const vendorReturnRows = useMemo(
    () =>
      returns.map((item) => ({
        id: item.id,
        number: item.returnNumber,
        vendorName: item.vendorName,
        type: item.returnType,
        reason: item.returnReason,
        status: item.status,
        approved: item.isApproved,
        shippedAt: item.shippedAt,
        totalQuantity: item.totalQuantity,
        totalAmount: item.totalAmount,
        createdAt: item.createdAt
      })),
    [returns]
  );

  const displayPurchaseOrders = purchaseOrders.map((po) => ({
    id: po.id,
    label: `${po.poNumber} | Pending ${po.pendingQuantity}`
  }));

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold m-0">Vendor Returns</h3>
          <small className="text-muted">Initiate RMAs, monitor statuses, and trigger approvals.</small>
        </div>
        <button className="btn btn-outline-primary" onClick={loadData} disabled={loading}>
          Refresh
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <h5 className="fw-bold">Create Vendor Return</h5>
          <form className="row g-3 mt-3" onSubmit={handleSubmit}>
            <div className="col-md-4">
              <label className="form-label">Vendor</label>
              <select
                className="form-select"
                value={returnForm.vendorId}
                onChange={(e) => setReturnForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                required
              >
                <option value="">Select vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorCode} - {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Purchase Order</label>
              <select
                className="form-select"
                value={returnForm.purchaseOrderId}
                onChange={(e) => setReturnForm((prev) => ({ ...prev, purchaseOrderId: e.target.value }))}
                required
              >
                <option value="">Select PO</option>
                {displayPurchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Return Type</label>
              <select
                className="form-select"
                value={returnForm.returnType}
                onChange={(e) => setReturnForm((prev) => ({ ...prev, returnType: e.target.value }))}
              >
                {returnTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Return Reason</label>
              <select
                className="form-select"
                value={returnForm.returnReason}
                onChange={(e) => setReturnForm((prev) => ({ ...prev, returnReason: e.target.value }))}
              >
                {reasonOptions.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                value={returnForm.notes}
                onChange={(e) => setReturnForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
                placeholder="Special instructions or reference numbers"
              />
            </div>

            {returnForm.lines.map((line, idx) => (
              <div key={`line-${idx}`} className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Item</label>
                  <select
                    className="form-select"
                    value={line.itemId}
                    onChange={(e) => updateLine(idx, { itemId: e.target.value })}
                    required
                  >
                    <option value="">Item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.itemCode} - {item.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Warehouse</label>
                  <select
                    className="form-select"
                    value={line.warehouseId}
                    onChange={(e) => updateLine(idx, { warehouseId: e.target.value })}
                    required
                  >
                    <option value="">Warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-1">
                  <label className="form-label">Qty</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="form-control"
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-1">
                  <label className="form-label">Unit Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={line.unitCost}
                    onChange={(e) => updateLine(idx, { unitCost: e.target.value })}
                  />
                </div>
                <div className="col-md-1">
                  <label className="form-label">Barcode</label>
                  <input
                    className="form-control"
                    value={line.barcode}
                    onChange={(e) => updateLine(idx, { barcode: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Lot Number</label>
                  <input
                    className="form-control"
                    value={line.lotNumber}
                    onChange={(e) => updateLine(idx, { lotNumber: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Serials (comma separated)</label>
                  <input
                    className="form-control"
                    value={line.serialNumbers}
                    onChange={(e) => updateLine(idx, { serialNumbers: e.target.value })}
                  />
                </div>
                <div className="col-md-0 d-grid">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm mt-1"
                    onClick={() => removeLine(idx)}
                    disabled={returnForm.lines.length === 1}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            <div className="col-12 d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={addLine}>
                Add line
              </button>
              <button type="submit" className="btn btn-primary" disabled={formLoading}>
                {formLoading ? "Submitting..." : "Create Return"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Vendor Return History</h5>
            <span className="badge bg-secondary">{returns.length} records</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Return #</th>
                  <th>Vendor</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorReturnRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.number}</td>
                    <td>{row.vendorName}</td>
                    <td>{row.type}</td>
                    <td>{row.reason}</td>
                    <td>
                      {row.status}
                      {row.shippedAt && <small className="text-muted d-block">Shipped {new Date(row.shippedAt).toLocaleString()}</small>}
                    </td>
                    <td>{row.totalQuantity}</td>
                    <td>{row.totalAmount}</td>
                    <td>{new Date(row.createdAt).toLocaleString()}</td>
                    <td>
                      {!row.approved && (
                        <button
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => handleApprove(row.id)}
                          disabled={actionState.id === row.id && actionState.action === "approve"}
                        >
                          {actionState.id === row.id && actionState.action === "approve" ? "Approving..." : "Approve"}
                        </button>
                      )}
                      {row.approved && !row.shippedAt && (
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleShip(row.id)}
                          disabled={actionState.id === row.id && actionState.action === "ship"}
                        >
                          {actionState.id === row.id && actionState.action === "ship" ? "Shipping..." : "Ship"}
                        </button>
                      )}
                      {row.type === "Refund" && row.status !== "Refunded" && (
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleRefund(row.id)}
                          disabled={actionState.id === row.id && actionState.action === "refund"}
                        >
                          {actionState.id === row.id && actionState.action === "refund" ? "Refunding..." : "Refund"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
