
// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
// import api from '../services/apiClient';

// const SCAN_COOLDOWN_MS = 2000;

// // Base template for the on-the-fly item creation
// const createEmptyProductForm = () => ({
//   itemCode: "",
//   description: "",
//   barcode: "",
//   category: "General",
//   unit: "NOS",
//   price: 0,
//   warehouseLocation: "",
//   isLotTracked: true, // Default to true to encourage tracking
//   serialPrefix: "",
//   itemType: "Purchased",
//   maxStockLevel: 1000,
//   safetyStock: 10,
//   leadTimeDays: 3,
//   averageDailySales: 0
// });

// export default function MobileScanner({
//   items = [],
//   warehouses = [],
//   fetchData = () => {},
//   onScanDetected = () => {}
// }) {
//   const videoRef = useRef(null);
//   const codeReaderRef = useRef(null);
//   const lastScan = useRef({ barcode: '', timestamp: 0 });

//   // --- Global States ---
//   const [cameraActive, setCameraActive] = useState(false);
//   const [cameraError, setCameraError] = useState('');
//   const [manualInput, setManualInput] = useState('');
//   const [status, setStatus] = useState({ type: '', text: '' });
//   const [loading, setLoading] = useState(false);
  
//   // --- Context States ---
//   const [currentItem, setCurrentItem] = useState(null);
//   const [detectedBarcode, setDetectedBarcode] = useState('');
//   const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  
//   // --- Navigation & Modes ---
//   const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'po'
//   const [txMode, setTxMode] = useState('in'); // 'in', 'out', 'transfer'
  
//   const defaultWarehouseId = warehouses.length ? String(warehouses[0].id) : '';
//   const [txForm, setTxForm] = useState({
//     itemId: '',
//     warehouseId: defaultWarehouseId,
//     destWarehouseId: '',
//     lotId: '',
//     quantity: '',
//     lotNumber: ''
//   });

//   // --- PO States ---
//   const [poLoading, setPoLoading] = useState(false);
//   const [poList, setPoList] = useState([]);
//   const [filteredPoList, setFilteredPoList] = useState([]);
//   const [selectedPoNumber, setSelectedPoNumber] = useState('');
//   const [currentPoLine, setCurrentPoLine] = useState(null);
//   const selectedPo = useMemo(
//     () => poList.find((po) => po.poNumber === selectedPoNumber) ?? null,
//     [poList, selectedPoNumber]
//   );

//   // --- Lot States ---
//   const [availableLots, setAvailableLots] = useState([]);
//   const [lotsLoading, setLotsLoading] = useState(false);

//   // --- Master Data Creation States (404 Intercept) ---
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [productForm, setProductForm] = useState(createEmptyProductForm());
//   const [createLoading, setCreateLoading] = useState(false);

//   // --- Helper Functions ---
//   const showStatus = useCallback((type, text) => {
//     setStatus({ type, text });
//     setTimeout(() => setStatus({ type: '', text: '' }), 4000);
//   }, []);

//   const findBackCamera = useCallback(async () => {
//     if (!navigator?.mediaDevices?.enumerateDevices) return undefined;
//     try {
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const videoDevices = devices.filter((device) => device.kind === 'videoinput');
//       const backCamera = videoDevices.find((device) => /(back|rear|environment)/i.test(device.label || ''));
//       return backCamera?.deviceId ?? videoDevices[0]?.deviceId;
//     } catch (error) {
//       console.error('Camera enumeration failed', error);
//       return undefined;
//     }
//   }, []);

//   const resetScanState = useCallback(() => {
//     setLastScannedBarcode('');
//     setDetectedBarcode('');
//     setCurrentItem(null);
//     setCurrentPoLine(null);
//     setSelectedPoNumber('');
//     setTxForm(prev => ({...prev, itemId: '', quantity: '', lotNumber: '', lotId: '', warehouseId: defaultWarehouseId}));
//     setAvailableLots([]);
//   }, [defaultWarehouseId]);

//   // --- API Loaders ---
//   const loadPendingPurchaseOrders = useCallback(async () => {
//     setPoLoading(true);
//     try {
//       const response = await api.get('/purchase-orders/pending');
//       setPoList(response.data || []);
//       setFilteredPoList(response.data || []);
//     } catch (error) {
//       setPoList([]);
//       setFilteredPoList([]);
//     } finally {
//       setPoLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadPendingPurchaseOrders();
//   }, [loadPendingPurchaseOrders]);

//   const loadAvailableLots = useCallback(async () => {
//     const scannerItemId = parseInt(txForm.itemId, 10);
//     const scannerWarehouseId = parseInt(txForm.warehouseId, 10);
//     if (!scannerItemId || !scannerWarehouseId) {
//       setAvailableLots([]);
//       return;
//     }
//     setLotsLoading(true);
//     try {
//       const res = await api.get('/stock/lots', { params: { itemId: scannerItemId, warehouseId: scannerWarehouseId } });
//       const normalized = (res.data || []).map((lot) => ({
//         lotId: lot.lotId ?? lot.LotId ?? null,
//         lotNumber: lot.lotNumber ?? lot.LotNumber ?? 'General',
//         quantity: Number(lot.quantity ?? lot.Quantity ?? 0)
//       }));
//       setAvailableLots(normalized);
//     } catch (error) {
//       setAvailableLots([]);
//     } finally {
//       setLotsLoading(false);
//     }
//   }, [txForm.itemId, txForm.warehouseId]);

//   useEffect(() => {
//     loadAvailableLots();
//   }, [loadAvailableLots]);

//   // Auto-Select Lot for OUT / TRANSFER
//   useEffect(() => {
//     if (availableLots.length > 0 && (txMode === 'out' || txMode === 'transfer')) {
//       const validLot = availableLots.find(l => l.quantity > 0);
//       if (validLot && !txForm.lotId) {
//         setTxForm(prev => ({ ...prev, lotId: String(validLot.lotId) }));
//       }
//     }
//   }, [availableLots, txMode, txForm.lotId]);

//   // Auto-Filter POs based on Scanned Item
//   useEffect(() => {
//     if (!txForm.itemId) {
//       setFilteredPoList(poList);
//     } else {
//       const filtered = poList.filter(po => po.lines.some(l => String(l.itemId) === String(txForm.itemId) && l.pendingQty > 0));
//       setFilteredPoList(filtered);
//       if (filtered.length === 1 && selectedPoNumber !== filtered[0].poNumber) {
//         setSelectedPoNumber(filtered[0].poNumber);
//       } else if (filtered.length === 0) {
//         setSelectedPoNumber('');
//       }
//     }
//   }, [poList, txForm.itemId, selectedPoNumber]);

//   // Auto-Select PO Line
//   useEffect(() => {
//     if (selectedPo && txForm.itemId) {
//       const match = selectedPo.lines.find(l => String(l.itemId) === String(txForm.itemId));
//       if (match) {
//         setCurrentPoLine(match);
//         setTxForm(prev => ({ ...prev, warehouseId: String(match.warehouseId) }));
//       } else {
//         setCurrentPoLine(null);
//       }
//     } else {
//       setCurrentPoLine(null);
//     }
//   }, [selectedPo, txForm.itemId]);

//   // --- Camera & Scanning Logic ---
//   const stopCamera = useCallback(() => {
//     try {
//       codeReaderRef.current?.reset();
//     } catch (error) {
//       console.error('Camera cleanup failed', error);
//     }
//     setCameraActive(false);
//   }, []);

//   const resolveBarcode = useCallback(
//     async (barcodeValue) => {
//       const trimmed = (barcodeValue || '').trim();
//       if (!trimmed) return null;
      
//       setCurrentItem(null);
//       setCurrentPoLine(null);
//       setDetectedBarcode(trimmed);
      
