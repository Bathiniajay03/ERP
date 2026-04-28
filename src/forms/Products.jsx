// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../services/apiClient";
// import { smartErpApi } from "../services/smartErpApi";

// const createEmptyProductForm = () => ({
//   itemCode: "",
//   description: "",
//   barcode: "",
//   category: "General",
//   unit: "NOS",
//   price: 0,
//   warehouseLocation: "",
//   isLotTracked: false,
//   serialPrefix: "",
//   itemType: "Purchased",
//   maxStockLevel: 0,
//   safetyStock: 0,
//   leadTimeDays: 0,
//   averageDailySales: 0
// });

// export default function SmartERP() {
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
//   const [vendors, setVendors] = useState([]);
//   const [inventory, setInventory] = useState([]);
//   const [poMap, setPoMap] = useState({}); // itemId -> pending PO qty
//   const [isOffline, setIsOffline] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ text: "", type: "" });

//   const navigate = useNavigate();

//   // Form States
//   const [productForm, setProductForm] = useState(createEmptyProductForm);
//   const [activeItem, setActiveItem] = useState(null);
//   const [detailItem, setDetailItem] = useState(null);
//   const [editForm, setEditForm] = useState(null);
//   const [isEditingProduct, setIsEditingProduct] = useState(false);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [stockForm, setStockForm] = useState({ warehouseId: "", quantity: 0, lotNumber: "", scannerDeviceId: "SCN-01" });

//   const warehouseNameById = useCallback((id) => {
//     if (id == null) return "General warehouse";
//     const warehouse = warehouses.find((w) => Number(w.id) === Number(id));
//     return warehouse?.name || `WH-${id}`;
//   }, [warehouses]);

//   const loadAllData = async () => {
//     setLoading(true);
//     try {
//       const [resItems, resWh, resInv, resPO, resVendors] = await Promise.all([
//         api.get("/stock/items"),
//         api.get("/warehouses"),
//         api.get("/stock/inventory"),
//         smartErpApi.getPurchaseOrders(),
//         smartErpApi.getVendors()
//       ]);
//       setItems(resItems.data || []);
//       setWarehouses(resWh.data || []);
//       setInventory(resInv.data || []);
//       setVendors(resVendors.data || []);
//       // build map of pending qty per item
//       const map = {};
//       (resPO.data || []).forEach(po => {
//         (po.Lines || []).forEach(line => {
//           if (!map[line.ItemId]) map[line.ItemId] = 0;
//           map[line.ItemId] += line.PendingQuantity || 0;
//         });
//       });
//       setPoMap(map);
//       setIsOffline(false);
//     } catch (err) {
//       setIsOffline(true);
//       setMessage({ text: "Gateway Connectivity Lost", type: "danger" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadAllData();
//     const interval = setInterval(loadAllData, 60000);
//     return () => clearInterval(interval);
//   }, []);

//   const handleCreateProduct = async (e) => {
//     e.preventDefault();
//     try {
//       const payload = {
//         itemCode: productForm.itemCode,
//         description: productForm.description,
//         barcode: productForm.barcode,
//         category: productForm.category,
//         unit: productForm.unit,
//         price: Number(productForm.price),
//         warehouseLocation: productForm.warehouseLocation,
//         isLotTracked: productForm.isLotTracked,
//         serialPrefix: productForm.serialPrefix || null,
//         maxStockLevel: Number(productForm.maxStockLevel),
//         safetyStock: Number(productForm.safetyStock),
//         leadTimeDays: Number(productForm.leadTimeDays),
//         averageDailySales: Number(productForm.averageDailySales)
//       };

//       await api.post("/smart-erp/products", payload);
//       setMessage({ text: "Item Created Successfully", type: "success" });
//       setProductForm(createEmptyProductForm());
//       setShowCreateForm(false);
//       await loadAllData();
//     } catch (err) {
//       const errorMsg = err?.response?.data?.message || err?.response?.data || "Product registration failed.";
//       setMessage({ text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg, type: "danger" });
//       console.error("Product creation error:", err.response?.data);
//     }
//   };

//   const handleBarcodeChange = (value) => {
//     setProductForm((prev) => {
//       const trimmedDescription = prev.description?.trim() ?? "";
//       const autoDescription = value ? `ITEM-${value}` : "";
//       const shouldAutoFill = !trimmedDescription && autoDescription;
//       return {
//         ...prev,
//         barcode: value,
//         description: shouldAutoFill ? autoDescription : prev.description,
//         isLotTracked: prev.isLotTracked || Boolean(autoDescription)
//       };
//     });
//   };

//   const handleReceiveStock = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await api.post("/stock/in", {
//         itemId: activeItem.id,
//         warehouseId: Number(stockForm.warehouseId),
//         quantity: Number(stockForm.quantity),
//         lotNumber: activeItem?.isLotTracked ? stockForm.lotNumber.trim() : null,
//         scannerDeviceId: stockForm.scannerDeviceId
//       });
//       const lotUsed = response?.data?.lotNumber
//         || (activeItem?.isLotTracked ? stockForm.lotNumber.trim() : "")
//         || "General lot";
//       setMessage({ text: `Stock Added to ${lotUsed} (${activeItem?.itemCode})`, type: "success" });
//       setActiveItem(null);
//       setStockForm({ warehouseId: "", quantity: 0, lotNumber: "", scannerDeviceId: "SCN-01" });
//       await loadAllData();
//     } catch (err) {
//       setMessage({ text: "Stock entry failed.", type: "danger" });
//     }
//   };

//   const handleEditSubmit = async (e) => {
//     e.preventDefault();
//     if (!detailItem || !editForm) return;
//     try {
//       const payload = {
//         itemCode: editForm.itemCode.trim(),
//         description: editForm.description.trim(),
//         barcode: editForm.barcode.trim(),
//         category: editForm.category.trim(),
//         unit: editForm.unit.trim(),
//         price: Number(editForm.price),
//         warehouseLocation: editForm.warehouseLocation.trim(),
//         isLotTracked: Boolean(editForm.isLotTracked),
//         serialPrefix: editForm.serialPrefix.trim(),
//         maxStockLevel: Number(editForm.maxStockLevel),
//         safetyStock: Number(editForm.safetyStock),
//         leadTimeDays: Number(editForm.leadTimeDays),
//         averageDailySales: Number(editForm.averageDailySales)
//       };
//       const response = await api.put(`/smart-erp/products/${detailItem.id}`, payload);
//       setDetailItem(response.data);
//       setMessage({ text: "Item updated successfully", type: "success" });
//       setIsEditingProduct(false);
//       await loadAllData();
//     } catch (err) {
//       const errorMsg = err?.response?.data?.message || err?.response?.data || "Item update failed.";
//       setMessage({ text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg, type: "danger" });
//     }
//   };

//   const totalStock = (itemId) => inventory
//     .filter((i) => i.itemId === itemId)
//     .reduce((sum, i) => sum + Number(i.quantity || i.Quantity || 0), 0);

//   const createPoForItem = async (item) => {
//     const currentStock = totalStock(item.id);
//     const maxLevel = item.maxStockLevel || 1000;
//     const qty = Math.max(0, maxLevel - currentStock);
//     if (qty <= 0) {
//       setMessage({ text: "Stock is already at or above max level", type: "info" });
//       return;
//     }
//     try {
//       const warehouseId = warehouses[0]?.id || 0;
//       const supplierName = vendors[0]?.name || `Auto Reorder - ${item.category || 'General'}`;
//       await smartErpApi.createPurchaseOrder({
//         reason: `Manual reorder below ${maxLevel}`,
//         vendorId: vendors[0]?.id || null,
//         supplierName,
//         lines: [{ itemId: item.id, warehouseId, quantity: qty }]
//       });
//       setMessage({ text: "Purchase order created", type: "success" });
//       // refresh POs
//       const resPO = await smartErpApi.getPurchaseOrders();
//       const map = {};
//       (resPO.data || []).forEach(po => {
//         (po.lines || po.Lines || []).forEach(line => {
//           const itemId = line.itemId ?? line.ItemId;
//           const pendingQty = line.pendingQuantity ?? line.PendingQuantity ?? 0;
//           if (!map[itemId]) map[itemId] = 0;
//           map[itemId] += pendingQty;
//         });
//       });
//       setPoMap(map);
//     } catch (e) {
//       const errorMsg = e?.response?.data?.message || e?.response?.data || "Failed to create PO";
//       setMessage({ text: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg, type: "danger" });
//     }
//   };

//   const detailInventoryRows = useMemo(() => {
//     if (!detailItem) return [];
//     const grouping = {};
//     inventory
//       .filter((i) => i.itemId === detailItem.id || i.ItemId === detailItem.id)
//       .forEach((row) => {
//         const warehouseId = row.warehouseId ?? row.WarehouseId;
//         const lotRaw = row.lotNumber ?? row.LotNumber ?? "general";
//         const lotNumber = lotRaw === "-" ? "general" : lotRaw;
//         const key = `${warehouseId}-${lotNumber}`;
//         if (!grouping[key]) {
//           grouping[key] = {
//             id: key,
//             warehouseId,
//             warehouseName: warehouseNameById(warehouseId),
//             lotNumber,
//             quantity: 0
//           };
//         }
//         grouping[key].quantity += Number(row.quantity ?? row.Quantity ?? 0);
//       });
//     return Object.values(grouping).sort((a, b) =>
//       (a.warehouseName || "").localeCompare(b.warehouseName || "") ||
//       (a.lotNumber || "").localeCompare(b.lotNumber || "")
//     );
//   }, [detailItem, inventory, warehouseNameById]);

//   useEffect(() => {
//     if (!detailItem) {
//       setEditForm(null);
//       setIsEditingProduct(false);
//       return;
//     }
//     setEditForm({
//       itemCode: detailItem.itemCode ?? "",
//       description: detailItem.description ?? "",
//       barcode: detailItem.barcode ?? "",
//       category: detailItem.category ?? "General",
//       unit: detailItem.unit ?? detailItem.UOM ?? "NOS",
//       price: detailItem.price ?? 0,
//       warehouseLocation: detailItem.warehouseLocation ?? "",
//       isLotTracked: detailItem.isLotTracked ?? false,
//       serialPrefix: detailItem.serialPrefix ?? "",
//       maxStockLevel: detailItem.maxStockLevel ?? 0,
//       safetyStock: detailItem.safetyStock ?? 0,
//       leadTimeDays: detailItem.leadTimeDays ?? 0,
//       averageDailySales: detailItem.averageDailySales ?? 0
//     });
//   }, [detailItem]);

//   if (isOffline) return <ErrorState onRetry={loadAllData} />;
//   if (loading && items.length === 0) return <LoadingState />;

//   return (
//     <div className="erp-app-wrapper min-vh-100">
      
//       {/* HEADER */}
//       <nav className="erp-topbar d-flex justify-content-end align-items-center px-4">
//         <div className="d-flex gap-3 align-items-center text-white-50 small">
//           <span>Connected: Gateway Active</span>
//           <span className="erp-status-dot bg-success"></span>
//         </div>
//       </nav>

//       <div className="container-fluid px-4 py-3">
        
//         {message.text && (
//           <div className={`alert alert-${message.type} erp-alert d-flex justify-content-between align-items-center py-2 mb-3`}>
//             <span className="fw-semibold">{message.text}</span>
//             <button className="btn-close btn-sm" onClick={() => setMessage({ text: "", type: "" })}></button>
//           </div>
//         )}

//         <div className="row g-3">
//           {/* LEFT: SYSTEM CONTROLS */}
//           <div className="col-lg-3 col-xl-2">
//             <div className="erp-panel h-100">
//               <div className="erp-panel-header">
//                 System Controls
//               </div>
//               <div className="p-3">
//                 <button className="erp-btn btn btn-primary w-100 shadow-sm" onClick={() => setShowCreateForm(true)}>
//                   + Register New SKU
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT: INVENTORY DATA GRID */}
//           <div className="col-lg-9 col-xl-10">
//             <div className="erp-panel d-flex flex-column" style={{ height: "calc(100vh - 100px)" }}>
//               <div className="erp-panel-header d-flex justify-content-between align-items-center">
//                 <span>Inventory Master Data</span>
//                 <span className="badge bg-secondary">{items.length} Records</span>
//               </div>
//               <div className="erp-table-container flex-grow-1 overflow-auto">
//                 <table className="table erp-table table-hover table-bordered mb-0 align-middle">
//                   <thead>
//                     <tr>
//                       <th style={{ width: "30%" }}>Item Details</th>
//                       <th>Barcode</th>
//                       <th>Category</th>
//                       <th>Type</th>
//                       <th>Bin Location</th>
//                       <th className="text-end">Value</th>
//                       <th className="text-end">On Hand</th>
//                       <th>Procurement</th>
//                       <th className="text-center" style={{ width: "180px" }}>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {items.map((item) => {
//                       const stock = totalStock(item.id);
//                       const isLowStock = stock < (item.maxStockLevel || 1000);
//                       const isCritical = stock < 5;
                      
//                       return (
//                         <tr key={item.id} className={isLowStock ? "table-warning" : ""}> 
//                           <td>
//                             <div className="d-flex flex-column">
//                               <span className="fw-bold text-dark">{item.itemCode}</span>
//                               <span className="erp-text-muted text-truncate" style={{ maxWidth: "250px" }} title={item.description}>
//                                 {item.description}
//                               </span>
//                             </div>
//                           </td>
//                           <td className="font-monospace text-muted">{item.barcode || '---'}</td>
//                           <td>{item.category}</td>
//                           <td>{item.itemType || '---'}</td>
//                           <td>{item.warehouseLocation || '---'}</td>
//                           <td className="text-end font-monospace">{Number(item.price).toFixed(2)}</td>
//                           <td className={`text-end fw-bold font-monospace ${isCritical ? 'text-danger' : 'text-dark'}`}>
//                             {stock}
//                           </td>
//                           <td className="small">
//                             {poMap[item.id] > 0 ? (
//                               <span className="text-primary fw-bold">In Transit: {poMap[item.id]}</span>
//                             ) : isLowStock ? (
//                               <button
//                                 className="erp-btn btn btn-sm btn-warning text-dark py-0"
//                                 onClick={() => createPoForItem(item)}
//                               >
//                                 Draft PO
//                               </button>
//                             ) : (
//                               <span className="text-success">Optimal</span>
//                             )}
//                           </td>
//                           <td className="text-center">
//                             <div className="btn-group shadow-sm">
//                               <button className="erp-btn btn btn-light btn-sm border" onClick={() => setDetailItem(item)}>View</button>
//                               <button className="erp-btn btn btn-light btn-sm border" onClick={() => {
//                                 setDetailItem(item);
//                                 setIsEditingProduct(true);
//                               }}>Edit</button>
//                               <button className="erp-btn btn btn-dark btn-sm" onClick={() => setActiveItem(item)}>Recv</button>
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* MODALS - Styled as Enterprise Dialogs */}
//       {(activeItem || detailItem) && (
//         <div className="erp-modal-overlay">
//           <div className={`erp-dialog ${detailItem ? 'erp-dialog-lg' : 'erp-dialog-md'}`}>
            
//             {/* INBOUND STOCK DIALOG */}
//             {activeItem && (
//               <>
//                 <div className="erp-dialog-header">
//                   <h6 className="m-0 fw-bold">Inbound Receipt processing: {activeItem.itemCode}</h6>
//                   <button className="btn-close btn-close-white" onClick={() => setActiveItem(null)}></button>
//                 </div>
//                 <div className="erp-dialog-body">
//                   <form onSubmit={handleReceiveStock}>
//                     <div className="mb-3">
//                       <label className="erp-label">Destination Warehouse</label>
//                       <select className="form-select erp-input" value={stockForm.warehouseId} onChange={(e) => setStockForm({ ...stockForm, warehouseId: e.target.value })} required>
//                         <option value="">Select Target...</option>
//                         {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//                       </select>
//                     </div>
//                     <div className="row g-3 mb-4">
//                       <div className="col-6">
//                         <label className="erp-label">Receipt Qty</label>
//                         <input type="number" className="form-control erp-input font-monospace" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} required />
//                       </div>
//                       <div className="col-6">
//                         <label className="erp-label">Lot/Batch Number {activeItem.isLotTracked && <span className="text-danger">*</span>}</label>
//                         <input className="form-control erp-input font-monospace" placeholder="Scan or type..." value={stockForm.lotNumber} onChange={(e) => setStockForm({ ...stockForm, lotNumber: e.target.value })} required={activeItem.isLotTracked} disabled={!activeItem.isLotTracked} />
//                       </div>
//                     </div>
//                     <div className="d-flex justify-content-end gap-2">
//                       <button type="button" className="erp-btn btn btn-light border" onClick={() => setActiveItem(null)}>Cancel</button>
//                       <button type="submit" className="erp-btn btn btn-primary px-4">Post Receipt</button>
//                     </div>
//                   </form>
//                 </div>
//               </>
//             )}

//             {/* ITEM MASTER DETAILS DIALOG */}
//             {detailItem && (
//               <>
//                 <div className="erp-dialog-header d-flex justify-content-between align-items-center">
//                   <div>
//                     <h5 className="m-0 fw-bold">{detailItem.itemCode}</h5>
//                     <small className="opacity-75">{detailItem.description}</small>
//                   </div>
//                   <div className="d-flex gap-2 align-items-center">
//                     <button className="erp-btn btn btn-sm btn-outline-light" type="button" onClick={() => setIsEditingProduct((prev) => !prev)}>
//                       {isEditingProduct ? "Cancel Edit" : "Modify Master Data"}
//                     </button>
//                     <button className="btn-close btn-close-white ms-2" onClick={() => setDetailItem(null)}></button>
//                   </div>
//                 </div>
                
