import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/apiClient";
import { smartErpApi } from "../services/smartErpApi";

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
  const [productForm, setProductForm] = useState({
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
  const [activeItem, setActiveItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [stockForm, setStockForm] = useState({ warehouseId: "", quantity: 0, lotNumber: "", scannerDeviceId: "SCN-01" });

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
      // Only send fields that backend expects
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
      
      const res = await api.post("/smart-erp/products", payload);
      const created = res.data;
      setMessage({ text: "SKU Registered Successfully", type: "success" });
      setProductForm({
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
      // add new item to state so table updates immediately
      if (created) setItems((prev) => [...prev, created]);
    } catch (err) {
      // Show detailed error message from backend
      const errorMsg = err?.response?.data?.message || err?.response?.data || "Product registration failed.";
      setMessage({ text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg, type: "danger" });
      console.error("Product creation error:", err.response?.data);
    }
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
      setMessage({ text: `Inbound Complete: ${activeItem.itemCode}`, type: "success" });
      setActiveItem(null);
      setStockForm({ warehouseId: "", quantity: 0, lotNumber: "", scannerDeviceId: "SCN-01" });
      loadAllData();
    } catch (err) {
      setMessage({ text: "Stock entry failed.", type: "danger" });
    }
  };

  const totalStock = (itemId) => inventory
    .filter((i) => i.itemId === itemId)
    .reduce((sum, i) => sum + Number(i.quantity || 0), 0);

  const createPoForItem = async (item) => {
    const currentStock = totalStock(item.id);
    const maxLevel = item.maxStockLevel || 1000; // use item's max stock level
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

  const warehouseNameById = (id) => warehouses.find((w) => Number(w.id) === Number(id))?.name || `WH-${id}`;

  if (isOffline) return <ErrorState onRetry={loadAllData} />;
  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#F8FAFC", fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <nav className="navbar navbar-dark bg-dark px-4 shadow-sm py-3">
        <div className="container-fluid text-center">
          <span className="navbar-brand fw-bold tracking-tighter mx-auto">
            NODE<span className="text-primary">.STOCK</span>
          </span>
        </div>
      </nav>

      <div className="container py-5">
        
        {message.text && (
          <div className={`alert alert-${message.type} border-0 shadow-sm mb-4 d-flex justify-content-between align-items-center`}>
            <span>{message.text}</span>
            <button className="btn-close" onClick={() => setMessage({ text: "", type: "" })}></button>
          </div>
        )}

        <div className="row g-4">
          {/* LEFT: PRODUCT REGISTRATION */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: "20px" }}>
              <h6 className="fw-bold mb-3 text-uppercase small text-muted">Register New SKU</h6>
              <form onSubmit={handleCreateProduct}>
                <div className="mb-2">
                  <label className="form-label">Item Code</label>
                  <input className="form-control" placeholder="Item Code" value={productForm.itemCode} onChange={(e) => setProductForm({ ...productForm, itemCode: e.target.value })} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" placeholder="Description" rows="2" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Barcode</label>
                  <input className="form-control" placeholder="Barcode" value={productForm.barcode} onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })} />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-3">
                    <label className="form-label">Price</label>
                    <input type="number" className="form-control" placeholder="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                  </div>
                  <div className="col-3">
                    <label className="form-label">Unit</label>
                    <input className="form-control" placeholder="NOS" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
                  </div>
                  <div className="col-3">
                    <label className="form-label">Category</label>
                    <input className="form-control" placeholder="General" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                  </div>
                  <div className="col-3">
                    <label className="form-label">Serial Prefix</label>
                    <input className="form-control" placeholder="Serial" value={productForm.serialPrefix} onChange={(e) => setProductForm({ ...productForm, serialPrefix: e.target.value })} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Warehouse Location</label>
                  <input className="form-control" placeholder="Auto-generated or location" value={productForm.warehouseLocation} onChange={(e) => setProductForm({ ...productForm, warehouseLocation: e.target.value })} />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <label className="form-label">Item Type</label>
                    <select className="form-select" value={productForm.itemType} onChange={(e) => setProductForm({ ...productForm, itemType: e.target.value })}>
                      <option>Purchased</option>
                      <option>Manufactured</option>
                      <option>Service</option>
                    </select>
                  </div>
                  <div className="col-4">
                    <label className="form-label">Max Stock Level</label>
                    <input type="number" className="form-control" placeholder="0" value={productForm.maxStockLevel} onChange={(e) => setProductForm({ ...productForm, maxStockLevel: Number(e.target.value) })} />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Safety Stock</label>
                    <input type="number" className="form-control" placeholder="0" value={productForm.safetyStock} onChange={(e) => setProductForm({ ...productForm, safetyStock: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label">Lead Time (days)</label>
                    <input type="number" className="form-control" placeholder="0" value={productForm.leadTimeDays} onChange={(e) => setProductForm({ ...productForm, leadTimeDays: Number(e.target.value) })} />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Average Daily Sales</label>
                    <input type="number" className="form-control" placeholder="0" value={productForm.averageDailySales} onChange={(e) => setProductForm({ ...productForm, averageDailySales: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-check form-switch mb-3 small">
                  <input className="form-check-input" type="checkbox" checked={productForm.isLotTracked} onChange={(e) => setProductForm({ ...productForm, isLotTracked: e.target.checked })} />
                  <label className="form-check-label">Enable Lot Tracking</label>
                </div>
                <button className="btn btn-primary w-100 fw-bold">Add to System</button>
              </form>
            </div>
          </div>

          {/* RIGHT: INVENTORY TABLE */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted small text-uppercase">
                    <th className="ps-4">Product</th>
                    <th>Barcode</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Value</th>
                    <th>Stock</th>
                    <th>PO</th>
                    <th className="text-end pe-4">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className={`${totalStock(item.id) < 1000 ? 'table-warning' : ''}`}> 
                      <td className="ps-4">
                        <div className="fw-bold">{item.itemCode}</div>
                        <div className="small text-muted">{item.description}</div>
                      </td>
                      <td>{item.barcode || '-'}</td>
                      <td>{item.category}</td>
                      <td>{item.itemType || '-'}</td>
                      <td>{item.warehouseLocation}</td>
                      <td>{item.price}</td>
                      <td className={`fw-bold ${totalStock(item.id) < 5 ? 'text-danger' : 'text-dark'}`}>
                        {totalStock(item.id)}
                      </td>
                      <td>
                        {poMap[item.id] > 0 ? `PO pending: ${poMap[item.id]}` : ''}
                        {totalStock(item.id) < (item.maxStockLevel || 1000) && !poMap[item.id] && (
                          <button
                            className="btn btn-sm btn-outline-warning ms-2"
                            onClick={() => createPoForItem(item)}
                          >Create PO</button>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <div className="btn-group shadow-sm">
                          <button className="btn btn-sm btn-light border" onClick={() => setDetailItem(item)}>Details</button>
                          <button className="btn btn-sm btn-dark" onClick={() => setActiveItem(item)}>Restock</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {(activeItem || detailItem) && (
        <div className="modal d-block" style={{ background: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(8px)" }}>
          <div className={`modal-dialog modal-dialog-centered ${detailItem ? 'modal-lg' : 'modal-md'}`}>
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              
              {activeItem && (
                <div className="p-4">
                  <div className="d-flex justify-content-between mb-4 border-bottom pb-2">
                    <h5 className="fw-bold m-0">Inbound: {activeItem.itemCode}</h5>
                    <button className="btn-close" onClick={() => setActiveItem(null)}></button>
                  </div>
                  <form onSubmit={handleReceiveStock}>
                    <select className="form-select mb-3" value={stockForm.warehouseId} onChange={(e) => setStockForm({ ...stockForm, warehouseId: e.target.value })} required>
                      <option value="">Select Warehouse...</option>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <div className="row g-2 mb-4">
                      <div className="col-6"><input type="number" className="form-control" placeholder="Qty" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required /></div>
                      <div className="col-6"><input className="form-control" placeholder="Lot #" value={stockForm.lotNumber} onChange={(e) => setStockForm({ ...stockForm, lotNumber: e.target.value })} required={activeItem.isLotTracked} /></div>
                    </div>
                    <button className="btn btn-primary w-100 fw-bold py-2">Confirm Receipt</button>
                  </form>
                </div>
              )}

              {detailItem && (
                <div>
                  <div className="p-4 bg-dark text-white d-flex justify-content-between">
                    <div><h4 className="fw-bold m-0">{detailItem.itemCode}</h4><p className="m-0 opacity-50">{detailItem.description}</p></div>
                    <button className="btn-close btn-close-white" onClick={() => setDetailItem(null)}></button>
                  </div>
                  <div className="p-4">
                    <div className="row g-3 mb-4 text-center">
                      <DetailBox label="Global Stock" value={totalStock(detailItem.id)} icon="📦" />
                      <DetailBox label="Item Value" value={detailItem.price} icon="⚖️" />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-4"><strong>Barcode:</strong> {detailItem.barcode || '-'}</div>
                      <div className="col-md-4"><strong>Type:</strong> {detailItem.itemType || '-'}</div>
                      <div className="col-md-4"><strong>Category:</strong> {detailItem.category || '-'}</div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-4"><strong>Serial Prefix:</strong> {detailItem.serialPrefix || '-'}</div>
                      <div className="col-md-4"><strong>Max Stock:</strong> {detailItem.maxStockLevel}</div>
                      <div className="col-md-4"><strong>Safety Stock:</strong> {detailItem.safetyStock}</div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-md-4"><strong>Lead Time (days):</strong> {detailItem.leadTimeDays}</div>
                      <div className="col-md-4"><strong>Avg Daily Sales:</strong> {detailItem.averageDailySales}</div>
                    </div>
                    <table className="table table-sm border rounded">
                      <thead className="table-light"><tr><th className="ps-3">Warehouse</th><th>Lot</th><th className="text-end pe-3">Qty</th></tr></thead>
                      <tbody>
                        {inventory.filter(i => i.itemId === detailItem.id).map(row => (
                          <tr key={row.id}>
                            <td className="ps-3">{warehouseNameById(row.warehouseId)}</td>
                            <td>{row.lotNumber || '-'}</td>
                            <td className="text-end pe-3 fw-bold text-primary">{row.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI FAB */}
      <div onClick={() => navigate('/local-ai')} className="ai-fab shadow-lg">
        <span className="fw-bold">AI</span>
      </div>

      <style>{`
        .ai-fab {
          position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px;
          background: #000; color: #fff; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: 0.3s; z-index: 1000;
        }
        .ai-fab:hover { transform: scale(1.1); }
      `}</style>
    </div>
  );
}

function DetailBox({ label, value, icon }) {
  return (
    <div className="col-6">
      <div className="p-3 border rounded-4 bg-light">
        <span className="fs-4 d-block mb-1">{icon}</span>
        <div className="text-muted small text-uppercase fw-bold" style={{fontSize: '10px'}}>{label}</div>
        <div className="fw-bold fs-5">{value}</div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-white">
      <div className="spinner-border text-primary mb-3"></div>
      <span className="text-uppercase small tracking-widest fw-bold">Syncing Inventory...</span>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="text-center p-5 bg-white shadow rounded-4" style={{maxWidth: '400px'}}>
        <div className="fs-1 mb-3">📡</div>
        <h5 className="fw-bold">Link Offline</h5>
        <button className="btn btn-dark w-100 mt-3" onClick={onRetry}>Retry Sync</button>
      </div>
    </div>
  );
}