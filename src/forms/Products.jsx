import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/apiClient";
import { smartErpApi } from "../services/smartErpApi";

const createEmptyProductForm = () => ({
  itemCode: "",
  description: "",
  barcode: "",
  category: "General",
  unit: "NOS",
  price: 0,
  warehouseLocation: "",
  isLotTracked: false,
  serialPrefix: "",
  itemType: "Purchased",
  maxStockLevel: 0,
  safetyStock: 0,
  leadTimeDays: 0,
  averageDailySales: 0
});

export default function SmartERP() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [poMap, setPoMap] = useState({}); // itemId -> pending PO qty
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();

  // Form States
  const [productForm, setProductForm] = useState(createEmptyProductForm);
  const [activeItem, setActiveItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stockForm, setStockForm] = useState({ warehouseId: "", quantity: 0, lotNumber: "", scannerDeviceId: "SCN-01" });

  const warehouseNameById = useCallback((id) => {
    if (id == null) return "General warehouse";
    const warehouse = warehouses.find((w) => Number(w.id) === Number(id));
    return warehouse?.name || `WH-${id}`;
  }, [warehouses]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resItems, resWh, resInv, resPO] = await Promise.all([
        api.get("/stock/items"),
        api.get("/warehouses"),
        api.get("/stock/inventory"),
        smartErpApi.getPurchaseOrders()
      ]);
      setItems(resItems.data || []);
      setWarehouses(resWh.data || []);
      setInventory(resInv.data || []);
      // build map of pending qty per item
      const map = {};
      (resPO.data || []).forEach(po => {
        (po.Lines || []).forEach(line => {
          if (!map[line.ItemId]) map[line.ItemId] = 0;
          map[line.ItemId] += line.PendingQuantity || 0;
        });
      });
      setPoMap(map);
      setIsOffline(false);
    } catch (err) {
      setIsOffline(true);
      setMessage({ text: "Gateway Connectivity Lost", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        itemCode: productForm.itemCode,
        description: productForm.description,
        barcode: productForm.barcode,
        category: productForm.category,
        unit: productForm.unit,
        price: Number(productForm.price),
        warehouseLocation: productForm.warehouseLocation,
        isLotTracked: productForm.isLotTracked,
        serialPrefix: productForm.serialPrefix || null,
        maxStockLevel: Number(productForm.maxStockLevel),
        safetyStock: Number(productForm.safetyStock),
        leadTimeDays: Number(productForm.leadTimeDays),
        averageDailySales: Number(productForm.averageDailySales)
      };

      await api.post("/smart-erp/products", payload);
      setMessage({ text: "Item Created Successfully", type: "success" });
      setProductForm(createEmptyProductForm());
      setShowCreateForm(false);
      await loadAllData();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data || "Product registration failed.";
      setMessage({ text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg, type: "danger" });
      console.error("Product creation error:", err.response?.data);
    }
  };

  const handleBarcodeChange = (value) => {
    setProductForm((prev) => {
      const trimmedDescription = prev.description?.trim() ?? "";
      const autoDescription = value ? `ITEM-${value}` : "";
      const shouldAutoFill = !trimmedDescription && autoDescription;
      return {
        ...prev,
        barcode: value,
        description: shouldAutoFill ? autoDescription : prev.description,
        isLotTracked: prev.isLotTracked || Boolean(autoDescription)
      };
    });
  };

  const handleReceiveStock = async (e) => {
    e.preventDefault();
    try {
      await api.post("/smart-erp/inventory/receive", {
        itemId: activeItem.id,
        warehouseId: Number(stockForm.warehouseId),
        quantity: Number(stockForm.quantity),
        lotNumber: activeItem?.isLotTracked ? stockForm.lotNumber.trim() : null,
        scannerDeviceId: stockForm.scannerDeviceId
      });
      const lotUsed = activeItem?.isLotTracked ? stockForm.lotNumber.trim() || "General lot" : "General lot";
      setMessage({ text: `Stock Added to ${lotUsed} (${activeItem?.itemCode})`, type: "success" });
      setActiveItem(null);
      setStockForm({ warehouseId: "", quantity: 0, lotNumber: "", scannerDeviceId: "SCN-01" });
      await loadAllData();
    } catch (err) {
      setMessage({ text: "Stock entry failed.", type: "danger" });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!detailItem || !editForm) return;
    try {
      const payload = {
        itemCode: editForm.itemCode.trim(),
        description: editForm.description.trim(),
        barcode: editForm.barcode.trim(),
        category: editForm.category.trim(),
        unit: editForm.unit.trim(),
        price: Number(editForm.price),
        warehouseLocation: editForm.warehouseLocation.trim(),
        isLotTracked: Boolean(editForm.isLotTracked),
        serialPrefix: editForm.serialPrefix.trim(),
        maxStockLevel: Number(editForm.maxStockLevel),
        safetyStock: Number(editForm.safetyStock),
        leadTimeDays: Number(editForm.leadTimeDays),
        averageDailySales: Number(editForm.averageDailySales)
      };
      const response = await api.put(`/smart-erp/products/${detailItem.id}`, payload);
      setDetailItem(response.data);
      setMessage({ text: "Item updated successfully", type: "success" });
      setIsEditingProduct(false);
      await loadAllData();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data || "Item update failed.";
      setMessage({ text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg, type: "danger" });
    }
  };

  const totalStock = (itemId) => inventory
    .filter((i) => i.itemId === itemId)
    .reduce((sum, i) => sum + Number(i.quantity || i.Quantity || 0), 0);

  const createPoForItem = async (item) => {
    const currentStock = totalStock(item.id);
    const maxLevel = item.maxStockLevel || 1000;
    const qty = Math.max(0, maxLevel - currentStock);
    if (qty <= 0) {
      setMessage({ text: "Stock is already at or above max level", type: "info" });
      return;
    }
    try {
      const warehouseId = warehouses[0]?.id || 0;
      await smartErpApi.createPurchaseOrder({
        Reason: `Manual reorder below ${maxLevel}`,
        VendorId: null,
        SupplierName: "",
        Lines: [{ ItemId: item.id, WarehouseId: warehouseId, Quantity: qty }]
      });
      setMessage({ text: "Purchase order created", type: "success" });
      // refresh POs
      const resPO = await smartErpApi.getPurchaseOrders();
      const map = {};
      (resPO.data || []).forEach(po => {
        (po.Lines || []).forEach(line => {
          if (!map[line.ItemId]) map[line.ItemId] = 0;
          map[line.ItemId] += line.PendingQuantity || 0;
        });
      });
      setPoMap(map);
    } catch (e) {
      setMessage({ text: "Failed to create PO", type: "danger" });
    }
  };

  const detailInventoryRows = useMemo(() => {
    if (!detailItem) return [];
    const grouping = {};
    inventory
      .filter((i) => i.itemId === detailItem.id || i.ItemId === detailItem.id)
      .forEach((row) => {
        const warehouseId = row.warehouseId ?? row.WarehouseId;
        const lotRaw = row.lotNumber ?? row.LotNumber ?? "general";
        const lotNumber = lotRaw === "-" ? "general" : lotRaw;
        const key = `${warehouseId}-${lotNumber}`;
        if (!grouping[key]) {
          grouping[key] = {
            id: key,
            warehouseId,
            warehouseName: warehouseNameById(warehouseId),
            lotNumber,
            quantity: 0
          };
        }
        grouping[key].quantity += Number(row.quantity ?? row.Quantity ?? 0);
      });
    return Object.values(grouping).sort((a, b) =>
      (a.warehouseName || "").localeCompare(b.warehouseName || "") ||
      (a.lotNumber || "").localeCompare(b.lotNumber || "")
    );
  }, [detailItem, inventory, warehouseNameById]);

  useEffect(() => {
    if (!detailItem) {
      setEditForm(null);
      setIsEditingProduct(false);
      return;
    }
    setEditForm({
      itemCode: detailItem.itemCode ?? "",
      description: detailItem.description ?? "",
      barcode: detailItem.barcode ?? "",
      category: detailItem.category ?? "General",
      unit: detailItem.unit ?? detailItem.UOM ?? "NOS",
      price: detailItem.price ?? 0,
      warehouseLocation: detailItem.warehouseLocation ?? "",
      isLotTracked: detailItem.isLotTracked ?? false,
      serialPrefix: detailItem.serialPrefix ?? "",
      maxStockLevel: detailItem.maxStockLevel ?? 0,
      safetyStock: detailItem.safetyStock ?? 0,
      leadTimeDays: detailItem.leadTimeDays ?? 0,
      averageDailySales: detailItem.averageDailySales ?? 0
    });
  }, [detailItem]);

  if (isOffline) return <ErrorState onRetry={loadAllData} />;
  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="erp-app-wrapper min-vh-100">
      
      {/* HEADER */}
      <nav className="erp-topbar d-flex justify-content-end align-items-center px-4">
        <div className="d-flex gap-3 align-items-center text-white-50 small">
          <span>Connected: Gateway Active</span>
          <span className="erp-status-dot bg-success"></span>
        </div>
      </nav>

      <div className="container-fluid px-4 py-3">
        
        {message.text && (
          <div className={`alert alert-${message.type} erp-alert d-flex justify-content-between align-items-center py-2 mb-3`}>
            <span className="fw-semibold">{message.text}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage({ text: "", type: "" })}></button>
          </div>
        )}

        <div className="row g-3">
          {/* LEFT: SYSTEM CONTROLS */}
          <div className="col-lg-3 col-xl-2">
            <div className="erp-panel h-100">
              <div className="erp-panel-header">
                System Controls
              </div>
              <div className="p-3">
                <button className="erp-btn btn btn-primary w-100 shadow-sm" onClick={() => setShowCreateForm(true)}>
                  + Register New SKU
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: INVENTORY DATA GRID */}
          <div className="col-lg-9 col-xl-10">
            <div className="erp-panel d-flex flex-column" style={{ height: "calc(100vh - 100px)" }}>
              <div className="erp-panel-header d-flex justify-content-between align-items-center">
                <span>Inventory Master Data</span>
                <span className="badge bg-secondary">{items.length} Records</span>
              </div>
              <div className="erp-table-container flex-grow-1 overflow-auto">
                <table className="table erp-table table-hover table-bordered mb-0 align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: "30%" }}>Item Details</th>
                      <th>Barcode</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Bin Location</th>
                      <th className="text-end">Value</th>
                      <th className="text-end">On Hand</th>
                      <th>Procurement</th>
                      <th className="text-center" style={{ width: "180px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const stock = totalStock(item.id);
                      const isLowStock = stock < (item.maxStockLevel || 1000);
                      const isCritical = stock < 5;
                      
                      return (
                        <tr key={item.id} className={isLowStock ? "table-warning" : ""}> 
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-bold text-dark">{item.itemCode}</span>
                              <span className="erp-text-muted text-truncate" style={{ maxWidth: "250px" }} title={item.description}>
                                {item.description}
                              </span>
                            </div>
                          </td>
                          <td className="font-monospace text-muted">{item.barcode || '---'}</td>
                          <td>{item.category}</td>
                          <td>{item.itemType || '---'}</td>
                          <td>{item.warehouseLocation || '---'}</td>
                          <td className="text-end font-monospace">{Number(item.price).toFixed(2)}</td>
                          <td className={`text-end fw-bold font-monospace ${isCritical ? 'text-danger' : 'text-dark'}`}>
                            {stock}
                          </td>
                          <td className="small">
                            {poMap[item.id] > 0 ? (
                              <span className="text-primary fw-bold">In Transit: {poMap[item.id]}</span>
                            ) : isLowStock ? (
                              <button
                                className="erp-btn btn btn-sm btn-warning text-dark py-0"
                                onClick={() => createPoForItem(item)}
                              >
                                Draft PO
                              </button>
                            ) : (
                              <span className="text-success">Optimal</span>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="btn-group shadow-sm">
                              <button className="erp-btn btn btn-light btn-sm border" onClick={() => setDetailItem(item)}>View</button>
                              <button className="erp-btn btn btn-light btn-sm border" onClick={() => {
                                setDetailItem(item);
                                setIsEditingProduct(true);
                              }}>Edit</button>
                              <button className="erp-btn btn btn-dark btn-sm" onClick={() => setActiveItem(item)}>Recv</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS - Styled as Enterprise Dialogs */}
      {(activeItem || detailItem) && (
        <div className="erp-modal-overlay">
          <div className={`erp-dialog ${detailItem ? 'erp-dialog-lg' : 'erp-dialog-md'}`}>
            
            {/* INBOUND STOCK DIALOG */}
            {activeItem && (
              <>
                <div className="erp-dialog-header">
                  <h6 className="m-0 fw-bold">Inbound Receipt processing: {activeItem.itemCode}</h6>
                  <button className="btn-close btn-close-white" onClick={() => setActiveItem(null)}></button>
                </div>
                <div className="erp-dialog-body">
                  <form onSubmit={handleReceiveStock}>
                    <div className="mb-3">
                      <label className="erp-label">Destination Warehouse</label>
                      <select className="form-select erp-input" value={stockForm.warehouseId} onChange={(e) => setStockForm({ ...stockForm, warehouseId: e.target.value })} required>
                        <option value="">Select Target...</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="row g-3 mb-4">
                      <div className="col-6">
                        <label className="erp-label">Receipt Qty</label>
                        <input type="number" className="form-control erp-input font-monospace" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
                      </div>
                      <div className="col-6">
                        <label className="erp-label">Lot/Batch Number {activeItem.isLotTracked && <span className="text-danger">*</span>}</label>
                        <input className="form-control erp-input font-monospace" placeholder="Scan or type..." value={stockForm.lotNumber} onChange={(e) => setStockForm({ ...stockForm, lotNumber: e.target.value })} required={activeItem.isLotTracked} disabled={!activeItem.isLotTracked} />
                      </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="erp-btn btn btn-light border" onClick={() => setActiveItem(null)}>Cancel</button>
                      <button type="submit" className="erp-btn btn btn-primary px-4">Post Receipt</button>
                    </div>
                  </form>
                </div>
              </>
            )}

            {/* ITEM MASTER DETAILS DIALOG */}
            {detailItem && (
              <>
                <div className="erp-dialog-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="m-0 fw-bold">{detailItem.itemCode}</h5>
                    <small className="opacity-75">{detailItem.description}</small>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <button className="erp-btn btn btn-sm btn-outline-light" type="button" onClick={() => setIsEditingProduct((prev) => !prev)}>
                      {isEditingProduct ? "Cancel Edit" : "Modify Master Data"}
                    </button>
                    <button className="btn-close btn-close-white ms-2" onClick={() => setDetailItem(null)}></button>
                  </div>
                </div>
                
                <div className="erp-dialog-body p-0">
                  <div className="row g-0">
                    <div className="col-md-8 p-4 border-end">
                      <h6 className="erp-section-title mb-3">Master Parameters</h6>
                      <div className="row g-3 mb-4">
                        <div className="col-sm-4"><div className="erp-meta-label">Barcode</div><div className="erp-meta-value font-monospace">{detailItem.barcode || 'N/A'}</div></div>
                        <div className="col-sm-4"><div className="erp-meta-label">Item Type</div><div className="erp-meta-value">{detailItem.itemType || 'N/A'}</div></div>
                        <div className="col-sm-4"><div className="erp-meta-label">Category</div><div className="erp-meta-value">{detailItem.category || 'N/A'}</div></div>
                        
                        <div className="col-sm-4"><div className="erp-meta-label">Serial Prefix</div><div className="erp-meta-value font-monospace">{detailItem.serialPrefix || 'N/A'}</div></div>
                        <div className="col-sm-4"><div className="erp-meta-label">Max Stock Level</div><div className="erp-meta-value">{detailItem.maxStockLevel}</div></div>
                        <div className="col-sm-4"><div className="erp-meta-label">Safety Stock</div><div className="erp-meta-value">{detailItem.safetyStock}</div></div>
                        
                        <div className="col-sm-4"><div className="erp-meta-label">Lead Time</div><div className="erp-meta-value">{detailItem.leadTimeDays} days</div></div>
                        <div className="col-sm-4"><div className="erp-meta-label">Avg Daily Sales</div><div className="erp-meta-value">{detailItem.averageDailySales}</div></div>
                        <div className="col-sm-4"><div className="erp-meta-label">Base Unit</div><div className="erp-meta-value">{detailItem.unit || detailItem.UOM}</div></div>
                      </div>

                      {isEditingProduct && editForm && (
                        <div className="erp-edit-box mt-4">
                          <h6 className="erp-section-title">Edit Master Data</h6>
                          <form onSubmit={handleEditSubmit}>
                            <div className="row g-2 mb-2">
                              <div className="col-md-4">
                                <label className="erp-label">Item Code</label>
                                <input className="form-control erp-input" value={editForm.itemCode} onChange={(e) => setEditForm((prev) => prev ? { ...prev, itemCode: e.target.value } : prev)} required />
                              </div>
                              <div className="col-md-4">
                                <label className="erp-label">Description</label>
                                <input className="form-control erp-input" value={editForm.description} onChange={(e) => setEditForm((prev) => prev ? { ...prev, description: e.target.value } : prev)} required />
                              </div>
                              <div className="col-md-4">
                                <label className="erp-label">Barcode</label>
                                <input className="form-control erp-input" value={editForm.barcode} onChange={(e) => setEditForm((prev) => prev ? { ...prev, barcode: e.target.value } : prev)} />
                              </div>
                            </div>
                            <div className="row g-2 mb-2">
                              <div className="col-md-3">
                                <label className="erp-label">Category</label>
                                <input className="form-control erp-input" value={editForm.category} onChange={(e) => setEditForm((prev) => prev ? { ...prev, category: e.target.value } : prev)} />
                              </div>
                              <div className="col-md-3">
                                <label className="erp-label">Unit</label>
                                <input className="form-control erp-input" value={editForm.unit} onChange={(e) => setEditForm((prev) => prev ? { ...prev, unit: e.target.value } : prev)} />
                              </div>
                              <div className="col-md-3">
                                <label className="erp-label">Unit Price</label>
                                <input type="number" step="0.01" className="form-control erp-input" value={editForm.price} onChange={(e) => setEditForm((prev) => prev ? { ...prev, price: e.target.value } : prev)} />
                              </div>
                              <div className="col-md-3">
                                <label className="erp-label">Default Bin</label>
                                <input className="form-control erp-input" value={editForm.warehouseLocation} onChange={(e) => setEditForm((prev) => prev ? { ...prev, warehouseLocation: e.target.value } : prev)} />
                              </div>
                            </div>
                            <div className="row g-2 mb-2">
                              <div className="col-md-3">
                                <label className="erp-label">Max Stock</label>
                                <input type="number" className="form-control erp-input" value={editForm.maxStockLevel} onChange={(e) => setEditForm((prev) => prev ? { ...prev, maxStockLevel: e.target.value } : prev)} />
                              </div>
                              <div className="col-md-3">
                                <label className="erp-label">Safety Stock</label>
                                <input type="number" className="form-control erp-input" value={editForm.safetyStock} onChange={(e) => setEditForm((prev) => prev ? { ...prev, safetyStock: e.target.value } : prev)} />
                              </div>
                              <div className="col-md-3">
                                <label className="erp-label">Lead Time (days)</label>
                                <input type="number" className="form-control erp-input" value={editForm.leadTimeDays} onChange={(e) => setEditForm((prev) => prev ? { ...prev, leadTimeDays: e.target.value } : prev)} />
                              </div>
                              <div className="col-md-3">
                                <label className="erp-label">Avg Sales</label>
                                <input type="number" className="form-control erp-input" value={editForm.averageDailySales} onChange={(e) => setEditForm((prev) => prev ? { ...prev, averageDailySales: e.target.value } : prev)} />
                              </div>
                            </div>
                            <div className="row g-2 mb-3 align-items-end">
                              <div className="col-md-4">
                                <label className="erp-label">Serial Prefix</label>
                                <input className="form-control erp-input" value={editForm.serialPrefix} onChange={(e) => setEditForm((prev) => prev ? { ...prev, serialPrefix: e.target.value } : prev)} />
                              </div>
                              <div className="col-md-4 pb-1">
                                <div className="form-check form-switch">
                                  <input className="form-check-input" type="checkbox" id="lotTrackCheck" checked={editForm.isLotTracked} onChange={(e) => setEditForm((prev) => prev ? { ...prev, isLotTracked: e.target.checked } : prev)} />
                                  <label className="form-check-label erp-label mt-1" htmlFor="lotTrackCheck">Require Lot Tracking</label>
                                </div>
                              </div>
                              <div className="col-md-4 text-end">
                                <button type="submit" className="erp-btn btn btn-primary w-100">Commit Changes</button>
                              </div>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                    
                    {/* RIGHT SIDE PANEL OF DIALOG: INVENTORY LEVELS */}
                    <div className="col-md-4 bg-light p-4">
                      <div className="d-flex flex-column gap-3 mb-4">
                        <div className="erp-kpi-box">
                          <span className="erp-kpi-label">Global On-Hand Stock</span>
                          <span className="erp-kpi-value text-primary">{totalStock(detailItem.id)}</span>
                        </div>
                        <div className="erp-kpi-box">
                          <span className="erp-kpi-label">Valuation Rate</span>
                          <span className="erp-kpi-value">{Number(detailItem.price).toFixed(2)}</span>
                        </div>
                      </div>

                      <h6 className="erp-section-title">Storage Locations & Lots</h6>
                      <div className="erp-lot-list">
                        {detailInventoryRows.length === 0 ? (
                          <div className="text-muted small text-center py-4 border rounded bg-white">No active lots or storage data</div>
                        ) : (
                          detailInventoryRows.map((row) => (
                            <div key={row.id} className="erp-lot-row">
                              <div>
                                <div className="fw-bold font-monospace text-dark">{row.lotNumber || "UNASSIGNED"}</div>
                                <div className="erp-text-muted small">{row.warehouseName || "Unknown Location"}</div>
                              </div>
                              <div className="fw-bold fs-5 text-dark font-monospace">{row.quantity}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CREATE SKU MODAL */}
      {showCreateForm && (
        <div className="erp-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="erp-dialog erp-dialog-lg">
            <div className="erp-dialog-header">
              <h5 className="m-0 fw-bold">Item Master Registration</h5>
              <button className="btn-close btn-close-white" onClick={() => setShowCreateForm(false)}></button>
            </div>
            <div className="erp-dialog-body">
              <form onSubmit={handleCreateProduct}>
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="erp-label">Item Code <span className="text-danger">*</span></label>
                    <input className="form-control erp-input" placeholder="e.g. RM-1001" value={productForm.itemCode} onChange={(e) => setProductForm({ ...productForm, itemCode: e.target.value })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Barcode</label>
                    <input className="form-control erp-input font-monospace" placeholder="Scan..." value={productForm.barcode} onChange={(e) => handleBarcodeChange(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Category</label>
                    <input className="form-control erp-input" placeholder="General" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="erp-label">Item Description <span className="text-danger">*</span></label>
                  <textarea className="form-control erp-input" rows="2" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-3">
                    <label className="erp-label">Unit Price</label>
                    <input type="number" step="0.01" className="form-control erp-input text-end" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-3">
                    <label className="erp-label">UOM (Unit)</label>
                    <input className="form-control erp-input" placeholder="NOS" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <label className="erp-label">Item Type</label>
                    <select className="form-select erp-input" value={productForm.itemType} onChange={(e) => setProductForm({ ...productForm, itemType: e.target.value })}>
                      <option>Purchased</option>
                      <option>Manufactured</option>
                      <option>Service</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="erp-label">Default Bin Location</label>
                    <input className="form-control erp-input" placeholder="e.g. A1-B2" value={productForm.warehouseLocation} onChange={(e) => setProductForm({ ...productForm, warehouseLocation: e.target.value })} />
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <label className="erp-label">Max Stock Level</label>
                    <input type="number" className="form-control erp-input" value={productForm.maxStockLevel} onChange={(e) => setProductForm({ ...productForm, maxStockLevel: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-3">
                    <label className="erp-label">Safety Stock</label>
                    <input type="number" className="form-control erp-input" value={productForm.safetyStock} onChange={(e) => setProductForm({ ...productForm, safetyStock: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-3">
                    <label className="erp-label">Lead Time (Days)</label>
                    <input type="number" className="form-control erp-input" value={productForm.leadTimeDays} onChange={(e) => setProductForm({ ...productForm, leadTimeDays: Number(e.target.value) })} />
                  </div>
                  <div className="col-md-3">
                    <label className="erp-label">Avg Daily Sales</label>
                    <input type="number" className="form-control erp-input" value={productForm.averageDailySales} onChange={(e) => setProductForm({ ...productForm, averageDailySales: Number(e.target.value) })} />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center bg-light p-3 border rounded">
                  <div className="d-flex gap-4">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="createLotTrack" checked={productForm.isLotTracked} onChange={(e) => setProductForm({ ...productForm, isLotTracked: e.target.checked })} />
                      <label className="form-check-label erp-label mt-1" htmlFor="createLotTrack">Enable Lot Tracking</label>
                    </div>
                    <div style={{ width: "150px" }}>
                      <input className="form-control form-control-sm erp-input" placeholder="Serial Prefix" value={productForm.serialPrefix} onChange={(e) => setProductForm({ ...productForm, serialPrefix: e.target.value })} disabled={!productForm.isLotTracked} />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" className="erp-btn btn btn-light border" onClick={() => setShowCreateForm(false)}>Discard</button>
                    <button type="submit" className="erp-btn btn btn-primary">Create Item Master</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI FAB */}
      <div onClick={() => navigate('/local-ai')} className="ai-fab shadow-lg">
        <span className="fw-bold">AI</span>
      </div>

      <style>{`
        /* --- ERP THEME CSS --- */
        :root {
          --erp-primary: #0f4c81; /* Classic Corporate Blue */
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
          font-size: 0.85rem; /* Standard dense ERP text size */
        }

        .erp-text-muted { color: var(--erp-text-muted) !important; }
        
        /* Top Navigation */
        .erp-topbar {
          background-color: #1a252f;
          height: 48px;
          border-bottom: 3px solid var(--erp-primary);
        }
        .erp-status-dot {
          width: 8px; height: 8px; border-radius: 50%; display: inline-block;
        }

        /* Panels and Cards */
        .erp-panel {
          background: var(--erp-surface);
          border: 1px solid var(--erp-border);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          overflow: hidden;
        }
        .erp-panel-header {
          background-color: #f8f9fa;
          border-bottom: 1px solid var(--erp-border);
          padding: 10px 16px;
          font-weight: 600;
          color: #34495e;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Typography & Labels */
        .erp-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 4px;
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
          font-weight: 500;
          letter-spacing: 0.2px;
          padding: 6px 12px;
        }

        /* Data Table */
        .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
        .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
        .erp-table { font-size: 0.8rem; }
        .erp-table thead th {
          background-color: #eceff1;
          color: #455a64;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #cfd8dc;
          padding: 8px 12px;
        }
        .erp-table tbody td {
          padding: 8px 12px;
          vertical-align: middle;
          border-color: #eceff1;
        }
        .table-warning { background-color: #fff8e1 !important; }

        /* Custom Lot Tags */
        .erp-lot-tag {
          background: #f1f3f4;
          border: 1px solid #dcdcdc;
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 0.75rem;
          display: inline-block;
          min-width: 80px;
        }
        .erp-lot-tag-wh {
          font-size: 0.65rem;
          color: var(--erp-text-muted);
        }

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

        /* KPIs & Detail Meta */
        .erp-meta-label { font-size: 0.7rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 600; }
        .erp-meta-value { font-size: 0.9rem; font-weight: 500; color: #212529; }
        .erp-edit-box { background: #f8f9fa; border: 1px dashed #b0bec5; padding: 16px; border-radius: 4px; }
        
        .erp-kpi-box {
          background: white; border: 1px solid var(--erp-border);
          padding: 12px 16px; border-left: 4px solid var(--erp-primary);
          border-radius: 3px;
        }
        .erp-kpi-label { display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 600; }
        .erp-kpi-value { display: block; font-size: 1.5rem; font-weight: 700; }
        
        .erp-lot-list { display: flex; flex-direction: column; gap: 8px; }
        .erp-lot-row {
          display: flex; justify-content: space-between; align-items: center;
          background: white; border: 1px solid var(--erp-border);
          padding: 8px 12px; border-radius: 3px;
        }

        /* FAB */
        .ai-fab {
          position: fixed; bottom: 30px; right: 30px; width: 50px; height: 50px;
          background: var(--erp-primary); color: #fff; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: 0.2s; z-index: 1000; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          border: 2px solid white;
        }
        .ai-fab:hover { transform: scale(1.05); background: #1565c0; }
        
        .erp-alert { border-radius: 3px; font-size: 0.85rem; border: 1px solid transparent; }
      `}</style>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100" style={{backgroundColor: "#eef2f5", color: "#263238"}}>
      <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
      <span className="text-uppercase small fw-bold" style={{letterSpacing: '1px'}}>Loading Master Data...</span>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{backgroundColor: "#eef2f5"}}>
      <div className="text-center p-5 bg-white border rounded shadow-sm" style={{maxWidth: '400px', borderColor: '#cfd8dc'}}>
        <div className="fs-1 mb-3 text-danger">🔌</div>
        <h5 className="fw-bold text-uppercase" style={{letterSpacing: '0.5px', color: '#37474f'}}>Database Disconnected</h5>
        <p className="small text-muted mb-4">The ERP client lost connection to the backend gateway. Please check your network.</p>
        <button className="btn btn-primary w-100 fw-bold" style={{borderRadius: '3px'}} onClick={onRetry}>Attempt Reconnection</button>
      </div>
    </div>
  );
}