//                 <div className="erp-dialog-body p-0">
//                   <div className="row g-0">
//                     <div className="col-md-8 p-4 border-end">
//                       <h6 className="erp-section-title mb-3">Master Parameters</h6>
//                       <div className="row g-3 mb-4">
//                         <div className="col-sm-4"><div className="erp-meta-label">Barcode</div><div className="erp-meta-value font-monospace">{detailItem.barcode || 'N/A'}</div></div>
//                         <div className="col-sm-4"><div className="erp-meta-label">Item Type</div><div className="erp-meta-value">{detailItem.itemType || 'N/A'}</div></div>
//                         <div className="col-sm-4"><div className="erp-meta-label">Category</div><div className="erp-meta-value">{detailItem.category || 'N/A'}</div></div>
                        
//                         <div className="col-sm-4"><div className="erp-meta-label">Serial Prefix</div><div className="erp-meta-value font-monospace">{detailItem.serialPrefix || 'N/A'}</div></div>
//                         <div className="col-sm-4"><div className="erp-meta-label">Max Stock Level</div><div className="erp-meta-value">{detailItem.maxStockLevel}</div></div>
//                         <div className="col-sm-4"><div className="erp-meta-label">Safety Stock</div><div className="erp-meta-value">{detailItem.safetyStock}</div></div>
                        
//                         <div className="col-sm-4"><div className="erp-meta-label">Lead Time</div><div className="erp-meta-value">{detailItem.leadTimeDays} days</div></div>
//                         <div className="col-sm-4"><div className="erp-meta-label">Avg Daily Sales</div><div className="erp-meta-value">{detailItem.averageDailySales}</div></div>
//                         <div className="col-sm-4"><div className="erp-meta-label">Base Unit</div><div className="erp-meta-value">{detailItem.unit || detailItem.UOM}</div></div>
//                       </div>

//                       {isEditingProduct && editForm && (
//                         <div className="erp-edit-box mt-4">
//                           <h6 className="erp-section-title">Edit Master Data</h6>
//                           <form onSubmit={handleEditSubmit}>
//                             <div className="row g-2 mb-2">
//                               <div className="col-md-4">
//                                 <label className="erp-label">Item Code</label>
//                                 <input className="form-control erp-input" value={editForm.itemCode} onChange={(e) => setEditForm((prev) => prev ? { ...prev, itemCode: e.target.value } : prev)} required />
//                               </div>
//                               <div className="col-md-4">
//                                 <label className="erp-label">Description</label>
//                                 <input className="form-control erp-input" value={editForm.description} onChange={(e) => setEditForm((prev) => prev ? { ...prev, description: e.target.value } : prev)} required />
//                               </div>
//                               <div className="col-md-4">
//                                 <label className="erp-label">Barcode</label>
//                                 <input className="form-control erp-input" value={editForm.barcode} onChange={(e) => setEditForm((prev) => prev ? { ...prev, barcode: e.target.value } : prev)} />
//                               </div>
//                             </div>
//                             <div className="row g-2 mb-2">
//                               <div className="col-md-3">
//                                 <label className="erp-label">Category</label>
//                                 <input className="form-control erp-input" value={editForm.category} onChange={(e) => setEditForm((prev) => prev ? { ...prev, category: e.target.value } : prev)} />
//                               </div>
//                               <div className="col-md-3">
//                                 <label className="erp-label">Unit</label>
//                                 <input className="form-control erp-input" value={editForm.unit} onChange={(e) => setEditForm((prev) => prev ? { ...prev, unit: e.target.value } : prev)} />
//                               </div>
//                               <div className="col-md-3">
//                                 <label className="erp-label">Unit Price</label>
//                                 <input type="number" step="0.01" className="form-control erp-input" value={editForm.price} onChange={(e) => setEditForm((prev) => prev ? { ...prev, price: e.target.value } : prev)} />
//                               </div>
//                               <div className="col-md-3">
//                                 <label className="erp-label">Default Bin</label>
//                                 <input className="form-control erp-input" value={editForm.warehouseLocation} onChange={(e) => setEditForm((prev) => prev ? { ...prev, warehouseLocation: e.target.value } : prev)} />
//                               </div>
//                             </div>
//                             <div className="row g-2 mb-2">
//                               <div className="col-md-3">
//                                 <label className="erp-label">Max Stock</label>
//                                 <input type="number" className="form-control erp-input" value={editForm.maxStockLevel} onChange={(e) => setEditForm((prev) => prev ? { ...prev, maxStockLevel: e.target.value } : prev)} />
//                               </div>
//                               <div className="col-md-3">
//                                 <label className="erp-label">Safety Stock</label>
//                                 <input type="number" className="form-control erp-input" value={editForm.safetyStock} onChange={(e) => setEditForm((prev) => prev ? { ...prev, safetyStock: e.target.value } : prev)} />
//                               </div>
//                               <div className="col-md-3">
//                                 <label className="erp-label">Lead Time (days)</label>
//                                 <input type="number" className="form-control erp-input" value={editForm.leadTimeDays} onChange={(e) => setEditForm((prev) => prev ? { ...prev, leadTimeDays: e.target.value } : prev)} />
//                               </div>
//                               <div className="col-md-3">
//                                 <label className="erp-label">Avg Sales</label>
//                                 <input type="number" className="form-control erp-input" value={editForm.averageDailySales} onChange={(e) => setEditForm((prev) => prev ? { ...prev, averageDailySales: e.target.value } : prev)} />
//                               </div>
//                             </div>
//                             <div className="row g-2 mb-3 align-items-end">
//                               <div className="col-md-4">
//                                 <label className="erp-label">Serial Prefix</label>
//                                 <input className="form-control erp-input" value={editForm.serialPrefix} onChange={(e) => setEditForm((prev) => prev ? { ...prev, serialPrefix: e.target.value } : prev)} />
//                               </div>
//                               <div className="col-md-4 pb-1">
//                                 <div className="form-check form-switch">
//                                   <input className="form-check-input" type="checkbox" id="lotTrackCheck" checked={editForm.isLotTracked} onChange={(e) => setEditForm((prev) => prev ? { ...prev, isLotTracked: e.target.checked } : prev)} />
//                                   <label className="form-check-label erp-label mt-1" htmlFor="lotTrackCheck">Require Lot Tracking</label>
//                                 </div>
//                               </div>
//                               <div className="col-md-4 text-end">
//                                 <button type="submit" className="erp-btn btn btn-primary w-100">Commit Changes</button>
//                               </div>
//                             </div>
//                           </form>
//                         </div>
//                       )}
//                     </div>
                    
//                     {/* RIGHT SIDE PANEL OF DIALOG: INVENTORY LEVELS */}
//                     <div className="col-md-4 bg-light p-4">
//                       <div className="d-flex flex-column gap-3 mb-4">
//                         <div className="erp-kpi-box">
//                           <span className="erp-kpi-label">Global On-Hand Stock</span>
//                           <span className="erp-kpi-value text-primary">{totalStock(detailItem.id)}</span>
//                         </div>
//                         <div className="erp-kpi-box">
//                           <span className="erp-kpi-label">Valuation Rate</span>
//                           <span className="erp-kpi-value">{Number(detailItem.price).toFixed(2)}</span>
//                         </div>
//                       </div>

//                       <h6 className="erp-section-title">Storage Locations & Lots</h6>
//                       <div className="erp-lot-list">
//                         {detailInventoryRows.length === 0 ? (
//                           <div className="text-muted small text-center py-4 border rounded bg-white">No active lots or storage data</div>
//                         ) : (
//                           detailInventoryRows.map((row) => (
//                             <div key={row.id} className="erp-lot-row">
//                               <div>
//                                 <div className="fw-bold font-monospace text-dark">{row.lotNumber || "UNASSIGNED"}</div>
//                                 <div className="erp-text-muted small">{row.warehouseName || "Unknown Location"}</div>
//                               </div>
//                               <div className="fw-bold fs-5 text-dark font-monospace">{row.quantity}</div>
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* CREATE SKU MODAL */}
//       {showCreateForm && (
//         <div className="erp-modal-overlay" style={{ zIndex: 1100 }}>
//           <div className="erp-dialog erp-dialog-lg">
//             <div className="erp-dialog-header">
//               <h5 className="m-0 fw-bold">Item Master Registration</h5>
//               <button className="btn-close btn-close-white" onClick={() => setShowCreateForm(false)}></button>
//             </div>
//             <div className="erp-dialog-body">
//               <form onSubmit={handleCreateProduct}>
//                 <div className="row g-3 mb-3">
//                   <div className="col-md-4">
//                     <label className="erp-label">Item Code <span className="text-danger">*</span></label>
//                     <input className="form-control erp-input" placeholder="e.g. RM-1001" value={productForm.itemCode} onChange={(e) => setProductForm({ ...productForm, itemCode: e.target.value })} required />
//                   </div>
//                   <div className="col-md-4">
//                     <label className="erp-label">Barcode</label>
//                     <input className="form-control erp-input font-monospace" placeholder="Scan..." value={productForm.barcode} onChange={(e) => handleBarcodeChange(e.target.value)} />
//                   </div>
//                   <div className="col-md-4">
//                     <label className="erp-label">Category</label>
//                     <input className="form-control erp-input" placeholder="General" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
//                   </div>
//                 </div>
                
//                 <div className="mb-3">
//                   <label className="erp-label">Item Description <span className="text-danger">*</span></label>
//                   <textarea className="form-control erp-input" rows="2" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
//                 </div>

//                 <div className="row g-3 mb-3">
//                   <div className="col-md-3">
//                     <label className="erp-label">Unit Price</label>
//                     <input type="number" step="0.01" className="form-control erp-input text-end" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
//                   </div>
//                   <div className="col-md-3">
//                     <label className="erp-label">UOM (Unit)</label>
//                     <input className="form-control erp-input" placeholder="NOS" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
//                   </div>
//                   <div className="col-md-3">
//                     <label className="erp-label">Item Type</label>
//                     <select className="form-select erp-input" value={productForm.itemType} onChange={(e) => setProductForm({ ...productForm, itemType: e.target.value })}>
//                       <option>Purchased</option>
//                       <option>Manufactured</option>
//                       <option>Service</option>
//                     </select>
//                   </div>
//                   <div className="col-md-3">
//                     <label className="erp-label">Default Bin Location</label>
//                     <input className="form-control erp-input" placeholder="e.g. A1-B2" value={productForm.warehouseLocation} onChange={(e) => setProductForm({ ...productForm, warehouseLocation: e.target.value })} />
//                   </div>
//                 </div>

//                 <div className="row g-3 mb-4">
//                   <div className="col-md-3">
//                     <label className="erp-label">Max Stock Level</label>
//                     <input type="number" className="form-control erp-input" value={productForm.maxStockLevel} onChange={(e) => setProductForm({ ...productForm, maxStockLevel: Number(e.target.value) })} />
//                   </div>
//                   <div className="col-md-3">
//                     <label className="erp-label">Safety Stock</label>
//                     <input type="number" className="form-control erp-input" value={productForm.safetyStock} onChange={(e) => setProductForm({ ...productForm, safetyStock: Number(e.target.value) })} />
//                   </div>
//                   <div className="col-md-3">
//                     <label className="erp-label">Lead Time (Days)</label>
//                     <input type="number" className="form-control erp-input" value={productForm.leadTimeDays} onChange={(e) => setProductForm({ ...productForm, leadTimeDays: Number(e.target.value) })} />
//                   </div>
//                   <div className="col-md-3">
//                     <label className="erp-label">Avg Daily Sales</label>
//                     <input type="number" className="form-control erp-input" value={productForm.averageDailySales} onChange={(e) => setProductForm({ ...productForm, averageDailySales: Number(e.target.value) })} />
//                   </div>
//                 </div>

//                 <div className="d-flex justify-content-between align-items-center bg-light p-3 border rounded">
//                   <div className="d-flex gap-4">
//                     <div className="form-check form-switch">
//                       <input className="form-check-input" type="checkbox" id="createLotTrack" checked={productForm.isLotTracked} onChange={(e) => setProductForm({ ...productForm, isLotTracked: e.target.checked })} />
//                       <label className="form-check-label erp-label mt-1" htmlFor="createLotTrack">Enable Lot Tracking</label>
//                     </div>
//                     <div style={{ width: "150px" }}>
//                       <input className="form-control form-control-sm erp-input" placeholder="Serial Prefix" value={productForm.serialPrefix} onChange={(e) => setProductForm({ ...productForm, serialPrefix: e.target.value })} disabled={!productForm.isLotTracked} />
//                     </div>
//                   </div>
//                   <div className="d-flex gap-2">
//                     <button type="button" className="erp-btn btn btn-light border" onClick={() => setShowCreateForm(false)}>Discard</button>
//                     <button type="submit" className="erp-btn btn btn-primary">Create Item Master</button>
//                   </div>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* AI FAB */}
//       <div onClick={() => navigate('/local-ai')} className="ai-fab shadow-lg">
//         <span className="fw-bold">AI</span>
//       </div>

//       <style>{`
//         /* --- ERP THEME CSS --- */
//         :root {
//           --erp-primary: #0f4c81; /* Classic Corporate Blue */
//           --erp-bg: #eef2f5;
//           --erp-surface: #ffffff;
//           --erp-border: #cfd8dc;
//           --erp-text-main: #263238;
//           --erp-text-muted: #607d8b;
//         }

//         .erp-app-wrapper {
//           background-color: var(--erp-bg);
//           color: var(--erp-text-main);
//           font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
//           font-size: 0.85rem; /* Standard dense ERP text size */
//         }

//         .erp-text-muted { color: var(--erp-text-muted) !important; }
        
//         /* Top Navigation */
//         .erp-topbar {
//           background-color: #1a252f;
//           height: 48px;
//           border-bottom: 3px solid var(--erp-primary);
//         }
//         .erp-status-dot {
//           width: 8px; height: 8px; border-radius: 50%; display: inline-block;
//         }

//         /* Panels and Cards */
//         .erp-panel {
//           background: var(--erp-surface);
//           border: 1px solid var(--erp-border);
//           border-radius: 4px;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.02);
//           overflow: hidden;
//         }
//         .erp-panel-header {
//           background-color: #f8f9fa;
//           border-bottom: 1px solid var(--erp-border);
//           padding: 10px 16px;
//           font-weight: 600;
//           color: #34495e;
//           font-size: 0.9rem;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//         }

//         /* Typography & Labels */
//         .erp-label {
//           font-size: 0.75rem;
//           font-weight: 600;
//           color: var(--erp-text-muted);
//           text-transform: uppercase;
//           margin-bottom: 4px;
//           display: block;
//         }
//         .erp-section-title {
//           font-size: 0.75rem;
//           font-weight: 700;
//           color: #90a4ae;
//           text-transform: uppercase;
//           letter-spacing: 1px;
//           border-bottom: 1px solid var(--erp-border);
//           padding-bottom: 4px;
//           margin-bottom: 12px;
//         }

//         /* Inputs & Buttons */
//         .erp-input {
//           border-radius: 3px;
//           border-color: #b0bec5;
//           font-size: 0.85rem;
//           padding: 6px 10px;
//         }
//         .erp-input:focus {
//           border-color: var(--erp-primary);
//           box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
//         }
//         .erp-btn {
//           border-radius: 3px;
//           font-weight: 500;
//           letter-spacing: 0.2px;
//           padding: 6px 12px;
//         }

//         /* Data Table */
//         .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
//         .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
//         .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
//         .erp-table { font-size: 0.8rem; }
//         .erp-table thead th {
//           background-color: #eceff1;
//           color: #455a64;
//           font-weight: 600;
//           text-transform: uppercase;
//           font-size: 0.75rem;
//           position: sticky;
//           top: 0;
//           z-index: 10;
//           border-bottom: 2px solid #cfd8dc;
//           padding: 8px 12px;
//         }
//         .erp-table tbody td {
//           padding: 8px 12px;
//           vertical-align: middle;
//           border-color: #eceff1;
//         }
//         .table-warning { background-color: #fff8e1 !important; }

//         /* Custom Lot Tags */
//         .erp-lot-tag {
//           background: #f1f3f4;
//           border: 1px solid #dcdcdc;
//           padding: 2px 6px;
//           border-radius: 2px;
//           font-size: 0.75rem;
//           display: inline-block;
//           min-width: 80px;
//         }
//         .erp-lot-tag-wh {
//           font-size: 0.65rem;
//           color: var(--erp-text-muted);
//         }

//         /* Modals / Dialogs */
//         .erp-modal-overlay {
//           position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
//           background: rgba(38, 50, 56, 0.6);
//           display: flex; align-items: center; justify-content: center;
//           z-index: 1050;
//         }
//         .erp-dialog {
//           background: var(--erp-surface);
//           border-radius: 4px;
//           box-shadow: 0 10px 30px rgba(0,0,0,0.2);
//           width: 100%;
//           max-height: 90vh;
//           display: flex;
//           flex-direction: column;
//           overflow: hidden;
//         }
//         .erp-dialog-md { max-width: 500px; }
//         .erp-dialog-lg { max-width: 900px; }
//         .erp-dialog-header {
//           background-color: var(--erp-primary);
//           color: white;
//           padding: 12px 20px;
//           display: flex; justify-content: space-between; align-items: center;
//         }
//         .erp-dialog-body {
//           padding: 20px;
//           overflow-y: auto;
//         }

//         /* KPIs & Detail Meta */
//         .erp-meta-label { font-size: 0.7rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 600; }
//         .erp-meta-value { font-size: 0.9rem; font-weight: 500; color: #212529; }
//         .erp-edit-box { background: #f8f9fa; border: 1px dashed #b0bec5; padding: 16px; border-radius: 4px; }
        
