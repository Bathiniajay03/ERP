// import React, { useEffect, useMemo, useState } from 'react';
// import { smartErpApi } from '../services/smartErpApi';
// // import DocumentAttachments from '../components/DocumentAttachments';

// const formatPurchaseOrderError = (error, fallback) => {
//   const payload = error?.response?.data;
//   if (typeof payload === 'string' && payload.trim()) return payload;
//   if (payload?.message) return payload.message;
//   if (payload?.title) return payload.title;
//   if (payload?.detail) return payload.detail;
//   return fallback;
// };

// export default function PurchaseOrders() {
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
//   const [vendors, setVendors] = useState([]);
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [selectedPoNumber, setSelectedPoNumber] = useState('');
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);

//   const [poForm, setPoForm] = useState({
//     vendorId: '',
//     reason: 'Manual replenishment request',
//     lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
//   });
//   const [vendorForm, setVendorForm] = useState({
//     vendorCode: '',
//     name: '',
//     contactPerson: '',
//     phone: '',
//     email: ''
//   });

//   const [receiveForm, setReceiveForm] = useState({
//     poId: '',
//     purchaseOrderLineId: '',
//     quantity: 0,
//     lotNumber: '',
//     scannerDeviceId: 'PO-SCN-01',
//     generateSerials: false
//   });