//       try {
//         const response = await api.get(`/items/barcode/${encodeURIComponent(trimmed)}`);
//         const payload = response.data;
//         const autoWarehouseId = payload.inventory?.warehouseId ?? warehouses[0]?.id ?? '';
        
//         setCurrentItem({
//           itemId: payload.itemId,
//           itemCode: payload.itemCode,
//           description: payload.itemName,
//           serialPrefix: payload.serialPrefix
//         });
        
//         setTxForm((prev) => {
//           const prevQty = parseInt(prev.quantity, 10) || 0;
//           const nextQty = trimmed === lastScannedBarcode ? prevQty + 1 : 1;
//           return {
//             ...prev,
//             itemId: String(payload.itemId),
//             warehouseId: String(autoWarehouseId),
//             quantity: String(nextQty),
//             lotNumber: '', // Reset lot number on new scan
//             lotId: ''
//           };
//         });

//         setLastScannedBarcode(trimmed);

//         if (activeTab === 'po') {
//           showStatus('info', `Item matched. Please verify PO Line.`);
//         } else {
//           showStatus('success', `Detected: ${payload.itemCode}`);
//         }
        
//         onScanDetected({ itemId: payload.itemId, warehouseId: autoWarehouseId });
//         stopCamera();
//         return payload;

//       } catch (err) {
//         console.error('Barcode lookup failed', err);
//         const status = err?.response?.status;
        
//         // INTERCEPT 404: Open Item Creation Modal
//         if (status === 404) {
//           stopCamera();
//           showStatus('warning', 'Unknown barcode. Register item to continue.');
//           setProductForm({
//             ...createEmptyProductForm(),
//             barcode: trimmed,
//             itemCode: `ITEM-${trimmed.substring(0, 6).toUpperCase()}` // Auto-suggest code
//           });
//           setShowCreateForm(true);
//         } else {
//           showStatus('error', 'Failed to resolve barcode');
//         }
//         return null;
//       }
//     },
//     [onScanDetected, showStatus, warehouses, activeTab, lastScannedBarcode, stopCamera]
//   );

//   const handleDetectedCode = useCallback(async (code) => {
//     const trimmed = (code || '').trim();
//     if (!trimmed) return;
//     const now = Date.now();
//     if (trimmed !== lastScan.current.barcode || now - lastScan.current.timestamp >= SCAN_COOLDOWN_MS) {
//       lastScan.current = { barcode: trimmed, timestamp: now };
//       await resolveBarcode(trimmed);
//     }
//   }, [resolveBarcode]);

//   const handleManualSubmit = async (e) => {
//     e.preventDefault();
//     if (!manualInput) return;
//     await handleDetectedCode(manualInput);
//     setManualInput('');
//   };

//   const startCamera = useCallback(async () => {
//     if (!videoRef.current) return;
//     setCameraError('');
//     try {
//       if (codeReaderRef.current) codeReaderRef.current.reset();
//       else codeReaderRef.current = new BrowserMultiFormatReader();

//       const deviceId = await findBackCamera();
//       codeReaderRef.current.decodeFromVideoDevice(deviceId ?? undefined, videoRef.current, (result, error) => {
//         if (result) handleDetectedCode(result.getText());
//       }).catch((err) => {
//         setCameraError(`Camera unavailable: ${err.message}`);
//         setCameraActive(false);
//       });

//       setCameraActive(true);
//       showStatus('info', 'Camera active. Point at barcode.');
//     } catch (err) {
//       setCameraError(`Camera unavailable: ${err.message}`);
//       setCameraActive(false);
//     }
//   }, [handleDetectedCode, showStatus, findBackCamera]);

//   useEffect(() => {
//     void startCamera();
//     return stopCamera;
//   }, [startCamera, stopCamera]);

//   // --- ON-THE-FLY ITEM CREATION ---
//   const handleCreateProduct = async (e) => {
//     e.preventDefault();
//     setCreateLoading(true);
//     try {
//       await api.post("/smart-erp/products", {
//         ...productForm,
//         price: Number(productForm.price),
//         maxStockLevel: Number(productForm.maxStockLevel),
//         safetyStock: Number(productForm.safetyStock),
//         leadTimeDays: Number(productForm.leadTimeDays),
//         averageDailySales: Number(productForm.averageDailySales)
//       });
      
//       const newBarcode = productForm.barcode;
//       showStatus("success", "Item Registered! Resuming scan...");
//       setProductForm(createEmptyProductForm());
//       setShowCreateForm(false);
//       fetchData(); 
      
//       // Auto-resolve newly created item to seamlessly continue workflow
//       if (newBarcode) await resolveBarcode(newBarcode);
//       else void startCamera();
      
//     } catch (err) {
//       showStatus("error", err?.response?.data?.message || "Registration failed.");
//     } finally {
//       setCreateLoading(false);
//     }
//   };

//   // --- TRANSACTION EXECUTION ---
//   const handleStockTransaction = async (e) => {
//     e?.preventDefault();
//     if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity) {
//       return showStatus('error', 'Provide valid item, warehouse, and quantity');
//     }

//     setLoading(true);
//     try {
//       let endpoint = '';
//       let payload = {
//         itemId: parseInt(txForm.itemId, 10),
//         warehouseId: parseInt(txForm.warehouseId, 10),
//         quantity: parseFloat(txForm.quantity),
//       };

//       if (activeTab === 'po') {
//         if (!selectedPo || !currentPoLine) return showStatus('error', 'Valid PO Line required');
//         if (payload.quantity > currentPoLine.pendingQty) return showStatus('error', 'Exceeds PO pending amount');
        
//         endpoint = '/purchase-orders/receive';
//         payload.poId = selectedPo.id;
//         // Strictly uses user input, else falls back to generic generated lot
//         payload.lotNumber = txForm.lotNumber?.trim() || `LOT-${Date.now().toString().slice(-6)}`;
//         payload.scannerDeviceId = 'MOBILE-SCAN';
//       } 
//       else if (activeTab === 'stock' && txMode === 'in') {
//         endpoint = '/stock/in';
//         // Strictly uses whatever custom string the user typed (e.g. "gbighh")
//         payload.lotNumber = txForm.lotNumber?.trim() || null;
//       } 
//       else if (activeTab === 'stock' && txMode === 'out') {
//         if (!txForm.lotId) return showStatus('error', 'Source lot required for dispatch');
//         endpoint = '/stock/out';
//         payload.lotId = parseInt(txForm.lotId, 10);
//       } 
//       else if (activeTab === 'stock' && txMode === 'transfer') {
//         if (!txForm.lotId || !txForm.destWarehouseId) return showStatus('error', 'Lot and Dest Warehouse required');
//         endpoint = '/stock/transfer';
//         payload.lotId = parseInt(txForm.lotId, 10);
//         payload.destinationWarehouseId = parseInt(txForm.destWarehouseId, 10);
//       }

//       const response = await api.post(endpoint, payload);
//       showStatus('success', response.data?.message || `Transaction recorded successfully`);
      
//       resetScanState();
//       fetchData();
//       if (activeTab === 'po') void loadPendingPurchaseOrders();
//       void startCamera();
      
//     } catch (err) {
//       showStatus('error', err.response?.data?.message || `Transaction failed`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getAlertClass = (type) => {
//     if (type === 'success') return 'alert-success border-success text-success';
//     if (type === 'error') return 'alert-danger border-danger text-danger';
//     if (type === 'warning') return 'alert-warning border-warning text-warning';
//     return 'alert-info border-info text-info';
//   };

//   return (
//     <div className="bg-white p-3 p-md-4 h-100 d-flex flex-column">
      