//         .erp-kpi-box {
//           background: white; border: 1px solid var(--erp-border);
//           padding: 12px 16px; border-left: 4px solid var(--erp-primary);
//           border-radius: 3px;
//         }
//         .erp-kpi-label { display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 600; }
//         .erp-kpi-value { display: block; font-size: 1.5rem; font-weight: 700; }
        
//         .erp-lot-list { display: flex; flex-direction: column; gap: 8px; }
//         .erp-lot-row {
//           display: flex; justify-content: space-between; align-items: center;
//           background: white; border: 1px solid var(--erp-border);
//           padding: 8px 12px; border-radius: 3px;
//         }

//         /* FAB */
//         .ai-fab {
//           position: fixed; bottom: 30px; right: 30px; width: 50px; height: 50px;
//           background: var(--erp-primary); color: #fff; border-radius: 50%; cursor: pointer;
//           display: flex; align-items: center; justify-content: center;
//           transition: 0.2s; z-index: 1000; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
//           border: 2px solid white;
//         }
//         .ai-fab:hover { transform: scale(1.05); background: #1565c0; }
        
//         .erp-alert { border-radius: 3px; font-size: 0.85rem; border: 1px solid transparent; }
//       `}</style>
//     </div>
//   );
// }

// function LoadingState() {
//   return (
//     <div className="d-flex flex-column align-items-center justify-content-center vh-100" style={{backgroundColor: "#eef2f5", color: "#263238"}}>
//       <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
//       <span className="text-uppercase small fw-bold" style={{letterSpacing: '1px'}}>Loading Master Data...</span>
//     </div>
//   );
// }

// function ErrorState({ onRetry }) {
//   return (
//     <div className="d-flex align-items-center justify-content-center vh-100" style={{backgroundColor: "#eef2f5"}}>
//       <div className="text-center p-5 bg-white border rounded shadow-sm" style={{maxWidth: '400px', borderColor: '#cfd8dc'}}>
//         <div className="fs-1 mb-3 text-danger">🔌</div>
//         <h5 className="fw-bold text-uppercase" style={{letterSpacing: '0.5px', color: '#37474f'}}>Database Disconnected</h5>
//         <p className="small text-muted mb-4">The ERP client lost connection to the backend gateway. Please check your network.</p>
//         <button className="btn btn-primary w-100 fw-bold" style={{borderRadius: '3px'}} onClick={onRetry}>Attempt Reconnection</button>
//       </div>
//     </div>
//   );
// }








// import React, { useEffect, useMemo, useRef, useState } from "react";
// import JsBarcode from "jsbarcode";
// import api from "../services/apiClient";
// import { smartErpApi } from "../services/smartErpApi";

// const createEmptyProductForm = () => ({
//   itemCode: "",
//   description: "",
//   barcode: "",
//   category: "General",
//   unit: "NOS",
//   price: 0,
//   warehouseLocation: "",
//   isLotTracked: false,
//   serialPrefix: "", // Added
//   itemType: "Purchased",
//   maxStockLevel: 0,
//   safetyStock: 0,
//   leadTimeDays: 0,
//   averageDailySales: 0
// });

// export default function SmartERP() {
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
//   const [inventory, setInventory] = useState([]);
//   const [poMap, setPoMap] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ text: "", type: "" });
  
//   // UI States
//   const [activeTab, setActiveTab] = useState("Main");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showSidebar, setShowSidebar] = useState(true);
//   const [productForm, setProductForm] = useState(createEmptyProductForm());
//   const [whAssignment, setWhAssignment] = useState({ 
//     warehouseId: "", 
//     quantity: 0, 
//     lotNumber: "", 
//     scannerDeviceId: "WEB-APP-01" 
//   });
//   const [selectedLot, setSelectedLot] = useState(null);
//   const [serials, setSerials] = useState([]);
//   const [selectedSerial, setSelectedSerial] = useState(null);
//   const [loadingSerials, setLoadingSerials] = useState(false);
//   const serialBarcodeRef = useRef(null);
//   const [validationErrors, setValidationErrors] = useState([]);
//   const [showIntegrityCheck, setShowIntegrityCheck] = useState(false);
//   const [integrityIssues, setIntegrityIssues] = useState([]);
//   const [itemCodeSuggestions, setItemCodeSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);

//   // Load Everything from Backend
//   const loadAllData = async () => {
//     setLoading(true);
//     try {
//       const [resItems, resWh, resInv, resPO] = await Promise.all([
//         api.get("/stock/items"),
//         api.get("/warehouses"),
//         api.get("/stock/inventory"),
//         smartErpApi.getPurchaseOrders()
//       ]);
//       setItems(resItems.data || []);
//       setWarehouses(resWh.data || []);
//       setInventory(resInv.data || []);

//       const map = {};
//       (resPO.data || []).forEach(po => {
//         (po.Lines || []).forEach(line => {
//           const id = line.ItemId || line.itemId;
//           if (!map[id]) map[id] = 0;
//           map[id] += line.PendingQuantity || 0;
//         });
//       });
//       setPoMap(map);
//     } catch (err) {
//       setMessage({ text: "Connectivity Lost. Gateway offline.", type: "danger" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadAllData(); }, []);

//   // Advanced validation checks
//   const validateProductForm = () => {
//     const errors = [];
    
//     // Required field validation
//     if (!productForm.itemCode?.trim()) errors.push("Item Code is required");
//     if (!productForm.description?.trim()) errors.push("Description is required");
    
//     // Duplicate checking
//     if (productForm.itemCode?.trim()) {
//       const duplicate = items.find(item => 
//         item.id !== productForm.id && 
//         item.itemCode?.toLowerCase() === productForm.itemCode.toLowerCase()
//       );
//       if (duplicate) errors.push(`Item Code "${productForm.itemCode}" already exists`);
//     }
    
//     if (productForm.barcode?.trim()) {
//       const duplicate = items.find(item => 
//         item.id !== productForm.id && 
//         item.barcode?.toLowerCase() === productForm.barcode.toLowerCase()
//       );
//       if (duplicate) errors.push(`Barcode "${productForm.barcode}" already exists`);
//     }
    
//     // Data type validation
//     if (productForm.price < 0) errors.push("Price cannot be negative");
//     if (productForm.safetyStock < 0) errors.push("Safety Stock cannot be negative");
//     if (productForm.maxStockLevel < 0) errors.push("Max Stock Level cannot be negative");
//     if (productForm.leadTimeDays < 0) errors.push("Lead Time cannot be negative");
//     if (productForm.averageDailySales < 0) errors.push("Average Daily Sales cannot be negative");
    
//     // Logical validation
//     if (productForm.maxStockLevel > 0 && productForm.safetyStock > productForm.maxStockLevel) {
//       errors.push("Safety Stock cannot exceed Max Stock Level");
//     }
    
//     // Serial prefix validation for lot tracked items
//     if (productForm.isLotTracked && !productForm.serialPrefix?.trim()) {
//       errors.push("Serial Prefix is required for lot tracked items");
//     }
    
//     return errors;
//   };

//   // Stock level analysis
//   const getStockStatus = (item) => {
//     if (!item) return { status: 'unknown', color: 'secondary', message: 'No data' };
    
//     const currentStock = totalStock(item.id);
//     const safetyStock = item.safetyStock || 0;
//     const maxStock = item.maxStockLevel || 1000;
//     const inTransit = poMap[item.id] || 0;
    
//     if (currentStock <= 0) return { status: 'out-of-stock', color: 'danger', message: 'Out of Stock' };
//     if (currentStock < safetyStock) return { status: 'critical', color: 'danger', message: 'Critical Low' };
//     if (currentStock < safetyStock * 1.5) return { status: 'low', color: 'warning', message: 'Low Stock' };
//     if (currentStock > maxStock) return { status: 'overstock', color: 'info', message: 'Overstocked' };
//     if (currentStock >= maxStock * 0.9) return { status: 'high', color: 'success', message: 'Near Max' };
    
//     return { status: 'optimal', color: 'success', message: 'Optimal' };
//   };

//   // Data integrity checks
//   const runIntegrityChecks = async () => {
//     const issues = [];
    
//     try {
//       // Check for items without inventory records
//       const itemsWithoutInventory = items.filter(item => totalStock(item.id) === 0);
//       if (itemsWithoutInventory.length > 0) {
//         issues.push(`${itemsWithoutInventory.length} items have no inventory records`);
//       }
      
//       // Check for negative stock levels
//       const negativeStock = inventory.filter(inv => (inv.quantity || inv.Quantity || 0) < 0);
//       if (negativeStock.length > 0) {
//         issues.push(`${negativeStock.length} inventory records show negative quantities`);
//       }
      
//       // Check for orphaned inventory records
//       const validItemIds = new Set(items.map(item => item.id));
//       const orphanedInventory = inventory.filter(inv => !validItemIds.has(inv.itemId || inv.ItemId));
//       if (orphanedInventory.length > 0) {
//         issues.push(`${orphanedInventory.length} inventory records reference non-existent items`);
//       }
      
//       // Check for items with invalid data
//       const invalidItems = items.filter(item => 
//         !item.itemCode?.trim() || 
//         !item.description?.trim() || 
//         item.price < 0
//       );
//       if (invalidItems.length > 0) {
//         issues.push(`${invalidItems.length} items have invalid or missing data`);
//       }
      
//     } catch (err) {
//       issues.push("Failed to run integrity checks");
//     }
    
//     return issues;
//   };

//   // Auto-suggestions for item codes
//   const getItemCodeSuggestions = (input) => {
//     if (!input || input.length < 2) return [];
    
//     const suggestions = [];
//     const prefix = input.toUpperCase();
    
//     // Category-based suggestions
//     const categoryPrefixes = {
//       'RAW': 'RM-',
//       'FINISHED': 'FG-',
//       'SEMI': 'SM-',
//       'PACKAGING': 'PKG-',
//       'SPARE': 'SPR-'
//     };
    
//     Object.entries(categoryPrefixes).forEach(([cat, prefix]) => {
//       if (cat.toLowerCase().includes(input.toLowerCase()) || prefix.toLowerCase().includes(input.toLowerCase())) {
//         const nextNumber = items
//           .filter(item => item.itemCode?.startsWith(prefix))
//           .map(item => {
//             const num = parseInt(item.itemCode.replace(prefix, ''));
//             return isNaN(num) ? 0 : num;
//           })
//           .reduce((max, num) => Math.max(max, num), 0) + 1;
//         suggestions.push(`${prefix}${nextNumber.toString().padStart(3, '0')}`);
//       }
//     });
    
//     // Sequential numbering
//     const existingNumbers = items
//       .map(item => {
//         const match = item.itemCode?.match(/^([A-Z]+)-?(\d+)$/);
//         return match ? parseInt(match[2]) : null;
//       })
//       .filter(num => num !== null)
//       .sort((a, b) => b - a);
    
//     if (existingNumbers.length > 0) {
//       suggestions.push(`${prefix}-${(existingNumbers[0] + 1).toString().padStart(3, '0')}`);
//     }
    
//     return [...new Set(suggestions)].slice(0, 5);
//   };

//   // Convert wildcard pattern to regex and match
//   const matchesWildcardPattern = (text, pattern) => {
//     if (!text || !pattern) return false;
//     const normalizedText = text.toLowerCase();
//     const normalizedPattern = pattern.toLowerCase();
    
//     // If no wildcards, use substring match
//     if (!normalizedPattern.includes('*')) {
//       return normalizedText.includes(normalizedPattern);
//     }
    
//     // Convert wildcard pattern to regex
//     // AJ* → ^AJ.*
//     // *AJ → .*AJ$
//     // *AJ* → .*AJ.*
//     const regexPattern = normalizedPattern
//       .replace(/\./g, '\\.')  // Escape dots
//       .replace(/\*/g, '.*')   // * becomes .*
//       .replace(/\?/g, '.');   // ? becomes .
    
//     try {
//       const regex = new RegExp(`^${regexPattern}$`);
//       return regex.test(normalizedText);
//     } catch (e) {
//       // If invalid regex, fall back to substring match
//       return normalizedText.includes(normalizedPattern.replace(/\*/g, ''));
//     }
//   };

//   // Filter Sidebar as user types - supports wildcard patterns like AJ*, *AJ, etc.
//   const filteredSidebarItems = useMemo(() => {
//     if (!searchTerm) return items;
    
//     return items.filter(i => 
//       matchesWildcardPattern(i.itemCode, searchTerm) ||
//       matchesWildcardPattern(i.description, searchTerm)
//     );
//   }, [items, searchTerm]);

//   // Logic: Auto-fill description if empty when barcode is typed
//   const handleBarcodeChange = (value) => {
//     setProductForm((prev) => {
//       const trimmedDesc = prev.description?.trim() ?? "";
//       const autoDesc = value ? `ITEM-${value}` : "";
//       return {
//         ...prev,
//         barcode: value,
//         description: !trimmedDesc ? autoDesc : prev.description,
//         isLotTracked: prev.isLotTracked || Boolean(autoDesc)
//       };
//     });
//   };

//   const selectItem = (item) => {
//     setProductForm({ ...item, serialPrefix: item.serialPrefix || "" });
//     setActiveTab("Main");
//   };

//   const totalStock = (itemId) => inventory
//     .filter((i) => (i.itemId || i.ItemId) === itemId)
//     .reduce((sum, i) => sum + Number(i.quantity || i.Quantity || 0), 0);

//   // Advanced Inventory Grouping for the Quantities Tab
//   const detailInventoryRows = useMemo(() => {
//     if (!productForm.id) return [];
//     const grouping = {};
//     inventory.filter(i => (i.itemId || i.ItemId) === productForm.id).forEach(row => {
//       const whId = row.warehouseId || row.WarehouseId;
//       const lot = row.lotNumber || "general";
//       const key = `${whId}-${lot}`;
//       if (!grouping[key]) {
//         const whName = warehouses.find(w => w.id === whId)?.name || `WH-${whId}`;
//         grouping[key] = { id: key, whName, lot, qty: 0 };
//       }
//       grouping[key].qty += Number(row.quantity || 0);
//     });
//     return Object.values(grouping);
//   }, [productForm.id, inventory, warehouses]);

//   const handleLotClick = async (row) => {
//     if (selectedLot === row.id) {
//       setSelectedLot(null);
//       setSerials([]);
//       return;
//     }
//     setSelectedLot(row.id);
//     setSerials([]);
//     setSelectedSerial(null);
//     setLoadingSerials(true);
//     try {
//       const firstDash = row.id.indexOf('-');
//       const whId = row.id.slice(0, firstDash);
//       const lot = row.id.slice(firstDash + 1);
//       const res = await api.get(`/stock/serials?itemId=${productForm.id}&warehouseId=${whId}&lotNumber=${encodeURIComponent(lot)}`);
//       setSerials(res.data || []);
//     } catch (err) {
//       setMessage({ text: "Failed to load serials", type: "danger" });
//       setSerials([]);
//     } finally {
//       setLoadingSerials(false);
//     }
//   };

//   const handleSerialClick = (serial) => {
//     const serialValue = serial?.SerialNumber || serial?.serialNumber || serial;
//     if (!serialValue) return;
//     if (selectedSerial?.SerialNumber === serialValue || selectedSerial?.serialNumber === serialValue || selectedSerial === serial) {
//       setSelectedSerial(null);
//       return;
//     }
//     setSelectedSerial(serial);
//   };

//   useEffect(() => {
//     if (!selectedSerial || !serialBarcodeRef.current) return;
//     try {
//       JsBarcode(serialBarcodeRef.current, selectedSerial.SerialNumber || selectedSerial.serialNumber || selectedSerial, {
//         format: "CODE128",
//         width: 2,
//         height: 44,
//         displayValue: true,
//         margin: 6
//       });
//     } catch (err) {
//       console.warn("Barcode render failed", err);
//     }
//   }, [selectedSerial]);


//   const handleSave = async () => {
//     // Run validation
//     const errors = validateProductForm();
//     setValidationErrors(errors);
    
//     if (errors.length > 0) {
//       setMessage({ text: `Validation failed: ${errors.length} issue(s) found`, type: "danger" });
//       return;
//     }
    
//     try {
//       setLoading(true);
//       if (productForm.id) {
//         await api.put(`/smart-erp/products/${productForm.id}`, productForm);
//         setMessage({ text: "Product successfully updated", type: "success" });
//       } else {
//         const res = await api.post("/smart-erp/products", productForm);
//         setProductForm(res.data);
//         setMessage({ text: "New Product registered", type: "success" });
//       }
//       loadAllData();
//       setValidationErrors([]);
//     } catch (err) {
//       const errorMsg = err?.response?.data?.message || err?.response?.data || "Save operation failed";
//       setMessage({ text: errorMsg, type: "danger" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleIntegrityCheck = async () => {
//     setShowIntegrityCheck(true);
//     setIntegrityIssues([]);
//     const issues = await runIntegrityChecks();
//     setIntegrityIssues(issues);
//   };

//   // Handle item code input with suggestions
//   const handleItemCodeChange = (value) => {
//     setProductForm({...productForm, itemCode: value});
    
//     if (value.length >= 2) {
//       const suggestions = getItemCodeSuggestions(value);
//       setItemCodeSuggestions(suggestions);
//       setShowSuggestions(suggestions.length > 0);
//     } else {
//       setShowSuggestions(false);
//     }
//   };

//   const selectSuggestion = (suggestion) => {
//     setProductForm({...productForm, itemCode: suggestion});
//     setShowSuggestions(false);
//   };

//   const postStock = async () => {
//     if (!productForm.id) return setMessage({ text: "Save product details first", type: "warning" });
//     try {
//       await api.post("/stock/in", {
//         itemId: productForm.id,
//         warehouseId: Number(whAssignment.warehouseId),
//         quantity: Number(whAssignment.quantity),
//         lotNumber: productForm.isLotTracked ? whAssignment.lotNumber : null,
//         scannerDeviceId: whAssignment.scannerDeviceId
//       });
//       setMessage({ text: "Inventory transaction successful", type: "success" });
//       loadAllData();
//     } catch (err) {
//       setMessage({ text: "Failed to post inventory", type: "danger" });
//     }
//   };

