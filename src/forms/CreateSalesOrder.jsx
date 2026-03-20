import React, { useEffect, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

const buildEmptyItem = () => ({
  productId: "",
  quantity: 1,
  price: 0,
  discount: 0,
  tax: 0,
  warehouseId: ""
});

const createInitialForm = () => ({
  customerName: "",
  deliveryDate: "",
  currency: "INR",
  notes: "",
  warehouseId: "",
  items: [buildEmptyItem()]
});

export default function CreateSalesOrder() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [createForm, setCreateForm] = useState(createInitialForm());
  const [validationErrors, setValidationErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    setLoading(true);
    try {
      const [itemsRes, warehousesRes] = await Promise.all([
        smartErpApi.stockItems(),
        smartErpApi.warehouses()
      ]);
      setItems(itemsRes.data || []);
      setWarehouses(warehousesRes.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load products and warehouses.");
    } finally {
      setLoading(false);
    }
  };

  const addLine = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, buildEmptyItem()]
    }));
  };

  const removeLine = (idx) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((_, i) => i !== idx)
    }));
  };

  const updateLine = (idx, patch) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((line, i) => (i === idx ? { ...line, ...patch } : line))
    }));
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!createForm.customerName?.trim()) errors.customerName = "Customer name is required";
    if (!createForm.deliveryDate) errors.deliveryDate = "Delivery date is required";
    if (createForm.deliveryDate && new Date(createForm.deliveryDate) < new Date().setHours(0, 0, 0, 0)) {
      errors.deliveryDate = "Delivery date must be today or in the future";
    }

    createForm.items.forEach((item, idx) => {
      if (!item.productId) errors[`item_${idx}_product`] = "Product is required";
      if (!item.quantity || item.quantity <= 0) errors[`item_${idx}_qty`] = "Valid qty required";
      if (!item.price || item.price < 0) errors[`item_${idx}_price`] = "Valid price required";
      if (!item.warehouseId && !createForm.warehouseId) {
        errors[`item_${idx}_warehouse`] = "Warehouse required";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createOrder = async (event) => {
    event.preventDefault();
    setMessage("");
    if (!validateCreateForm()) {
      setMessage("⚠ Please fix the validation errors before creating the order.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerName: createForm.customerName.trim(),
        deliveryDate: createForm.deliveryDate || null,
        currency: createForm.currency || "INR",
        notes: createForm.notes?.trim() || null,
        warehouseId: createForm.warehouseId ? Number(createForm.warehouseId) : null,
        items: createForm.items.map((x) => ({
          productId: Number(x.productId),
          quantity: Number(x.quantity),
          price: Number(x.price),
          discount: Number(x.discount) || 0,
          tax: Number(x.tax) || 0,
          warehouseId: x.warehouseId
            ? Number(x.warehouseId)
            : createForm.warehouseId
            ? Number(createForm.warehouseId)
            : 0
        }))
      };

      const res = await smartErpApi.createSalesOrder(payload);
      setMessage(`✓ Order created successfully: ${res.data.orderNumber}`);
      setCreateForm(createInitialForm());
      setValidationErrors({});
    } catch (err) {
      setMessage(err?.response?.data || "Create order failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1200px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Sales Order Entry</h4>
            <span className="erp-text-muted small text-uppercase">New Order Origination</span>
          </div>
          <button 
            className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
            onClick={loadLookups} 
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            Refresh Master Data
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

        <div className="erp-panel shadow-sm">
          <div className="erp-panel-header bg-light">
            <span className="fw-bold">Order Header Details</span>
          </div>
          
          <div className="p-4 bg-white">
            <form onSubmit={createOrder}>
              {/* HEADER FIELDS */}
              <div className="row g-3 mb-5">
                <div className="col-md-4">
                  <label className="erp-label">Customer Name <span className="text-danger">*</span></label>
                  <input
                    className={`form-control erp-input ${validationErrors.customerName ? "is-invalid" : ""}`}
                    value={createForm.customerName}
                    onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
                    placeholder="Enter customer name"
                  />
                  {validationErrors.customerName && <div className="invalid-feedback">{validationErrors.customerName}</div>}
                </div>

                <div className="col-md-2">
                  <label className="erp-label">Delivery Date <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    className={`form-control erp-input ${validationErrors.deliveryDate ? "is-invalid" : ""}`}
                    value={createForm.deliveryDate}
                    onChange={(e) => setCreateForm({ ...createForm, deliveryDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {validationErrors.deliveryDate && <div className="invalid-feedback">{validationErrors.deliveryDate}</div>}
                </div>

                <div className="col-md-2">
                  <label className="erp-label">Currency</label>
                  <select
                    className="form-select erp-input"
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                  >
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="erp-label">Default Warehouse</label>
                  <select
                    className="form-select erp-input"
                    value={createForm.warehouseId}
                    onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
                  >
                    <option value="">None (Select per line item)</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-12">
                  <label className="erp-label">Order Notes</label>
                  <input
                    className="form-control erp-input"
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder="Optional order notes or special instructions..."
                  />
                </div>
              </div>

              {/* LINE ITEMS */}
              <h6 className="erp-section-title mb-3">Line Items</h6>
              <div className="bg-light p-3 border rounded mb-4">
                {createForm.items.map((line, idx) => (
                  <div key={idx} className="row g-2 align-items-start mb-3 pb-3 border-bottom position-relative erp-line-item">
                    
                    {/* Row Number Indicator */}
                    <div className="position-absolute d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.7rem', top: '30px', left: '-10px', zIndex: 1 }}>
                      {idx + 1}
                    </div>

                    <div className="col-md-3 ps-3">
                      <label className="erp-label">Product <span className="text-danger">*</span></label>
                      <select
                        className={`form-select erp-input ${validationErrors[`item_${idx}_product`] ? "is-invalid" : ""}`}
                        value={line.productId}
                        onChange={(e) => updateLine(idx, { productId: e.target.value })}
                      >
                        <option value="">Select Product...</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>{i.itemCode}</option>
                        ))}
                      </select>
                      {validationErrors[`item_${idx}_product`] && <div className="invalid-feedback d-block">{validationErrors[`item_${idx}_product`]}</div>}
                    </div>

                    <div className="col-md-2">
                      <label className="erp-label">Warehouse</label>
                      <select
                        className={`form-select erp-input ${validationErrors[`item_${idx}_warehouse`] ? "is-invalid" : ""}`}
                        value={line.warehouseId}
                        onChange={(e) => updateLine(idx, { warehouseId: e.target.value })}
                      >
                        <option value="">Use Default</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      {validationErrors[`item_${idx}_warehouse`] && <div className="invalid-feedback d-block">{validationErrors[`item_${idx}_warehouse`]}</div>}
                    </div>

                    <div className="col-md-2">
                      <label className="erp-label">Qty <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control erp-input font-monospace text-end ${validationErrors[`item_${idx}_qty`] ? "is-invalid" : ""}`}
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                        min="1"
                      />
                      {validationErrors[`item_${idx}_qty`] && <div className="invalid-feedback d-block">{validationErrors[`item_${idx}_qty`]}</div>}
                    </div>

                    <div className="col-md-2">
                      <label className="erp-label">Unit Price <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        className={`form-control erp-input font-monospace text-end ${validationErrors[`item_${idx}_price`] ? "is-invalid" : ""}`}
                        value={line.price}
                        onChange={(e) => updateLine(idx, { price: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                      {validationErrors[`item_${idx}_price`] && <div className="invalid-feedback d-block">{validationErrors[`item_${idx}_price`]}</div>}
                    </div>

                    <div className="col-md-1">
                      <label className="erp-label">Disc</label>
                      <input
                        type="number"
                        className="form-control erp-input font-monospace text-end px-1"
                        value={line.discount}
                        onChange={(e) => updateLine(idx, { discount: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-md-1">
                      <label className="erp-label">Tax</label>
                      <input
                        type="number"
                        className="form-control erp-input font-monospace text-end px-1"
                        value={line.tax}
                        onChange={(e) => updateLine(idx, { tax: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="col-md-1 d-flex align-items-end justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-danger erp-btn w-100 fw-bold"
                        onClick={() => removeLine(idx)}
                        disabled={createForm.items.length === 1}
                        title="Remove Line Item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-light border erp-btn fw-bold text-primary mt-1" onClick={addLine} disabled={loading}>
                  + Add Line Item
                </button>
              </div>

              {/* ACTION FOOTER */}
              <div className="d-flex justify-content-end pt-3 border-top mt-4">
                <button type="submit" className="btn btn-primary erp-btn px-5 py-2 fs-6 fw-bold" disabled={loading}>
                  {loading ? "Processing..." : "Commit Sales Order to Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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
          padding: 12px 16px;
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
          padding: 8px 10px;
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
          font-weight: 700;
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

        /* Specific overrides for line items */
        .erp-line-item:last-child {
          border-bottom: none !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
      `}</style>
    </div>
  );
}