//       {/* CAMERA VIEWFINDER */}
//       <div className="position-relative bg-dark rounded-3 overflow-hidden shadow-sm mb-3" style={{ minHeight: '220px' }}>
//         <video ref={videoRef} className="w-100 h-100 object-fit-cover" autoPlay muted playsInline />
//         <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ pointerEvents: 'none' }}>
//           <div className="scanner-laser" style={{ width: '70%', height: '2px', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
//           <div className="text-white fw-bold mt-3 px-3 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)', fontSize: '0.8rem' }}>
//             {cameraActive ? 'Scanning for barcodes...' : 'Camera Offline'}
//           </div>
//         </div>
//       </div>

//       {cameraError && <div className="alert alert-danger py-2 small fw-bold">⚠️ {cameraError}</div>}

//       {/* MANUAL INPUT */}
//       <form onSubmit={handleManualSubmit} className="d-flex gap-2 mb-3">
//         <input type="text" className="form-control erp-input font-monospace" placeholder="Manual barcode entry..." value={manualInput} onChange={(e) => setManualInput(e.target.value)} />
//         <button type="submit" className="btn btn-primary erp-btn px-4" disabled={!manualInput}>Lookup</button>
//       </form>

//       {/* STATUS NOTIFICATIONS */}
//       {status.text && (
//         <div className={`alert erp-alert py-2 fw-bold ${getAlertClass(status.type)}`}>
//           {status.text}
//         </div>
//       )}

//       {/* DETECTED ITEM CARD */}
//       {currentItem && (
//         <div className="alert alert-success d-flex flex-column mb-3 py-2 border-success shadow-sm">
//           <div className="d-flex justify-content-between align-items-center">
//              <span className="fw-bold font-monospace fs-5">{currentItem.itemCode}</span>
//              <button className="btn btn-sm btn-outline-danger erp-btn py-0 px-2" onClick={() => { resetScanState(); void startCamera(); }}>Clear</button>
//           </div>
//           <span className="small text-dark mt-1">{currentItem.description}</span>
//           {activeTab === 'po' && currentPoLine && (
//             <div className="mt-2 pt-2 border-top border-success d-flex justify-content-between small fw-bold">
//               <span>PO Line Matched</span>
//               <span>Pending: {currentPoLine.pendingQty}</span>
//             </div>
//           )}
//         </div>
//       )}

//       {/* TOP NAVIGATION TABS */}
//       <ul className="nav nav-tabs mb-3 border-bottom-0">
//         <li className="nav-item">
//           <button className={`nav-link fw-bold ${activeTab === 'stock' ? 'active bg-light border-bottom-0 text-primary' : 'text-muted'}`} onClick={() => { setActiveTab('stock'); resetScanState(); void startCamera(); }}>
//             📦 Stock Ops
//           </button>
//         </li>
//         <li className="nav-item">
//           <button className={`nav-link fw-bold ${activeTab === 'po' ? 'active bg-light border-bottom-0 text-primary' : 'text-muted'}`} onClick={() => { setActiveTab('po'); resetScanState(); void startCamera(); }}>
//             🛒 PO Receiving
//           </button>
//         </li>
//       </ul>

//       {/* ========================================= */}
//       {/* TAB 1: STOCK OPERATIONS (IN/OUT/TRANSFER) */}
//       {/* ========================================= */}
//       {activeTab === 'stock' && (
//         <div className="erp-panel shadow-sm flex-grow-1 d-flex flex-column bg-light border-top-0 rounded-top-0">
//           <div className="p-3 bg-white flex-grow-1 d-flex flex-column rounded-bottom">
            
//             <div className="btn-group w-100 mb-3 shadow-sm" role="group">
//               <button type="button" className={`btn erp-btn ${txMode === 'in' ? 'btn-success fw-bold' : 'btn-light border'}`} onClick={() => { setTxMode('in'); setTxForm(p => ({...p, lotId: '', destWarehouseId: ''})); }}>📥 IN</button>
//               <button type="button" className={`btn erp-btn ${txMode === 'out' ? 'btn-danger fw-bold' : 'btn-light border'}`} onClick={() => { setTxMode('out'); setTxForm(p => ({...p, lotNumber: '', destWarehouseId: ''})); }}>📤 OUT</button>
//               <button type="button" className={`btn erp-btn ${txMode === 'transfer' ? 'btn-warning fw-bold' : 'btn-light border'}`} onClick={() => { setTxMode('transfer'); setTxForm(p => ({...p, lotNumber: ''})); }}>🔁 XFER</button>
//             </div>

//             <fieldset disabled={!currentItem}>
//               <form onSubmit={(e) => e.preventDefault()}>
//                 <div className="row g-2 mb-3">
//                   <div className="col-12">
//                     <label className="erp-label">Location <span className="text-danger">*</span></label>
//                     <select className="form-select erp-input" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}>
//                       {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
//                     </select>
//                   </div>
//                 </div>

//                 <div className="row g-2 mb-3">
//                   <div className="col-4">
//                     <label className="erp-label">Qty <span className="text-danger">*</span></label>
//                     <input type="number" className="form-control erp-input font-monospace text-end fw-bold" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} min="1" placeholder="0" />
//                   </div>

//                   {txMode === 'in' ? (
//                     <div className="col-8">
//                       <label className="erp-label">Lot / Batch Number</label>
//                       <input 
//                         type="text" 
//                         className="form-control erp-input font-monospace" 
//                         value={txForm.lotNumber} 
//                         onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })} 
//                         placeholder="Type lot code..." 
//                       />
//                     </div>
//                   ) : (
//                     <div className="col-8">
//                       <label className="erp-label">Source Lot <span className="text-danger">*</span></label>
//                       <select className="form-select erp-input font-monospace" value={txForm.lotId} onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })}>
//                         <option value="">{lotsLoading ? 'Loading...' : '-- Select --'}</option>
//                         {availableLots.filter(l => l.quantity > 0).map((lot) => (
//                           <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
//                             {lot.lotNumber} (Avail: {lot.quantity})
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   )}
//                 </div>

//                 {txMode === 'transfer' && (
//                   <div className="row g-2 mb-3 p-2 bg-light border rounded">
//                     <div className="col-12">
//                       <label className="erp-label text-warning">Dest Location <span className="text-danger">*</span></label>
//                       <select className="form-select erp-input" value={txForm.destWarehouseId} onChange={(e) => setTxForm({ ...txForm, destWarehouseId: e.target.value })}>
//                         <option value="">-- Target Bin --</option>
//                         {warehouses.filter((w) => w.id !== parseInt(txForm.warehouseId, 10)).map((w) => (
//                           <option key={w.id} value={w.id}>{w.name}</option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>
//                 )}

//                 <div className="d-flex pt-3 border-top mt-auto">
//                   <button type="button" onClick={handleStockTransaction} disabled={loading || !txForm.itemId || !txForm.quantity} className={`btn erp-btn w-100 py-2 fw-bold ${txMode === 'in' ? 'btn-success' : txMode === 'out' ? 'btn-danger' : 'btn-warning text-dark'}`}>
//                     {loading ? 'PROCESSING...' : txMode === 'in' ? 'EXECUTE RECEIPT' : txMode === 'out' ? 'EXECUTE DISPATCH' : 'EXECUTE TRANSFER'}
//                   </button>
//                 </div>
//               </form>
//             </fieldset>
//             {!currentItem && <div className="text-center text-muted small mt-3 p-2 border border-dashed rounded">Scan an item to unlock transaction controls.</div>}
//           </div>
//         </div>
//       )}

//       {/* ========================================= */}
//       {/* TAB 2: PO RECEIVING */}
//       {/* ========================================= */}
//       {activeTab === 'po' && (
//         <div className="erp-panel shadow-sm flex-grow-1 d-flex flex-column bg-light border-top-0 rounded-top-0">
//           <div className="p-3 bg-white flex-grow-1 d-flex flex-column rounded-bottom">
            