//   if (loading && items.length === 0) return <LoadingState />;

//   return (
//     <div className="erp-app-shell vh-100 d-flex flex-column">
      
//       {/* 🛠 TOP TOOLBAR */}
//       <div className="erp-nav d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white shadow-sm">
//         <div className="d-flex gap-2">
//           <button className="erp-btn" onClick={() => setShowSidebar(!showSidebar)}>
//             {showSidebar ? "⬅ Close Filter" : "🔍 Open Filter"}
//           </button>
//           <button className="erp-btn" onClick={() => { setProductForm(createEmptyProductForm()); setActiveTab("Main"); setValidationErrors([]); }}>📄 New</button>
//           <button className="erp-btn btn-primary text-white border-0" onClick={handleSave} disabled={loading}>
//             {loading ? "💾 Saving..." : "💾 Save"}
//           </button>
//           <button className="erp-btn text-danger">🗑 Delete</button>
//           <button className="erp-btn btn-warning text-dark border-0" onClick={handleIntegrityCheck} title="Run data integrity checks">
//             🔍 Check Data
//           </button>
//         </div>

//         <div className="d-flex align-items-center gap-2">
//           <label className="small fw-bold text-muted mb-0">Quick Search:</label>
//           <input 
//             type="text" 
//             className="form-control form-control-sm" 
//             style={{width: '280px'}} 
//             placeholder="e.g. AJ*, *BOLT, BLK* (use * for wildcard)" 
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             title="Type item code or name. Use * for wildcard: AJ* (starts with), *BOLT (ends with), *BLK* (contains)"
//           />
//         </div>
//       </div>

//       <div className="d-flex flex-grow-1 overflow-hidden">
        
//         {/* 📋 SIDEBAR LIST */}
//         {showSidebar && (
//           <div className="erp-sidebar border-end bg-white d-flex flex-column shadow-sm" style={{width: '280px'}}>
//             <div className="p-2 small fw-bold bg-light border-bottom d-flex justify-content-between text-muted">
//               <span>ITEMS MASTER</span>
//               <span className="badge bg-secondary">{filteredSidebarItems.length}</span>
//             </div>
//             <div className="flex-grow-1 overflow-auto">
//               {filteredSidebarItems.length === 0 ? (
//                 <div className="p-3 text-center text-muted small">
//                   <div style={{fontSize: '24px', marginBottom: '8px'}}>🔍</div>
//                   No items match "{searchTerm}"
//                 </div>
//               ) : (
//                 filteredSidebarItems.map((item) => {
//                   const matchesCode = matchesWildcardPattern(item.itemCode, searchTerm);
//                   const matchesName = matchesWildcardPattern(item.description, searchTerm);
//                   const stockStatus = getStockStatus(item);
                  
//                   return (
//                     <div 
//                       key={item.id} 
//                       className={`sidebar-row p-2 border-bottom cursor-pointer ${productForm.id === item.id ? 'active-row' : ''}`}
//                       onClick={() => selectItem(item)}
//                       style={{
//                         backgroundColor: matchesCode || matchesName ? '#f0f8ff' : 'transparent',
//                         transition: 'background-color 0.2s',
//                         borderLeft: `3px solid var(--bs-${stockStatus.color})`
//                       }}
//                     >
//                       <div className="d-flex justify-content-between fw-bold small align-items-start gap-2">
//                         <div style={{flex: 1}}>
//                           <span className={`fw-bold ${matchesCode ? 'text-danger' : 'text-dark'}`} title={`Pattern: ${searchTerm}`}>
//                             {item.itemCode}
//                           </span>
//                           <div className={`badge bg-${stockStatus.color} text-white ms-1`} style={{fontSize: '9px'}}>
//                             {stockStatus.message}
//                           </div>
//                         </div>
//                         <span className="text-primary badge bg-light text-dark" style={{whiteSpace: 'nowrap'}}>
//                           {totalStock(item.id)} units
//                         </span>
//                       </div>
//                       <div className={`text-truncate ${matchesName && !matchesCode ? 'text-danger fw-bold' : 'text-muted'}`} style={{fontSize: '11px'}}>
//                         {item.description || 'No description'}
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         )}

//         {/* 📑 MAIN FORM CONTENT */}
//         <div className="flex-grow-1 p-3 overflow-auto bg-light">
//           {message.text && (
//             <div className={`alert alert-${message.type} py-1 small fw-bold mb-3 d-flex justify-content-between`}>
//               {message.text}
//               <span className="cursor-pointer" onClick={() => setMessage({text:"", type:""})}>×</span>
//             </div>
//           )}

//           {validationErrors.length > 0 && (
//             <div className="alert alert-warning py-2 mb-3">
//               <div className="fw-bold small mb-2">⚠️ Validation Issues Found:</div>
//               <ul className="mb-0 small">
//                 {validationErrors.map((error, idx) => (
//                   <li key={idx}>{error}</li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           <div className="erp-card bg-white border shadow-sm rounded-1">
//             <div className="erp-tabs d-flex border-bottom bg-light">
//               {["Main", "Planning", "Warehouse", "Quantities", "Costs"].map(tabName => (
//                 <button 
//                   key={tabName} 
//                   className={`tab-link ${activeTab === tabName ? 'active' : ''}`} 
//                   onClick={() => setActiveTab(tabName)}
//                 >
//                   {tabName}
//                 </button>
//               ))}
//             </div>

//             <div className="p-4">
//               {activeTab === "Main" && (
//                 <div className="row g-5">
//                   {/* Identification Group */}
//                   <div className="col-md-6 border-end">
//                     <div className="erp-group-box">
//                       <span className="box-title">Identification</span>
//                       <div className="field-row position-relative">
//                         <label>Item Code:</label> 
//                         <div style={{width: '65%', position: 'relative'}}>
//                           <input 
//                             className={`fw-bold ${validationErrors.some(e => e.includes('Item Code')) ? 'border-danger' : ''}`} 
//                             value={productForm.itemCode} 
//                             onChange={e => handleItemCodeChange(e.target.value)}
//                             onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
//                             placeholder="e.g. RM-001, FG-100"
//                           />
//                           {showSuggestions && itemCodeSuggestions.length > 0 && (
//                             <div className="position-absolute bg-white border rounded shadow-sm mt-1" style={{width: '100%', zIndex: 1000, maxHeight: '150px', overflowY: 'auto'}}>
//                               {itemCodeSuggestions.map((suggestion, idx) => (
//                                 <div 
//                                   key={idx} 
//                                   className="p-2 small cursor-pointer hover-bg-light"
//                                   onClick={() => selectSuggestion(suggestion)}
//                                   style={{borderBottom: idx < itemCodeSuggestions.length - 1 ? '1px solid #eee' : 'none'}}
//                                 >
//                                   {suggestion}
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                       <div className="field-row"><label>Barcode:</label> <input className="font-monospace" value={productForm.barcode} onChange={e => handleBarcodeChange(e.target.value)} /></div>
//                       <div className="field-row"><label className="text-primary fw-bold">Serial Prefix:</label> <input className="border-primary" placeholder="Enter Prefix..." value={productForm.serialPrefix} onChange={e => setProductForm({...productForm, serialPrefix: e.target.value})} /></div>
//                       <div className="field-row"><label>Description:</label> <textarea rows="2" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
//                     </div>
//                   </div>
//                   {/* Attributes Group */}
//                   <div className="col-md-6">
//                     <div className="erp-group-box">
//                       <span className="box-title">Inventory Attributes</span>
//                       <div className="field-row"><label>Category:</label> <input value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} /></div>
//                       <div className="field-row"><label>Unit (UOM):</label> 
//                         <select value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})}>
//                           <option>NOS</option><option>BX</option><option>KGS</option><option>PCS</option>
//                         </select>
//                       </div>
//                       <div className="field-row"><label>Type:</label> 
//                         <select value={productForm.itemType} onChange={e => setProductForm({...productForm, itemType: e.target.value})}>
//                           <option>Purchased</option><option>Manufactured</option><option>Service</option>
//                         </select>
//                       </div>
//                       <div className="field-row mt-3 p-2 bg-light border rounded">
//                         <label className="form-check-label fw-bold small">Enable Lot Tracking:</label>
//                         <input type="checkbox" className="form-check-input ms-2" checked={productForm.isLotTracked} onChange={e => setProductForm({...productForm, isLotTracked: e.target.checked})} />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === "Planning" && (
//                 <div className="row g-4">
//                   <div className="col-md-6">
//                     <div className="erp-group-box">
//                       <span className="box-title">Stock Controls</span>
//                       <div className="field-row"><label>Safety Stock:</label> <input type="number" className="text-end" value={productForm.safetyStock} onChange={e => setProductForm({...productForm, safetyStock: Number(e.target.value)})} /></div>
//                       <div className="field-row"><label>Max Stock Level:</label> <input type="number" className="text-end" value={productForm.maxStockLevel} onChange={e => setProductForm({...productForm, maxStockLevel: Number(e.target.value)})} /></div>
//                     </div>
//                   </div>
//                   <div className="col-md-6">
//                     <div className="erp-group-box">
//                       <span className="box-title">Forecasting</span>
//                       <div className="field-row"><label>Lead Time (Days):</label> <input type="number" className="text-end" value={productForm.leadTimeDays} onChange={e => setProductForm({...productForm, leadTimeDays: Number(e.target.value)})} /></div>
//                       <div className="field-row"><label>Avg Daily Sales:</label> <input type="number" className="text-end" value={productForm.averageDailySales} onChange={e => setProductForm({...productForm, averageDailySales: Number(e.target.value)})} /></div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === "Warehouse" && (
//                 <div className="row justify-content-center">
//                   <div className="col-md-6 erp-group-box border-primary p-4">
//                     <span className="box-title text-primary">Inbound Material Posting</span>
//                     <div className="field-row mb-3"><label className="fw-bold">Warehouse:</label>
//                       <select value={whAssignment.warehouseId} onChange={e => setWhAssignment({...whAssignment, warehouseId: e.target.value})}>
//                         <option value="">-- Select Destination --</option>
//                         {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//                       </select>
//                     </div>
//                     <div className="field-row mb-3"><label className="fw-bold">Receipt Qty:</label> <input type="number" className="text-end fw-bold" value={whAssignment.quantity} onChange={e => setWhAssignment({...whAssignment, quantity: e.target.value})} /></div>
//                     <div className="field-row mb-4"><label className="fw-bold">Lot Number:</label> <input placeholder={productForm.isLotTracked ? "REQUIRED" : "N/A"} value={whAssignment.lotNumber} onChange={e => setWhAssignment({...whAssignment, lotNumber: e.target.value})} disabled={!productForm.isLotTracked} /></div>
//                     <button className="btn btn-primary w-100 fw-bold" onClick={postStock}>POST TO INVENTORY</button>
//                   </div>
//                 </div>
//               )}

//               {activeTab === "Quantities" && (
//                 <div className="row g-4">
//                   <div className="col-md-4">
//                     <div className="erp-kpi shadow-sm">
//                       <div className="small fw-bold text-muted">GLOBAL ON HAND</div>
//                       <div className="display-6 fw-bold text-primary">{totalStock(productForm.id)}</div>
//                     </div>
//                     {poMap[productForm.id] > 0 && (
//                       <div className="erp-kpi shadow-sm mt-3 border-info">
//                         <div className="small fw-bold text-info">IN TRANSIT (PURCHASE)</div>
//                         <div className="h4 fw-bold text-info">{poMap[productForm.id]}</div>
//                       </div>
//                     )}
//                   </div>
//                   <div className="col-md-8 px-4">
//                     <h6 className="small fw-bold text-uppercase text-muted border-bottom pb-2">Location & Lot Details</h6>
//                     <div className="mt-3">
//                       {detailInventoryRows.length === 0 ? <p className="text-center p-5 text-muted small">No active stock records.</p> : 
//                         detailInventoryRows.map(row => (
//                           <div key={row.id}>
//                             <div 
//                               className={`d-flex justify-content-between align-items-center border-bottom py-2 cursor-pointer ${selectedLot === row.id ? 'bg-light' : ''}`}
//                               onClick={() => handleLotClick(row)}
//                             >
//                               <div>
//                                 <div className="fw-bold small text-dark">{row.lot.toUpperCase()}</div>
//                                 <div className="text-muted" style={{fontSize:'10px'}}>{row.whName}</div>
//                               </div>
//                               <div className="fw-bold fs-5">{row.qty.toLocaleString()}</div>
//                             </div>
//                             {selectedLot === row.id && (
//                               <div className="mt-2 mb-3 p-3 bg-white border rounded">
//                                 <h6 className="small fw-bold text-primary mb-2">Serial Numbers</h6>
//                                 {loadingSerials ? (
//                                   <div className="text-center py-2">
//                                     <div className="spinner-border spinner-border-sm text-primary"></div>
//                                   </div>
//                                 ) : serials.length === 0 ? (
//                                   <p className="text-muted small mb-0">No serials found for this lot.</p>
//                                 ) : (
//                                   <>
//                                     <div className="d-flex flex-wrap gap-1">
//                                       {serials.map((serial, idx) => {
//                                         const serialValue = serial?.SerialNumber || serial?.serialNumber || serial;
//                                         const isSelected = selectedSerial && (
//                                           selectedSerial?.SerialNumber === serialValue ||
//                                           selectedSerial?.serialNumber === serialValue ||
//                                           selectedSerial === serial
//                                         );
//                                         return (
//                                           <span
//                                             key={idx}
//                                             className={`badge small ${isSelected ? 'bg-primary text-white' : 'bg-secondary text-dark'} cursor-pointer`}
//                                             onClick={() => handleSerialClick(serial)}
//                                           >
//                                             {serialValue}
//                                           </span>
//                                         );
//                                       })}
//                                     </div>
//                                     {selectedSerial && (
//                                       <div className="mt-3 p-3 border rounded bg-white">
//                                         <div className="small text-muted mb-2">Barcode preview</div>
//                                         <svg ref={serialBarcodeRef} aria-label="Selected serial barcode preview"></svg>
//                                       </div>
//                                     )}
//                                   </>
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         ))
//                       }
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* INTEGRITY CHECK MODAL */}
//       {showIntegrityCheck && (
//         <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{zIndex: 1050}}>
//           <div className="bg-white rounded shadow-lg p-4" style={{maxWidth: '500px', width: '90%'}}>
//             <div className="d-flex justify-content-between align-items-center mb-3">
//               <h5 className="mb-0 fw-bold text-primary">🔍 Data Integrity Check</h5>
//               <button className="btn-close" onClick={() => setShowIntegrityCheck(false)}></button>
//             </div>
            
//             {integrityIssues.length === 0 ? (
//               <div className="text-center py-4">
//                 <div className="text-success mb-2" style={{fontSize: '48px'}}>✅</div>
//                 <div className="fw-bold text-success">All checks passed!</div>
//                 <div className="text-muted small">No data integrity issues found</div>
//               </div>
//             ) : (
//               <div>
//                 <div className="alert alert-warning py-2 mb-3">
//                   <strong>{integrityIssues.length} issue(s) found</strong>
//                 </div>
//                 <div style={{maxHeight: '300px', overflowY: 'auto'}}>
//                   {integrityIssues.map((issue, idx) => (
//                     <div key={idx} className="d-flex align-items-start mb-2 p-2 bg-light rounded">
//                       <span className="text-warning me-2">⚠️</span>
//                       <span className="small">{issue}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             <div className="d-flex justify-content-end gap-2 mt-3">
//               <button className="btn btn-secondary btn-sm" onClick={() => setShowIntegrityCheck(false)}>Close</button>
//               {integrityIssues.length > 0 && (
//                 <button className="btn btn-primary btn-sm" onClick={() => {setShowIntegrityCheck(false); handleIntegrityCheck();}}>
//                   🔄 Re-run Check
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <style>{`
//         .erp-app-shell { background: #f4f7f9; font-family: 'Segoe UI', system-ui, sans-serif; }
//         .erp-btn { background: white; border: 1px solid #ced4da; font-size: 12px; padding: 5px 15px; border-radius: 3px; cursor: pointer; font-weight: 500; }
//         .erp-btn:hover { background: #f8f9fa; border-color: #adb5bd; }
        
//         .hover-bg-light:hover { background-color: #f8f9fa !important; }
        
//         .sidebar-row { transition: 0.1s; border-left: 3px solid transparent; }
//         .sidebar-row:hover { background: #f8f9fa; }
//         .active-row { background: #e7f1ff !important; border-left-color: #0d6efd !important; }

//         .cursor-pointer { cursor: pointer; }

//         .tab-link { border: none; background: transparent; padding: 10px 25px; font-size: 13px; color: #666; border-right: 1px solid #eee; cursor: pointer; }
//         .tab-link.active { background: white; color: #0d6efd; font-weight: 700; border-bottom: 2px solid #0d6efd; }

//         .erp-group-box { border: 1px solid #dee2e6; padding: 25px 15px 15px; position: relative; border-radius: 4px; margin-top: 10px; }
//         .box-title { position: absolute; top: -10px; left: 12px; background: white; padding: 0 8px; font-size: 11px; font-weight: 700; color: #0d6efd; text-transform: uppercase; }

//         .field-row { display: flex; align-items: center; margin-bottom: 10px; }
//         .field-row label { width: 35%; font-size: 12px; color: #495057; font-weight: 600; }
//         .field-row input, .field-row select, .field-row textarea { width: 65%; border: 1px solid #ced4da; border-radius: 3px; padding: 4px 10px; font-size: 13px; outline: none; }
//         .field-row input:focus, .field-row select:focus, .field-row textarea:focus { border-color: #0d6efd; }
//         .field-row input.border-danger { border-color: #dc3545 !important; }

//         .erp-kpi { background: #fff; padding: 20px; border-left: 5px solid #0d6efd; border-radius: 3px; border: 1px solid #eee; border-left-width: 5px; }
//       `}</style>
//     </div>
//   );
// }

