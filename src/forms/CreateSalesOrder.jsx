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
      if (!item.quantity || item.quantity <= 0) errors[`item_${idx}_qty`] = "Valid quantity required";
      if (!item.price || item.price < 0) errors[`item_${idx}_price`] = "Valid price required";
      if (!item.warehouseId && !createForm.warehouseId) {
        errors[`item_${idx}_warehouse`] = "Warehouse is required";
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
    <div className="container-fluid py-4 app-page-bg">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="fw-bold m-0">Create Sales Order</h3>
          <small className="text-muted">Capture a new order and push it into the ERP pipeline.</small>
        </div>
        <button className="btn btn-outline-secondary" onClick={loadLookups} disabled={loading}>
          Refresh Lookups
        </button>
      </div>

      {message && (
        <div className={`alert py-2 ${message.includes("✓") ? "alert-success" : message.includes("⚠") ? "alert-warning" : "alert-info"}`}>
          {message}
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <form className="row g-3" onSubmit={createOrder}>
          <div className="col-md-3">
            <label className="form-label">Customer Name *</label>
            <input
              className={`form-control ${validationErrors.customerName ? "is-invalid" : ""}`}
              value={createForm.customerName}
              onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })}
              placeholder="Enter customer name"
            />
            {validationErrors.customerName && (
              <div className="invalid-feedback d-block">{validationErrors.customerName}</div>
            )}
          </div>

          <div className="col-md-2">
            <label className="form-label">Delivery Date *</label>
            <input
              type="date"
              className={`form-control ${validationErrors.deliveryDate ? "is-invalid" : ""}`}
              value={createForm.deliveryDate}
              onChange={(e) => setCreateForm({ ...createForm, deliveryDate: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
            />
            {validationErrors.deliveryDate && (
              <div className="invalid-feedback d-block">{validationErrors.deliveryDate}</div>
            )}
          </div>

          <div className="col-md-2">
            <label className="form-label">Currency</label>
            <select
              className="form-select"
              value={createForm.currency}
              onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
            >
              <option value="INR">INR - Indian Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label">Default Warehouse</label>
            <select
              className="form-select"
              value={createForm.warehouseId}
              onChange={(e) => setCreateForm({ ...createForm, warehouseId: e.target.value })}
            >
              <option value="">None (Select per item)</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label">Notes</label>
            <input
              className="form-control"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="Optional order notes"
            />
          </div>

          {createForm.items.map((line, idx) => (
            <React.Fragment key={idx}>
              <div className="col-md-3">
                <label className="form-label">Product *</label>
                <select
                  className={`form-select ${validationErrors[`item_${idx}_product`] ? "is-invalid" : ""}`}
                  value={line.productId}
                  onChange={(e) => updateLine(idx, { productId: e.target.value })}
                >
                  <option value="">Select Product</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.itemCode}
                    </option>
                  ))}
                </select>
                {validationErrors[`item_${idx}_product`] && (
                  <div className="invalid-feedback d-block">{validationErrors[`item_${idx}_product`]}</div>
                )}
              </div>

              <div className="col-md-2">
                <label className="form-label">Warehouse</label>
                <select
                  className={`form-select ${validationErrors[`item_${idx}_warehouse`] ? "is-invalid" : ""}`}
                  value={line.warehouseId}
                  onChange={(e) => updateLine(idx, { warehouseId: e.target.value })}
                >
                  <option value="">Use Default</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                {validationErrors[`item_${idx}_warehouse`] && (
                  <div className="invalid-feedback d-block">{validationErrors[`item_${idx}_warehouse`]}</div>
                )}
              </div>

              <div className="col-md-1">
                <label className="form-label">Qty *</label>
                <input
                  type="number"
                  className={`form-control ${validationErrors[`item_${idx}_qty`] ? "is-invalid" : ""}`}
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                  min="1"
                />
                {validationErrors[`item_${idx}_qty`] && (
                  <div className="invalid-feedback d-block">{validationErrors[`item_${idx}_qty`]}</div>
                )}
              </div>

              <div className="col-md-2">
                <label className="form-label">Price *</label>
                <input
                  type="number"
                  className={`form-control ${validationErrors[`item_${idx}_price`] ? "is-invalid" : ""}`}
                  value={line.price}
                  onChange={(e) => updateLine(idx, { price: e.target.value })}
                  min="0"
                  step="0.01"
                />
                {validationErrors[`item_${idx}_price`] && (
                  <div className="invalid-feedback d-block">{validationErrors[`item_${idx}_price`]}</div>
                )}
              </div>

              <div className="col-md-1">
                <label className="form-label">Disc</label>
                <input
                  type="number"
                  className="form-control"
                  value={line.discount}
                  onChange={(e) => updateLine(idx, { discount: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="col-md-1">
                <label className="form-label">Tax</label>
                <input
                  type="number"
                  className="form-control"
                  value={line.tax}
                  onChange={(e) => updateLine(idx, { tax: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  onClick={() => removeLine(idx)}
                  disabled={createForm.items.length === 1}
                >
                  Remove Line
                </button>
              </div>
            </React.Fragment>
          ))}

          <div className="col-12 d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary" onClick={addLine} disabled={loading}>
              + Add Line Item
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Create Sales Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