//   const [showSerialModal, setShowSerialModal] = useState(false);
//   const [serialGenerationForm, setSerialGenerationForm] = useState({
//     quantity: 0,
//     prefix: '',
//     generatedSerials: []
//   });

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const [itemRes, whRes, poRes, vendorRes] = await Promise.all([
//         smartErpApi.stockItems(),
//         smartErpApi.warehouses(),
//         smartErpApi.getPurchaseOrders(),
//         smartErpApi.getVendors()
//       ]);

//       setItems(itemRes.data || []);
//       setWarehouses(whRes.data || []);
//       setVendors(vendorRes.data || []);
//       const normalizedPos = (poRes.data || []).map((po) => {
//         const lines = Array.isArray(po.lines) && po.lines.length > 0
//           ? po.lines
//           : [{
//               lineId: po.id,
//               itemId: po.itemId,
//               itemCode: po.itemCode,
//               warehouseId: po.warehouseId,
//               warehouseName: po.warehouseName,
//               quantity: po.quantity,
//               receivedQuantity: po.receivedQuantity,
//               pendingQuantity: po.pendingQuantity,
//               status: po.status
//             }];

//         const totalQuantity = po.totalQuantity ?? lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
//         const receivedQuantity = po.receivedQuantity ?? lines.reduce((sum, line) => sum + Number(line.receivedQuantity || 0), 0);

//         return {
//           ...po,
//           totalQuantity,
//           receivedQuantity,
//           pendingQuantity: po.pendingQuantity ?? (totalQuantity - receivedQuantity),
//           lines
//         };
//       });

//       setPurchaseOrders(normalizedPos);
//     } catch (err) {
//       setMessage(formatPurchaseOrderError(err, 'Failed to load purchase-order data.'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (!selectedPoNumber && purchaseOrders.length > 0) {
//       setSelectedPoNumber(purchaseOrders[0].poNumber);
//     }
//   }, [purchaseOrders, selectedPoNumber]);

//   const selectedPo = useMemo(
//     () => purchaseOrders.find((po) => po.poNumber === selectedPoNumber) || null,
//     [purchaseOrders, selectedPoNumber]
//   );

//   const selectedReceivePo = useMemo(
//     () => purchaseOrders.find((po) => Number(po.id) === Number(receiveForm.poId)) || null,
//     [purchaseOrders, receiveForm.poId]
//   );

//   const pendingLines = useMemo(
//     () => (selectedReceivePo?.lines || []).filter((line) => Number(line.pendingQuantity) > 0),
//     [selectedReceivePo]
//   );

//   const selectedReceiveLine = useMemo(
//     () => pendingLines.find((line) => Number(line.lineId) === Number(receiveForm.purchaseOrderLineId)) || null,
//     [pendingLines, receiveForm.purchaseOrderLineId]
//   );

//   const selectedReceiveItem = useMemo(
//     () => items.find((item) => Number(item.id) === Number(selectedReceiveLine?.itemId)) || null,
//     [items, selectedReceiveLine]
//   );

//   const receiveIsAiPo = Boolean(selectedReceiveLine?.isAiGenerated || selectedReceivePo?.isAiGenerated);
//   const receiveSuggestedLot = selectedReceiveLine?.suggestedLotNumber || '';

//   useEffect(() => {
//     if (!selectedReceiveLine) return;

//     setReceiveForm((prev) => {
//       const autoGenerateSerials = selectedReceiveItem?.serialPrefix ? true : false;
//       return {
//         ...prev,
//         quantity: prev.quantity > 0 ? prev.quantity : Number(selectedReceiveLine.pendingQuantity || 0),
//         lotNumber: receiveIsAiPo ? receiveSuggestedLot : prev.lotNumber,
//         generateSerials: autoGenerateSerials || prev.generateSerials
//       };
//     });
//   }, [receiveIsAiPo, receiveSuggestedLot, selectedReceiveItem, selectedReceiveLine]);

//   const openSerialGenerationModal = () => {
//     if (!selectedReceiveItem) {
//       setMessage('⚠ Select an item first.');
//       return;
//     }
    
//     let qty = Number(receiveForm.quantity);
//     if (!qty || qty <= 0) {
//       qty = Number(selectedReceiveLine?.pendingQuantity) || 0;
//     }
    
//     if (qty <= 0) {
//       setMessage('⚠ Enter quantity before generating serials.');
//       return;
//     }

//     const item = selectedReceiveItem;
//     const prefix = item.serialPrefix || item.itemCode || 'ITEM';

//     const normalizedPrefix = String(prefix).trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ITEM';

//     setSerialGenerationForm({
//       quantity: qty,
//       prefix: normalizedPrefix,
//       generatedSerials: []
//     });
//     setShowSerialModal(true);
//   };

//   const generatePoSerialNumbers = () => {
//     const qty = serialGenerationForm.quantity;
//     if (!qty || qty <= 0 || qty > 9999) {
//       setMessage('⚠ Invalid quantity. Limit: 1-9,999 units per batch');
//       return;
//     }

//     const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
//     const randomOffset = Math.floor(Math.random() * 88) + 1;

//     const serials = Array.from({ length: qty }, (_, i) => {
//       const poNum = String((randomOffset + i) % 100).padStart(2, '0');
//       return {
//         serialNumber: `${serialGenerationForm.prefix}-${dateStr}-PO${poNum}`,
//         status: 'Available'
//       };
//     });

//     setSerialGenerationForm((prev) => ({ ...prev, generatedSerials: serials }));
//     setMessage(`✓ Generated ${qty} serial number(s)`);
//   };

//   const addPoLine = () => {
//     setPoForm((prev) => ({
//       ...prev,
//       lines: [...prev.lines, { itemId: '', warehouseId: '', quantity: 1 }]
//     }));
//   };

//   const removePoLine = (idx) => {
//     setPoForm((prev) => ({
//       ...prev,
//       lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((_, i) => i !== idx)
//     }));
//   };

//   const updatePoLine = (idx, patch) => {
//     setPoForm((prev) => ({
//       ...prev,
//       lines: prev.lines.map((line, i) => (i === idx ? { ...line, ...patch } : line))
//     }));
//   };

//   const createPo = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setLoading(true);
//     try {
//       if (!poForm.vendorId) {
//         setMessage('⚠ Create/select vendor first.');
//         setLoading(false);
//         return;
//       }

//       const lines = poForm.lines
//         .map((line) => ({
//           itemId: Number(line.itemId),
//           warehouseId: Number(line.warehouseId),
//           quantity: Number(line.quantity)
//         }))
//         .filter((line) => line.itemId > 0 && line.warehouseId > 0 && line.quantity > 0);

//       if (!lines.length) {
//         setMessage('⚠ Add at least one valid PO line.');
//         setLoading(false);
//         return;
//       }

//       const res = await smartErpApi.createPurchaseOrder({
//         vendorId: Number(poForm.vendorId),
//         reason: poForm.reason,
//         lines
//       });

//       setPoForm({
//         vendorId: '',
//         reason: 'Manual replenishment request',
//         lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
//       });

//       setSelectedPoNumber(res?.data?.poNumber || '');
//       setMessage(`✓ Purchase Order created: ${res?.data?.poNumber || ''}`);
//       await loadData();
//     } catch (err) {
//       setMessage(formatPurchaseOrderError(err, '⚠ PO creation failed.'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createVendor = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setLoading(true);
//     try {
//       const res = await smartErpApi.createVendor({
//         vendorCode: vendorForm.vendorCode,
//         name: vendorForm.name,
//         contactPerson: vendorForm.contactPerson || null,
//         phone: vendorForm.phone || null,
//         email: vendorForm.email || null
//       });

//       setVendorForm({
//         vendorCode: '',
//         name: '',
//         contactPerson: '',
//         phone: '',
//         email: ''
//       });
//       setPoForm((prev) => ({ ...prev, vendorId: String(res.data.id) }));
//       setMessage(`✓ Vendor created: ${res.data.vendorCode} - ${res.data.name}`);
//       await loadData();
//     } catch (err) {
//       setMessage(formatPurchaseOrderError(err, '⚠ Vendor creation failed.'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const receivePoLine = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setLoading(true);
//     try {
//       if (!receiveForm.poId || !receiveForm.purchaseOrderLineId) {
//         setMessage('⚠ Select PO and PO line.');
//         setLoading(false);
//         return;
//       }

//       // Validation: if item requires serials, serials must be generated
//       if (selectedReceiveItem?.serialPrefix && serialGenerationForm.generatedSerials.length === 0) {
//         setMessage('⚠ This item requires serial tracking. Please generate serials first.');
//         setLoading(false);
//         return;
//       }

//       const res = await smartErpApi.receivePurchaseOrder(Number(receiveForm.poId), {
//         purchaseOrderLineId: Number(receiveForm.purchaseOrderLineId),
//         quantity: Number(receiveForm.quantity),
//         lotNumber: receiveForm.lotNumber || null,
//         scannerDeviceId: receiveForm.scannerDeviceId,
//         generateSerials: serialGenerationForm.generatedSerials.length > 0 ? true : receiveForm.generateSerials,
//         serialNumbers: serialGenerationForm.generatedSerials.length > 0 
//           ? serialGenerationForm.generatedSerials.map(s => s.serialNumber) 
//           : null
//       });

//       const generatedSerialCount = Number(res?.data?.generatedSerialCount || 0);
//       const serialMessage = generatedSerialCount > 0 ? ` | Serials: ${generatedSerialCount}` : '';
//       setMessage(`✓ ${res?.data?.message || 'Received'} (${res?.data?.poNumber || ''})${serialMessage}`);
//       setReceiveForm({
//         poId: '',
//         purchaseOrderLineId: '',
//         quantity: 0,
//         lotNumber: '',
//         scannerDeviceId: 'PO-SCN-01',
//         generateSerials: false
//       });
//       setSerialGenerationForm({ quantity: 0, prefix: '', generatedSerials: [] });
//       setShowSerialModal(false);
//       await loadData();
//     } catch (err) {
//       setMessage(formatPurchaseOrderError(err, '⚠ PO receiving failed.'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusColor = (status) => {
//     const s = (status || '').toLowerCase();
//     if (s === 'completed' || s === 'received') return 'tag-success';
//     if (s === 'partial' || s === 'processing') return 'tag-warning';
//     if (s === 'pending' || s === 'open') return 'tag-info';
//     return 'tag-secondary';
//   };

//   return (
//     <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
//       <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
//         {/* HEADER */}
//         <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
//           <div>
//             <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Procurement & Inbound</h4>
//             <span className="erp-text-muted small text-uppercase">Purchase Orders & Receipts</span>
//           </div>
//           <button 
//             className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
//             onClick={loadData} 
//             disabled={loading}
//           >
//             {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
//             Refresh Data
//           </button>
//         </div>

//         {/* ALERT */}
//         {message && (
//           <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
//             backgroundColor: message.includes("✓") ? '#f0fdf4' : '#fef2f2',
//             color: message.includes("✓") ? '#166534' : '#991b1b',
//             border: `1px solid ${message.includes("✓") ? '#bbf7d0' : '#fecaca'}`
//           }}>
//             <span className="fw-semibold">{message}</span>
//             <button className="btn-close btn-sm" onClick={() => setMessage('')}></button>
//           </div>
//         )}

//         <div className="row g-4 mb-4">
          
//           {/* LEFT COLUMN: ORIGINATION (Vendor & PO) */}
//           <div className="col-xl-7">
//             <div className="erp-panel shadow-sm h-100">
//               <div className="erp-panel-header bg-light">
//                 <span className="fw-bold">Purchase Order Origination</span>
//               </div>
//               <div className="p-4 bg-white">
                
//                 {/* Vendor Creation */}
//                 <h6 className="erp-section-title mb-3">1. Vendor Management</h6>
//                 <form className="row g-2 mb-5 p-3 border rounded bg-light" onSubmit={createVendor}>
//                   <div className="col-md-3">
//                     <label className="erp-label">Vendor Code <span className="text-danger">*</span></label>
//                     <input className="form-control erp-input font-monospace" placeholder="e.g. V-001" value={vendorForm.vendorCode} onChange={(e) => setVendorForm((prev) => ({ ...prev, vendorCode: e.target.value }))} required />
//                   </div>
//                   <div className="col-md-5">
//                     <label className="erp-label">Vendor Name <span className="text-danger">*</span></label>
//                     <input className="form-control erp-input" placeholder="Company Name" value={vendorForm.name} onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))} required />
//                   </div>
//                   <div className="col-md-4">
//                     <label className="erp-label">Contact Person</label>
//                     <input className="form-control erp-input" placeholder="Name" value={vendorForm.contactPerson} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactPerson: e.target.value }))} />
//                   </div>
//                   <div className="col-md-4 mt-2">
//                     <label className="erp-label">Phone</label>
//                     <input className="form-control erp-input" placeholder="Phone" value={vendorForm.phone} onChange={(e) => setVendorForm((prev) => ({ ...prev, phone: e.target.value }))} />
//                   </div>
//                   <div className="col-md-5 mt-2">
//                     <label className="erp-label">Email</label>
//                     <input type="email" className="form-control erp-input" placeholder="Email Address" value={vendorForm.email} onChange={(e) => setVendorForm((prev) => ({ ...prev, email: e.target.value }))} />
//                   </div>
//                   <div className="col-md-3 mt-2 d-flex align-items-end">
//                     <button className="btn btn-outline-primary erp-btn w-100 fw-bold" disabled={loading}>+ Create Vendor</button>
//                   </div>
//                 </form>

//                 {/* PO Creation */}
//                 <h6 className="erp-section-title mb-3">2. Order Details</h6>
//                 <form onSubmit={createPo}>
//                   <div className="row g-3 mb-4">
//                     <div className="col-md-6">
//                       <label className="erp-label">Select Vendor <span className="text-danger">*</span></label>
//                       <select className="form-select erp-input" value={poForm.vendorId} onChange={(e) => setPoForm((prev) => ({ ...prev, vendorId: e.target.value }))} required>
//                         <option value="">-- Choose Vendor --</option>
//                         {vendors.map((vendor) => (
//                           <option key={vendor.id} value={vendor.id}>{vendor.vendorCode} - {vendor.name}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-md-6">
//                       <label className="erp-label">Procurement Reason <span className="text-danger">*</span></label>
//                       <input className="form-control erp-input" placeholder="Internal justification" value={poForm.reason} onChange={(e) => setPoForm((prev) => ({ ...prev, reason: e.target.value }))} required />
//                     </div>
//                   </div>

//                   <h6 className="erp-label text-muted mb-2">Line Items</h6>
//                   <div className="bg-light p-3 border rounded mb-4">
//                     {poForm.lines.map((line, idx) => (
//                       <div key={idx} className="row g-2 align-items-start mb-3 pb-3 border-bottom position-relative erp-line-item">
                        
//                         <div className="position-absolute d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.7rem', top: '30px', left: '-10px', zIndex: 1 }}>
//                           {idx + 1}
//                         </div>

//                         <div className="col-md-4 ps-3">
//                           <label className="erp-label">Item / SKU <span className="text-danger">*</span></label>
//                           <select className="form-select erp-input" value={line.itemId} onChange={(e) => updatePoLine(idx, { itemId: e.target.value })} required>
//                             <option value="">Select Item...</option>
//                             {items.map((item) => (
//                               <option key={item.id} value={item.id}>{item.itemCode} - {item.description}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-md-4">
//                           <label className="erp-label">Destination Warehouse <span className="text-danger">*</span></label>
//                           <select className="form-select erp-input" value={line.warehouseId} onChange={(e) => updatePoLine(idx, { warehouseId: e.target.value })} required>
//                             <option value="">Select Warehouse...</option>
//                             {warehouses.map((wh) => (
//                               <option key={wh.id} value={wh.id}>{wh.name}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-md-3">
//                           <label className="erp-label">Quantity <span className="text-danger">*</span></label>
//                           <input type="number" className="form-control erp-input font-monospace text-end" value={line.quantity} onChange={(e) => updatePoLine(idx, { quantity: e.target.value })} min="0.01" step="0.01" required />
//                         </div>
//                         <div className="col-md-1 d-flex align-items-end justify-content-end">
//                           <button type="button" className="btn btn-outline-danger erp-btn w-100 fw-bold" onClick={() => removePoLine(idx)} disabled={poForm.lines.length === 1} title="Remove Line">✕</button>
//                         </div>
//                       </div>
//                     ))}
                    
//                     <button type="button" className="btn btn-light border erp-btn fw-bold text-primary mt-1" onClick={addPoLine}>+ Add Line</button>
//                   </div>

//                   <div className="d-flex justify-content-end pt-2 border-top">
//                     <button type="submit" className="btn btn-primary erp-btn px-4 py-2 fw-bold" disabled={loading}>
//                       Issue Purchase Order
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT COLUMN: RECEIVING */}
//           <div className="col-xl-5">
//             <div className="erp-panel shadow-sm h-100">
//               <div className="erp-panel-header bg-light">
//                 <span className="fw-bold">Inbound Receiving (GRN)</span>
//               </div>
//               <div className="p-4 bg-white">
//                 <form onSubmit={receivePoLine}>
//                   <div className="mb-3">
//                     <label className="erp-label">Active Purchase Order <span className="text-danger">*</span></label>
//                     <select className="form-select erp-input font-monospace" value={receiveForm.poId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, poId: e.target.value, purchaseOrderLineId: '' }))} required>
//                       <option value="">-- Select Pending PO --</option>
//                       {purchaseOrders.filter((po) => Number(po.pendingQuantity) > 0).map((po) => (
//                         <option key={po.poNumber} value={po.id}>
//                           {po.poNumber} (Pending Qty: {po.pendingQuantity})
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="mb-4">
//                     <label className="erp-label">Target PO Line <span className="text-danger">*</span></label>
//                     <select className="form-select erp-input font-monospace" value={receiveForm.purchaseOrderLineId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, purchaseOrderLineId: e.target.value }))} required disabled={!receiveForm.poId}>
//                       <option value="">-- Select specific line item --</option>
//                       {pendingLines.map((line) => (
//                         <option key={line.lineId} value={line.lineId}>
//                           Ln {line.lineId} | {line.itemCode} | {line.warehouseName} | Pending: {line.pendingQuantity}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="row g-3 mb-4 p-3 bg-light border rounded">
//                     <div className="col-md-6">
//                       <label className="erp-label">Receive Quantity <span className="text-danger">*</span></label>
//                       <input type="number" className="form-control erp-input font-monospace text-end" placeholder="0 = full pending" value={receiveForm.quantity} onChange={(e) => setReceiveForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} min="0" step="0.01" />
//                       <small className="text-muted" style={{fontSize: '0.65rem'}}>Leave 0 to receive all pending.</small>
//                     </div>
//                     <div className="col-md-6">
//                       <label className="erp-label">{receiveIsAiPo ? 'Auto Lot / Batch #' : 'Assign Lot / Batch #'}</label>
//                       <input
//                         className="form-control erp-input font-monospace"
//                         placeholder={receiveIsAiPo ? 'Resolved automatically from existing lot' : 'Scan or Type'}
//                         value={receiveForm.lotNumber}
//                         onChange={(e) => setReceiveForm((prev) => ({ ...prev, lotNumber: e.target.value }))}
//                         readOnly={receiveIsAiPo}
//                       />
//                       <small className="text-muted" style={{ fontSize: '0.65rem' }}>
//                         {receiveIsAiPo
//                           ? 'AI purchase orders reuse the latest existing lot for this item and warehouse.'
//                           : 'Manual purchase orders allow direct lot entry.'}
//                       </small>
//                     </div>
//                     <div className="col-md-12 mt-2">
//                       <label className="erp-label">Scanner Device ID</label>
//                       <input className="form-control erp-input font-monospace text-muted" value={receiveForm.scannerDeviceId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, scannerDeviceId: e.target.value }))} />
//                     </div>
//                     <div className="col-md-12 mt-2">
//                       <button
//                         type="button"
//                         onClick={openSerialGenerationModal}
//                         disabled={loading || !selectedReceiveItem || !selectedReceiveLine || Number(receiveForm.quantity) <= 0}
//                         className="btn btn-outline-primary erp-btn w-100 fw-bold py-2"
//                       >
//                         + GENERATE SERIAL NUMBERS
//                       </button>
//                       <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>
//                         {selectedReceiveItem?.serialPrefix
//                           ? `Required for this item. ${serialGenerationForm.generatedSerials.length} serial(s) generated.`
//                           : 'Optional. Generate tracking serials for this PO receipt.'}
//                       </small>
//                     </div>
//                   </div>

//                   <button type="submit" className="btn btn-success erp-btn w-100 fw-bold py-2" disabled={loading || !receiveForm.poId}>
//                     Process Goods Receipt (GRN)
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>

//         </div>

//         {/* BOTTOM ROW: LEDGER */}
//         <div className="erp-panel shadow-sm">
//           <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
//             <span className="fw-bold">Purchase Order Ledger</span>
//             <div className="d-flex align-items-center gap-2">
//               <span className="text-muted small">Filter:</span>
//               <select className="form-select form-select-sm erp-input font-monospace" style={{ width: '250px' }} value={selectedPoNumber} onChange={(e) => setSelectedPoNumber(e.target.value)}>
//                 <option value="">All Purchase Orders</option>
//                 {purchaseOrders.map((po) => (
//                   <option key={po.poNumber} value={po.poNumber}>{po.poNumber}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="erp-table-container overflow-auto bg-white" style={{ maxHeight: '400px' }}>
//             <table className="table erp-table table-hover mb-0 align-middle">
//               <thead>
//                 <tr>
//                   <th>PO Number</th>
//                   <th>Reason / Ref</th>
//                   <th className="text-end">Total Qty</th>
//                   <th className="text-end">Received</th>
//                   <th className="text-end">Pending</th>
//                   <th className="text-center">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(selectedPo ? [selectedPo] : purchaseOrders).length === 0 ? (
//                   <tr><td colSpan="6" className="text-center py-4 text-muted">No purchase orders found.</td></tr>
//                 ) : (
//                   (selectedPo ? [selectedPo] : purchaseOrders).map((po) => (
//                     <React.Fragment key={po.poNumber}>
//                       {/* Master Row */}
//                       <tr className="bg-light">
//                         <td><span className="fw-bold text-dark font-monospace">{po.poNumber}</span></td>
//                         <td className="text-muted">{po.reason}</td>
//                         <td className="text-end font-monospace">{po.totalQuantity}</td>
//                         <td className="text-end font-monospace text-success">{po.receivedQuantity}</td>
//                         <td className={`text-end font-monospace fw-bold ${po.pendingQuantity > 0 ? 'text-danger' : 'text-muted'}`}>{po.pendingQuantity}</td>
//                         <td className="text-center"><span className={`erp-status-tag ${getStatusColor(po.status)}`}>{po.status}</span></td>
//                       </tr>
//                       {/* Detailed Lines */}
//                       {po.lines && po.lines.length > 0 && (
//                         <tr>
//                           <td colSpan="6" className="p-0 border-0">
//                             <div className="bg-white px-4 py-2 border-bottom">
//                               <table className="table table-sm erp-table mb-0">
//                                 <thead>
//                                   <tr>
//                                     <th className="text-muted" style={{fontSize: '0.65rem'}}>Ln ID</th>
//                                     <th className="text-muted" style={{fontSize: '0.65rem'}}>Item Code</th>
//                                     <th className="text-muted" style={{fontSize: '0.65rem'}}>Warehouse Location</th>
//                                     <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Order Qty</th>
//                                     <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Recv Qty</th>
//                                     <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Pend Qty</th>
//                                     <th className="text-center text-muted" style={{fontSize: '0.65rem'}}>Ln Status</th>
//                                   </tr>
//                                 </thead>
//                                 <tbody>
//                                   {po.lines.map((line) => (
//                                     <tr key={line.lineId}>
//                                       <td className="text-muted font-monospace">{line.lineId}</td>
//                                       <td className="fw-bold">{line.itemCode || line.itemId}</td>
//                                       <td>{line.warehouseName || line.warehouseId}</td>
//                                       <td className="text-end font-monospace">{line.quantity}</td>
//                                       <td className="text-end font-monospace text-success">{line.receivedQuantity}</td>
//                                       <td className="text-end font-monospace">{line.pendingQuantity}</td>
//                                       <td className="text-center">
//                                         <span className={`erp-status-tag ${getStatusColor(line.status)}`} style={{fontSize: '0.55rem', padding: '2px 4px'}}>{line.status}</span>
//                                       </td>
//                                     </tr>
//                                   ))}
//                                 </tbody>
//                               </table>
//                             </div>
//                           </td>
//                         </tr>
//                       )}
//                     </React.Fragment>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//       </div>

//       <style>{`
//         /* --- ERP THEME CSS --- */
//         :root {
//           --erp-primary: #0f4c81;
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
//           font-size: 0.85rem;
//         }

//         .erp-text-muted { color: var(--erp-text-muted) !important; }

//         /* Panels */
//         .erp-panel {
//           background: var(--erp-surface);
//           border: 1px solid var(--erp-border);
//           border-radius: 4px;
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

//         /* Inputs & Buttons */
//         .erp-input {
//           border-radius: 3px;
//           border-color: #b0bec5;
//           font-size: 0.85rem;
//           padding: 8px 10px;
//         }
//         .erp-input:focus {
//           border-color: var(--erp-primary);
//           box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
//         }
//         .erp-btn {
//           border-radius: 3px;
//           font-weight: 600;
//           letter-spacing: 0.2px;
//           font-size: 0.8rem;
//           padding: 6px 14px;
//         }
//         .erp-label {
//           font-size: 0.75rem;
//           font-weight: 700;
//           color: var(--erp-text-muted);
//           text-transform: uppercase;
//           margin-bottom: 6px;
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

//         /* Specific overrides for line items */
//         .erp-line-item:last-child {
//           border-bottom: none !important;
//           margin-bottom: 0 !important;
//           padding-bottom: 0 !important;
//         }

//         /* Data Table */
//         .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
//         .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
//         .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
//         .erp-table { font-size: 0.8rem; }
//         .erp-table thead th {
//           background-color: #f1f5f9;
//           color: #475569;
//           font-weight: 700;
//           text-transform: uppercase;
//           font-size: 0.7rem;
//           position: sticky;
//           top: 0;
//           z-index: 10;
//           border-bottom: 2px solid #cbd5e1;
//           padding: 8px 12px;
//           white-space: nowrap;
//         }
//         .erp-table tbody td {
//           padding: 8px 12px;
//           vertical-align: middle;
//           border-color: #e2e8f0;
//         }

//         /* Status Tags */
//         .erp-status-tag {
//           font-size: 0.6rem;
//           font-weight: 700;
//           padding: 3px 6px;
//           border-radius: 2px;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//           display: inline-block;
//           white-space: nowrap;
//         }
//         .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
//         .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
//         .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
//         .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
//         .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

//         /* Modal Styles */
//         .erp-modal-overlay {
//           position: fixed;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           background-color: rgba(0, 0, 0, 0.5);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           z-index: 1050;
//         }
//         .erp-dialog {
//           background-color: var(--erp-surface);
//           border-radius: 4px;
//           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//           max-height: 90vh;
//           overflow-y: auto;
//           max-width: 100%;
//         }
//         .erp-dialog-md {
//           max-width: 500px;
//         }
//         .erp-dialog-header {
//           background-color: var(--erp-primary);
//           color: white;
//           padding: 16px;
//           border-bottom: 1px solid #ddd;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }
//         .erp-dialog-body {
//           padding: 16px;
//           max-height: calc(90vh - 120px);
//           overflow-y: auto;
//         }
//       `}</style>

//       {/* SERIAL GENERATION MODAL */}
//       {showSerialModal && (
//         <div className="erp-modal-overlay" style={{ zIndex: 1060 }}>
//           <div className="erp-dialog erp-dialog-md w-100 mx-3">
//             <div className="erp-dialog-header">
//               <h6 className="m-0 fw-bold">PO Serial Number Generation</h6>
//               <button className="btn-close btn-close-white" onClick={() => setShowSerialModal(false)}></button>
//             </div>
//             <div className="erp-dialog-body bg-white p-3">
//               <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light border rounded">
//                 <div>
//                   <span className="erp-label m-0">Target Qty</span>
//                   <span className="fs-5 fw-bold font-monospace text-primary">{Number(serialGenerationForm.quantity)}</span>
//                 </div>
//                 <button type="button" className="btn btn-sm btn-outline-primary fw-bold erp-btn" onClick={generatePoSerialNumbers}>
//                   + Generate Sequence
//                 </button>
//               </div>

//               {message && (
//                 <div className="alert alert-info small mb-3" style={{ fontSize: '0.75rem' }}>
//                   {message}
//                 </div>
//               )}

//               {serialGenerationForm.generatedSerials.length > 0 ? (
//                 <div className="border rounded overflow-hidden" style={{ maxHeight: '300px', overflowY: 'auto' }}>
//                   <table className="table table-sm table-striped m-0 font-monospace" style={{ fontSize: '0.8rem' }}>
//                     <thead className="table-light sticky-top">
//                       <tr>
//                         <th className="ps-3 text-uppercase text-muted">S/N</th>
//                         <th className="text-uppercase text-muted">Generated Serial (PO Format)</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {serialGenerationForm.generatedSerials.map((s, i) => (
//                         <tr key={i}>
//                           <td className="ps-3 text-muted">{i + 1}</td>
//                           <td className="fw-bold">{s.serialNumber}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="text-center py-4 text-muted small border rounded bg-light shadow-sm">
//                   Click generate to create unique serials for this PO receipt.
//                 </div>
//               )}
//             </div>
//             <div className="p-3 bg-light border-top d-flex justify-content-end gap-2">
//               <button type="button" className="btn btn-light border erp-btn" onClick={() => setShowSerialModal(false)}>Cancel</button>
//               <button
//                 type="button"
//                 className="btn btn-success erp-btn px-4"
//                 onClick={() => {
//                   if (serialGenerationForm.generatedSerials.length === 0) {
//                     setMessage('⚠ Please generate serial numbers first');
//                     return;
//                   }
//                   setShowSerialModal(false);
//                   receivePoLine({ preventDefault: () => {} });
//                 }}
//                 disabled={serialGenerationForm.generatedSerials.length === 0 || loading}
//               >
//                 {loading ? 'Processing...' : 'Confirm & Receive'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// import React, { useEffect, useMemo, useState } from 'react';
// import { smartErpApi } from '../services/smartErpApi';
// // import DocumentAttachments from '../components/DocumentAttachments';

// const formatPurchaseOrderError = (error, fallback) => {
//   const payload = error?.response?.data;
//   if (typeof payload === 'string' && payload.trim()) return payload;
//   if (payload?.message) return payload.message;
//   if (payload?.title) return payload.title;
//   if (payload?.detail) return payload.detail;
//   return fallback;
// };

// export default function PurchaseOrders() {
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
//   const [vendors, setVendors] = useState([]);
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [selectedPoNumber, setSelectedPoNumber] = useState('');
//   const [message, setMessage] = useState('');
//   const [loading, setLoading] = useState(false);

//   const [poForm, setPoForm] = useState({
//     vendorId: '',
//     reason: 'Manual replenishment request',
//     lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
//   });
//   const [vendorForm, setVendorForm] = useState({
//     vendorCode: '',
//     name: '',
//     contactPerson: '',
//     phone: '',
//     email: ''
//   });

//   const [receiveForm, setReceiveForm] = useState({
//     poId: '',
//     purchaseOrderLineId: '',
//     quantity: 0,
//     lotNumber: '',
//     scannerDeviceId: 'PO-SCN-01',
//     generateSerials: false
//   });

//   const [showSerialModal, setShowSerialModal] = useState(false);
//   const [serialGenerationForm, setSerialGenerationForm] = useState({
//     quantity: 0,
//     prefix: '',
//     generatedSerials: []
//   });

//   const loadData = async () => {
//     setLoading(true);
//     try {
//       const [itemRes, whRes, poRes, vendorRes] = await Promise.all([
//         smartErpApi.stockItems(),
//         smartErpApi.warehouses(),
//         smartErpApi.getPurchaseOrders(),
//         smartErpApi.getVendors()
//       ]);

//       setItems(itemRes.data || []);
//       setWarehouses(whRes.data || []);
//       setVendors(vendorRes.data || []);
//       const normalizedPos = (poRes.data || []).map((po) => {
//         const lines = Array.isArray(po.lines) && po.lines.length > 0
//           ? po.lines
//           : [{
//               lineId: po.id,
//               itemId: po.itemId,
//               itemCode: po.itemCode,
//               warehouseId: po.warehouseId,
//               warehouseName: po.warehouseName,
//               quantity: po.quantity,
//               receivedQuantity: po.receivedQuantity,
//               pendingQuantity: po.pendingQuantity,
//               status: po.status
//             }];

//         const totalQuantity = po.totalQuantity ?? lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
//         const receivedQuantity = po.receivedQuantity ?? lines.reduce((sum, line) => sum + Number(line.receivedQuantity || 0), 0);

//         return {
//           ...po,
//           totalQuantity,
//           receivedQuantity,
//           pendingQuantity: po.pendingQuantity ?? (totalQuantity - receivedQuantity),
//           lines
//         };
//       });

//       setPurchaseOrders(normalizedPos);
//     } catch (err) {
//       setMessage(formatPurchaseOrderError(err, 'Failed to load purchase-order data.'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (!selectedPoNumber && purchaseOrders.length > 0) {
//       setSelectedPoNumber(purchaseOrders[0].poNumber);
//     }
//   }, [purchaseOrders, selectedPoNumber]);

//   const selectedPo = useMemo(
//     () => purchaseOrders.find((po) => po.poNumber === selectedPoNumber) || null,
//     [purchaseOrders, selectedPoNumber]
//   );

//   const selectedReceivePo = useMemo(
//     () => purchaseOrders.find((po) => Number(po.id) === Number(receiveForm.poId)) || null,
//     [purchaseOrders, receiveForm.poId]
//   );

//   const pendingLines = useMemo(
//     () => (selectedReceivePo?.lines || []).filter((line) => Number(line.pendingQuantity) > 0),
//     [selectedReceivePo]
//   );

//   const selectedReceiveLine = useMemo(
//     () => pendingLines.find((line) => Number(line.lineId) === Number(receiveForm.purchaseOrderLineId)) || null,
//     [pendingLines, receiveForm.purchaseOrderLineId]
//   );

//   const selectedReceiveItem = useMemo(
//     () => items.find((item) => Number(item.id) === Number(selectedReceiveLine?.itemId)) || null,
//     [items, selectedReceiveLine]
//   );

//   const receiveIsAiPo = Boolean(selectedReceiveLine?.isAiGenerated || selectedReceivePo?.isAiGenerated);
//   const receiveSuggestedLot = selectedReceiveLine?.suggestedLotNumber || '';

//   useEffect(() => {
//     if (!selectedReceiveLine) return;

//     setReceiveForm((prev) => {
//       const autoGenerateSerials = selectedReceiveItem?.serialPrefix ? true : false;
//       return {
//         ...prev,
//         quantity: prev.quantity > 0 ? prev.quantity : Number(selectedReceiveLine.pendingQuantity || 0),
//         lotNumber: receiveIsAiPo ? receiveSuggestedLot : prev.lotNumber,
//         generateSerials: autoGenerateSerials || prev.generateSerials
//       };
//     });
//   }, [receiveIsAiPo, receiveSuggestedLot, selectedReceiveItem, selectedReceiveLine]);

//   const openSerialGenerationModal = () => {
//     if (!selectedReceiveItem) {
//       setMessage('⚠ Select an item first.');
//       return;
//     }
    
//     let qty = Number(receiveForm.quantity);
//     if (!qty || qty <= 0) {
//       qty = Number(selectedReceiveLine?.pendingQuantity) || 0;
//     }
    
//     if (qty <= 0) {
//       setMessage('⚠ Enter quantity before generating serials.');
//       return;
//     }

//     const item = selectedReceiveItem;
//     const prefix = item.serialPrefix || item.itemCode || 'ITEM';

//     const normalizedPrefix = String(prefix).trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ITEM';

//     setSerialGenerationForm({
//       quantity: qty,
//       prefix: normalizedPrefix,
//       generatedSerials: []
//     });
//     setShowSerialModal(true);
//   };

//   // FIX: Updated logic to include full year, date, time, and exact incrementing ID
//   const generatePoSerialNumbers = () => {
//     const qty = serialGenerationForm.quantity;
//     if (!qty || qty <= 0 || qty > 9999) {
//       setMessage('⚠ Invalid quantity. Limit: 1-9,999 units per batch');
//       return;
//     }

//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const hours = String(now.getHours()).padStart(2, '0');
//     const minutes = String(now.getMinutes()).padStart(2, '0');
//     const seconds = String(now.getSeconds()).padStart(2, '0');
    
//     // Format: YYYYMMDD-HHMMSS
//     const dateTimeStr = `${year}${month}${day}-${hours}${minutes}${seconds}`;

//     const serials = Array.from({ length: qty }, (_, i) => {
//       // Use sequential numbers so there are no duplicates inside the same generated batch
//       const uniqueId = String(i + 1).padStart(4, '0');
//       return {
//         serialNumber: `${serialGenerationForm.prefix}-${dateTimeStr}-${uniqueId}`,
//         status: 'Available'
//       };
//     });

//     setSerialGenerationForm((prev) => ({ ...prev, generatedSerials: serials }));
//     setMessage(`✓ Generated ${qty} serial number(s)`);
//   };

//   const addPoLine = () => {
//     setPoForm((prev) => ({
//       ...prev,
//       lines: [...prev.lines, { itemId: '', warehouseId: '', quantity: 1 }]
//     }));
//   };

//   const removePoLine = (idx) => {
//     setPoForm((prev) => ({
//       ...prev,
//       lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((_, i) => i !== idx)
//     }));
//   };

//   const updatePoLine = (idx, patch) => {
//     setPoForm((prev) => ({
//       ...prev,
//       lines: prev.lines.map((line, i) => (i === idx ? { ...line, ...patch } : line))
//     }));
//   };

//   const createPo = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setLoading(true);
//     try {
//       if (!poForm.vendorId) {
//         setMessage('⚠ Create/select vendor first.');
//         setLoading(false);
//         return;
//       }

//       const lines = poForm.lines
//         .map((line) => ({
//           itemId: Number(line.itemId),
//           warehouseId: Number(line.warehouseId),
//           quantity: Number(line.quantity)
//         }))
//         .filter((line) => line.itemId > 0 && line.warehouseId > 0 && line.quantity > 0);

//       if (!lines.length) {
//         setMessage('⚠ Add at least one valid PO line.');
//         setLoading(false);
//         return;
//       }

//       const res = await smartErpApi.createPurchaseOrder({
//         vendorId: Number(poForm.vendorId),
//         reason: poForm.reason,
//         lines
//       });

//       setPoForm({
//         vendorId: '',
//         reason: 'Manual replenishment request',
//         lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
//       });

//       setSelectedPoNumber(res?.data?.poNumber || '');
//       setMessage(`✓ Purchase Order created: ${res?.data?.poNumber || ''}`);
//       await loadData();
//     } catch (err) {
//       setMessage(formatPurchaseOrderError(err, '⚠ PO creation failed.'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createVendor = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setLoading(true);
//     try {
//       const res = await smartErpApi.createVendor({
//         vendorCode: vendorForm.vendorCode,
//         name: vendorForm.name,
//         contactPerson: vendorForm.contactPerson || null,
//         phone: vendorForm.phone || null,
//         email: vendorForm.email || null
//       });

//       setVendorForm({
//         vendorCode: '',
//         name: '',
//         contactPerson: '',
//         phone: '',
//         email: ''
//       });
//       setPoForm((prev) => ({ ...prev, vendorId: String(res.data.id) }));
//       setMessage(`✓ Vendor created: ${res.data.vendorCode} - ${res.data.name}`);
//       await loadData();
//     } catch (err) {
//       setMessage(formatPurchaseOrderError(err, '⚠ Vendor creation failed.'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const receivePoLine = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setLoading(true);
//     try {
//       if (!receiveForm.poId || !receiveForm.purchaseOrderLineId) {
//         setMessage('⚠ Select PO and PO line.');
//         setLoading(false);
//         return;
//       }

//       // Validation: if item requires serials, serials must be generated
//       if (selectedReceiveItem?.serialPrefix && serialGenerationForm.generatedSerials.length === 0) {
//         setMessage('⚠ This item requires serial tracking. Please generate serials first.');
//         setLoading(false);
//         return;
//       }

//       const res = await smartErpApi.receivePurchaseOrder(Number(receiveForm.poId), {
//         purchaseOrderLineId: Number(receiveForm.purchaseOrderLineId),
//         quantity: Number(receiveForm.quantity),
//         lotNumber: receiveForm.lotNumber || null,
//         scannerDeviceId: receiveForm.scannerDeviceId,
//         generateSerials: serialGenerationForm.generatedSerials.length > 0 ? true : receiveForm.generateSerials,
//         serialNumbers: serialGenerationForm.generatedSerials.length > 0 
//           ? serialGenerationForm.generatedSerials.map(s => s.serialNumber) 
//           : null
//       });

//       const generatedSerialCount = Number(res?.data?.generatedSerialCount || 0);
//       const serialMessage = generatedSerialCount > 0 ? ` | Serials: ${generatedSerialCount}` : '';
//       setMessage(`✓ ${res?.data?.message || 'Received'} (${res?.data?.poNumber || ''})${serialMessage}`);
//       setReceiveForm({
//         poId: '',
//         purchaseOrderLineId: '',
//         quantity: 0,
//         lotNumber: '',
//         scannerDeviceId: 'PO-SCN-01',
//         generateSerials: false
//       });
//       setSerialGenerationForm({ quantity: 0, prefix: '', generatedSerials: [] });
//       setShowSerialModal(false);
//       await loadData();
//     } catch (err) {
//       setMessage(formatPurchaseOrderError(err, '⚠ PO receiving failed.'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStatusColor = (status) => {
//     const s = (status || '').toLowerCase();
//     if (s === 'completed' || s === 'received') return 'tag-success';
//     if (s === 'partial' || s === 'processing') return 'tag-warning';
//     if (s === 'pending' || s === 'open') return 'tag-info';
//     return 'tag-secondary';
//   };

//   return (
//     <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
//       <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
//         {/* HEADER */}
//         <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
//           <div>
//             <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Procurement & Inbound</h4>
//             <span className="erp-text-muted small text-uppercase">Purchase Orders & Receipts</span>
//           </div>
//           <button 
//             className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
//             onClick={loadData} 
//             disabled={loading}
//           >
//             {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
//             Refresh Data
//           </button>
//         </div>

//         {/* ALERT */}
//         {message && (
//           <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
//             backgroundColor: message.includes("✓") ? '#f0fdf4' : '#fef2f2',
//             color: message.includes("✓") ? '#166534' : '#991b1b',
//             border: `1px solid ${message.includes("✓") ? '#bbf7d0' : '#fecaca'}`
//           }}>
//             <span className="fw-semibold">{message}</span>
//             <button className="btn-close btn-sm" onClick={() => setMessage('')}></button>
//           </div>
//         )}

//         <div className="row g-4 mb-4">
          
//           {/* LEFT COLUMN: ORIGINATION (Vendor & PO) */}
//           <div className="col-xl-7">
//             <div className="erp-panel shadow-sm h-100">
//               <div className="erp-panel-header bg-light">
//                 <span className="fw-bold">Purchase Order Origination</span>
//               </div>
//               <div className="p-4 bg-white">
                
//                 {/* Vendor Creation */}
//                 <h6 className="erp-section-title mb-3">1. Vendor Management</h6>
//                 <form className="row g-2 mb-5 p-3 border rounded bg-light" onSubmit={createVendor}>
//                   <div className="col-md-3">
//                     <label className="erp-label">Vendor Code <span className="text-danger">*</span></label>
//                     <input className="form-control erp-input font-monospace" placeholder="e.g. V-001" value={vendorForm.vendorCode} onChange={(e) => setVendorForm((prev) => ({ ...prev, vendorCode: e.target.value }))} required />
//                   </div>
//                   <div className="col-md-5">
//                     <label className="erp-label">Vendor Name <span className="text-danger">*</span></label>
//                     <input className="form-control erp-input" placeholder="Company Name" value={vendorForm.name} onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))} required />
//                   </div>
//                   <div className="col-md-4">
//                     <label className="erp-label">Contact Person</label>
//                     <input className="form-control erp-input" placeholder="Name" value={vendorForm.contactPerson} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactPerson: e.target.value }))} />
//                   </div>
//                   <div className="col-md-4 mt-2">
//                     <label className="erp-label">Phone</label>
//                     <input className="form-control erp-input" placeholder="Phone" value={vendorForm.phone} onChange={(e) => setVendorForm((prev) => ({ ...prev, phone: e.target.value }))} />
//                   </div>
//                   <div className="col-md-5 mt-2">
//                     <label className="erp-label">Email</label>
//                     <input type="email" className="form-control erp-input" placeholder="Email Address" value={vendorForm.email} onChange={(e) => setVendorForm((prev) => ({ ...prev, email: e.target.value }))} />
//                   </div>
//                   <div className="col-md-3 mt-2 d-flex align-items-end">
//                     <button className="btn btn-outline-primary erp-btn w-100 fw-bold" disabled={loading}>+ Create Vendor</button>
//                   </div>
//                 </form>

//                 {/* PO Creation */}
//                 <h6 className="erp-section-title mb-3">2. Order Details</h6>
//                 <form onSubmit={createPo}>
//                   <div className="row g-3 mb-4">
//                     <div className="col-md-6">
//                       <label className="erp-label">Select Vendor <span className="text-danger">*</span></label>
//                       <select className="form-select erp-input" value={poForm.vendorId} onChange={(e) => setPoForm((prev) => ({ ...prev, vendorId: e.target.value }))} required>
//                         <option value="">-- Choose Vendor --</option>
//                         {vendors.map((vendor) => (
//                           <option key={vendor.id} value={vendor.id}>{vendor.vendorCode} - {vendor.name}</option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-md-6">
//                       <label className="erp-label">Procurement Reason <span className="text-danger">*</span></label>
//                       <input className="form-control erp-input" placeholder="Internal justification" value={poForm.reason} onChange={(e) => setPoForm((prev) => ({ ...prev, reason: e.target.value }))} required />
//                     </div>
//                   </div>

//                   <h6 className="erp-label text-muted mb-2">Line Items</h6>
//                   <div className="bg-light p-3 border rounded mb-4">
//                     {poForm.lines.map((line, idx) => (
//                       <div key={idx} className="row g-2 align-items-start mb-3 pb-3 border-bottom position-relative erp-line-item">
                        
//                         <div className="position-absolute d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.7rem', top: '30px', left: '-10px', zIndex: 1 }}>
//                           {idx + 1}
//                         </div>

//                         <div className="col-md-4 ps-3">
//                           <label className="erp-label">Item / SKU <span className="text-danger">*</span></label>
//                           <select className="form-select erp-input" value={line.itemId} onChange={(e) => updatePoLine(idx, { itemId: e.target.value })} required>
//                             <option value="">Select Item...</option>
//                             {items.map((item) => (
//                               <option key={item.id} value={item.id}>{item.itemCode} - {item.description}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-md-4">
//                           <label className="erp-label">Destination Warehouse <span className="text-danger">*</span></label>
//                           <select className="form-select erp-input" value={line.warehouseId} onChange={(e) => updatePoLine(idx, { warehouseId: e.target.value })} required>
//                             <option value="">Select Warehouse...</option>
//                             {warehouses.map((wh) => (
//                               <option key={wh.id} value={wh.id}>{wh.name}</option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="col-md-3">
//                           <label className="erp-label">Quantity <span className="text-danger">*</span></label>
//                           <input type="number" className="form-control erp-input font-monospace text-end" value={line.quantity} onChange={(e) => updatePoLine(idx, { quantity: e.target.value })} min="0.01" step="0.01" required />
//                         </div>
//                         <div className="col-md-1 d-flex align-items-end justify-content-end">
//                           <button type="button" className="btn btn-outline-danger erp-btn w-100 fw-bold" onClick={() => removePoLine(idx)} disabled={poForm.lines.length === 1} title="Remove Line">✕</button>
//                         </div>
//                       </div>
//                     ))}
                    
//                     <button type="button" className="btn btn-light border erp-btn fw-bold text-primary mt-1" onClick={addPoLine}>+ Add Line</button>
//                   </div>

//                   <div className="d-flex justify-content-end pt-2 border-top">
//                     <button type="submit" className="btn btn-primary erp-btn px-4 py-2 fw-bold" disabled={loading}>
//                       Issue Purchase Order
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT COLUMN: RECEIVING */}
//           <div className="col-xl-5">
//             <div className="erp-panel shadow-sm h-100">
//               <div className="erp-panel-header bg-light">
//                 <span className="fw-bold">Inbound Receiving (GRN)</span>
//               </div>
//               <div className="p-4 bg-white">
//                 <form onSubmit={receivePoLine}>
//                   <div className="mb-3">
//                     <label className="erp-label">Active Purchase Order <span className="text-danger">*</span></label>
//                     <select className="form-select erp-input font-monospace" value={receiveForm.poId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, poId: e.target.value, purchaseOrderLineId: '' }))} required>
//                       <option value="">-- Select Pending PO --</option>
//                       {purchaseOrders.filter((po) => Number(po.pendingQuantity) > 0).map((po) => (
//                         <option key={po.poNumber} value={po.id}>
//                           {po.poNumber} (Pending Qty: {po.pendingQuantity})
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="mb-4">
//                     <label className="erp-label">Target PO Line <span className="text-danger">*</span></label>
//                     <select className="form-select erp-input font-monospace" value={receiveForm.purchaseOrderLineId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, purchaseOrderLineId: e.target.value }))} required disabled={!receiveForm.poId}>
//                       <option value="">-- Select specific line item --</option>
//                       {pendingLines.map((line) => (
//                         <option key={line.lineId} value={line.lineId}>
//                           Ln {line.lineId} | {line.itemCode} | {line.warehouseName} | Pending: {line.pendingQuantity}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div className="row g-3 mb-4 p-3 bg-light border rounded">
//                     <div className="col-md-6">
//                       <label className="erp-label">Receive Quantity <span className="text-danger">*</span></label>
//                       <input type="number" className="form-control erp-input font-monospace text-end" placeholder="0 = full pending" value={receiveForm.quantity} onChange={(e) => setReceiveForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} min="0" step="0.01" />
//                       <small className="text-muted" style={{fontSize: '0.65rem'}}>Leave 0 to receive all pending.</small>
//                     </div>
//                     <div className="col-md-6">
//                       <label className="erp-label">{receiveIsAiPo ? 'Auto Lot / Batch #' : 'Assign Lot / Batch #'}</label>
//                       <input
//                         className="form-control erp-input font-monospace"
//                         placeholder={receiveIsAiPo ? 'Resolved automatically from existing lot' : 'Scan or Type'}
//                         value={receiveForm.lotNumber}
//                         onChange={(e) => setReceiveForm((prev) => ({ ...prev, lotNumber: e.target.value }))}
//                         readOnly={receiveIsAiPo}
//                       />
//                       <small className="text-muted" style={{ fontSize: '0.65rem' }}>
//                         {receiveIsAiPo
//                           ? 'AI purchase orders reuse the latest existing lot for this item and warehouse.'
//                           : 'Manual purchase orders allow direct lot entry.'}
//                       </small>
//                     </div>
//                     <div className="col-md-12 mt-2">
//                       <label className="erp-label">Scanner Device ID</label>
//                       <input className="form-control erp-input font-monospace text-muted" value={receiveForm.scannerDeviceId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, scannerDeviceId: e.target.value }))} />
//                     </div>
//                     <div className="col-md-12 mt-2">
//                       <button
//                         type="button"
//                         onClick={openSerialGenerationModal}
//                         disabled={loading || !selectedReceiveItem || !selectedReceiveLine || Number(receiveForm.quantity) <= 0}
//                         className="btn btn-outline-primary erp-btn w-100 fw-bold py-2"
//                       >
//                         + GENERATE SERIAL NUMBERS
//                       </button>
//                       <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>
//                         {selectedReceiveItem?.serialPrefix
//                           ? `Required for this item. ${serialGenerationForm.generatedSerials.length} serial(s) generated.`
//                           : 'Optional. Generate tracking serials for this PO receipt.'}
//                       </small>
//                     </div>
//                   </div>