// function LoadingState() {
//   return (
//     <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
//       <div className="spinner-border text-primary mb-3"></div>
//       <div className="fw-bold text-muted small text-uppercase">Initialising ERP Master Data...</div>
//     </div>
//   );
// }



// import React, { useEffect, useMemo, useRef, useState } from "react";
// import JsBarcode from "jsbarcode";
// import api from "../services/apiClient";
// import { smartErpApi } from "../services/smartErpApi";

// const createEmptyProductForm = () => ({
//   itemCode: "",
//   description: "",
//   barcode: "",
//   category: "General",
//   unit: "NOS",
//   price: 0,           // Selling Price
//   unitPrice: 0,       // Added Unit Price (Cost)
//   warehouseLocation: "",
//   isLotTracked: false,
//   serialPrefix: "",
//   itemType: "Purchased",
//   maxStockLevel: 0,
//   safetyStock: 0,
//   leadTimeDays: 0,
//   averageDailySales: 0
// });

// export default function SmartERP() {
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
//   const [inventory, setInventory] = useState([]);
//   const [poMap, setPoMap] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ text: "", type: "" });
  
//   // UI States
//   const [activeTab, setActiveTab] = useState("Main");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showSidebar, setShowSidebar] = useState(true);
//   const [productForm, setProductForm] = useState(createEmptyProductForm());
//   const [whAssignment, setWhAssignment] = useState({ 
//     warehouseId: "", 
//     quantity: 0, 
//     lotNumber: "", 
//     scannerDeviceId: "WEB-APP-01" 
//   });
//   const [selectedLot, setSelectedLot] = useState(null);
//   const [serials, setSerials] = useState([]);
//   const [selectedSerial, setSelectedSerial] = useState(null);
//   const [loadingSerials, setLoadingSerials] = useState(false);
//   const serialBarcodeRef = useRef(null);
//   const [validationErrors, setValidationErrors] = useState([]);
//   const [showIntegrityCheck, setShowIntegrityCheck] = useState(false);
//   const [integrityIssues, setIntegrityIssues] = useState([]);
//   const [itemCodeSuggestions, setItemCodeSuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);

//   // Load Everything from Backend
//   const loadAllData = async () => {
//     setLoading(true);
//     try {
//       const [resItems, resWh, resInv, resPO] = await Promise.all([
//         api.get("/stock/items"),
//         api.get("/warehouses"),
//         api.get("/stock/inventory"),
//         smartErpApi.getPurchaseOrders()
//       ]);
//       setItems(resItems.data || []);
//       setWarehouses(resWh.data || []);
//       setInventory(resInv.data || []);

//       const map = {};
//       (resPO.data || []).forEach(po => {
//         (po.Lines || []).forEach(line => {
//           const id = line.ItemId || line.itemId;
//           if (!map[id]) map[id] = 0;
//           map[id] += line.PendingQuantity || 0;
//         });
//       });
//       setPoMap(map);
//     } catch (err) {
//       setMessage({ text: "Connectivity Lost. Gateway offline.", type: "danger" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => { loadAllData(); }, []);

//   // Advanced validation checks
//   const validateProductForm = () => {
//     const errors = [];
    
//     // Required field validation
//     if (!productForm.itemCode?.trim()) errors.push("Item Code is required");
//     if (!productForm.description?.trim()) errors.push("Description is required");
    
//     // Duplicate checking
//     if (productForm.itemCode?.trim()) {
//       const duplicate = items.find(item => 
//         item.id !== productForm.id && 
//         item.itemCode?.toLowerCase() === productForm.itemCode.toLowerCase()
//       );
//       if (duplicate) errors.push(`Item Code "${productForm.itemCode}" already exists`);
//     }
    
//     if (productForm.barcode?.trim()) {
//       const duplicate = items.find(item => 
//         item.id !== productForm.id && 
//         item.barcode?.toLowerCase() === productForm.barcode.toLowerCase()
//       );
//       if (duplicate) errors.push(`Barcode "${productForm.barcode}" already exists`);
//     }
    
//     // Data type validation
//     if (productForm.price < 0) errors.push("Selling Price cannot be negative");
//     if (productForm.unitPrice < 0) errors.push("Unit Price cannot be negative"); // Added Unit Price validation
//     if (productForm.safetyStock < 0) errors.push("Safety Stock cannot be negative");
//     if (productForm.maxStockLevel < 0) errors.push("Max Stock Level cannot be negative");
//     if (productForm.leadTimeDays < 0) errors.push("Lead Time cannot be negative");
//     if (productForm.averageDailySales < 0) errors.push("Average Daily Sales cannot be negative");
    
//     // Logical validation
//     if (productForm.maxStockLevel > 0 && productForm.safetyStock > productForm.maxStockLevel) {
//       errors.push("Safety Stock cannot exceed Max Stock Level");
//     }
    
//     // Serial prefix validation for lot tracked items
//     if (productForm.isLotTracked && !productForm.serialPrefix?.trim()) {
//       errors.push("Serial Prefix is required for lot tracked items");
//     }
    
//     return errors;
//   };

//   // Stock level analysis
//   const getStockStatus = (item) => {
//     if (!item) return { status: 'unknown', color: 'secondary', message: 'No data' };
    
//     const currentStock = totalStock(item.id);
//     const safetyStock = item.safetyStock || 0;
//     const maxStock = item.maxStockLevel || 1000;
//     const inTransit = poMap[item.id] || 0;
    
//     if (currentStock <= 0) return { status: 'out-of-stock', color: 'danger', message: 'Out of Stock' };
//     if (currentStock < safetyStock) return { status: 'critical', color: 'danger', message: 'Critical Low' };
//     if (currentStock < safetyStock * 1.5) return { status: 'low', color: 'warning', message: 'Low Stock' };
//     if (currentStock > maxStock) return { status: 'overstock', color: 'info', message: 'Overstocked' };
//     if (currentStock >= maxStock * 0.9) return { status: 'high', color: 'success', message: 'Near Max' };
    
//     return { status: 'optimal', color: 'success', message: 'Optimal' };
//   };

//   // Data integrity checks
//   const runIntegrityChecks = async () => {
//     const issues = [];
    
//     try {
//       const itemsWithoutInventory = items.filter(item => totalStock(item.id) === 0);
//       if (itemsWithoutInventory.length > 0) {
//         issues.push(`${itemsWithoutInventory.length} items have no inventory records`);
//       }
      
//       const negativeStock = inventory.filter(inv => (inv.quantity || inv.Quantity || 0) < 0);
//       if (negativeStock.length > 0) {
//         issues.push(`${negativeStock.length} inventory records show negative quantities`);
//       }
      
//       const validItemIds = new Set(items.map(item => item.id));
//       const orphanedInventory = inventory.filter(inv => !validItemIds.has(inv.itemId || inv.ItemId));
//       if (orphanedInventory.length > 0) {
//         issues.push(`${orphanedInventory.length} inventory records reference non-existent items`);
//       }
      
//       const invalidItems = items.filter(item => 
//         !item.itemCode?.trim() || 
//         !item.description?.trim() || 
//         item.price < 0
//       );
//       if (invalidItems.length > 0) {
//         issues.push(`${invalidItems.length} items have invalid or missing data`);
//       }
      
//     } catch (err) {
//       issues.push("Failed to run integrity checks");
//     }
    
//     return issues;
//   };

//   // Auto-suggestions for item codes
//   const getItemCodeSuggestions = (input) => {
//     if (!input || input.length < 2) return [];
    
//     const suggestions = [];
//     const prefix = input.toUpperCase();
    
//     const categoryPrefixes = {
//       'RAW': 'RM-',
//       'FINISHED': 'FG-',
//       'SEMI': 'SM-',
//       'PACKAGING': 'PKG-',
//       'SPARE': 'SPR-'
//     };
    
//     Object.entries(categoryPrefixes).forEach(([cat, prefix]) => {
//       if (cat.toLowerCase().includes(input.toLowerCase()) || prefix.toLowerCase().includes(input.toLowerCase())) {
//         const nextNumber = items
//           .filter(item => item.itemCode?.startsWith(prefix))
//           .map(item => {
//             const num = parseInt(item.itemCode.replace(prefix, ''));
//             return isNaN(num) ? 0 : num;
//           })
//           .reduce((max, num) => Math.max(max, num), 0) + 1;
//         suggestions.push(`${prefix}${nextNumber.toString().padStart(3, '0')}`);
//       }
//     });
    
//     const existingNumbers = items
//       .map(item => {
//         const match = item.itemCode?.match(/^([A-Z]+)-?(\d+)$/);
//         return match ? parseInt(match[2]) : null;
//       })
//       .filter(num => num !== null)
//       .sort((a, b) => b - a);
    
//     if (existingNumbers.length > 0) {
//       suggestions.push(`${prefix}-${(existingNumbers[0] + 1).toString().padStart(3, '0')}`);
//     }
    
//     return [...new Set(suggestions)].slice(0, 5);
//   };

//   // Convert wildcard pattern to regex and match
//   const matchesWildcardPattern = (text, pattern) => {
//     if (!text || !pattern) return false;
//     const normalizedText = text.toLowerCase();
//     const normalizedPattern = pattern.toLowerCase();
    
//     if (!normalizedPattern.includes('*')) {
//       return normalizedText.includes(normalizedPattern);
//     }
    
//     const regexPattern = normalizedPattern
//       .replace(/\./g, '\\.')
//       .replace(/\*/g, '.*')
//       .replace(/\?/g, '.');
    
//     try {
//       const regex = new RegExp(`^${regexPattern}$`);
//       return regex.test(normalizedText);
//     } catch (e) {
//       return normalizedText.includes(normalizedPattern.replace(/\*/g, ''));
//     }
//   };

//   const filteredSidebarItems = useMemo(() => {
//     if (!searchTerm) return items;
    
//     return items.filter(i => 
//       matchesWildcardPattern(i.itemCode, searchTerm) ||
//       matchesWildcardPattern(i.description, searchTerm)
//     );
//   }, [items, searchTerm]);

//   const handleBarcodeChange = (value) => {
//     setProductForm((prev) => {
//       const trimmedDesc = prev.description?.trim() ?? "";
//       const autoDesc = value ? `ITEM-${value}` : "";
//       return {
//         ...prev,
//         barcode: value,
//         description: !trimmedDesc ? autoDesc : prev.description,
//         isLotTracked: prev.isLotTracked || Boolean(autoDesc)
//       };
//     });
//   };

//   const selectItem = (item) => {
//     setProductForm({ 
//       ...createEmptyProductForm(), // Merge defaults to ensure unitPrice exists if missing on older items
//       ...item, 
//       serialPrefix: item.serialPrefix || "" 
//     });
//     setActiveTab("Main");
//     setValidationErrors([]);
//   };

//   const totalStock = (itemId) => inventory
//     .filter((i) => (i.itemId || i.ItemId) === itemId)
//     .reduce((sum, i) => sum + Number(i.quantity || i.Quantity || 0), 0);

//   const detailInventoryRows = useMemo(() => {
//     if (!productForm.id) return [];
//     const grouping = {};
//     inventory.filter(i => (i.itemId || i.ItemId) === productForm.id).forEach(row => {
//       const whId = row.warehouseId || row.WarehouseId;
//       const lot = row.lotNumber || "general";
//       const key = `${whId}-${lot}`;
//       if (!grouping[key]) {
//         const whName = warehouses.find(w => w.id === whId)?.name || `WH-${whId}`;
//         grouping[key] = { id: key, whName, lot, qty: 0 };
//       }
//       grouping[key].qty += Number(row.quantity || 0);
//     });
//     return Object.values(grouping);
//   }, [productForm.id, inventory, warehouses]);

//   const handleLotClick = async (row) => {
//     if (selectedLot === row.id) {
//       setSelectedLot(null);
//       setSerials([]);
//       return;
//     }
//     setSelectedLot(row.id);
//     setSerials([]);
//     setSelectedSerial(null);
//     setLoadingSerials(true);
//     try {
//       const firstDash = row.id.indexOf('-');
//       const whId = row.id.slice(0, firstDash);
//       const lot = row.id.slice(firstDash + 1);
//       const res = await api.get(`/stock/serials?itemId=${productForm.id}&warehouseId=${whId}&lotNumber=${encodeURIComponent(lot)}`);
//       setSerials(res.data || []);
//     } catch (err) {
//       setMessage({ text: "Failed to load serials", type: "danger" });
//       setSerials([]);
//     } finally {
//       setLoadingSerials(false);
//     }
//   };

//   const handleSerialClick = (serial) => {
//     const serialValue = serial?.SerialNumber || serial?.serialNumber || serial;
//     if (!serialValue) return;
//     if (selectedSerial?.SerialNumber === serialValue || selectedSerial?.serialNumber === serialValue || selectedSerial === serial) {
//       setSelectedSerial(null);
//       return;
//     }
//     setSelectedSerial(serial);
//   };

//   useEffect(() => {
//     if (!selectedSerial || !serialBarcodeRef.current) return;
//     try {
//       JsBarcode(serialBarcodeRef.current, selectedSerial.SerialNumber || selectedSerial.serialNumber || selectedSerial, {
//         format: "CODE128",
//         width: 2,
//         height: 44,
//         displayValue: true,
//         margin: 6
//       });
//     } catch (err) {
//       console.warn("Barcode render failed", err);
//     }
//   }, [selectedSerial]);

//   const handleSave = async () => {
//     const errors = validateProductForm();
//     setValidationErrors(errors);
    
//     if (errors.length > 0) {
//       setMessage({ text: `Validation failed: ${errors.length} issue(s) found`, type: "danger" });
//       return;
//     }
    
//     try {
//       setLoading(true);
//       if (productForm.id) {
//         await api.put(`/smart-erp/products/${productForm.id}`, productForm);
//         setMessage({ text: "Product successfully updated", type: "success" });
//       } else {
//         const res = await api.post("/smart-erp/products", productForm);
//         setProductForm(res.data);
//         setMessage({ text: "New Product registered", type: "success" });
//       }
//       loadAllData();
//       setValidationErrors([]);
//     } catch (err) {
//       const errorMsg = err?.response?.data?.message || err?.response?.data || "Save operation failed";
//       setMessage({ text: errorMsg, type: "danger" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ADDED: Missing Delete Functionality
//   const handleDelete = async () => {
//     if (!productForm.id) {
//       setMessage({ text: "Please select an item to delete first.", type: "warning" });
//       return;
//     }
    
//     if (!window.confirm(`Are you sure you want to delete item: ${productForm.itemCode}?`)) {
//       return;
//     }

//     try {
//       setLoading(true);
//       await api.delete(`/smart-erp/products/${productForm.id}`);
//       setMessage({ text: "Product successfully deleted", type: "success" });
//       setProductForm(createEmptyProductForm());
//       setActiveTab("Main");
//       loadAllData();
//     } catch (err) {
//       const errorMsg = err?.response?.data?.message || err?.response?.data || "Delete operation failed";
//       setMessage({ text: errorMsg, type: "danger" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleIntegrityCheck = async () => {
//     setShowIntegrityCheck(true);
//     setIntegrityIssues([]);
//     const issues = await runIntegrityChecks();
//     setIntegrityIssues(issues);
//   };

//   const handleItemCodeChange = (value) => {
//     setProductForm({...productForm, itemCode: value});
    
//     if (value.length >= 2) {
//       const suggestions = getItemCodeSuggestions(value);
//       setItemCodeSuggestions(suggestions);
//       setShowSuggestions(suggestions.length > 0);
//     } else {
//       setShowSuggestions(false);
//     }
//   };

//   const selectSuggestion = (suggestion) => {
//     setProductForm({...productForm, itemCode: suggestion});
//     setShowSuggestions(false);
//   };

//   const postStock = async () => {
//     if (!productForm.id) return setMessage({ text: "Save product details first", type: "warning" });
//     try {
//       await api.post("/stock/in", {
//         itemId: productForm.id,
//         warehouseId: Number(whAssignment.warehouseId),
//         quantity: Number(whAssignment.quantity),
//         lotNumber: productForm.isLotTracked ? whAssignment.lotNumber : null,
//         scannerDeviceId: whAssignment.scannerDeviceId
//       });
//       setMessage({ text: "Inventory transaction successful", type: "success" });
//       loadAllData();
//     } catch (err) {
//       setMessage({ text: "Failed to post inventory", type: "danger" });
//     }
//   };

//   if (loading && items.length === 0) return <LoadingState />;

//   return (
//     <div className="erp-app-shell vh-100 d-flex flex-column">
      
//       {/* 🛠 TOP TOOLBAR */}
//       <div className="erp-nav d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white shadow-sm">
//         <div className="d-flex gap-2">
//           <button className="erp-btn" onClick={() => setShowSidebar(!showSidebar)}>
//             {showSidebar ? "⬅ Close Filter" : "🔍 Open Filter"}
//           </button>
//           <button className="erp-btn" onClick={() => { setProductForm(createEmptyProductForm()); setActiveTab("Main"); setValidationErrors([]); }}>
//             📄 New
//           </button>
//           <button className="erp-btn btn-primary text-white border-0" onClick={handleSave} disabled={loading}>
//             {loading ? "💾 Saving..." : "💾 Save"}
//           </button>
//           <button className="erp-btn text-danger" onClick={handleDelete} disabled={loading || !productForm.id}>
//             🗑 Delete
//           </button>
//           <button className="erp-btn btn-warning text-dark border-0" onClick={handleIntegrityCheck} title="Run data integrity checks">
//             🔍 Check Data
//           </button>
//         </div>