//             <div className="mb-4">
//               <label className="erp-label m-0 mb-2">Target Purchase Order</label>
//               <select className="form-select erp-input font-monospace mb-2" value={selectedPoNumber} onChange={(e) => { setSelectedPoNumber(e.target.value); setCurrentPoLine(null); }}>
//                 <option value="">-- Select PO --</option>
//                 {filteredPoList.map((po) => (
//                   <option key={po.poNumber} value={po.poNumber}>{po.poNumber} (Pending: {po.totalPending})</option>
//                 ))}
//               </select>
//               {selectedPo && (
//                 <div className="d-flex justify-content-between bg-light p-2 border rounded small text-muted">
//                   <span>Vendor:</span><span className="fw-bold text-dark">{selectedPo.supplierName}</span>
//                 </div>
//               )}
//             </div>

//             <fieldset disabled={!currentItem || !currentPoLine}>
//               <form onSubmit={(e) => e.preventDefault()}>
//                 <div className="row g-2 mb-3">
//                   <div className="col-12">
//                     <label className="erp-label">Receive Location</label>
//                     <select className="form-select erp-input" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}>
//                       {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
//                     </select>
//                   </div>
//                 </div>
//                 <div className="row g-2 mb-3">
//                   <div className="col-4">
//                     <label className="erp-label">Qty <span className="text-danger">*</span></label>
//                     <input type="number" className="form-control erp-input font-monospace text-end fw-bold" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} min="1" placeholder="0" />
//                   </div>
//                   <div className="col-8">
//                     <label className="erp-label">Assign Lot Number</label>
//                     <input type="text" className="form-control erp-input font-monospace" value={txForm.lotNumber} onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })} placeholder="Type custom lot..." />
//                   </div>
//                 </div>
//                 <div className="d-flex pt-3 border-top mt-auto">
//                   <button type="button" onClick={handleStockTransaction} disabled={loading || !txForm.quantity || !currentPoLine} className="btn btn-primary erp-btn w-100 py-2 fw-bold">
//                     {loading ? 'PROCESSING...' : 'RECEIVE PO STOCK'}
//                   </button>
//                 </div>
//               </form>
//             </fieldset>
//             {!currentItem && <div className="text-center text-muted small mt-3 p-2 border border-dashed rounded">Scan an item to match against pending PO lines.</div>}
//           </div>
//         </div>
//       )}

//       {/* ========================================= */}
//       {/* 404 INTERCEPT: ON-THE-FLY ITEM CREATION   */}
//       {/* ========================================= */}
//       {showCreateForm && (
//         <div className="erp-modal-overlay" style={{ zIndex: 1100 }}>
//           <div className="erp-dialog erp-dialog-md w-100 m-3 shadow-lg">
//             <div className="erp-dialog-header">
//               <h6 className="m-0 fw-bold">Unrecognized Barcode Detected</h6>
//               <button className="btn-close btn-close-white" onClick={() => { setShowCreateForm(false); void startCamera(); }}></button>
//             </div>
//             <div className="erp-dialog-body bg-white p-4">
//               <form onSubmit={handleCreateProduct}>
//                 <div className="alert alert-warning py-2 small fw-bold mb-4 border-warning">
//                   Barcode <span className="font-monospace text-dark">{productForm.barcode}</span> is not in the system. Register it to continue scanning.
//                 </div>
                
//                 <div className="mb-3">
//                   <label className="erp-label">Item Code <span className="text-danger">*</span></label>
//                   <input className="form-control erp-input font-monospace" placeholder="e.g. SKU-001" value={productForm.itemCode} onChange={(e) => setProductForm({ ...productForm, itemCode: e.target.value })} required />
//                 </div>
//                 <div className="mb-3">
//                   <label className="erp-label">Description <span className="text-danger">*</span></label>
//                   <textarea className="form-control erp-input" rows="2" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
//                 </div>

//                 <div className="row g-2 mb-4">
//                   <div className="col-6">
//                     <label className="erp-label">Unit Price</label>
//                     <input type="number" step="0.01" className="form-control erp-input font-monospace" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
//                   </div>
//                   <div className="col-6">
//                     <label className="erp-label">Category</label>
//                     <input className="form-control erp-input" placeholder="General" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
//                   </div>
//                 </div>

//                 <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-3">
//                   <button type="button" className="btn btn-light border erp-btn" onClick={() => { setShowCreateForm(false); void startCamera(); }}>Cancel</button>
//                   <button type="submit" className="btn btn-primary erp-btn px-4 fw-bold" disabled={createLoading}>
//                     {createLoading ? 'Saving...' : 'Register & Resume'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}

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
        
//         .erp-panel {
//           background: var(--erp-surface);
//           border: 1px solid var(--erp-border);
//           border-radius: 4px;
//           overflow: hidden;
//         }
//         .erp-panel-header {
//           border-bottom: 1px solid var(--erp-border);
//           padding: 10px 12px;
//           font-size: 0.85rem;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//           color: #34495e;
//           font-weight: bold;
//         }

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
//           font-weight: 600;
//           letter-spacing: 0.2px;
//           font-size: 0.85rem;
//           padding: 8px 12px;
//         }
//         .erp-label {
//           font-size: 0.7rem;
//           font-weight: 700;
//           color: var(--erp-text-muted);
//           text-transform: uppercase;
//           margin-bottom: 4px;
//           display: block;
//         }

//         /* Tabs customization */
//         .nav-tabs .nav-link {
//           border-radius: 4px 4px 0 0;
//           border-color: transparent transparent var(--erp-border);
//         }
//         .nav-tabs .nav-link.active {
//           border-color: var(--erp-border) var(--erp-border) transparent;
//         }

//         /* Scanner Specific Animations */
//         .scanner-laser {
//           animation: scan 2s infinite linear;
//         }
//         @keyframes scan {
//           0% { transform: translateY(-80px); }
//           50% { transform: translateY(80px); }
//           100% { transform: translateY(-80px); }
//         }
        
//         .erp-alert {
//           border-radius: 4px;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.05);
//         }
        
//         /* Modals */
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
//           animation: modalFadeIn 0.2s ease-out;
//         }
//         @keyframes modalFadeIn {
//           from { opacity: 0; transform: translateY(-10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .erp-dialog-md { max-width: 450px; }
//         .erp-dialog-header {
//           background-color: var(--erp-primary);
//           color: white;
//           padding: 12px 16px;
//           display: flex; justify-content: space-between; align-items: center;
//         }
//       `}</style>
//     </div>
//   );
// }
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import api from '../services/apiClient';

const SCAN_COOLDOWN_MS = 2000;

const createEmptyProductForm = () => ({
  itemCode: "",
  description: "",
  barcode: "",
  category: "General",
  unit: "NOS",
  price: 0,
  warehouseLocation: "",
  isLotTracked: true, 
  serialPrefix: "",
  itemType: "Purchased",
  maxStockLevel: 1000,
  safetyStock: 10,
  leadTimeDays: 3,
  averageDailySales: 0
});