//                   <button type="submit" className="btn btn-success erp-btn w-100 fw-bold py-2" disabled={loading || !receiveForm.poId}>
//                     Process Goods Receipt (GRN)
//                   </button>
//                 </form>
//               </div>
//             </div>
//           </div>

//         </div>

//         {/* BOTTOM ROW: LEDGER */}
//         <div className="erp-panel shadow-sm">
//           <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
//             <span className="fw-bold">Purchase Order Ledger</span>
//             <div className="d-flex align-items-center gap-2">
//               <span className="text-muted small">Filter:</span>
//               <select className="form-select form-select-sm erp-input font-monospace" style={{ width: '250px' }} value={selectedPoNumber} onChange={(e) => setSelectedPoNumber(e.target.value)}>
//                 <option value="">All Purchase Orders</option>
//                 {purchaseOrders.map((po) => (
//                   <option key={po.poNumber} value={po.poNumber}>{po.poNumber}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="erp-table-container overflow-auto bg-white" style={{ maxHeight: '400px' }}>
//             <table className="table erp-table table-hover mb-0 align-middle">
//               <thead>
//                 <tr>
//                   <th>PO Number</th>
//                   <th>Reason / Ref</th>
//                   <th className="text-end">Total Qty</th>
//                   <th className="text-end">Received</th>
//                   <th className="text-end">Pending</th>
//                   <th className="text-center">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(selectedPo ? [selectedPo] : purchaseOrders).length === 0 ? (
//                   <tr><td colSpan="6" className="text-center py-4 text-muted">No purchase orders found.</td></tr>
//                 ) : (
//                   (selectedPo ? [selectedPo] : purchaseOrders).map((po) => (
//                     <React.Fragment key={po.poNumber}>
//                       {/* Master Row */}
//                       <tr className="bg-light">
//                         <td><span className="fw-bold text-dark font-monospace">{po.poNumber}</span></td>
//                         <td className="text-muted">{po.reason}</td>
//                         <td className="text-end font-monospace">{po.totalQuantity}</td>
//                         <td className="text-end font-monospace text-success">{po.receivedQuantity}</td>
//                         <td className={`text-end font-monospace fw-bold ${po.pendingQuantity > 0 ? 'text-danger' : 'text-muted'}`}>{po.pendingQuantity}</td>
//                         <td className="text-center"><span className={`erp-status-tag ${getStatusColor(po.status)}`}>{po.status}</span></td>
//                       </tr>
//                       {/* Detailed Lines */}
//                       {po.lines && po.lines.length > 0 && (
//                         <tr>
//                           <td colSpan="6" className="p-0 border-0">
//                             <div className="bg-white px-4 py-2 border-bottom">
//                               <table className="table table-sm erp-table mb-0">
//                                 <thead>
//                                   <tr>
//                                     <th className="text-muted" style={{fontSize: '0.65rem'}}>Ln ID</th>
//                                     <th className="text-muted" style={{fontSize: '0.65rem'}}>Item Code</th>
//                                     <th className="text-muted" style={{fontSize: '0.65rem'}}>Warehouse Location</th>
//                                     <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Order Qty</th>
//                                     <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Recv Qty</th>
//                                     <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Pend Qty</th>
//                                     <th className="text-center text-muted" style={{fontSize: '0.65rem'}}>Ln Status</th>
//                                   </tr>
//                                 </thead>
//                                 <tbody>
//                                   {po.lines.map((line) => (
//                                     <tr key={line.lineId}>
//                                       <td className="text-muted font-monospace">{line.lineId}</td>
//                                       <td className="fw-bold">{line.itemCode || line.itemId}</td>
//                                       <td>{line.warehouseName || line.warehouseId}</td>
//                                       <td className="text-end font-monospace">{line.quantity}</td>
//                                       <td className="text-end font-monospace text-success">{line.receivedQuantity}</td>
//                                       <td className="text-end font-monospace">{line.pendingQuantity}</td>
//                                       <td className="text-center">
//                                         <span className={`erp-status-tag ${getStatusColor(line.status)}`} style={{fontSize: '0.55rem', padding: '2px 4px'}}>{line.status}</span>
//                                       </td>
//                                     </tr>
//                                   ))}
//                                 </tbody>
//                               </table>
//                             </div>
//                           </td>
//                         </tr>
//                       )}
//                     </React.Fragment>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//       </div>