//         <div className="d-flex align-items-center gap-2">
//           <label className="small fw-bold text-muted mb-0">Quick Search:</label>
//           <input 
//             type="text" 
//             className="form-control form-control-sm" 
//             style={{width: '280px'}} 
//             placeholder="e.g. AJ*, *BOLT, BLK* (use * for wildcard)" 
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             title="Type item code or name. Use * for wildcard: AJ* (starts with), *BOLT (ends with), *BLK* (contains)"
//           />
//         </div>
//       </div>

//       <div className="d-flex flex-grow-1 overflow-hidden">
        
//         {/* 📋 SIDEBAR LIST */}
//         {showSidebar && (
//           <div className="erp-sidebar border-end bg-white d-flex flex-column shadow-sm" style={{width: '280px'}}>
//             <div className="p-2 small fw-bold bg-light border-bottom d-flex justify-content-between text-muted">
//               <span>ITEMS MASTER</span>
//               <span className="badge bg-secondary">{filteredSidebarItems.length}</span>
//             </div>
//             <div className="flex-grow-1 overflow-auto">
//               {filteredSidebarItems.length === 0 ? (
//                 <div className="p-3 text-center text-muted small">
//                   <div style={{fontSize: '24px', marginBottom: '8px'}}>🔍</div>
//                   No items match "{searchTerm}"
//                 </div>
//               ) : (
//                 filteredSidebarItems.map((item) => {
//                   const matchesCode = matchesWildcardPattern(item.itemCode, searchTerm);
//                   const matchesName = matchesWildcardPattern(item.description, searchTerm);
//                   const stockStatus = getStockStatus(item);
                  
//                   return (
//                     <div 
//                       key={item.id} 
//                       className={`sidebar-row p-2 border-bottom cursor-pointer ${productForm.id === item.id ? 'active-row' : ''}`}
//                       onClick={() => selectItem(item)}
//                       style={{
//                         backgroundColor: matchesCode || matchesName ? '#f0f8ff' : 'transparent',
//                         transition: 'background-color 0.2s',
//                         borderLeft: `3px solid var(--bs-${stockStatus.color})`
//                       }}
//                     >
//                       <div className="d-flex justify-content-between fw-bold small align-items-start gap-2">
//                         <div style={{flex: 1}}>
//                           <span className={`fw-bold ${matchesCode ? 'text-danger' : 'text-dark'}`} title={`Pattern: ${searchTerm}`}>
//                             {item.itemCode}
//                           </span>
//                           <div className={`badge bg-${stockStatus.color} text-white ms-1`} style={{fontSize: '9px'}}>
//                             {stockStatus.message}
//                           </div>
//                         </div>
//                         <span className="text-primary badge bg-light text-dark" style={{whiteSpace: 'nowrap'}}>
//                           {totalStock(item.id)} units
//                         </span>
//                       </div>
//                       <div className={`text-truncate ${matchesName && !matchesCode ? 'text-danger fw-bold' : 'text-muted'}`} style={{fontSize: '11px'}}>
//                         {item.description || 'No description'}
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         )}

//         {/* 📑 MAIN FORM CONTENT */}
//         <div className="flex-grow-1 p-3 overflow-auto bg-light">
//           {message.text && (
//             <div className={`alert alert-${message.type} py-1 small fw-bold mb-3 d-flex justify-content-between`}>
//               {message.text}
//               <span className="cursor-pointer" onClick={() => setMessage({text:"", type:""})}>×</span>
//             </div>
//           )}

//           {validationErrors.length > 0 && (
//             <div className="alert alert-warning py-2 mb-3">
//               <div className="fw-bold small mb-2">⚠️ Validation Issues Found:</div>
//               <ul className="mb-0 small">
//                 {validationErrors.map((error, idx) => (
//                   <li key={idx}>{error}</li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           <div className="erp-card bg-white border shadow-sm rounded-1">
//             <div className="erp-tabs d-flex border-bottom bg-light">
//               {["Main", "Planning", "Warehouse", "Quantities", "Costs"].map(tabName => (
//                 <button 
//                   key={tabName} 
//                   className={`tab-link ${activeTab === tabName ? 'active' : ''}`} 
//                   onClick={() => setActiveTab(tabName)}
//                 >
//                   {tabName}
//                 </button>
//               ))}
//             </div>

//             <div className="p-4">
//               {activeTab === "Main" && (
//                 <div className="row g-5">
//                   <div className="col-md-6 border-end">
//                     <div className="erp-group-box">
//                       <span className="box-title">Identification</span>
//                       <div className="field-row position-relative">
//                         <label>Item Code:</label> 
//                         <div style={{width: '65%', position: 'relative'}}>
//                           <input 
//                             className={`fw-bold ${validationErrors.some(e => e.includes('Item Code')) ? 'border-danger' : ''}`} 
//                             value={productForm.itemCode} 
//                             onChange={e => handleItemCodeChange(e.target.value)}
//                             onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
//                             placeholder="e.g. RM-001, FG-100"
//                           />
//                           {showSuggestions && itemCodeSuggestions.length > 0 && (
//                             <div className="position-absolute bg-white border rounded shadow-sm mt-1" style={{width: '100%', zIndex: 1000, maxHeight: '150px', overflowY: 'auto'}}>
//                               {itemCodeSuggestions.map((suggestion, idx) => (
//                                 <div 
//                                   key={idx} 
//                                   className="p-2 small cursor-pointer hover-bg-light"
//                                   onClick={() => selectSuggestion(suggestion)}
//                                   style={{borderBottom: idx < itemCodeSuggestions.length - 1 ? '1px solid #eee' : 'none'}}
//                                 >
//                                   {suggestion}
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                       <div className="field-row"><label>Barcode:</label> <input className="font-monospace" value={productForm.barcode} onChange={e => handleBarcodeChange(e.target.value)} /></div>
//                       <div className="field-row"><label className="text-primary fw-bold">Serial Prefix:</label> <input className="border-primary" placeholder="Enter Prefix..." value={productForm.serialPrefix} onChange={e => setProductForm({...productForm, serialPrefix: e.target.value})} /></div>
//                       <div className="field-row"><label>Description:</label> <textarea rows="2" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
//                     </div>
//                   </div>
//                   <div className="col-md-6">
//                     <div className="erp-group-box">
//                       <span className="box-title">Inventory Attributes</span>
//                       <div className="field-row"><label>Category:</label> <input value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} /></div>
//                       <div className="field-row"><label>Unit (UOM):</label> 
//                         <select value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})}>
//                           <option>NOS</option><option>BX</option><option>KGS</option><option>PCS</option>
//                         </select>
//                       </div>
//                       <div className="field-row"><label>Type:</label> 
//                         <select value={productForm.itemType} onChange={e => setProductForm({...productForm, itemType: e.target.value})}>
//                           <option>Purchased</option><option>Manufactured</option><option>Service</option>
//                         </select>
//                       </div>
//                       <div className="field-row mt-3 p-2 bg-light border rounded">
//                         <label className="form-check-label fw-bold small">Enable Lot Tracking:</label>
//                         <input type="checkbox" className="form-check-input ms-2" checked={productForm.isLotTracked} onChange={e => setProductForm({...productForm, isLotTracked: e.target.checked})} />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === "Planning" && (
//                 <div className="row g-4">
//                   <div className="col-md-6">
//                     <div className="erp-group-box">
//                       <span className="box-title">Stock Controls</span>
//                       <div className="field-row"><label>Safety Stock:</label> <input type="number" className="text-end" value={productForm.safetyStock} onChange={e => setProductForm({...productForm, safetyStock: Number(e.target.value)})} /></div>
//                       <div className="field-row"><label>Max Stock Level:</label> <input type="number" className="text-end" value={productForm.maxStockLevel} onChange={e => setProductForm({...productForm, maxStockLevel: Number(e.target.value)})} /></div>
//                     </div>
//                   </div>
//                   <div className="col-md-6">
//                     <div className="erp-group-box">
//                       <span className="box-title">Forecasting</span>
//                       <div className="field-row"><label>Lead Time (Days):</label> <input type="number" className="text-end" value={productForm.leadTimeDays} onChange={e => setProductForm({...productForm, leadTimeDays: Number(e.target.value)})} /></div>
//                       <div className="field-row"><label>Avg Daily Sales:</label> <input type="number" className="text-end" value={productForm.averageDailySales} onChange={e => setProductForm({...productForm, averageDailySales: Number(e.target.value)})} /></div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {activeTab === "Warehouse" && (
//                 <div className="row justify-content-center">
//                   <div className="col-md-6 erp-group-box border-primary p-4">
//                     <span className="box-title text-primary">Inbound Material Posting</span>
//                     <div className="field-row mb-3"><label className="fw-bold">Warehouse:</label>
//                       <select value={whAssignment.warehouseId} onChange={e => setWhAssignment({...whAssignment, warehouseId: e.target.value})}>
//                         <option value="">-- Select Destination --</option>
//                         {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//                       </select>
//                     </div>
//                     <div className="field-row mb-3"><label className="fw-bold">Receipt Qty:</label> <input type="number" className="text-end fw-bold" value={whAssignment.quantity} onChange={e => setWhAssignment({...whAssignment, quantity: e.target.value})} /></div>
//                     <div className="field-row mb-4"><label className="fw-bold">Lot Number:</label> <input placeholder={productForm.isLotTracked ? "REQUIRED" : "N/A"} value={whAssignment.lotNumber} onChange={e => setWhAssignment({...whAssignment, lotNumber: e.target.value})} disabled={!productForm.isLotTracked} /></div>
//                     <button className="btn btn-primary w-100 fw-bold" onClick={postStock}>POST TO INVENTORY</button>
//                   </div>
//                 </div>
//               )}

//               {activeTab === "Quantities" && (
//                 <div className="row g-4">
//                   <div className="col-md-4">
//                     <div className="erp-kpi shadow-sm">
//                       <div className="small fw-bold text-muted">GLOBAL ON HAND</div>
//                       <div className="display-6 fw-bold text-primary">{totalStock(productForm.id)}</div>
//                     </div>
//                     {poMap[productForm.id] > 0 && (
//                       <div className="erp-kpi shadow-sm mt-3 border-info">
//                         <div className="small fw-bold text-info">IN TRANSIT (PURCHASE)</div>
//                         <div className="h4 fw-bold text-info">{poMap[productForm.id]}</div>
//                       </div>
//                     )}
//                   </div>
//                   <div className="col-md-8 px-4">
//                     <h6 className="small fw-bold text-uppercase text-muted border-bottom pb-2">Location & Lot Details</h6>
//                     <div className="mt-3">
//                       {detailInventoryRows.length === 0 ? <p className="text-center p-5 text-muted small">No active stock records.</p> : 
//                         detailInventoryRows.map(row => (
//                           <div key={row.id}>
//                             <div 
//                               className={`d-flex justify-content-between align-items-center border-bottom py-2 cursor-pointer ${selectedLot === row.id ? 'bg-light' : ''}`}
//                               onClick={() => handleLotClick(row)}
//                             >
//                               <div>
//                                 <div className="fw-bold small text-dark">{row.lot.toUpperCase()}</div>
//                                 <div className="text-muted" style={{fontSize:'10px'}}>{row.whName}</div>
//                               </div>
//                               <div className="fw-bold fs-5">{row.qty.toLocaleString()}</div>
//                             </div>
//                             {selectedLot === row.id && (
//                               <div className="mt-2 mb-3 p-3 bg-white border rounded">
//                                 <h6 className="small fw-bold text-primary mb-2">Serial Numbers</h6>
//                                 {loadingSerials ? (
//                                   <div className="text-center py-2">
//                                     <div className="spinner-border spinner-border-sm text-primary"></div>
//                                   </div>
//                                 ) : serials.length === 0 ? (
//                                   <p className="text-muted small mb-0">No serials found for this lot.</p>
//                                 ) : (
//                                   <>
//                                     <div className="d-flex flex-wrap gap-1">
//                                       {serials.map((serial, idx) => {
//                                         const serialValue = serial?.SerialNumber || serial?.serialNumber || serial;
//                                         const isSelected = selectedSerial && (
//                                           selectedSerial?.SerialNumber === serialValue ||
//                                           selectedSerial?.serialNumber === serialValue ||
//                                           selectedSerial === serial
//                                         );
//                                         return (
//                                           <span
//                                             key={idx}
//                                             className={`badge small ${isSelected ? 'bg-primary text-white' : 'bg-secondary text-dark'} cursor-pointer`}
//                                             onClick={() => handleSerialClick(serial)}
//                                           >
//                                             {serialValue}
//                                           </span>
//                                         );
//                                       })}
//                                     </div>
//                                     {selectedSerial && (
//                                       <div className="mt-3 p-3 border rounded bg-white">
//                                         <div className="small text-muted mb-2">Barcode preview</div>
//                                         <svg ref={serialBarcodeRef} aria-label="Selected serial barcode preview"></svg>
//                                       </div>
//                                     )}
//                                   </>
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         ))
//                       }
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* ADDED: Missing Costs & Pricing Tab UI */}
//               {activeTab === "Costs" && (
//                 <div className="row g-4">
//                   <div className="col-md-6">
//                     <div className="erp-group-box">
//                       <span className="box-title">Pricing & Costs</span>
//                       <div className="field-row">
//                         <label>Unit Price (Cost):</label> 
//                         <input 
//                           type="number" 
//                           className="text-end fw-bold" 
//                           value={productForm.unitPrice} 
//                           onChange={e => setProductForm({...productForm, unitPrice: Number(e.target.value)})} 
//                         />
//                       </div>
//                       <div className="field-row">
//                         <label>Selling Price:</label> 
//                         <input 
//                           type="number" 
//                           className="text-end" 
//                           value={productForm.price} 
//                           onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} 
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* INTEGRITY CHECK MODAL */}
//       {showIntegrityCheck && (
//         <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{zIndex: 1050}}>
//           <div className="bg-white rounded shadow-lg p-4" style={{maxWidth: '500px', width: '90%'}}>
//             <div className="d-flex justify-content-between align-items-center mb-3">
//               <h5 className="mb-0 fw-bold text-primary">🔍 Data Integrity Check</h5>
//               <button className="btn-close" onClick={() => setShowIntegrityCheck(false)}></button>
//             </div>
            
//             {integrityIssues.length === 0 ? (
//               <div className="text-center py-4">
//                 <div className="text-success mb-2" style={{fontSize: '48px'}}>✅</div>
//                 <div className="fw-bold text-success">All checks passed!</div>
//                 <div className="text-muted small">No data integrity issues found</div>
//               </div>
//             ) : (
//               <div>
//                 <div className="alert alert-warning py-2 mb-3">
//                   <strong>{integrityIssues.length} issue(s) found</strong>
//                 </div>
//                 <div style={{maxHeight: '300px', overflowY: 'auto'}}>
//                   {integrityIssues.map((issue, idx) => (
//                     <div key={idx} className="d-flex align-items-start mb-2 p-2 bg-light rounded">
//                       <span className="text-warning me-2">⚠️</span>
//                       <span className="small">{issue}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             <div className="d-flex justify-content-end gap-2 mt-3">
//               <button className="btn btn-secondary btn-sm" onClick={() => setShowIntegrityCheck(false)}>Close</button>
//               {integrityIssues.length > 0 && (
//                 <button className="btn btn-primary btn-sm" onClick={() => {setShowIntegrityCheck(false); handleIntegrityCheck();}}>
//                   🔄 Re-run Check
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       <style>{`
//         .erp-app-shell { background: #f4f7f9; font-family: 'Segoe UI', system-ui, sans-serif; }
//         .erp-btn { background: white; border: 1px solid #ced4da; font-size: 12px; padding: 5px 15px; border-radius: 3px; cursor: pointer; font-weight: 500; }
//         .erp-btn:hover:not(:disabled) { background: #f8f9fa; border-color: #adb5bd; }
//         .erp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        
//         .hover-bg-light:hover { background-color: #f8f9fa !important; }
        
//         .sidebar-row { transition: 0.1s; border-left: 3px solid transparent; }
//         .sidebar-row:hover { background: #f8f9fa; }
//         .active-row { background: #e7f1ff !important; border-left-color: #0d6efd !important; }

//         .cursor-pointer { cursor: pointer; }

//         .tab-link { border: none; background: transparent; padding: 10px 25px; font-size: 13px; color: #666; border-right: 1px solid #eee; cursor: pointer; }
//         .tab-link.active { background: white; color: #0d6efd; font-weight: 700; border-bottom: 2px solid #0d6efd; }

//         .erp-group-box { border: 1px solid #dee2e6; padding: 25px 15px 15px; position: relative; border-radius: 4px; margin-top: 10px; }
//         .box-title { position: absolute; top: -10px; left: 12px; background: white; padding: 0 8px; font-size: 11px; font-weight: 700; color: #0d6efd; text-transform: uppercase; }

//         .field-row { display: flex; align-items: center; margin-bottom: 10px; }
//         .field-row label { width: 35%; font-size: 12px; color: #495057; font-weight: 600; }
//         .field-row input, .field-row select, .field-row textarea { width: 65%; border: 1px solid #ced4da; border-radius: 3px; padding: 4px 10px; font-size: 13px; outline: none; }
//         .field-row input:focus, .field-row select:focus, .field-row textarea:focus { border-color: #0d6efd; }
//         .field-row input.border-danger { border-color: #dc3545 !important; }

//         .erp-kpi { background: #fff; padding: 20px; border-left: 5px solid #0d6efd; border-radius: 3px; border: 1px solid #eee; border-left-width: 5px; }
//       `}</style>
//     </div>
//   );
// }