export default function MobileScanner({
  items = [],
  warehouses = [],
  fetchData = () => {},
  onScanDetected = () => {}
}) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const lastScan = useRef({ barcode: '', timestamp: 0 });

  // --- Global States ---
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  // --- Context States ---
  const [currentItem, setCurrentItem] = useState(null);
  const [detectedBarcode, setDetectedBarcode] = useState('');
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  
  // --- Navigation & Modes ---
  const [activeTab, setActiveTab] = useState('stock'); // 'stock', 'po', 'create'
  const [txMode, setTxMode] = useState('in'); // 'in', 'out', 'transfer'
  
  const defaultWarehouseId = warehouses.length ? String(warehouses[0].id) : '';
  const [txForm, setTxForm] = useState({
    itemId: '',
    warehouseId: defaultWarehouseId,
    destWarehouseId: '',
    lotId: '',
    quantity: '',
    lotNumber: ''
  });

  // --- PO States ---
  const [poLoading, setPoLoading] = useState(false);
  const [poList, setPoList] = useState([]);
  const [filteredPoList, setFilteredPoList] = useState([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [currentPoLine, setCurrentPoLine] = useState(null);
  const selectedPo = useMemo(
    () => poList.find((po) => po.poNumber === selectedPoNumber) ?? null,
    [poList, selectedPoNumber]
  );

  // --- Lot States ---
  const [availableLots, setAvailableLots] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);

  // --- Serial Generation Modal States ---
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialGenerationForm, setSerialGenerationForm] = useState({
    quantity: 0,
    generatedSerials: []
  });

  // --- Master Data Creation States ---
  const [productForm, setProductForm] = useState(createEmptyProductForm());
  const [createLoading, setCreateLoading] = useState(false);

  const showStatus = useCallback((type, text) => {
    setStatus({ type, text });
    setTimeout(() => setStatus({ type: '', text: '' }), 4500);
  }, []);

  const findBackCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return undefined;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      const backCamera = videoDevices.find((device) => /(back|rear|environment)/i.test(device.label || ''));
      return backCamera?.deviceId ?? videoDevices[0]?.deviceId;
    } catch (error) {
      console.error('Camera enumeration failed', error);
      return undefined;
    }
  }, []);

  const resetScanState = useCallback(() => {
    setLastScannedBarcode('');
    setDetectedBarcode('');
    setCurrentItem(null);
    setCurrentPoLine(null);
    setSelectedPoNumber('');
    setTxForm(prev => ({...prev, itemId: '', quantity: '', lotNumber: '', lotId: '', warehouseId: defaultWarehouseId}));
    setAvailableLots([]);
  }, [defaultWarehouseId]);

  const loadPendingPurchaseOrders = useCallback(async () => {
    setPoLoading(true);
    try {
      const response = await api.get('/purchase-orders/pending');
      setPoList(response.data || []);
      setFilteredPoList(response.data || []);
    } catch (error) {
      setPoList([]);
      setFilteredPoList([]);
    } finally {
      setPoLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingPurchaseOrders();
  }, [loadPendingPurchaseOrders]);

  const loadAvailableLots = useCallback(async () => {
    const scannerItemId = parseInt(txForm.itemId, 10);
    const scannerWarehouseId = parseInt(txForm.warehouseId, 10);
    if (!scannerItemId || !scannerWarehouseId) {
      setAvailableLots([]);
      return;
    }
    setLotsLoading(true);
    try {
      const res = await api.get('/stock/lots', { params: { itemId: scannerItemId, warehouseId: scannerWarehouseId } });
      const normalized = (res.data || []).map((lot) => ({
        lotId: lot.lotId ?? lot.LotId ?? null,
        lotNumber: lot.lotNumber ?? lot.LotNumber ?? 'General',
        quantity: Number(lot.quantity ?? lot.Quantity ?? 0)
      }));
      setAvailableLots(normalized);
    } catch (error) {
      setAvailableLots([]);
    } finally {
      setLotsLoading(false);
    }
  }, [txForm.itemId, txForm.warehouseId]);

  useEffect(() => {
    loadAvailableLots();
  }, [loadAvailableLots]);

  // Auto-Select Lot for OUT / TRANSFER
  useEffect(() => {
    if (availableLots.length > 0 && (txMode === 'out' || txMode === 'transfer')) {
      const validLot = availableLots.find(l => l.quantity > 0);
      if (validLot && !txForm.lotId) {
        setTxForm(prev => ({ ...prev, lotId: String(validLot.lotId) }));
      }
    }
  }, [availableLots, txMode, txForm.lotId]);

  // Auto-Filter POs based on Scanned Item
  useEffect(() => {
    if (!txForm.itemId) {
      setFilteredPoList(poList);
    } else {
      const filtered = poList.filter(po => po.lines.some(l => String(l.itemId) === String(txForm.itemId) && l.pendingQty > 0));
      setFilteredPoList(filtered);
      
      if (filtered.length === 1 && selectedPoNumber !== filtered[0].poNumber) {
        setSelectedPoNumber(filtered[0].poNumber);
      } else if (filtered.length === 0) {
        setSelectedPoNumber('');
      }
    }
  }, [poList, txForm.itemId, selectedPoNumber]);

  // Auto-Select PO Line
  useEffect(() => {
    if (selectedPo && txForm.itemId) {
      const match = selectedPo.lines.find(l => String(l.itemId) === String(txForm.itemId));
      if (match) {
        setCurrentPoLine(match);
        setTxForm(prev => ({ ...prev, warehouseId: String(match.warehouseId) }));
      } else {
        setCurrentPoLine(null);
      }
    } else {
      setCurrentPoLine(null);
    }
  }, [selectedPo, txForm.itemId]);

  const stopCamera = useCallback(() => {
    try {
      codeReaderRef.current?.reset();
    } catch (error) {
      console.error('Camera cleanup failed', error);
    }
    setCameraActive(false);
  }, []);

  const recordBarcodeScan = useCallback((barcode) => {
    const previousBarcode = lastScannedBarcode;
    setTxForm((prev) => {
      const prevQty = parseInt(prev.quantity, 10) || 0;
      const nextQty = barcode === previousBarcode ? prevQty + 1 : 1;
      return { ...prev, quantity: String(nextQty) };
    });
    setLastScannedBarcode(barcode);
  }, [lastScannedBarcode]);

  const resolveBarcode = useCallback(
    async (barcodeValue) => {
      const trimmed = (barcodeValue || '').trim();
      if (!trimmed) return null;
      
      setCurrentItem(null);
      setCurrentPoLine(null);
      setDetectedBarcode(trimmed);
      let allowScanRecording = true;
      
      try {
        const response = await api.get(`/items/barcode/${encodeURIComponent(trimmed)}`);
        const payload = response.data;
        const autoWarehouseId = payload.inventory?.warehouseId ?? warehouses[0]?.id ?? '';

        // STRICT PO VALIDATION: If in PO tab, ensure item belongs to a pending PO
        if (activeTab === 'po') {
          const isItemInAnyPO = poList.some(po => po.lines.some(l => String(l.itemId) === String(payload.itemId) && l.pendingQty > 0));
          if (!isItemInAnyPO) {
            showStatus('error', `Item ${payload.itemCode} is NOT in any pending Purchase Order.`);
            stopCamera();
            return null;
          }
        }
        
        setCurrentItem({
          itemId: payload.itemId,
          itemCode: payload.itemCode,
          description: payload.itemName,
          serialPrefix: payload.serialPrefix
        });
        
        setTxForm((prev) => {
          const prevQty = parseInt(prev.quantity, 10) || 0;
          const nextQty = trimmed === lastScannedBarcode ? prevQty + 1 : 1;
          return {
            ...prev,
            itemId: String(payload.itemId),
            warehouseId: String(autoWarehouseId),
            quantity: String(nextQty),
            lotNumber: '', 
            lotId: ''
          };
        });

        setLastScannedBarcode(trimmed);

        if (activeTab === 'po') {
          showStatus('info', `Item matched in PO queue. Verify target PO.`);
        } else {
          showStatus('success', `Detected: ${payload.itemCode}`);
        }
        
        onScanDetected({ itemId: payload.itemId, warehouseId: autoWarehouseId });
        stopCamera();
        
        if (allowScanRecording) {
          recordBarcodeScan(trimmed);
        }
        return payload;

      } catch (err) {
        const status = err?.response?.status;
        
        // INTERCEPT 404: Route to the "Add Item" tab instantly
        if (status === 404) {
          stopCamera();
          showStatus('warning', 'Unknown barcode detected. Please register it.');
          setProductForm({
            ...createEmptyProductForm(),
            barcode: trimmed,
            itemCode: `ITEM-${trimmed.substring(0, 6).toUpperCase()}`
          });
          setActiveTab('create');
        } else {
          showStatus('error', 'Failed to resolve barcode');
        }
        return null;
      }
    },
    [onScanDetected, showStatus, warehouses, activeTab, poList, lastScannedBarcode, stopCamera, recordBarcodeScan]
  );

  const handleDetectedCode = useCallback(async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    const now = Date.now();
    if (trimmed !== lastScan.current.barcode || now - lastScan.current.timestamp >= SCAN_COOLDOWN_MS) {
      lastScan.current = { barcode: trimmed, timestamp: now };
      await resolveBarcode(trimmed);
    }
  }, [resolveBarcode]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualInput) return;
    await handleDetectedCode(manualInput);
    setManualInput('');
  };

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setCameraError('');
    try {
      if (codeReaderRef.current) codeReaderRef.current.reset();
      else codeReaderRef.current = new BrowserMultiFormatReader();

      const deviceId = await findBackCamera();
      codeReaderRef.current.decodeFromVideoDevice(deviceId ?? undefined, videoRef.current, (result, error) => {
        if (result) handleDetectedCode(result.getText());
      }).catch((err) => {
        setCameraError(`Camera unavailable: ${err.message}`);
        setCameraActive(false);
      });

      setCameraActive(true);
      showStatus('info', 'Camera active. Point at barcode.');
    } catch (err) {
      setCameraError(`Camera unavailable: ${err.message}`);
      setCameraActive(false);
    }
  }, [handleDetectedCode, showStatus, findBackCamera]);

  useEffect(() => {
    if (activeTab !== 'create') {
      void startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [activeTab, startCamera, stopCamera]);

  // --- ITEM REGISTRATION (404 INTERCEPT) ---
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await api.post("/smart-erp/products", {
        ...productForm,
        price: Number(productForm.price),
        maxStockLevel: Number(productForm.maxStockLevel),
        safetyStock: Number(productForm.safetyStock),
        leadTimeDays: Number(productForm.leadTimeDays),
        averageDailySales: Number(productForm.averageDailySales)
      });
      
      const newBarcode = productForm.barcode;
      showStatus("success", "Item Registered! Resuming stock operations...");
      setProductForm(createEmptyProductForm());
      
      setActiveTab('stock');
      setTxMode('in');
      fetchData(); 
      
      if (newBarcode) await resolveBarcode(newBarcode);
      
    } catch (err) {
      showStatus("error", err?.response?.data?.message || "Registration failed.");
    } finally {
      setCreateLoading(false);
    }
  };

  // --- SERIAL GENERATION LOGIC ---
  const openSerialGenerationModal = () => {
    if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity || parseFloat(txForm.quantity) <= 0) {
      return showStatus('error', 'Valid Item, Warehouse, and Quantity required.');
    }
    if (activeTab === 'po' && !currentPoLine) {
      return showStatus('error', 'Valid PO Line required.');
    }
    setSerialGenerationForm({
      quantity: parseFloat(txForm.quantity),
      generatedSerials: []
    });
    setShowSerialModal(true);
  };

  const generateSerialNumbers = () => {
    const qty = serialGenerationForm.quantity;
    if (qty <= 0 || qty > 100) {
      return showStatus('warning', 'Serial generation limited to 1-100 units per batch');
    }
    
    const prefix = currentItem?.serialPrefix || `SN-${currentItem?.itemCode || 'ITEM'}`;
    const timestamp = Date.now().toString().slice(-4);
    const serials = Array.from({ length: qty }, (_, i) => ({
      serialNumber: `${prefix}-${timestamp}-${String(i + 1).padStart(4, '0')}`
    }));

    setSerialGenerationForm(prev => ({ ...prev, generatedSerials: serials }));
  };

  // --- TRANSACTION EXECUTION ---
  const handleStockTransaction = async (e) => {
    e?.preventDefault();
    if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity) {
      return showStatus('error', 'Provide valid item, warehouse, and quantity');
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload = {
        itemId: parseInt(txForm.itemId, 10),
        warehouseId: parseInt(txForm.warehouseId, 10),
        quantity: parseFloat(txForm.quantity),
      };

      // Add Serials if generated
      if (serialGenerationForm.generatedSerials.length > 0) {
        payload.serialNumbers = serialGenerationForm.generatedSerials.map(s => s.serialNumber);
      }

      if (activeTab === 'po') {
        if (!selectedPo || !currentPoLine) return showStatus('error', 'Valid PO Line required');
        if (payload.quantity > currentPoLine.pendingQty) return showStatus('error', 'Exceeds PO pending amount');
        
        endpoint = '/purchase-orders/receive';
        payload.poId = selectedPo.id;
        payload.lotNumber = txForm.lotNumber?.trim() || `LOT-${Date.now().toString().slice(-6)}`;
        payload.scannerDeviceId = 'MOBILE-SCAN';
      } 
      else if (activeTab === 'stock' && txMode === 'in') {
        endpoint = '/stock/in';
        payload.lotNumber = txForm.lotNumber?.trim() || null;
      } 
      else if (activeTab === 'stock' && txMode === 'out') {
        if (!txForm.lotId) return showStatus('error', 'Source lot required for dispatch');
        endpoint = '/stock/out';
        payload.lotId = parseInt(txForm.lotId, 10);
      } 
      else if (activeTab === 'stock' && txMode === 'transfer') {
        if (!txForm.lotId || !txForm.destWarehouseId) return showStatus('error', 'Lot and Dest Warehouse required');
        endpoint = '/stock/transfer';
        payload.lotId = parseInt(txForm.lotId, 10);
        payload.destinationWarehouseId = parseInt(txForm.destWarehouseId, 10);
      }

      const response = await api.post(endpoint, payload);
      showStatus('success', response.data?.message || `Transaction recorded successfully`);
      
      resetScanState();
      setSerialGenerationForm({ quantity: 0, generatedSerials: [] });
      setShowSerialModal(false);
      fetchData();
      if (activeTab === 'po') void loadPendingPurchaseOrders();
      void startCamera();
      
    } catch (err) {
      showStatus('error', err.response?.data?.message || `Transaction failed`);
    } finally {
      setLoading(false);
    }
  };

  // *** THIS IS THE MISSING FUNCTION THAT FIXES THE ERROR ***
  const confirmStockTransactionWithSerials = () => {
    handleStockTransaction();
  };

  const getAlertClass = (type) => {
    if (type === 'success') return 'alert-success border-success text-success';
    if (type === 'error') return 'alert-danger border-danger text-danger';
    if (type === 'warning') return 'alert-warning border-warning text-warning';
    return 'alert-info border-info text-info';
  };

  return (
    <div className="bg-white p-3 p-md-4 h-100 d-flex flex-column">
      
      {/* TOP NAVIGATION TABS */}
      <ul className="nav nav-tabs mb-3 border-bottom-0 flex-nowrap overflow-auto" style={{ whiteSpace: 'nowrap' }}>
        <li className="nav-item">
          <button className={`nav-link fw-bold px-3 ${activeTab === 'stock' ? 'active bg-light border-bottom-0 text-primary' : 'text-muted'}`} onClick={() => { setActiveTab('stock'); resetScanState(); }}>
            📦 Stock Ops
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-bold px-3 ${activeTab === 'po' ? 'active bg-light border-bottom-0 text-primary' : 'text-muted'}`} onClick={() => { setActiveTab('po'); resetScanState(); }}>
            🛒 PO Receiving
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link fw-bold px-3 ${activeTab === 'create' ? 'active bg-light border-bottom-0 text-success' : 'text-muted'}`} onClick={() => { setActiveTab('create'); resetScanState(); }}>
            ➕ Add Item
          </button>
        </li>
      </ul>

      {/* CAMERA & SCANNER (Hidden in Create Mode) */}
      {activeTab !== 'create' && (
        <>
          <div className="position-relative bg-dark rounded-3 overflow-hidden shadow-sm mb-3" style={{ minHeight: '220px' }}>
            <video ref={videoRef} className="w-100 h-100 object-fit-cover" autoPlay muted playsInline />
            <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ pointerEvents: 'none' }}>
              <div className="scanner-laser" style={{ width: '70%', height: '2px', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
              <div className="text-white fw-bold mt-3 px-3 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)', fontSize: '0.8rem' }}>
                {cameraActive ? 'Scanning for barcodes...' : 'Camera Offline'}
              </div>
            </div>
          </div>

          {cameraError && <div className="alert alert-danger py-2 small fw-bold">⚠️ {cameraError}</div>}

          <form onSubmit={handleManualSubmit} className="d-flex gap-2 mb-3">
            <input type="text" className="form-control erp-input font-monospace" placeholder="Manual barcode entry..." value={manualInput} onChange={(e) => setManualInput(e.target.value)} />
            <button type="submit" className="btn btn-primary erp-btn px-4" disabled={!manualInput}>Lookup</button>
          </form>

          {/* STATUS NOTIFICATIONS */}
          {status.text && (
            <div className={`alert erp-alert py-2 fw-bold ${getAlertClass(status.type)}`}>
              {status.text}
            </div>
          )}

          {/* DETECTED ITEM CARD */}
          {currentItem && (
            <div className="alert alert-success d-flex flex-column mb-3 py-2 border-success shadow-sm">
              <div className="d-flex justify-content-between align-items-center">
                 <span className="fw-bold font-monospace fs-5">{currentItem.itemCode}</span>
                 <button className="btn btn-sm btn-outline-danger erp-btn py-0 px-2" onClick={() => { resetScanState(); void startCamera(); }}>Clear</button>
              </div>
              <span className="small text-dark mt-1">{currentItem.description}</span>
              {activeTab === 'po' && currentPoLine && (
                <div className="mt-2 pt-2 border-top border-success d-flex justify-content-between small fw-bold">
                  <span>PO Line Matched</span>
                  <span>Pending: {currentPoLine.pendingQty}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================= */}
      {/* TAB 1: STOCK OPERATIONS (IN/OUT/TRANSFER) */}
      {/* ========================================= */}
      {activeTab === 'stock' && (
        <div className="erp-panel shadow-sm flex-grow-1 d-flex flex-column bg-light border-top-0 rounded-top-0">
          <div className="p-3 bg-white flex-grow-1 d-flex flex-column rounded-bottom">
            
            <div className="btn-group w-100 mb-3 shadow-sm" role="group">
              <button type="button" className={`btn erp-btn ${txMode === 'in' ? 'btn-success fw-bold' : 'btn-light border'}`} onClick={() => { setTxMode('in'); setTxForm(p => ({...p, lotId: '', destWarehouseId: ''})); }}>📥 IN</button>
              <button type="button" className={`btn erp-btn ${txMode === 'out' ? 'btn-danger fw-bold' : 'btn-light border'}`} onClick={() => { setTxMode('out'); setTxForm(p => ({...p, lotNumber: '', destWarehouseId: ''})); }}>📤 OUT</button>
              <button type="button" className={`btn erp-btn ${txMode === 'transfer' ? 'btn-warning fw-bold' : 'btn-light border'}`} onClick={() => { setTxMode('transfer'); setTxForm(p => ({...p, lotNumber: ''})); }}>🔁 XFER</button>
            </div>

            <fieldset disabled={!currentItem}>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row g-2 mb-3">
                  <div className="col-12">
                    <label className="erp-label">Location <span className="text-danger">*</span></label>
                    <select className="form-select erp-input" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}>
                      {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <label className="erp-label">Qty <span className="text-danger">*</span></label>
                    <input type="number" className="form-control erp-input font-monospace text-end fw-bold text-primary" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} min="1" placeholder="0" />
                  </div>

                  {txMode === 'in' ? (
                    <div className="col-8">
                      <label className="erp-label">Assign Lot / Batch Number</label>
                      <input 
                        type="text" 
                        className="form-control erp-input font-monospace" 
                        value={txForm.lotNumber} 
                        onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })} 
                        placeholder="Type lot string..." 
                      />
                    </div>
                  ) : (
                    <div className="col-8">
                      <label className="erp-label">Source Lot <span className="text-danger">*</span></label>
                      <select className="form-select erp-input font-monospace" value={txForm.lotId} onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })} disabled={lotsLoading}>
                        <option value="">{lotsLoading ? 'Loading...' : '-- Select --'}</option>
                        {availableLots.filter(l => l.quantity > 0).map((lot) => (
                          <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
                            {lot.lotNumber} (Avail: {lot.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {txMode === 'transfer' && (
                  <div className="row g-2 mb-3 p-2 bg-light border rounded">
                    <div className="col-12">
                      <label className="erp-label text-warning">Dest Location <span className="text-danger">*</span></label>
                      <select className="form-select erp-input" value={txForm.destWarehouseId} onChange={(e) => setTxForm({ ...txForm, destWarehouseId: e.target.value })}>
                        <option value="">-- Target Bin --</option>
                        {warehouses.filter((w) => w.id !== parseInt(txForm.warehouseId, 10)).map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="d-flex flex-column gap-2 pt-3 border-top mt-auto">
                  <button type="button" onClick={openSerialGenerationModal} disabled={loading || !txForm.itemId || !txForm.warehouseId || !txForm.quantity} className="btn btn-outline-primary erp-btn w-100 fw-bold">
                    + ASSIGN SERIAL NUMBERS
                  </button>
                  <button type="button" onClick={handleStockTransaction} disabled={loading || !txForm.itemId || !txForm.warehouseId || !txForm.quantity} className={`btn erp-btn w-100 py-2 fw-bold ${txMode === 'in' ? 'btn-success' : txMode === 'out' ? 'btn-danger' : 'btn-warning text-dark'}`}>
                    {loading ? 'PROCESSING...' : txMode === 'in' ? 'EXECUTE RECEIPT' : txMode === 'out' ? 'EXECUTE DISPATCH' : 'EXECUTE TRANSFER'}
                  </button>
                </div>
              </form>
            </fieldset>
            {!currentItem && <div className="text-center text-muted small mt-3 p-2 border border-dashed rounded">Scan an item to unlock transaction controls.</div>}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 2: PO RECEIVING */}
      {/* ========================================= */}
      {activeTab === 'po' && (
        <div className="erp-panel shadow-sm flex-grow-1 d-flex flex-column bg-light border-top-0 rounded-top-0">
          <div className="p-3 bg-white flex-grow-1 d-flex flex-column rounded-bottom">
            
            <div className="mb-4">
              <label className="erp-label m-0 mb-2">Target Purchase Order</label>
              <select className="form-select erp-input font-monospace mb-2" value={selectedPoNumber} onChange={(e) => { setSelectedPoNumber(e.target.value); setCurrentPoLine(null); }}>
                <option value="">-- Select PO --</option>
                {filteredPoList.map((po) => (
                  <option key={po.poNumber} value={po.poNumber}>{po.poNumber} (Pending: {po.totalPending})</option>
                ))}
              </select>
              {selectedPo && (
                <div className="d-flex justify-content-between bg-light p-2 border rounded small text-muted">
                  <span>Vendor:</span><span className="fw-bold text-dark">{selectedPo.supplierName}</span>
                </div>
              )}
            </div>

            <fieldset disabled={!currentItem || !currentPoLine}>
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row g-2 mb-3">
                  <div className="col-12">
                    <label className="erp-label">Receive Location</label>
                    <select className="form-select erp-input" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}>
                      {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <label className="erp-label">Qty <span className="text-danger">*</span></label>
                    <input type="number" className="form-control erp-input font-monospace text-end fw-bold text-primary" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} min="1" placeholder="0" />
                  </div>
                  <div className="col-8">
                    <label className="erp-label">Assign Lot Number</label>
                    <input type="text" className="form-control erp-input font-monospace" value={txForm.lotNumber} onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })} placeholder="Type custom lot..." />
                  </div>
                </div>
                <div className="d-flex flex-column gap-2 pt-3 border-top mt-auto">
                  <button type="button" onClick={openSerialGenerationModal} disabled={loading || !txForm.quantity || !currentPoLine} className="btn btn-outline-primary erp-btn w-100 fw-bold">
                    + ASSIGN SERIAL NUMBERS
                  </button>
                  <button type="button" onClick={handleStockTransaction} disabled={loading || !txForm.quantity || !currentPoLine} className="btn btn-primary erp-btn w-100 py-2 fw-bold">
                    {loading ? 'PROCESSING...' : 'RECEIVE PO STOCK'}
                  </button>
                </div>
              </form>
            </fieldset>
            {!currentItem && <div className="text-center text-muted small mt-3 p-2 border border-dashed rounded">Scan an item to match against pending PO lines.</div>}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 3: 404 INTERCEPT: ON-THE-FLY CREATION */}
      {/* ========================================= */}
      {activeTab === 'create' && (
        <div className="erp-panel shadow-sm flex-grow-1 d-flex flex-column bg-light border-top-0 rounded-top-0">
          <div className="p-4 bg-white flex-grow-1 d-flex flex-column rounded-bottom overflow-auto">
            <h6 className="erp-section-title mb-4">Register New SKU</h6>
            <form onSubmit={handleCreateProduct}>
              {productForm.barcode && (
                <div className="alert alert-warning py-2 small fw-bold mb-4 border-warning">
                  Barcode <span className="font-monospace text-dark">{productForm.barcode}</span> is not in the system. Register it to continue.
                </div>
              )}
              
              <div className="mb-3">
                <label className="erp-label">Item Code <span className="text-danger">*</span></label>
                <input className="form-control erp-input font-monospace" placeholder="e.g. SKU-001" value={productForm.itemCode} onChange={(e) => setProductForm({ ...productForm, itemCode: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="erp-label">Barcode</label>
                <input className="form-control erp-input font-monospace" value={productForm.barcode} onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })} placeholder="Type or scan..." />
              </div>
              <div className="mb-3">
                <label className="erp-label">Description <span className="text-danger">*</span></label>
                <textarea className="form-control erp-input" rows="2" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
              </div>

              <div className="row g-2 mb-4">
                <div className="col-6">
                  <label className="erp-label">Unit Price</label>
                  <input type="number" step="0.01" className="form-control erp-input font-monospace" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} />
                </div>
                <div className="col-6">
                  <label className="erp-label">Category</label>
                  <input className="form-control erp-input" placeholder="General" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center bg-light p-2 border rounded mt-2">
                <div className="form-check form-switch mt-1">
                  <input className="form-check-input" type="checkbox" id="createLotTrack" checked={productForm.isLotTracked} onChange={(e) => setProductForm({ ...productForm, isLotTracked: e.target.checked })} />
                  <label className="form-check-label erp-label m-0" htmlFor="createLotTrack">Enable Lot/Serial Tracking</label>
                </div>
                {productForm.isLotTracked && (
                  <div style={{ width: "120px" }}>
                    <input className="form-control form-control-sm erp-input font-monospace" placeholder="Serial Prefix" value={productForm.serialPrefix} onChange={(e) => setProductForm({ ...productForm, serialPrefix: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-4">
                <button type="button" className="btn btn-light border erp-btn" onClick={() => { setActiveTab('stock'); void startCamera(); }}>Cancel</button>
                <button type="submit" className="btn btn-success erp-btn px-4 fw-bold" disabled={createLoading}>
                  {createLoading ? 'Saving...' : 'Register & Resume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* SERIAL GENERATION MODAL (All TX Modes)    */}
      {/* ========================================= */}
      {showSerialModal && (
        <div className="erp-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="erp-dialog erp-dialog-md w-100 m-3 shadow-lg">
            <div className="erp-dialog-header">
              <h6 className="m-0 fw-bold">Serial Number Allocation</h6>
              <button className="btn-close btn-close-white" onClick={() => setShowSerialModal(false)}></button>
            </div>
            <div className="erp-dialog-body p-3 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light border rounded">
                <div>
                  <span className="erp-label m-0">Target Qty</span>
                  <span className="fs-5 fw-bold font-monospace text-primary">{serialGenerationForm.quantity}</span>
                </div>
                <button className="btn btn-sm btn-outline-primary fw-bold erp-btn" onClick={generateSerialNumbers}>
                  + Generate Sequence
                </button>
              </div>

              {serialGenerationForm.generatedSerials.length > 0 ? (
                <div className="border rounded overflow-hidden" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="table table-sm table-striped m-0 font-monospace" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light sticky-top">
                      <tr>
                        <th className="ps-3 text-uppercase text-muted">S/N</th>
                        <th className="text-uppercase text-muted">Generated Identifier</th>
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
                <div className="text-center py-4 text-muted small border rounded bg-light">
                  Click generate to assign unique serials for this transaction.
                </div>
              )}
            </div>
            <div className="p-3 bg-light border-top d-flex justify-content-end gap-2">
              <button className="btn btn-light border erp-btn" onClick={() => setShowSerialModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary erp-btn px-4" 
                onClick={confirmStockTransactionWithSerials}
                disabled={serialGenerationForm.generatedSerials.length === 0 || loading}
              >
                {loading ? 'Saving...' : 'Commit to Ledger'}
              </button>
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
        
        .erp-panel {
          background: var(--erp-surface);
          border: 1px solid var(--erp-border);
          border-radius: 4px;
          overflow: hidden;
        }
        .erp-panel-header {
          border-bottom: 1px solid var(--erp-border);
          padding: 10px 12px;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #34495e;
          font-weight: bold;
        }

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
          font-size: 0.85rem;
          padding: 8px 12px;
        }
        .erp-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 4px;
          display: block;
        }

        /* Tabs customization */
        .nav-tabs .nav-link {
          border-radius: 4px 4px 0 0;
          border-color: transparent transparent var(--erp-border);
        }
        .nav-tabs .nav-link.active {
          border-color: var(--erp-border) var(--erp-border) transparent;
        }

        /* Scanner Specific Animations */
        .scanner-laser {
          animation: scan 2s infinite linear;
        }
        @keyframes scan {
          0% { transform: translateY(-80px); }
          50% { transform: translateY(80px); }
          100% { transform: translateY(-80px); }
        }
        
        .erp-alert {
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        /* Modals */
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
        .erp-dialog-md { max-width: 450px; }
        .erp-dialog-header {
          background-color: var(--erp-primary);
          color: white;
          padding: 12px 16px;
          display: flex; justify-content: space-between; align-items: center;
        }
      `}</style>
    </div>
  );
}