//       <style>{`
//         /* --- ERP THEME CSS --- */
//         :root {
//           --erp-primary: #0f4c81;
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
//           font-size: 0.85rem;
//         }

//         .erp-text-muted { color: var(--erp-text-muted) !important; }

//         /* Panels */
//         .erp-panel {
//           background: var(--erp-surface);
//           border: 1px solid var(--erp-border);
//           border-radius: 4px;
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

//         /* Inputs & Buttons */
//         .erp-input {
//           border-radius: 3px;
//           border-color: #b0bec5;
//           font-size: 0.85rem;
//           padding: 8px 10px;
//         }
//         .erp-input:focus {
//           border-color: var(--erp-primary);
//           box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
//         }
//         .erp-btn {
//           border-radius: 3px;
//           font-weight: 600;
//           letter-spacing: 0.2px;
//           font-size: 0.8rem;
//           padding: 6px 14px;
//         }
//         .erp-label {
//           font-size: 0.75rem;
//           font-weight: 700;
//           color: var(--erp-text-muted);
//           text-transform: uppercase;
//           margin-bottom: 6px;
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

//         /* Specific overrides for line items */
//         .erp-line-item:last-child {
//           border-bottom: none !important;
//           margin-bottom: 0 !important;
//           padding-bottom: 0 !important;
//         }