// function LoadingState() {
//   return (
//     <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
//       <div className="spinner-border text-primary mb-3"></div>
//       <div className="fw-bold text-muted small text-uppercase">Initialising ERP Master Data...</div>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import api from "../services/apiClient";
import { smartErpApi } from "../services/smartErpApi";

const createEmptyProductForm = () => ({
  // Core
  itemCode: "",
  description: "",
  barcode: "",
  category: "General",
  unit: "NOS",
  itemType: "Purchased",
  // Pricing & Costs
  price: 0,           
  unitPrice: 0,       
  standardCost: 0,    // Advanced: Standard vs Avg Cost
  taxCode: "STANDARD", // Advanced: Taxation
  // Inventory Control
  warehouseLocation: "",
  isLotTracked: false,
  serialPrefix: "",
  maxStockLevel: 0,
  safetyStock: 0,
  leadTimeDays: 0,
  averageDailySales: 0,
  // Advanced Supply Chain & Quality
  mpn: "",            // Manufacturer Part Number
  preferredVendor: "",
  moq: 1,             // Minimum Order Quantity
  netWeight: 0,       
  grossWeight: 0,
  volumeCBM: 0,       // Cubic Meters
  shelfLifeDays: 0,
  countryOfOrigin: "",
  requiresQA: false   // Quality Assurance routing
});

export default function SmartERP() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [poMap, setPoMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // UI States
  const [activeTab, setActiveTab] = useState("Main");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [productForm, setProductForm] = useState(createEmptyProductForm());
  const [whAssignment, setWhAssignment] = useState({ 
    warehouseId: "", 
    quantity: 0, 
    lotNumber: "", 
    scannerDeviceId: "WEB-APP-01" 
  });
  const [selectedLot, setSelectedLot] = useState(null);
  const [serials, setSerials] = useState([]);
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const serialBarcodeRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showIntegrityCheck, setShowIntegrityCheck] = useState(false);
  const [integrityIssues, setIntegrityIssues] = useState([]);
  const [itemCodeSuggestions, setItemCodeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load Everything from Backend
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

      const map = {};
      (resPO.data || []).forEach(po => {
        (po.Lines || []).forEach(line => {
          const id = line.ItemId || line.itemId;
          if (!map[id]) map[id] = 0;
          map[id] += line.PendingQuantity || 0;
        });
      });
      setPoMap(map);
    } catch (err) {
      setMessage({ text: "Connectivity Lost. Gateway offline.", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllData(); }, []);

  // Advanced validation checks
  const validateProductForm = () => {
    const errors = [];
    
    // Required field validation
    if (!productForm.itemCode?.trim()) errors.push("Item Code is required");
    if (!productForm.description?.trim()) errors.push("Description is required");
    
    // Duplicate checking
    if (productForm.itemCode?.trim()) {
      const duplicate = items.find(item => 
        item.id !== productForm.id && 
        item.itemCode?.toLowerCase() === productForm.itemCode.toLowerCase()
      );
      if (duplicate) errors.push(`Item Code "${productForm.itemCode}" already exists`);
    }
    
    if (productForm.barcode?.trim()) {
      const duplicate = items.find(item => 
        item.id !== productForm.id && 
        item.barcode?.toLowerCase() === productForm.barcode.toLowerCase()
      );
      if (duplicate) errors.push(`Barcode "${productForm.barcode}" already exists`);
    }
    
    // Data type validation (Including new advanced fields)
    if (productForm.price < 0) errors.push("Selling Price cannot be negative");
    if (productForm.unitPrice < 0) errors.push("Unit Price cannot be negative"); 
    if (productForm.safetyStock < 0) errors.push("Safety Stock cannot be negative");
    if (productForm.maxStockLevel < 0) errors.push("Max Stock Level cannot be negative");
    if (productForm.leadTimeDays < 0) errors.push("Lead Time cannot be negative");
    if (productForm.moq < 1) errors.push("Minimum Order Quantity (MOQ) must be at least 1");
    if (productForm.netWeight < 0 || productForm.grossWeight < 0) errors.push("Weights cannot be negative");
    if (productForm.shelfLifeDays < 0) errors.push("Shelf life cannot be negative");
    
    // Logical validation
    if (productForm.maxStockLevel > 0 && productForm.safetyStock > productForm.maxStockLevel) {
      errors.push("Safety Stock cannot exceed Max Stock Level");
    }
    if (productForm.netWeight > productForm.grossWeight) {
      errors.push("Net Weight cannot be greater than Gross Weight");
    }
    
    // Serial prefix validation for lot tracked items
    if (productForm.isLotTracked && !productForm.serialPrefix?.trim()) {
      errors.push("Serial Prefix is required for lot tracked items");
    }
    
    return errors;
  };

  // Stock level analysis
  const getStockStatus = (item) => {
    if (!item) return { status: 'unknown', color: 'secondary', message: 'No data' };
    
    const currentStock = totalStock(item.id);
    const safetyStock = item.safetyStock || 0;
    const maxStock = item.maxStockLevel || 1000;
    
    if (currentStock <= 0) return { status: 'out-of-stock', color: 'danger', message: 'Out of Stock' };
    if (currentStock < safetyStock) return { status: 'critical', color: 'danger', message: 'Critical Low' };
    if (currentStock < safetyStock * 1.5) return { status: 'low', color: 'warning', message: 'Low Stock' };
    if (currentStock > maxStock) return { status: 'overstock', color: 'info', message: 'Overstocked' };
    if (currentStock >= maxStock * 0.9) return { status: 'high', color: 'success', message: 'Near Max' };
    
    return { status: 'optimal', color: 'success', message: 'Optimal' };
  };

  // Data integrity checks
  const runIntegrityChecks = async () => {
    const issues = [];
    try {
      const itemsWithoutInventory = items.filter(item => totalStock(item.id) === 0);
      if (itemsWithoutInventory.length > 0) issues.push(`${itemsWithoutInventory.length} items have no inventory records`);
      
      const negativeStock = inventory.filter(inv => (inv.quantity || inv.Quantity || 0) < 0);
      if (negativeStock.length > 0) issues.push(`${negativeStock.length} inventory records show negative quantities`);
      
      const validItemIds = new Set(items.map(item => item.id));
      const orphanedInventory = inventory.filter(inv => !validItemIds.has(inv.itemId || inv.ItemId));
      if (orphanedInventory.length > 0) issues.push(`${orphanedInventory.length} inventory records reference non-existent items`);
      
      const invalidItems = items.filter(item => !item.itemCode?.trim() || !item.description?.trim() || item.price < 0);
      if (invalidItems.length > 0) issues.push(`${invalidItems.length} items have invalid or missing data`);
    } catch (err) {
      issues.push("Failed to run integrity checks");
    }
    return issues;
  };

  // Auto-suggestions for item codes
  const getItemCodeSuggestions = (input) => {
    if (!input || input.length < 2) return [];
    
    const suggestions = [];
    const prefix = input.toUpperCase();
    
    const categoryPrefixes = {
      'RAW': 'RM-', 'FINISHED': 'FG-', 'SEMI': 'SM-', 'PACKAGING': 'PKG-', 'SPARE': 'SPR-'
    };
    
    Object.entries(categoryPrefixes).forEach(([cat, prefix]) => {
      if (cat.toLowerCase().includes(input.toLowerCase()) || prefix.toLowerCase().includes(input.toLowerCase())) {
        const nextNumber = items
          .filter(item => item.itemCode?.startsWith(prefix))
          .map(item => {
            const num = parseInt(item.itemCode.replace(prefix, ''));
            return isNaN(num) ? 0 : num;
          })
          .reduce((max, num) => Math.max(max, num), 0) + 1;
        suggestions.push(`${prefix}${nextNumber.toString().padStart(3, '0')}`);
      }
    });
    
    const existingNumbers = items
      .map(item => {
        const match = item.itemCode?.match(/^([A-Z]+)-?(\d+)$/);
        return match ? parseInt(match[2]) : null;
      })
      .filter(num => num !== null)
      .sort((a, b) => b - a);
    
    if (existingNumbers.length > 0) {
      suggestions.push(`${prefix}-${(existingNumbers[0] + 1).toString().padStart(3, '0')}`);
    }
    
    return [...new Set(suggestions)].slice(0, 5);
  };

  // Convert wildcard pattern to regex and match
  const matchesWildcardPattern = (text, pattern) => {
    if (!text || !pattern) return false;
    const normalizedText = text.toLowerCase();
    const normalizedPattern = pattern.toLowerCase();
    
    if (!normalizedPattern.includes('*')) return normalizedText.includes(normalizedPattern);
    
    const regexPattern = normalizedPattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    try {
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(normalizedText);
    } catch (e) {
      return normalizedText.includes(normalizedPattern.replace(/\*/g, ''));
    }
  };

  const filteredSidebarItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(i => 
      matchesWildcardPattern(i.itemCode, searchTerm) ||
      matchesWildcardPattern(i.description, searchTerm)
    );
  }, [items, searchTerm]);

  const handleBarcodeChange = (value) => {
    setProductForm((prev) => {
      const trimmedDesc = prev.description?.trim() ?? "";
      const autoDesc = value ? `ITEM-${value}` : "";
      return {
        ...prev,
        barcode: value,
        description: !trimmedDesc ? autoDesc : prev.description,
        isLotTracked: prev.isLotTracked || Boolean(autoDesc)
      };
    });
  };

  const selectItem = (item) => {
    setProductForm({ 
      ...createEmptyProductForm(), 
      ...item, 
      serialPrefix: item.serialPrefix || "" 
    });
    setActiveTab("Main");
    setValidationErrors([]);
  };

  const totalStock = (itemId) => inventory
    .filter((i) => (i.itemId || i.ItemId) === itemId)
    .reduce((sum, i) => sum + Number(i.quantity || i.Quantity || 0), 0);

  const detailInventoryRows = useMemo(() => {
    if (!productForm.id) return [];
    const grouping = {};
    inventory.filter(i => (i.itemId || i.ItemId) === productForm.id).forEach(row => {
      const whId = row.warehouseId || row.WarehouseId;
      const lot = row.lotNumber || "general";
      const key = `${whId}-${lot}`;
      if (!grouping[key]) {
        const whName = warehouses.find(w => w.id === whId)?.name || `WH-${whId}`;
        grouping[key] = { id: key, whName, lot, qty: 0 };
      }
      grouping[key].qty += Number(row.quantity || 0);
    });
    return Object.values(grouping);
  }, [productForm.id, inventory, warehouses]);

  const handleLotClick = async (row) => {
    if (selectedLot === row.id) {
      setSelectedLot(null);
      setSerials([]);
      return;
    }
    setSelectedLot(row.id);
    setSerials([]);
    setSelectedSerial(null);
    setLoadingSerials(true);
    try {
      const firstDash = row.id.indexOf('-');
      const whId = row.id.slice(0, firstDash);
      const lot = row.id.slice(firstDash + 1);
      const res = await api.get(`/stock/serials?itemId=${productForm.id}&warehouseId=${whId}&lotNumber=${encodeURIComponent(lot)}`);
      setSerials(res.data || []);
    } catch (err) {
      setMessage({ text: "Failed to load serials", type: "danger" });
      setSerials([]);
    } finally {
      setLoadingSerials(false);
    }
  };

  const handleSerialClick = (serial) => {
    const serialValue = serial?.SerialNumber || serial?.serialNumber || serial;
    if (!serialValue) return;
    if (selectedSerial?.SerialNumber === serialValue || selectedSerial?.serialNumber === serialValue || selectedSerial === serial) {
      setSelectedSerial(null);
      return;
    }
    setSelectedSerial(serial);
  };

  useEffect(() => {
    if (!selectedSerial || !serialBarcodeRef.current) return;
    try {
      JsBarcode(serialBarcodeRef.current, selectedSerial.SerialNumber || selectedSerial.serialNumber || selectedSerial, {
        format: "CODE128",
        width: 2, height: 44, displayValue: true, margin: 6
      });
    } catch (err) {
      console.warn("Barcode render failed", err);
    }
  }, [selectedSerial]);

  const handleSave = async () => {
    const errors = validateProductForm();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      setMessage({ text: `Validation failed: ${errors.length} issue(s) found`, type: "danger" });
      return;
    }
    
    try {
      setLoading(true);
      if (productForm.id) {
        await api.put(`/smart-erp/products/${productForm.id}`, productForm);
        setMessage({ text: "Product successfully updated", type: "success" });
      } else {
        const res = await api.post("/smart-erp/products", productForm);
        setProductForm(res.data);
        setMessage({ text: "New Product registered", type: "success" });
      }
      loadAllData();
      setValidationErrors([]);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data || "Save operation failed";
      setMessage({ text: errorMsg, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productForm.id) return setMessage({ text: "Please select an item to delete first.", type: "warning" });
    if (!window.confirm(`Are you sure you want to delete item: ${productForm.itemCode}?`)) return;

    try {
      setLoading(true);
      await api.delete(`/smart-erp/products/${productForm.id}`);
      setMessage({ text: "Product successfully deleted", type: "success" });
      setProductForm(createEmptyProductForm());
      setActiveTab("Main");
      loadAllData();
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.response?.data || "Delete operation failed";
      setMessage({ text: errorMsg, type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrityCheck = async () => {
    setShowIntegrityCheck(true);
    setIntegrityIssues([]);
    const issues = await runIntegrityChecks();
    setIntegrityIssues(issues);
  };

  const handleItemCodeChange = (value) => {
    setProductForm({...productForm, itemCode: value});
    if (value.length >= 2) {
      const suggestions = getItemCodeSuggestions(value);
      setItemCodeSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setProductForm({...productForm, itemCode: suggestion});
    setShowSuggestions(false);
  };

  const postStock = async () => {
    if (!productForm.id) return setMessage({ text: "Save product details first", type: "warning" });
    try {
      await api.post("/stock/in", {
        itemId: productForm.id,
        warehouseId: Number(whAssignment.warehouseId),
        quantity: Number(whAssignment.quantity),
        lotNumber: productForm.isLotTracked ? whAssignment.lotNumber : null,
        scannerDeviceId: whAssignment.scannerDeviceId
      });
      setMessage({ text: "Inventory transaction successful", type: "success" });
      loadAllData();
    } catch (err) {
      setMessage({ text: "Failed to post inventory", type: "danger" });
    }
  };

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="erp-app-shell vh-100 d-flex flex-column">
      
      {/* 🛠 TOP TOOLBAR */}
      <div className="erp-nav d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-white shadow-sm">
        <div className="d-flex gap-2">
          <button className="erp-btn" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? "⬅ Close Filter" : "🔍 Open Filter"}
          </button>
          <button className="erp-btn" onClick={() => { setProductForm(createEmptyProductForm()); setActiveTab("Main"); setValidationErrors([]); }}>
            📄 New
          </button>
          <button className="erp-btn btn-primary text-white border-0" onClick={handleSave} disabled={loading}>
            {loading ? "💾 Saving..." : "💾 Save"}
          </button>
          <button className="erp-btn text-danger" onClick={handleDelete} disabled={loading || !productForm.id}>
            🗑 Delete
          </button>
          <button className="erp-btn btn-warning text-dark border-0" onClick={handleIntegrityCheck} title="Run data integrity checks">
            🔍 Check Data
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <label className="small fw-bold text-muted mb-0">Quick Search:</label>
          <input 
            type="text" 
            className="form-control form-control-sm" 
            style={{width: '280px'}} 
            placeholder="e.g. AJ*, *BOLT, BLK* (use * for wildcard)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="d-flex flex-grow-1 overflow-hidden">
        
        {/* 📋 SIDEBAR LIST */}
        {showSidebar && (
          <div className="erp-sidebar border-end bg-white d-flex flex-column shadow-sm" style={{width: '280px'}}>
            <div className="p-2 small fw-bold bg-light border-bottom d-flex justify-content-between text-muted">
              <span>ITEMS MASTER</span>
              <span className="badge bg-secondary">{filteredSidebarItems.length}</span>
            </div>
            <div className="flex-grow-1 overflow-auto">
              {filteredSidebarItems.length === 0 ? (
                <div className="p-3 text-center text-muted small">
                  <div style={{fontSize: '24px', marginBottom: '8px'}}>🔍</div>
                  No items match "{searchTerm}"
                </div>
              ) : (
                filteredSidebarItems.map((item) => {
                  const matchesCode = matchesWildcardPattern(item.itemCode, searchTerm);
                  const matchesName = matchesWildcardPattern(item.description, searchTerm);
                  const stockStatus = getStockStatus(item);
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`sidebar-row p-2 border-bottom cursor-pointer ${productForm.id === item.id ? 'active-row' : ''}`}
                      onClick={() => selectItem(item)}
                      style={{
                        backgroundColor: matchesCode || matchesName ? '#f0f8ff' : 'transparent',
                        borderLeft: `3px solid var(--bs-${stockStatus.color})`
                      }}
                    >
                      <div className="d-flex justify-content-between fw-bold small align-items-start gap-2">
                        <div style={{flex: 1}}>
                          <span className={`fw-bold ${matchesCode ? 'text-danger' : 'text-dark'}`}>{item.itemCode}</span>
                          <div className={`badge bg-${stockStatus.color} text-white ms-1`} style={{fontSize: '9px'}}>
                            {stockStatus.message}
                          </div>
                        </div>
                        <span className="text-primary badge bg-light text-dark" style={{whiteSpace: 'nowrap'}}>
                          {totalStock(item.id)} units
                        </span>
                      </div>
                      <div className={`text-truncate ${matchesName && !matchesCode ? 'text-danger fw-bold' : 'text-muted'}`} style={{fontSize: '11px'}}>
                        {item.description || 'No description'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 📑 MAIN FORM CONTENT */}
        <div className="flex-grow-1 p-3 overflow-auto bg-light">
          {message.text && (
            <div className={`alert alert-${message.type} py-1 small fw-bold mb-3 d-flex justify-content-between`}>
              {message.text}
              <span className="cursor-pointer" onClick={() => setMessage({text:"", type:""})}>×</span>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="alert alert-warning py-2 mb-3">
              <div className="fw-bold small mb-2">⚠️ Validation Issues Found:</div>
              <ul className="mb-0 small">
                {validationErrors.map((error, idx) => <li key={idx}>{error}</li>)}
              </ul>
            </div>
          )}

          <div className="erp-card bg-white border shadow-sm rounded-1">
            <div className="erp-tabs d-flex border-bottom bg-light">
              {["Main", "Planning", "Advanced", "Warehouse", "Quantities", "Costs"].map(tabName => (
                <button 
                  key={tabName} 
                  className={`tab-link ${activeTab === tabName ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tabName)}
                >
                  {tabName}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* TAB 1: MAIN */}
              {activeTab === "Main" && (
                <div className="row g-5">
                  <div className="col-md-6 border-end">
                    <div className="erp-group-box">
                      <span className="box-title">Identification</span>
                      <div className="field-row position-relative">
                        <label>Item Code:</label> 
                        <div style={{width: '65%', position: 'relative'}}>
                          <input 
                            className={`fw-bold ${validationErrors.some(e => e.includes('Item Code')) ? 'border-danger' : ''}`} 
                            value={productForm.itemCode} 
                            onChange={e => handleItemCodeChange(e.target.value)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="e.g. RM-001, FG-100"
                          />
                          {showSuggestions && itemCodeSuggestions.length > 0 && (
                            <div className="position-absolute bg-white border rounded shadow-sm mt-1" style={{width: '100%', zIndex: 1000, maxHeight: '150px', overflowY: 'auto'}}>
                              {itemCodeSuggestions.map((suggestion, idx) => (
                                <div key={idx} className="p-2 small cursor-pointer hover-bg-light" onClick={() => selectSuggestion(suggestion)}>{suggestion}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="field-row"><label>Barcode:</label> <input className="font-monospace" value={productForm.barcode} onChange={e => handleBarcodeChange(e.target.value)} /></div>
                      <div className="field-row"><label className="text-primary fw-bold">Serial Prefix:</label> <input className="border-primary" placeholder="Enter Prefix..." value={productForm.serialPrefix} onChange={e => setProductForm({...productForm, serialPrefix: e.target.value})} /></div>
                      <div className="field-row"><label>Description:</label> <textarea rows="2" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-group-box">
                      <span className="box-title">Inventory Attributes</span>
                      <div className="field-row"><label>Category:</label> <input value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} /></div>
                      <div className="field-row"><label>Unit (UOM):</label> 
                        <select value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})}>
                          <option>NOS</option><option>BX</option><option>KGS</option><option>PCS</option><option>LTR</option>
                        </select>
                      </div>
                      <div className="field-row"><label>Type:</label> 
                        <select value={productForm.itemType} onChange={e => setProductForm({...productForm, itemType: e.target.value})}>
                          <option>Purchased</option><option>Manufactured</option><option>Service</option>
                        </select>
                      </div>
                      <div className="field-row mt-3 p-2 bg-light border rounded">
                        <label className="form-check-label fw-bold small">Enable Lot Tracking:</label>
                        <input type="checkbox" className="form-check-input ms-2" checked={productForm.isLotTracked} onChange={e => setProductForm({...productForm, isLotTracked: e.target.checked})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PLANNING */}
              {activeTab === "Planning" && (
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="erp-group-box">
                      <span className="box-title">Stock Controls</span>
                      <div className="field-row"><label>Safety Stock:</label> <input type="number" className="text-end" value={productForm.safetyStock} onChange={e => setProductForm({...productForm, safetyStock: Number(e.target.value)})} /></div>
                      <div className="field-row"><label>Max Stock Level:</label> <input type="number" className="text-end" value={productForm.maxStockLevel} onChange={e => setProductForm({...productForm, maxStockLevel: Number(e.target.value)})} /></div>
                      <div className="field-row"><label>Avg Daily Sales:</label> <input type="number" className="text-end" value={productForm.averageDailySales} onChange={e => setProductForm({...productForm, averageDailySales: Number(e.target.value)})} /></div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-group-box">
                      <span className="box-title">Procurement Info</span>
                      <div className="field-row"><label>Lead Time (Days):</label> <input type="number" className="text-end" value={productForm.leadTimeDays} onChange={e => setProductForm({...productForm, leadTimeDays: Number(e.target.value)})} /></div>
                      <div className="field-row"><label>Pref. Vendor:</label> <input placeholder="e.g. VEND-001" value={productForm.preferredVendor} onChange={e => setProductForm({...productForm, preferredVendor: e.target.value})} /></div>
                      <div className="field-row"><label>Min Order Qty (MOQ):</label> <input type="number" className="text-end" value={productForm.moq} onChange={e => setProductForm({...productForm, moq: Number(e.target.value)})} /></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ADVANCED (NEW) */}
              {activeTab === "Advanced" && (
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="erp-group-box border-info">
                      <span className="box-title text-info">Dimensions & Weight</span>
                      <div className="field-row"><label>Net Weight (kg):</label> <input type="number" step="0.01" className="text-end" value={productForm.netWeight} onChange={e => setProductForm({...productForm, netWeight: Number(e.target.value)})} /></div>
                      <div className="field-row"><label>Gross Weight (kg):</label> <input type="number" step="0.01" className="text-end" value={productForm.grossWeight} onChange={e => setProductForm({...productForm, grossWeight: Number(e.target.value)})} /></div>
                      <div className="field-row"><label>Volume (CBM):</label> <input type="number" step="0.001" className="text-end" value={productForm.volumeCBM} onChange={e => setProductForm({...productForm, volumeCBM: Number(e.target.value)})} /></div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-group-box border-warning">
                      <span className="box-title text-warning">Quality & Compliance</span>
                      <div className="field-row"><label>Country of Origin:</label> <input placeholder="e.g. IND, USA" value={productForm.countryOfOrigin} onChange={e => setProductForm({...productForm, countryOfOrigin: e.target.value})} /></div>
                      <div className="field-row"><label>Shelf Life (Days):</label> <input type="number" className="text-end" value={productForm.shelfLifeDays} onChange={e => setProductForm({...productForm, shelfLifeDays: Number(e.target.value)})} placeholder="0 for infinite" /></div>
                      <div className="field-row"><label>Mfg Part No (MPN):</label> <input value={productForm.mpn} onChange={e => setProductForm({...productForm, mpn: e.target.value})} /></div>
                      <div className="field-row mt-3 p-2 bg-light border rounded border-warning">
                        <label className="form-check-label fw-bold small text-warning-emphasis">Requires Inbound QA Inspection:</label>
                        <input type="checkbox" className="form-check-input ms-2" checked={productForm.requiresQA} onChange={e => setProductForm({...productForm, requiresQA: e.target.checked})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WAREHOUSE */}
              {activeTab === "Warehouse" && (
                <div className="row justify-content-center">
                  <div className="col-md-6 erp-group-box border-primary p-4">
                    <span className="box-title text-primary">Inbound Material Posting</span>
                    <div className="field-row mb-3"><label className="fw-bold">Warehouse:</label>
                      <select value={whAssignment.warehouseId} onChange={e => setWhAssignment({...whAssignment, warehouseId: e.target.value})}>
                        <option value="">-- Select Destination --</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="field-row mb-3"><label className="fw-bold">Receipt Qty:</label> <input type="number" className="text-end fw-bold" value={whAssignment.quantity} onChange={e => setWhAssignment({...whAssignment, quantity: e.target.value})} /></div>
                    <div className="field-row mb-4"><label className="fw-bold">Lot Number:</label> <input placeholder={productForm.isLotTracked ? "REQUIRED" : "N/A"} value={whAssignment.lotNumber} onChange={e => setWhAssignment({...whAssignment, lotNumber: e.target.value})} disabled={!productForm.isLotTracked} /></div>
                    <button className="btn btn-primary w-100 fw-bold" onClick={postStock}>POST TO INVENTORY</button>
                  </div>
                </div>
              )}

              {/* TAB 5: QUANTITIES */}
              {activeTab === "Quantities" && (
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="erp-kpi shadow-sm">
                      <div className="small fw-bold text-muted">GLOBAL ON HAND</div>
                      <div className="display-6 fw-bold text-primary">{totalStock(productForm.id)}</div>
                    </div>
                    {poMap[productForm.id] > 0 && (
                      <div className="erp-kpi shadow-sm mt-3 border-info">
                        <div className="small fw-bold text-info">IN TRANSIT (PURCHASE)</div>
                        <div className="h4 fw-bold text-info">{poMap[productForm.id]}</div>
                      </div>
                    )}
                  </div>
                  <div className="col-md-8 px-4">
                    <h6 className="small fw-bold text-uppercase text-muted border-bottom pb-2">Location & Lot Details</h6>
                    <div className="mt-3">
                      {detailInventoryRows.length === 0 ? <p className="text-center p-5 text-muted small">No active stock records.</p> : 
                        detailInventoryRows.map(row => (
                          <div key={row.id}>
                            <div className={`d-flex justify-content-between align-items-center border-bottom py-2 cursor-pointer ${selectedLot === row.id ? 'bg-light' : ''}`} onClick={() => handleLotClick(row)}>
                              <div>
                                <div className="fw-bold small text-dark">{row.lot.toUpperCase()}</div>
                                <div className="text-muted" style={{fontSize:'10px'}}>{row.whName}</div>
                              </div>
                              <div className="fw-bold fs-5">{row.qty.toLocaleString()}</div>
                            </div>
                            {selectedLot === row.id && (
                              <div className="mt-2 mb-3 p-3 bg-white border rounded">
                                <h6 className="small fw-bold text-primary mb-2">Serial Numbers</h6>
                                {loadingSerials ? <div className="text-center py-2"><div className="spinner-border spinner-border-sm text-primary"></div></div> : serials.length === 0 ? <p className="text-muted small mb-0">No serials found.</p> : (
                                  <><div className="d-flex flex-wrap gap-1">
                                      {serials.map((serial, idx) => {
                                        const val = serial?.SerialNumber || serial?.serialNumber || serial;
                                        const sel = selectedSerial && (selectedSerial?.SerialNumber === val || selectedSerial?.serialNumber === val || selectedSerial === serial);
                                        return <span key={idx} className={`badge small ${sel ? 'bg-primary text-white' : 'bg-secondary text-dark'} cursor-pointer`} onClick={() => handleSerialClick(serial)}>{val}</span>;
                                      })}
                                    </div>
                                    {selectedSerial && <div className="mt-3 p-3 border rounded bg-white"><div className="small text-muted mb-2">Barcode preview</div><svg ref={serialBarcodeRef}></svg></div>}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: COSTS */}
              {activeTab === "Costs" && (
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="erp-group-box">
                      <span className="box-title">Pricing & Costs</span>
                      <div className="field-row"><label>Standard Cost:</label> <input type="number" className="text-end" value={productForm.standardCost} onChange={e => setProductForm({...productForm, standardCost: Number(e.target.value)})} title="Base accounting cost" /></div>
                      <div className="field-row"><label>Actual Unit Price:</label> <input type="number" className="text-end fw-bold" value={productForm.unitPrice} onChange={e => setProductForm({...productForm, unitPrice: Number(e.target.value)})} title="Last purchase cost" /></div>
                      <div className="field-row"><label>Selling Price:</label> <input type="number" className="text-end" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} /></div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="erp-group-box">
                      <span className="box-title">Taxation</span>
                      <div className="field-row"><label>Tax Code:</label> 
                        <select value={productForm.taxCode} onChange={e => setProductForm({...productForm, taxCode: e.target.value})}>
                          <option value="STANDARD">Standard Rate</option>
                          <option value="EXEMPT">Tax Exempt</option>
                          <option value="REDUCED">Reduced Rate</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INTEGRITY CHECK MODAL */}
      {showIntegrityCheck && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{zIndex: 1050}}>
          <div className="bg-white rounded shadow-lg p-4" style={{maxWidth: '500px', width: '90%'}}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 fw-bold text-primary">🔍 Data Integrity Check</h5>
              <button className="btn-close" onClick={() => setShowIntegrityCheck(false)}></button>
            </div>
            {integrityIssues.length === 0 ? (
              <div className="text-center py-4"><div className="text-success mb-2" style={{fontSize: '48px'}}>✅</div><div className="fw-bold text-success">All checks passed!</div><div className="text-muted small">No data integrity issues found</div></div>
            ) : (
              <div><div className="alert alert-warning py-2 mb-3"><strong>{integrityIssues.length} issue(s) found</strong></div><div style={{maxHeight: '300px', overflowY: 'auto'}}>{integrityIssues.map((issue, idx) => <div key={idx} className="d-flex align-items-start mb-2 p-2 bg-light rounded"><span className="text-warning me-2">⚠️</span><span className="small">{issue}</span></div>)}</div></div>
            )}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowIntegrityCheck(false)}>Close</button>
              {integrityIssues.length > 0 && <button className="btn btn-primary btn-sm" onClick={() => {setShowIntegrityCheck(false); handleIntegrityCheck();}}>🔄 Re-run Check</button>}
            </div>
          </div>
        </div>
      )}
<style>{`
        /* Global Shell */
        .erp-app-shell { 
          background: #f1f5f9; /* Modern slate background */
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; 
          color: #1e293b;
        }

        /* 🎛️ Modern Button Styling */
        .erp-btn { 
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px; 
          font-size: 13px; 
          font-weight: 600;
          border-radius: 6px; 
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          cursor: pointer; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          letter-spacing: 0.3px;
        }
        
        .erp-btn:hover:not(:disabled) { 
          background: #f8fafc; 
          border-color: #94a3b8; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }

        .erp-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .erp-btn:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
          background: #e2e8f0;
          color: #94a3b8;
          border-color: #cbd5e1;
          box-shadow: none;
        }

        /* Override Bootstraps utilities to match the new button shape */
        .erp-btn.btn-primary {
          background: #2563eb !important;
          color: #ffffff !important;
          border: 1px solid #1d4ed8 !important;
        }
        .erp-btn.btn-primary:hover:not(:disabled) {
          background: #1d4ed8 !important;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .erp-btn.text-danger {
          color: #dc2626 !important;
          background: #fef2f2;
          border-color: #fca5a5;
        }
        .erp-btn.text-danger:hover:not(:disabled) {
          background: #fee2e2;
          border-color: #ef4444;
        }

        .erp-btn.btn-warning {
          background: #f59e0b !important;
          color: #fff !important;
          border: 1px solid #d97706 !important;
        }
        .erp-btn.btn-warning.text-dark {
          color: #78350f !important;
          background: #fbbf24 !important;
          border-color: #f59e0b !important;
        }
        .erp-btn.btn-warning:hover:not(:disabled) {
          background: #f59e0b !important;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        /* 📋 Sidebar and Layout */
        .erp-nav { border-bottom: 1px solid #e2e8f0 !important; }
        .hover-bg-light:hover { background-color: #f8fafc !important; }
        
        .sidebar-row { transition: all 0.2s ease; border-left: 4px solid transparent; }
        .sidebar-row:hover { background: #f1f5f9; }
        .active-row { background: #eff6ff !important; border-left-color: #3b82f6 !important; }
        .cursor-pointer { cursor: pointer; }

        /* 📑 Tabs */
        .erp-tabs { padding: 0 16px; margin-top: 8px; gap: 4px; }
        .tab-link { 
          border: none; 
          background: transparent; 
          padding: 12px 24px; 
          font-size: 14px; 
          font-weight: 600;
          color: #64748b; 
          cursor: pointer; 
          transition: color 0.2s ease;
          border-bottom: 3px solid transparent;
        }
        .tab-link:hover { color: #3b82f6; }
        .tab-link.active { 
          color: #2563eb; 
          border-bottom: 3px solid #2563eb; 
        }

        /* 📝 Form Elements */
        .erp-group-box { 
          border: 1px solid #e2e8f0; 
          padding: 28px 20px 20px; 
          position: relative; 
          border-radius: 8px; 
          margin-top: 16px; 
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        
        .box-title { 
          position: absolute; 
          top: -12px; 
          left: 16px; 
          background: #ffffff; 
          padding: 2px 10px; 
          font-size: 12px; 
          font-weight: 700; 
          color: #475569; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }

        .field-row { display: flex; align-items: center; margin-bottom: 14px; }
        .field-row label { width: 35%; font-size: 13px; color: #334155; font-weight: 600; }
        
        .field-row input, .field-row select, .field-row textarea { 
          width: 65%; 
          border: 1px solid #cbd5e1; 
          border-radius: 6px; 
          padding: 8px 12px; 
          font-size: 13px; 
          color: #1e293b;
          background: #f8fafc;
          outline: none; 
          transition: all 0.2s ease;
        }
        
        .field-row input:hover, .field-row select:hover, .field-row textarea:hover { 
          border-color: #94a3b8; 
        }
        
        .field-row input:focus, .field-row select:focus, .field-row textarea:focus { 
          border-color: #3b82f6; 
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); /* Modern Focus Ring */
        }
        
        .field-row input.border-danger { 
          border-color: #ef4444 !important; 
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        /* 📊 KPI Cards */
        .erp-kpi { 
          background: #ffffff; 
          padding: 20px; 
          border-radius: 8px; 
          border: 1px solid #e2e8f0; 
          border-left: 6px solid #3b82f6; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
        }
        .erp-kpi:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="vh-100 d-flex flex-column align-items-center justify-content-center bg-light">
      <div className="spinner-border text-primary mb-3"></div>
      <div className="fw-bold text-muted small text-uppercase">Initialising ERP Master Data...</div>
    </div>
  );
}