//         /* Data Table */
//         .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
//         .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
//         .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
//         .erp-table { font-size: 0.8rem; }
//         .erp-table thead th {
//           background-color: #f1f5f9;
//           color: #475569;
//           font-weight: 700;
//           text-transform: uppercase;
//           font-size: 0.7rem;
//           position: sticky;
//           top: 0;
//           z-index: 10;
//           border-bottom: 2px solid #cbd5e1;
//           padding: 8px 12px;
//           white-space: nowrap;
//         }
//         .erp-table tbody td {
//           padding: 8px 12px;
//           vertical-align: middle;
//           border-color: #e2e8f0;
//         }

//         /* Status Tags */
//         .erp-status-tag {
//           font-size: 0.6rem;
//           font-weight: 700;
//           padding: 3px 6px;
//           border-radius: 2px;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//           display: inline-block;
//           white-space: nowrap;
//         }
//         .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
//         .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
//         .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
//         .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
//         .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

//         /* Modal Styles */
//         .erp-modal-overlay {
//           position: fixed;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           background-color: rgba(0, 0, 0, 0.5);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           z-index: 1050;
//         }
//         .erp-dialog {
//           background-color: var(--erp-surface);
//           border-radius: 4px;
//           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//           max-height: 90vh;
//           overflow-y: auto;
//           max-width: 100%;
//         }
//         .erp-dialog-md {
//           max-width: 500px;
//         }
//         .erp-dialog-header {
//           background-color: var(--erp-primary);
//           color: white;
//           padding: 16px;
//           border-bottom: 1px solid #ddd;
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//         }
//         .erp-dialog-body {
//           padding: 16px;
//           max-height: calc(90vh - 120px);
//           overflow-y: auto;
//         }
//       `}</style>

//       {/* SERIAL GENERATION MODAL */}
//       {showSerialModal && (
//         <div className="erp-modal-overlay" style={{ zIndex: 1060 }}>
//           <div className="erp-dialog erp-dialog-md w-100 mx-3">
//             <div className="erp-dialog-header">
//               <h6 className="m-0 fw-bold">PO Serial Number Generation</h6>
//               <button className="btn-close btn-close-white" onClick={() => setShowSerialModal(false)}></button>
//             </div>
//             <div className="erp-dialog-body bg-white p-3">
//               <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light border rounded">
//                 <div>
//                   <span className="erp-label m-0">Target Qty</span>
//                   <span className="fs-5 fw-bold font-monospace text-primary">{Number(serialGenerationForm.quantity)}</span>
//                 </div>
//                 <button type="button" className="btn btn-sm btn-outline-primary fw-bold erp-btn" onClick={generatePoSerialNumbers}>
//                   + Generate Sequence
//                 </button>
//               </div>

//               {message && (
//                 <div className="alert alert-info small mb-3" style={{ fontSize: '0.75rem' }}>
//                   {message}
//                 </div>
//               )}

//               {serialGenerationForm.generatedSerials.length > 0 ? (
//                 <div className="border rounded overflow-hidden" style={{ maxHeight: '300px', overflowY: 'auto' }}>
//                   <table className="table table-sm table-striped m-0 font-monospace" style={{ fontSize: '0.8rem' }}>
//                     <thead className="table-light sticky-top">
//                       <tr>
//                         <th className="ps-3 text-uppercase text-muted">S/N</th>
//                         <th className="text-uppercase text-muted">Generated Serial (PO Format)</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {serialGenerationForm.generatedSerials.map((s, i) => (
//                         <tr key={i}>
//                           <td className="ps-3 text-muted">{i + 1}</td>
//                           <td className="fw-bold">{s.serialNumber}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               ) : (
//                 <div className="text-center py-4 text-muted small border rounded bg-light shadow-sm">
//                   Click generate to create unique serials for this PO receipt.
//                 </div>
//               )}
//             </div>
//             <div className="p-3 bg-light border-top d-flex justify-content-end gap-2">
//               <button type="button" className="btn btn-light border erp-btn" onClick={() => setShowSerialModal(false)}>Cancel</button>
//               <button
//                 type="button"
//                 className="btn btn-success erp-btn px-4"
//                 onClick={() => {
//                   if (serialGenerationForm.generatedSerials.length === 0) {
//                     setMessage('⚠ Please generate serial numbers first');
//                     return;
//                   }
//                   setShowSerialModal(false);
//                   receivePoLine({ preventDefault: () => {} });
//                 }}
//                 disabled={serialGenerationForm.generatedSerials.length === 0 || loading}
//               >
//                 {loading ? 'Processing...' : 'Confirm & Receive'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useEffect, useMemo, useState } from 'react';
import { smartErpApi } from '../services/smartErpApi';

// import DocumentAttachments from '../components/DocumentAttachments';

const formatPurchaseOrderError = (error, fallback) => {
  const payload = error?.response?.data;
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload?.message) return payload.message;
  if (payload?.title) return payload.title;
  if (payload?.detail) return payload.detail;
  return fallback;
};

export default function PurchaseOrders() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [poForm, setPoForm] = useState({
    vendorId: '',
    reason: 'Manual replenishment request',
    lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
  });
  const [vendorForm, setVendorForm] = useState({
    vendorCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: ''
  });

  const [receiveForm, setReceiveForm] = useState({
    poId: '',
    purchaseOrderLineId: '',
    quantity: 0,
    lotNumber: '',
    scannerDeviceId: 'PO-SCN-01',
    generateSerials: false
  });

  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialGenerationForm, setSerialGenerationForm] = useState({
    quantity: 0,
    prefix: '',
    generatedSerials: []
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemRes, whRes, poRes, vendorRes] = await Promise.all([
        smartErpApi.stockItems(),
        smartErpApi.warehouses(),
        smartErpApi.getPurchaseOrders(),
        smartErpApi.getVendors()
      ]);

      // Bulletproof data extraction for both { data: [...] } and direct [...] array responses
      const itemsData = Array.isArray(itemRes?.data) ? itemRes.data : (Array.isArray(itemRes) ? itemRes : []);
      const whData = Array.isArray(whRes?.data) ? whRes.data : (Array.isArray(whRes) ? whRes : []);
      const vendorData = Array.isArray(vendorRes?.data) ? vendorRes.data : (Array.isArray(vendorRes) ? vendorRes : []);
      const poData = Array.isArray(poRes?.data) ? poRes.data : (Array.isArray(poRes) ? poRes : []);

      setItems(itemsData);
      setWarehouses(whData);
      setVendors(vendorData);
      
      const normalizedPos = poData.map((po) => {
        const lines = Array.isArray(po.lines) && po.lines.length > 0
          ? po.lines
          : [{
              lineId: po.id,
              itemId: po.itemId,
              itemCode: po.itemCode,
              warehouseId: po.warehouseId,
              warehouseName: po.warehouseName,
              quantity: po.quantity,
              receivedQuantity: po.receivedQuantity,
              pendingQuantity: po.pendingQuantity,
              status: po.status
            }];

        const totalQuantity = po.totalQuantity ?? lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
        const receivedQuantity = po.receivedQuantity ?? lines.reduce((sum, line) => sum + Number(line.receivedQuantity || 0), 0);

        return {
          ...po,
          totalQuantity,
          receivedQuantity,
          pendingQuantity: po.pendingQuantity ?? (totalQuantity - receivedQuantity),
          lines
        };
      });

      setPurchaseOrders(normalizedPos);
    } catch (err) {
      setMessage(formatPurchaseOrderError(err, 'Failed to load purchase-order data.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPoNumber && purchaseOrders.length > 0) {
      setSelectedPoNumber(purchaseOrders[0].poNumber);
    }
  }, [purchaseOrders, selectedPoNumber]);

  const selectedPo = useMemo(
    () => purchaseOrders.find((po) => po.poNumber === selectedPoNumber) || null,
    [purchaseOrders, selectedPoNumber]
  );

  const selectedReceivePo = useMemo(
    () => purchaseOrders.find((po) => Number(po.id) === Number(receiveForm.poId)) || null,
    [purchaseOrders, receiveForm.poId]
  );

  const pendingLines = useMemo(
    () => (selectedReceivePo?.lines || []).filter((line) => Number(line.pendingQuantity) > 0),
    [selectedReceivePo]
  );

  const selectedReceiveLine = useMemo(
    () => pendingLines.find((line) => Number(line.lineId) === Number(receiveForm.purchaseOrderLineId)) || null,
    [pendingLines, receiveForm.purchaseOrderLineId]
  );

  const selectedReceiveItem = useMemo(
    () => items.find((item) => Number(item.id) === Number(selectedReceiveLine?.itemId)) || null,
    [items, selectedReceiveLine]
  );

  const receiveIsAiPo = Boolean(selectedReceiveLine?.isAiGenerated || selectedReceivePo?.isAiGenerated);
  const receiveSuggestedLot = selectedReceiveLine?.suggestedLotNumber || '';

  useEffect(() => {
    if (!selectedReceiveLine) return;

    setReceiveForm((prev) => {
      const autoGenerateSerials = selectedReceiveItem?.serialPrefix ? true : false;
      return {
        ...prev,
        quantity: prev.quantity > 0 ? prev.quantity : Number(selectedReceiveLine.pendingQuantity || 0),
        lotNumber: receiveIsAiPo ? receiveSuggestedLot : prev.lotNumber,
        generateSerials: autoGenerateSerials || prev.generateSerials
      };
    });
  }, [receiveIsAiPo, receiveSuggestedLot, selectedReceiveItem, selectedReceiveLine]);

  const openSerialGenerationModal = () => {
    if (!selectedReceiveItem) {
      setMessage('⚠ Select an item first.');
      return;
    }
    
    let qty = Number(receiveForm.quantity);
    if (!qty || qty <= 0) {
      qty = Number(selectedReceiveLine?.pendingQuantity) || 0;
    }
    
    if (qty <= 0) {
      setMessage('⚠ Enter quantity before generating serials.');
      return;
    }

    const item = selectedReceiveItem;
    const prefix = item.serialPrefix || item.itemCode || 'ITEM';

    const normalizedPrefix = String(prefix).trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ITEM';

    setSerialGenerationForm({
      quantity: qty,
      prefix: normalizedPrefix,
      generatedSerials: []
    });
    setShowSerialModal(true);
  };

  const generatePoSerialNumbers = () => {
    const qty = serialGenerationForm.quantity;
    if (!qty || qty <= 0 || qty > 9999) {
      setMessage('⚠ Invalid quantity. Limit: 1-9,999 units per batch');
      return;
    }

    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Format: POMMDD-HHMMSS
    const dateTimeStr = `PO${month}${day}-${hours}${minutes}${seconds}`;

    const serials = Array.from({ length: qty }, (_, i) => {
      // Use sequential numbers so there are no duplicates inside the same generated batch
      const uniqueId = String(i + 1).padStart(4, '0');
      return {
        serialNumber: `${serialGenerationForm.prefix}${dateTimeStr}-${uniqueId}`,
        status: 'Available'
      };
    });

    setSerialGenerationForm((prev) => ({ ...prev, generatedSerials: serials }));
    setMessage(`✓ Generated ${qty} serial number(s)`);
  };

  const addPoLine = () => {
    setPoForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { itemId: '', warehouseId: '', quantity: 1 }]
    }));
  };

  const removePoLine = (idx) => {
    setPoForm((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((_, i) => i !== idx)
    }));
  };

  const updatePoLine = (idx, patch) => {
    setPoForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === idx ? { ...line, ...patch } : line))
    }));
  };

  const createPo = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      if (!poForm.vendorId) {
        setMessage('⚠ Create/select vendor first.');
        setLoading(false);
        return;
      }

      const lines = poForm.lines
        .map((line) => ({
          itemId: Number(line.itemId),
          warehouseId: Number(line.warehouseId),
          quantity: Number(line.quantity)
        }))
        .filter((line) => line.itemId > 0 && line.warehouseId > 0 && line.quantity > 0);

      if (!lines.length) {
        setMessage('⚠ Add at least one valid PO line.');
        setLoading(false);
        return;
      }

      const res = await smartErpApi.createPurchaseOrder({
        vendorId: Number(poForm.vendorId),
        reason: poForm.reason,
        lines
      });

      setPoForm({
        vendorId: '',
        reason: 'Manual replenishment request',
        lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
      });

      setSelectedPoNumber(res?.data?.poNumber || '');
      setMessage(`✓ Purchase Order created: ${res?.data?.poNumber || ''}`);
      await loadData();
    } catch (err) {
      setMessage(formatPurchaseOrderError(err, '⚠ PO creation failed.'));
    } finally {
      setLoading(false);
    }
  };

  const createVendor = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await smartErpApi.createVendor({
        vendorCode: vendorForm.vendorCode,
        name: vendorForm.name,
        contactPerson: vendorForm.contactPerson || null,
        phone: vendorForm.phone || null,
        email: vendorForm.email || null
      });

      setVendorForm({
        vendorCode: '',
        name: '',
        contactPerson: '',
        phone: '',
        email: ''
      });
      setPoForm((prev) => ({ ...prev, vendorId: String(res.data.id) }));
      setMessage(`✓ Vendor created: ${res.data.vendorCode} - ${res.data.name}`);
      await loadData();
    } catch (err) {
      setMessage(formatPurchaseOrderError(err, '⚠ Vendor creation failed.'));
    } finally {
      setLoading(false);
    }
  };

  const receivePoLine = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      if (!receiveForm.poId || !receiveForm.purchaseOrderLineId) {
        setMessage('⚠ Select PO and PO line.');
        setLoading(false);
        return;
      }

      // Validation: if item requires serials, serials must be generated
      if (selectedReceiveItem?.serialPrefix && serialGenerationForm.generatedSerials.length === 0) {
        setMessage('⚠ This item requires serial tracking. Please generate serials first.');
        setLoading(false);
        return;
      }

      const res = await smartErpApi.receivePurchaseOrder(Number(receiveForm.poId), {
        purchaseOrderLineId: Number(receiveForm.purchaseOrderLineId),
        quantity: Number(receiveForm.quantity),
        lotNumber: receiveForm.lotNumber || null,
        scannerDeviceId: receiveForm.scannerDeviceId,
        generateSerials: serialGenerationForm.generatedSerials.length > 0 ? true : receiveForm.generateSerials,
        serialNumbers: serialGenerationForm.generatedSerials.length > 0 
          ? serialGenerationForm.generatedSerials.map(s => s.serialNumber) 
          : null
      });

      const generatedSerialCount = Number(res?.data?.generatedSerialCount || 0);
      const serialMessage = generatedSerialCount > 0 ? ` | Serials: ${generatedSerialCount}` : '';
      setMessage(`✓ ${res?.data?.message || 'Received'} (${res?.data?.poNumber || ''})${serialMessage}`);
      setReceiveForm({
        poId: '',
        purchaseOrderLineId: '',
        quantity: 0,
        lotNumber: '',
        scannerDeviceId: 'PO-SCN-01',
        generateSerials: false
      });
      setSerialGenerationForm({ quantity: 0, prefix: '', generatedSerials: [] });
      setShowSerialModal(false);
      await loadData();
    } catch (err) {
      setMessage(formatPurchaseOrderError(err, '⚠ PO receiving failed.'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'received') return 'tag-success';
    if (s === 'partial' || s === 'processing') return 'tag-warning';
    if (s === 'pending' || s === 'open') return 'tag-info';
    return 'tag-secondary';
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Procurement & Inbound</h4>
            <span className="erp-text-muted small text-uppercase">Purchase Orders & Receipts</span>
          </div>
          <button 
            className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
            onClick={loadData} 
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            Refresh Data
          </button>
        </div>

        {/* ALERT */}
        {message && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: message.includes("✓") ? '#f0fdf4' : '#fef2f2',
            color: message.includes("✓") ? '#166534' : '#991b1b',
            border: `1px solid ${message.includes("✓") ? '#bbf7d0' : '#fecaca'}`
          }}>
            <span className="fw-semibold">{message}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage('')}></button>
          </div>
        )}

        <div className="row g-4 mb-4">
          
          {/* LEFT COLUMN: ORIGINATION (Vendor & PO) */}
          <div className="col-xl-7">
            <div className="erp-panel shadow-sm h-100">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">Purchase Order Origination</span>
              </div>
              <div className="p-4 bg-white">
                
                {/* Vendor Creation */}
                <h6 className="erp-section-title mb-3">1. Vendor Management</h6>
                <form className="row g-2 mb-5 p-3 border rounded bg-light" onSubmit={createVendor}>
                  <div className="col-md-3">
                    <label className="erp-label">Vendor Code <span className="text-danger">*</span></label>
                    <input className="form-control erp-input font-monospace" placeholder="e.g. V-001" value={vendorForm.vendorCode} onChange={(e) => setVendorForm((prev) => ({ ...prev, vendorCode: e.target.value }))} required />
                  </div>
                  <div className="col-md-5">
                    <label className="erp-label">Vendor Name <span className="text-danger">*</span></label>
                    <input className="form-control erp-input" placeholder="Company Name" value={vendorForm.name} onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))} required />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Contact Person</label>
                    <input className="form-control erp-input" placeholder="Name" value={vendorForm.contactPerson} onChange={(e) => setVendorForm((prev) => ({ ...prev, contactPerson: e.target.value }))} />
                  </div>
                  <div className="col-md-4 mt-2">
                    <label className="erp-label">Phone</label>
                    <input className="form-control erp-input" placeholder="Phone" value={vendorForm.phone} onChange={(e) => setVendorForm((prev) => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className="col-md-5 mt-2">
                    <label className="erp-label">Email</label>
                    <input type="email" className="form-control erp-input" placeholder="Email Address" value={vendorForm.email} onChange={(e) => setVendorForm((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="col-md-3 mt-2 d-flex align-items-end">
                    <button className="btn btn-outline-primary erp-btn w-100 fw-bold" disabled={loading}>+ Create Vendor</button>
                  </div>
                </form>

                {/* PO Creation */}
                <h6 className="erp-section-title mb-3">2. Order Details</h6>
                <form onSubmit={createPo}>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="erp-label">Select Vendor <span className="text-danger">*</span></label>
                      <select className="form-select erp-input" value={poForm.vendorId} onChange={(e) => setPoForm((prev) => ({ ...prev, vendorId: e.target.value }))} required>
                        <option value="">-- Choose Vendor --</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>{vendor.vendorCode} - {vendor.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="erp-label">Procurement Reason <span className="text-danger">*</span></label>
                      <input className="form-control erp-input" placeholder="Internal justification" value={poForm.reason} onChange={(e) => setPoForm((prev) => ({ ...prev, reason: e.target.value }))} required />
                    </div>
                  </div>

                  <h6 className="erp-label text-muted mb-2">Line Items</h6>
                  <div className="bg-light p-3 border rounded mb-4">
                    {poForm.lines.map((line, idx) => (
                      <div key={idx} className="row g-2 align-items-start mb-3 pb-3 border-bottom position-relative erp-line-item">
                        
                        <div className="position-absolute d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.7rem', top: '30px', left: '-10px', zIndex: 1 }}>
                          {idx + 1}
                        </div>

                        <div className="col-md-4 ps-3">
                          <label className="erp-label">Item / SKU <span className="text-danger">*</span></label>
                          <select className="form-select erp-input" value={line.itemId} onChange={(e) => updatePoLine(idx, { itemId: e.target.value })} required>
                            <option value="">Select Item...</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>{item.itemCode} - {item.description}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="erp-label">Destination Warehouse <span className="text-danger">*</span></label>
                          <select className="form-select erp-input" value={line.warehouseId} onChange={(e) => updatePoLine(idx, { warehouseId: e.target.value })} required>
                            <option value="">Select Warehouse...</option>
                            {warehouses.map((wh) => (
                              <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <label className="erp-label">Quantity <span className="text-danger">*</span></label>
                          <input type="number" className="form-control erp-input font-monospace text-end" value={line.quantity} onChange={(e) => updatePoLine(idx, { quantity: e.target.value })} min="0.01" step="0.01" required />
                        </div>
                        <div className="col-md-1 d-flex align-items-end justify-content-end">
                          <button type="button" className="btn btn-outline-danger erp-btn w-100 fw-bold" onClick={() => removePoLine(idx)} disabled={poForm.lines.length === 1} title="Remove Line">✕</button>
                        </div>
                      </div>
                    ))}
                    
                    <button type="button" className="btn btn-light border erp-btn fw-bold text-primary mt-1" onClick={addPoLine}>+ Add Line</button>
                  </div>

                  <div className="d-flex justify-content-end pt-2 border-top">
                    <button type="submit" className="btn btn-primary erp-btn px-4 py-2 fw-bold" disabled={loading}>
                      Issue Purchase Order
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RECEIVING */}
          <div className="col-xl-5">
            <div className="erp-panel shadow-sm h-100">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">Inbound Receiving (GRN)</span>
              </div>
              <div className="p-4 bg-white">
                <form onSubmit={receivePoLine}>
                  <div className="mb-3">
                    <label className="erp-label">Active Purchase Order <span className="text-danger">*</span></label>
                    <select className="form-select erp-input font-monospace" value={receiveForm.poId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, poId: e.target.value, purchaseOrderLineId: '' }))} required>
                      <option value="">-- Select Pending PO --</option>
                      {purchaseOrders.filter((po) => Number(po.pendingQuantity) > 0).map((po) => (
                        <option key={po.poNumber} value={po.id}>
                          {po.poNumber} (Pending Qty: {po.pendingQuantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="erp-label">Target PO Line <span className="text-danger">*</span></label>
                    <select className="form-select erp-input font-monospace" value={receiveForm.purchaseOrderLineId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, purchaseOrderLineId: e.target.value }))} required disabled={!receiveForm.poId}>
                      <option value="">-- Select specific line item --</option>
                      {pendingLines.map((line) => (
                        <option key={line.lineId} value={line.lineId}>
                          Ln {line.lineId} | {line.itemCode} | {line.warehouseName} | Pending: {line.pendingQuantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-4 p-3 bg-light border rounded">
                    <div className="col-md-6">
                      <label className="erp-label">Receive Quantity <span className="text-danger">*</span></label>
                      <input type="number" className="form-control erp-input font-monospace text-end" placeholder="0 = full pending" value={receiveForm.quantity} onChange={(e) => setReceiveForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} min="0" step="0.01" />
                      <small className="text-muted" style={{fontSize: '0.65rem'}}>Leave 0 to receive all pending.</small>
                    </div>
                    <div className="col-md-6">
                      <label className="erp-label">{receiveIsAiPo ? 'Auto Lot / Batch #' : 'Assign Lot / Batch #'}</label>
                      <input
                        className="form-control erp-input font-monospace"
                        placeholder={receiveIsAiPo ? 'Resolved automatically from existing lot' : 'Scan or Type'}
                        value={receiveForm.lotNumber}
                        onChange={(e) => setReceiveForm((prev) => ({ ...prev, lotNumber: e.target.value }))}
                        readOnly={receiveIsAiPo}
                      />
                      <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                        {receiveIsAiPo
                          ? 'AI purchase orders reuse the latest existing lot for this item and warehouse.'
                          : 'Manual purchase orders allow direct lot entry.'}
                      </small>
                    </div>
                    <div className="col-md-12 mt-2">
                      <label className="erp-label">Scanner Device ID</label>
                      <input className="form-control erp-input font-monospace text-muted" value={receiveForm.scannerDeviceId} onChange={(e) => setReceiveForm((prev) => ({ ...prev, scannerDeviceId: e.target.value }))} />
                    </div>
                    <div className="col-md-12 mt-2">
                      <button
                        type="button"
                        onClick={openSerialGenerationModal}
                        disabled={loading || !selectedReceiveItem || !selectedReceiveLine || Number(receiveForm.quantity) <= 0}
                        className="btn btn-outline-primary erp-btn w-100 fw-bold py-2"
                      >
                        + GENERATE SERIAL NUMBERS
                      </button>
                      <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>
                        {selectedReceiveItem?.serialPrefix
                          ? `Required for this item. ${serialGenerationForm.generatedSerials.length} serial(s) generated.`
                          : 'Optional. Generate tracking serials for this PO receipt.'}
                      </small>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-success erp-btn w-100 fw-bold py-2" disabled={loading || !receiveForm.poId}>
                    Process Goods Receipt (GRN)
                  </button>
                </form>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW: LEDGER */}
        <div className="erp-panel shadow-sm">
          <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Purchase Order Ledger</span>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Filter:</span>
              <select className="form-select form-select-sm erp-input font-monospace" style={{ width: '250px' }} value={selectedPoNumber} onChange={(e) => setSelectedPoNumber(e.target.value)}>
                <option value="">All Purchase Orders</option>
                {purchaseOrders.map((po) => (
                  <option key={po.poNumber} value={po.poNumber}>{po.poNumber}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="erp-table-container overflow-auto bg-white" style={{ maxHeight: '400px' }}>
            <table className="table erp-table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Reason / Ref</th>
                  <th className="text-end">Total Qty</th>
                  <th className="text-end">Received</th>
                  <th className="text-end">Pending</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {(selectedPo ? [selectedPo] : purchaseOrders).length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-4 text-muted">No purchase orders found.</td></tr>
                ) : (
                  (selectedPo ? [selectedPo] : purchaseOrders).map((po) => (
                    <React.Fragment key={po.poNumber}>
                      {/* Master Row */}
                      <tr className="bg-light">
                        <td><span className="fw-bold text-dark font-monospace">{po.poNumber}</span></td>
                        <td className="text-muted">{po.reason}</td>
                        <td className="text-end font-monospace">{po.totalQuantity}</td>
                        <td className="text-end font-monospace text-success">{po.receivedQuantity}</td>
                        <td className={`text-end font-monospace fw-bold ${po.pendingQuantity > 0 ? 'text-danger' : 'text-muted'}`}>{po.pendingQuantity}</td>
                        <td className="text-center"><span className={`erp-status-tag ${getStatusColor(po.status)}`}>{po.status}</span></td>
                      </tr>
                      {/* Detailed Lines */}
                      {po.lines && po.lines.length > 0 && (
                        <tr>
                          <td colSpan="6" className="p-0 border-0">
                            <div className="bg-white px-4 py-2 border-bottom">
                              <table className="table table-sm erp-table mb-0">
                                <thead>
                                  <tr>
                                    <th className="text-muted" style={{fontSize: '0.65rem'}}>Ln ID</th>
                                    <th className="text-muted" style={{fontSize: '0.65rem'}}>Item Code</th>
                                    <th className="text-muted" style={{fontSize: '0.65rem'}}>Warehouse Location</th>
                                    <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Order Qty</th>
                                    <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Recv Qty</th>
                                    <th className="text-end text-muted" style={{fontSize: '0.65rem'}}>Pend Qty</th>
                                    <th className="text-center text-muted" style={{fontSize: '0.65rem'}}>Ln Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {po.lines.map((line) => (
                                    <tr key={line.lineId}>
                                      <td className="text-muted font-monospace">{line.lineId}</td>
                                      <td className="fw-bold">{line.itemCode || line.itemId}</td>
                                      <td>{line.warehouseName || line.warehouseId}</td>
                                      <td className="text-end font-monospace">{line.quantity}</td>
                                      <td className="text-end font-monospace text-success">{line.receivedQuantity}</td>
                                      <td className="text-end font-monospace">{line.pendingQuantity}</td>
                                      <td className="text-center">
                                        <span className={`erp-status-tag ${getStatusColor(line.status)}`} style={{fontSize: '0.55rem', padding: '2px 4px'}}>{line.status}</span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
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
        .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

        /* Modal Styles */
        .erp-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        .erp-dialog {
          background-color: var(--erp-surface);
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: 90vh;
          overflow-y: auto;
          max-width: 100%;
        }
        .erp-dialog-md {
          max-width: 500px;
        }
        .erp-dialog-header {
          background-color: var(--erp-primary);
          color: white;
          padding: 16px;
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .erp-dialog-body {
          padding: 16px;
          max-height: calc(90vh - 120px);
          overflow-y: auto;
        }
      `}</style>

      {/* SERIAL GENERATION MODAL */}
      {showSerialModal && (
        <div className="erp-modal-overlay" style={{ zIndex: 1060 }}>
          <div className="erp-dialog erp-dialog-md w-100 mx-3">
            <div className="erp-dialog-header">
              <h6 className="m-0 fw-bold">PO Serial Number Generation</h6>
              <button className="btn-close btn-close-white" onClick={() => setShowSerialModal(false)}></button>
            </div>
            <div className="erp-dialog-body bg-white p-3">
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light border rounded">
                <div>
                  <span className="erp-label m-0">Target Qty</span>
                  <span className="fs-5 fw-bold font-monospace text-primary">{Number(serialGenerationForm.quantity)}</span>
                </div>
                <button type="button" className="btn btn-sm btn-outline-primary fw-bold erp-btn" onClick={generatePoSerialNumbers}>
                  + Generate Sequence
                </button>
              </div>

              {message && (
                <div className="alert alert-info small mb-3" style={{ fontSize: '0.75rem' }}>
                  {message}
                </div>
              )}

              {serialGenerationForm.generatedSerials.length > 0 ? (
                <div className="border rounded overflow-hidden" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-sm table-striped m-0 font-monospace" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light sticky-top">
                      <tr>
                        <th className="ps-3 text-uppercase text-muted">S/N</th>
                        <th className="text-uppercase text-muted">Generated Serial (PO Format)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serialGenerationForm.generatedSerials.map((s, i) => (
                        <tr key={i}>
                          <td className="ps-3 text-muted">{i + 1}</td>
                          <td className="fw-bold">{s.serialNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted small border rounded bg-light shadow-sm">
                  Click generate to create unique serials for this PO receipt.
                </div>
              )}
            </div>
            <div className="p-3 bg-light border-top d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-light border erp-btn" onClick={() => setShowSerialModal(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn-success erp-btn px-4"
                onClick={() => {
                  if (serialGenerationForm.generatedSerials.length === 0) {
                    setMessage('⚠ Please generate serial numbers first');
                    return;
                  }
                  setShowSerialModal(false);
                  receivePoLine({ preventDefault: () => {} });
                }}
                disabled={serialGenerationForm.generatedSerials.length === 0 || loading}
              >
                {loading ? 'Processing...' : 'Confirm & Receive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}