// import React, { useCallback, useEffect, useState } from 'react';
// import api from '../services/apiClient';
// import MobileScanner from '../components/MobileScanner';
// import './Operations.css';

// const MODE_TABS = ['stock', 'sales', 'scanner'];

// const formatStatusMessage = (value) => {
//   if (!value) return '';
//   if (typeof value === 'string') return value;
//   if (Array.isArray(value)) return value.map(formatStatusMessage).join('; ');
//   if (typeof value === 'object') {
//     if (value.message) return value.message;
//     if (value.title) return value.title;
//     if (value.errors) {
//       if (Array.isArray(value.errors)) return value.errors.map(formatStatusMessage).join('; ');
//       return typeof value.errors === 'string' ? value.errors : JSON.stringify(value.errors);
//     }
//     return JSON.stringify(value);
//   }
//   return String(value);
// };

// const STATUS_PALETTE = {
//   success: { background: '#dcfce7', color: '#166534', border: '#166534' },
//   info: { background: '#e0f2fe', color: '#035b99', border: '#0284c7' },
//   warning: { background: '#fef3c7', color: '#92400e', border: '#92400e' },
//   error: { background: '#fee2e2', color: '#991b1b', border: '#991b1b' }
// };

// export default function Operations() {
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
//   const [inventory, setInventory] = useState([]);
//   const [status, setStatus] = useState({ type: '', text: '' });
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState('scanner');

//   const [txMode, setTxMode] = useState('in');
//   const [txForm, setTxForm] = useState({
//     itemId: '',
//     warehouseId: '',
//     destWarehouseId: '',
//     quantity: '',
//     lotNumber: '',
//     lotId: '',
//     prefix: ''
//   });

//   const [showSerialModal, setShowSerialModal] = useState(false);
//   const [serialGenerationForm, setSerialGenerationForm] = useState({
//     itemId: null,
//     warehouseId: '',
//     quantity: 0,
//     lotNumber: '',
//     prefix: '',
//     generatedSerials: []
//   });
//   const [lotOptions, setLotOptions] = useState([]);
//   const [lotsLoading, setLotsLoading] = useState(false);

//   const parseNumber = (value) => {
//     const num = Number(value);
//     return Number.isNaN(num) ? null : num;
//   };

//   const showStatus = useCallback((type, text) => {
//     const normalized = formatStatusMessage(text);
//     setStatus({ type, text: normalized });
//     if (normalized) {
//       setTimeout(() => setStatus({ type: '', text: '' }), 4000);
//     }
//   }, []);

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [itemsRes, warehousesRes, inventoryRes] = await Promise.all([
//         api.get('/stock/items'),
//         api.get('/warehouses'),
//         api.get('/stock/inventory')
//       ]);
//       setItems(itemsRes.data || []);
//       setWarehouses(warehousesRes.data || []);
//       setInventory(inventoryRes.data || []);
//     } catch (err) {
//       showStatus('error', 'Failed to load data');
//     } finally {
//       setLoading(false);
//     }
//   }, [showStatus]);

//   const handleScannerPopulate = useCallback((payload) => {
//     if (!payload) return;
//     setTxForm((prev) => ({
//       ...prev,
//       ...(payload.itemId ? { itemId: String(payload.itemId) } : {}),
//       ...(payload.warehouseId ? { warehouseId: String(payload.warehouseId) } : {}),
//       ...(payload.lotNumber ? { lotNumber: payload.lotNumber } : {}),
//       ...(payload.lotId ? { lotId: String(payload.lotId) } : {})
//     }));
//   }, []);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   const parseId = (value) => {
//     const parsed = parseInt(value, 10);
//     return Number.isNaN(parsed) ? null : parsed;
//   };

//   const selectedItemId = parseId(txForm.itemId);
//   const selectedWarehouseId = parseId(txForm.warehouseId);

//   const loadLotOptions = useCallback(async () => {
//     if (!selectedItemId || !selectedWarehouseId) {
//       setLotOptions([]);
//       return;
//     }
//     setLotsLoading(true);
//     try {
//       const res = await api.get('/stock/lots', {
//         params: { itemId: selectedItemId, warehouseId: selectedWarehouseId }
//       });
//       const normalized = (res.data || []).map((lot) => ({
//         lotId: lot.lotId ?? lot.LotId ?? null,
//         lotNumber: lot.lotNumber ?? lot.LotNumber ?? 'General',
//         quantity: Number(lot.quantity ?? lot.Quantity ?? 0)
//       }));
//       setLotOptions(normalized);
//     } catch (err) {
//       setLotOptions([]);
//     } finally {
//       setLotsLoading(false);
//     }
//   }, [selectedItemId, selectedWarehouseId]);

//   useEffect(() => {
//     loadLotOptions();
//     setTxForm((prev) => ({ ...prev, lotId: '' }));
//   }, [loadLotOptions]);

//   const getAvailableLots = () => lotOptions.filter((lot) => lot.lotId !== null && lot.quantity > 0);

//   const openSerialGenerationModal = () => {
//     const item = items.find((i) => i.id === parseInt(txForm.itemId, 10));
//     const prefix = txForm.prefix || (item ? item.itemCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) : '');

//     setSerialGenerationForm({
//       itemId: parseInt(txForm.itemId, 10),
//       warehouseId: txForm.warehouseId,
//       quantity: parseInt(txForm.quantity, 10) || 0,
//       lotNumber: txForm.lotNumber,
//       prefix,
//       generatedSerials: []
//     });
//     setShowSerialModal(true);
//   };

//   const generateSerialNumbers = () => {
//     const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
//     const serials = Array.from({ length: serialGenerationForm.quantity }, (_, i) => ({
//       serialNumber: `${serialGenerationForm.prefix}-${dateStr}-${String(i + 1).padStart(4, '0')}`,
//       status: 'Available'
//     }));
//     setSerialGenerationForm((prev) => ({ ...prev, generatedSerials: serials }));
//   };

//   const confirmStockTransactionWithSerials = async () => {
//     setLoading(true);
//     try {
//       const payload = {
//         itemId: serialGenerationForm.itemId,
//         warehouseId: parseInt(serialGenerationForm.warehouseId, 10),
//         quantity: parseFloat(serialGenerationForm.quantity),
//         lotNumber: serialGenerationForm.lotNumber?.trim() || null
//       };

//       const response = await api.post('/stock/in', payload);

//       const inventoryRes = await api.get('/stock/inventory');
//       const inventoryList = inventoryRes.data || [];

//       const matchingInventory = inventoryList.find(
//         (inv) =>
//           inv.itemId === serialGenerationForm.itemId &&
//           inv.warehouseId === parseInt(serialGenerationForm.warehouseId, 10) &&
//           inv.lotNumber === (serialGenerationForm.lotNumber.trim() || null)
//       );

//       const lotId = matchingInventory ? matchingInventory.lotId : null;

//       if (lotId) {
//         await api.post('/smart-erp/inventory/generate-serials', {
//           itemId: serialGenerationForm.itemId,
//           warehouseId: parseInt(serialGenerationForm.warehouseId, 10),
//           quantity: serialGenerationForm.quantity,
//           lotId
//         });
//       }
//       const message = response.data?.message || `Stock IN & ${serialGenerationForm.quantity} serials synced!`;
//       const statusType = response.data?.success ? 'success' : 'error';
//       showStatus(statusType, message);
//       setShowSerialModal(false);
//       setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
//       fetchData();
//     } catch (err) {
//       showStatus('error', err.response?.data || 'Sync Failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStockTransaction = async (e) => {
//     e.preventDefault();

//     const itemId = parseNumber(txForm.itemId);
//     const warehouseId = parseNumber(txForm.warehouseId);
//     const quantity = parseNumber(txForm.quantity);
//     const lotIdNumber = parseNumber(txForm.lotId);
//     const destWhId = parseNumber(txForm.destWarehouseId);
//     const requiresLot = txMode === 'out' || txMode === 'transfer';
//     const selectedLot = requiresLot
//       ? getAvailableLots().find((lot) => String(lot.lotId) === String(txForm.lotId))
//       : null;

//     if (!itemId || !warehouseId || !quantity) {
//       return showStatus('error', 'Please select item, warehouse, and quantity');
//     }

//     if (requiresLot) {
//       if (!lotIdNumber) {
//         return showStatus('error', 'Please select a lot');
//       }
//       if (!selectedLot) {
//         return showStatus('error', 'Selected lot is not available');
//       }
//       if (quantity > selectedLot.quantity) {
//         return showStatus('error', 'Quantity exceeds lot availability');
//       }
//     }

//     if (txMode === 'transfer' && !destWhId) {
//       return showStatus('error', 'Please select destination warehouse');
//     }

//     try {
//       let response;
//       if (txMode === 'transfer') {
//         const params = {
//           itemId,
//           warehouseId,
//           lotId: lotIdNumber,
//           qty: quantity,
//           destWhId
//         };
//         response = await api.post(`/stock/${txMode}`, null, { params });
//         showStatus('success', response?.data || `Stock ${txMode.toUpperCase()} successful`);
//       } else {
//         const payload = {
//           itemId,
//           warehouseId,
//           quantity,
//           lotId: txMode === 'out' ? lotIdNumber : undefined,
//           lotNumber: txMode === 'in' ? txForm.lotNumber?.trim() || null : undefined
//         };
//         const prunedPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
//         response = await api.post(`/stock/${txMode}`, prunedPayload);
//         const message = response.data?.message || `Stock ${txMode.toUpperCase()} successful`;
//         const type = response.data?.success ? 'success' : 'error';
//         showStatus(type, message);
//       }

//       setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
//       fetchData();
//     } catch (err) {
//       const message = err.response?.data?.message || err.response?.data || 'Transaction failed';
//       showStatus('error', formatStatusMessage(message));
//     }
//   };

//   const modeOptions = {
//     in: { label: '📦 Add stock + generate serials', background: '#d1fae5', border: '#059669' },
//     out: { label: '🚚 Dispatch stock from warehouse', background: '#fee2e2', border: '#dc2626' },
//     transfer: { label: '🔁 Transfer stock between warehouses', background: '#fef3c7', border: '#d97706' }
//   };

//   const currentModeInfo = modeOptions[txMode] || modeOptions.in;
//   const modeButtonAccent = {
//     in: { backgroundColor: '#10b981', border: '2px solid #059669', color: '#fff' },
//     out: { backgroundColor: '#ef4444', border: '2px solid #dc2626', color: '#fff' },
//     transfer: { backgroundColor: '#f59e0b', border: '2px solid #d97706', color: '#111827' }
//   };

//   return (
//     <div className="operations-wrapper">
//       <div className="operations-header">
//         <div className="operations-title-block">
//           <h2>Operations Command Center</h2>
//           <p>Stock management & order fulfillment</p>
//         </div>
//         <button
//           onClick={fetchData}
//           disabled={loading}
//           className="operations-refresh-btn"
//         >
//           {loading ? 'Refreshing data…' : 'Refresh Data'}
//         </button>
//       </div>

//       {status.text && (
//         <div
//           className="status-alert"
//           style={{
//             backgroundColor: (STATUS_PALETTE[status.type] || STATUS_PALETTE.error).background,
//             color: (STATUS_PALETTE[status.type] || STATUS_PALETTE.error).color,
//             borderColor: (STATUS_PALETTE[status.type] || STATUS_PALETTE.error).border
//           }}
//         >
//           {status.text}
//         </div>
//       )}

//       <div className="tabs-grid">
//         {MODE_TABS.map((tab) => (
//           <button
//             key={tab}
//             onClick={() => setActiveTab(tab)}
//             className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
//           >
//             {tab.toUpperCase()}
//           </button>
//         ))}
//       </div>

//       {activeTab === 'scanner' && (
//         <>
//           <div className="scanner-panel focus">
//             <MobileScanner
//               items={items}
//               warehouses={warehouses}
//               inventory={inventory}
//               fetchData={fetchData}
//               onScanDetected={handleScannerPopulate}
//             />
//           </div>
//           <p className="operations-scanner-callout">
//             The scanner feed stays live here for quick barcode captures. Once a product is detected,
//             switch to the STOCK tab to apply lot numbers, quantities, and serials.
//           </p>
//         </>
//       )}
// {/* 
//       {activeTab === 'sales' && (
//         <div className="operations-card">
//           <h3 style={{ margin: 0 }}>Sales operations</h3>
//           <p style={{ marginTop: '8px', color: '#475569' }}>
//             Sales workflows are in progress. Use the STOCK tab to move inventory for now.
//           </p>
//         </div>
//       )} */}

//       {activeTab === 'stock' && (
//         <>
//           {/* <WarehouseScanner /> */}
//           <div className="operations-card">
//             <h3 style={{ margin: 0 }}>Stock Movement</h3>
//             <div className="mode-selector">
//               {['in', 'out', 'transfer'].map((mode) => (
//                 <button
//                   key={mode}
//                   type="button"
//                   className={`mode-btn ${txMode === mode ? 'active' : ''}`}
//                   style={txMode === mode ? modeButtonAccent[mode] : undefined}
//                   onClick={() => setTxMode(mode)}
//                 >
//                   {mode.toUpperCase()}
//                 </button>
//               ))}
//             </div>

//             <div
//               className="mode-info"
//               style={{
//                 backgroundColor: currentModeInfo.background,
//                 borderColor: currentModeInfo.border
//               }}
//             >
//               {currentModeInfo.label}
//             </div>

//             <form className="operation-form-grid" onSubmit={(e) => e.preventDefault()}>
//               <div className="form-group">
//                 <label>Product</label>
//                 <select
//                   value={txForm.itemId}
//                   onChange={(e) => setTxForm({ ...txForm, itemId: e.target.value })}
//                 >
//                   <option value="">-- Select --</option>
//                   {items.map((item) => (
//                     <option key={item.id} value={item.id}>
//                       {item.itemCode}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label>Warehouse</label>
//                 <select
//                   value={txForm.warehouseId}
//                   onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}
//                 >
//                   <option value="">-- Select --</option>
//                   {warehouses.map((warehouse) => (
//                     <option key={warehouse.id} value={warehouse.id}>
//                       {warehouse.name}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="form-group">
//                 <label>Quantity</label>
//                 <input
//                   type="number"
//                   value={txForm.quantity}
//                   onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
//                   min="0"
//                 />
//               </div>

//               {txMode === 'in' && (
//                 <div className="form-group">
//                   <label>Lot Number</label>
//                   <input
//                     type="text"
//                     value={txForm.lotNumber}
//                     onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })}
//                     placeholder="Enter lot number"
//                   />
//                 </div>
//               )}

//               {txMode !== 'in' && (
//                 <div className="form-group">
//                   <label>Select Lot</label>
//                   <select
//                     value={txForm.lotId}
//                     onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })}
//                   >
//                     <option value="">-- Choose Lot --</option>
//                     {getAvailableLots().map((lot) => (
//                       <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
//                         {lot.lotNumber || 'Unassigned'} (Qty: {lot.quantity})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               )}

//               {txMode === 'transfer' && (
//                 <>
//                   <div className="form-group">
//                     <label>Destination Warehouse</label>
//                     <select
//                       value={txForm.destWarehouseId}
//                       onChange={(e) => setTxForm({ ...txForm, destWarehouseId: e.target.value })}
//                     >
//                       <option value="">
//                         {warehouses.filter((warehouse) => warehouse.id !== parseInt(txForm.warehouseId, 10)).length > 0
//                           ? '-- Select Destination --'
//                           : 'No other warehouses available'}
//                       </option>
//                       {warehouses
//                         .filter((warehouse) => warehouse.id !== parseInt(txForm.warehouseId, 10))
//                         .map((warehouse) => (
//                           <option key={warehouse.id} value={warehouse.id}>
//                             {warehouse.name}
//                           </option>
//                         ))}
//                     </select>
//                   </div>
//                   {warehouses.filter((warehouse) => warehouse.id !== parseInt(txForm.warehouseId, 10)).length === 0 && (
//                     <div className="form-help" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
//                       Add another warehouse before transferring stock to keep destinations visible.
//                     </div>
//                   )}
//                 </>
//               )}

//               <div className="form-actions">
//                 <button
//                   type="button"
//                   onClick={(e) => (txMode === 'in' ? openSerialGenerationModal() : handleStockTransaction(e))}
//                   className={`stock-${txMode}`}
//                 >
//                   {txMode === 'in'
//                     ? '📦 Generate & Receive'
//                     : txMode === 'out'
//                     ? '🚚 Execute STOCK OUT'
//                     : '🔁 Execute TRANSFER'}
//                 </button>
//               </div>
//             </form>

//             {selectedItemId && selectedWarehouseId && (
//               <div className="lot-summary">
//                 <h4 style={{ margin: 0, marginBottom: '12px' }}>Lot overview</h4>
//                 {lotsLoading ? (
//                   <p className="lot-card-line text-muted">Loading lots for this warehouse…</p>
//                 ) : lotOptions.length === 0 ? (
//                   <p className="lot-card-line">
//                     No lots registered for this product/warehouse combination yet.
//                   </p>
//                 ) : (
//                   <div className="lot-grid">
//                     {lotOptions.map((lot) => {
//                       const quantity = Number(lot.quantity) || 0;
//                       const statusColor = quantity > 0 ? '#064e3b' : '#b91c1c';
//                       return (
//                         <div
//                           key={`${lot.lotId ?? 'lot'}-${lot.lotNumber || 'unknown'}`}
//                           className="lot-card"
//                         >
//                           <div className="lot-card-line">
//                             <strong>Lot:</strong> {lot.lotNumber || 'Unassigned'}
//                           </div>
//                           <div className="lot-card-line">
//                             <strong>Qty:</strong> {quantity}
//                           </div>
//                           <div className="lot-card-line" style={{ color: statusColor, fontSize: '12px' }}>
//                             {quantity > 0 ? 'Ready for dispatch' : 'Empty lot'}
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </>
//       )}

//       {/* Serial Modal Placeholder Logic follows Bootstrap classes provided in original */}
//       {showSerialModal && (
//         <div className="modal d-block" style={{ background: 'rgba(15, 23, 42, 0.7)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1050 }}>
//           <div className="modal-dialog modal-dialog-centered modal-lg">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5>Generate Serials</h5>
//               </div>
//               <div className="modal-body">
//                 <p>Quantity: {serialGenerationForm.quantity}</p>
//                 <button className="btn btn-primary mb-2" onClick={generateSerialNumbers}>
//                   Generate List
//                 </button>
//                 <div style={{ maxHeight: '220px', overflowY: 'auto', marginTop: '10px' }}>
//                   {serialGenerationForm.generatedSerials.map((s, i) => (
//                     <div key={i}>{s.serialNumber}</div>
//                   ))}
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button className="btn btn-success" onClick={confirmStockTransactionWithSerials}>
//                   Confirm & Save
//                 </button>
//                 <button className="btn btn-secondary" onClick={() => setShowSerialModal(false)}>
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/apiClient';
import MobileScanner from '../components/MobileScanner';

// Removed 'sales' from tabs
const MODE_TABS = ['stock', 'scanner'];

const formatStatusMessage = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatStatusMessage).join('; ');
  if (typeof value === 'object') {
    if (value.message) return value.message;
    if (value.title) return value.title;
    if (value.errors) {
      if (Array.isArray(value.errors)) return value.errors.map(formatStatusMessage).join('; ');
      return typeof value.errors === 'string' ? value.errors : JSON.stringify(value.errors);
    }
    return JSON.stringify(value);
  }
  return String(value);
};

export default function Operations() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  
  // Changed default tab to 'stock'
  const [activeTab, setActiveTab] = useState('stock');

  const [txMode, setTxMode] = useState('in');
  const [txForm, setTxForm] = useState({
    itemId: '',
    warehouseId: '',
    destWarehouseId: '',
    quantity: '',
    lotNumber: '',
    lotId: '',
    prefix: ''
  });

  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialGenerationForm, setSerialGenerationForm] = useState({
    itemId: null,
    warehouseId: '',
    quantity: 0,
    lotNumber: '',
    prefix: '',
    generatedSerials: []
  });
  const [lotOptions, setLotOptions] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);

  const parseNumber = (value) => {
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const showStatus = useCallback((type, text) => {
    const normalized = formatStatusMessage(text);
    setStatus({ type, text: normalized });
    if (normalized) {
      setTimeout(() => setStatus({ type: '', text: '' }), 4000);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, warehousesRes, inventoryRes] = await Promise.all([
        api.get('/stock/items'),
        api.get('/warehouses'),
        api.get('/stock/inventory')
      ]);
      setItems(itemsRes.data || []);
      setWarehouses(warehousesRes.data || []);
      setInventory(inventoryRes.data || []);
    } catch (err) {
      showStatus('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showStatus]);

  const handleScannerPopulate = useCallback((payload) => {
    if (!payload) return;
    setTxForm((prev) => ({
      ...prev,
      ...(payload.itemId ? { itemId: String(payload.itemId) } : {}),
      ...(payload.warehouseId ? { warehouseId: String(payload.warehouseId) } : {}),
      ...(payload.lotNumber ? { lotNumber: payload.lotNumber } : {}),
      ...(payload.lotId ? { lotId: String(payload.lotId) } : {})
    }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parseId = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const selectedItemId = parseId(txForm.itemId);
  const selectedWarehouseId = parseId(txForm.warehouseId);

  const loadLotOptions = useCallback(async () => {
    if (!selectedItemId || !selectedWarehouseId) {
      setLotOptions([]);
      return;
    }
    setLotsLoading(true);
    try {
      const res = await api.get('/stock/lots', {
        params: { itemId: selectedItemId, warehouseId: selectedWarehouseId }
      });
      const normalized = (res.data || []).map((lot) => ({
        lotId: lot.lotId ?? lot.LotId ?? null,
        lotNumber: lot.lotNumber ?? lot.LotNumber ?? 'General',
        quantity: Number(lot.quantity ?? lot.Quantity ?? 0)
      }));
      setLotOptions(normalized);
    } catch (err) {
      setLotOptions([]);
    } finally {
      setLotsLoading(false);
    }
  }, [selectedItemId, selectedWarehouseId]);

  useEffect(() => {
    loadLotOptions();
    setTxForm((prev) => ({ ...prev, lotId: '' }));
  }, [loadLotOptions]);

  const getAvailableLots = () => lotOptions.filter((lot) => lot.lotId !== null && lot.quantity > 0);

  const openSerialGenerationModal = () => {
    const item = items.find((i) => i.id === parseInt(txForm.itemId, 10));
    const prefix = txForm.prefix || (item ? item.itemCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) : '');

    setSerialGenerationForm({
      itemId: parseInt(txForm.itemId, 10),
      warehouseId: txForm.warehouseId,
      quantity: parseInt(txForm.quantity, 10) || 0,
      lotNumber: txForm.lotNumber,
      prefix,
      generatedSerials: []
    });
    setShowSerialModal(true);
  };

  const generateSerialNumbers = () => {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const serials = Array.from({ length: serialGenerationForm.quantity }, (_, i) => ({
      serialNumber: `${serialGenerationForm.prefix}-${dateStr}-${String(i + 1).padStart(4, '0')}`,
      status: 'Available'
    }));
    setSerialGenerationForm((prev) => ({ ...prev, generatedSerials: serials }));
  };

  const confirmStockTransactionWithSerials = async () => {
    setLoading(true);
    try {
      const payload = {
        itemId: serialGenerationForm.itemId,
        warehouseId: parseInt(serialGenerationForm.warehouseId, 10),
        quantity: parseFloat(serialGenerationForm.quantity),
        lotNumber: serialGenerationForm.lotNumber?.trim() || null
      };

      const response = await api.post('/stock/in', payload);

      const inventoryRes = await api.get('/stock/inventory');
      const inventoryList = inventoryRes.data || [];

      const matchingInventory = inventoryList.find(
        (inv) =>
          inv.itemId === serialGenerationForm.itemId &&
          inv.warehouseId === parseInt(serialGenerationForm.warehouseId, 10) &&
          inv.lotNumber === (serialGenerationForm.lotNumber.trim() || null)
      );

      const lotId = matchingInventory ? matchingInventory.lotId : null;

      if (lotId) {
        await api.post('/smart-erp/inventory/generate-serials', {
          itemId: serialGenerationForm.itemId,
          warehouseId: parseInt(serialGenerationForm.warehouseId, 10),
          quantity: serialGenerationForm.quantity,
          lotId
        });
      }
      const message = response.data?.message || `Stock IN & ${serialGenerationForm.quantity} serials synced!`;
      const statusType = response.data?.success ? 'success' : 'error';
      showStatus(statusType, message);
      setShowSerialModal(false);
      setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
      fetchData();
    } catch (err) {
      showStatus('error', err.response?.data || 'Sync Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStockTransaction = async (e) => {
    e.preventDefault();

    const itemId = parseNumber(txForm.itemId);
    const warehouseId = parseNumber(txForm.warehouseId);
    const quantity = parseNumber(txForm.quantity);
    const lotIdNumber = parseNumber(txForm.lotId);
    const destWhId = parseNumber(txForm.destWarehouseId);
    const requiresLot = txMode === 'out' || txMode === 'transfer';
    const selectedLot = requiresLot
      ? getAvailableLots().find((lot) => String(lot.lotId) === String(txForm.lotId))
      : null;

    if (!itemId || !warehouseId || !quantity) {
      return showStatus('error', 'Please select item, warehouse, and quantity');
    }

    if (requiresLot) {
      if (!lotIdNumber) {
        return showStatus('error', 'Please select a lot');
      }
      if (!selectedLot) {
        return showStatus('error', 'Selected lot is not available');
      }
      if (quantity > selectedLot.quantity) {
        return showStatus('error', 'Quantity exceeds lot availability');
      }
    }

    if (txMode === 'transfer' && !destWhId) {
      return showStatus('error', 'Please select destination warehouse');
    }

    try {
      let response;
      if (txMode === 'transfer') {
        const params = {
          itemId,
          warehouseId,
          lotId: lotIdNumber,
          qty: quantity,
          destWhId
        };
        response = await api.post(`/stock/${txMode}`, null, { params });
        showStatus('success', response?.data || `Stock ${txMode.toUpperCase()} successful`);
      } else {
        const payload = {
          itemId,
          warehouseId,
          quantity,
          lotId: txMode === 'out' ? lotIdNumber : undefined,
          lotNumber: txMode === 'in' ? txForm.lotNumber?.trim() || null : undefined
        };
        const prunedPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
        response = await api.post(`/stock/${txMode}`, prunedPayload);
        const message = response.data?.message || `Stock ${txMode.toUpperCase()} successful`;
        const type = response.data?.success ? 'success' : 'error';
        showStatus(type, message);
      }

      setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
      fetchData();
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data || 'Transaction failed';
      showStatus('error', formatStatusMessage(message));
    }
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container px-4" style={{ maxWidth: '1000px' }}>
        
        {/* HEADER / TABS ROW */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-2">
          <div className="erp-tabs border-0 m-0">
            {MODE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`erp-tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading} 
            className="btn btn-sm btn-light border d-flex align-items-center gap-2 text-muted fw-bold" 
            style={{ borderRadius: '3px', marginBottom: '8px' }}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            {loading ? 'Syncing...' : 'Refresh Gateway'}
          </button>
        </div>

        {status.text && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: status.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: status.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${status.type === 'error' ? '#f87171' : '#4ade80'}`
          }}>
            <span className="fw-semibold">{status.text}</span>
            <button className="btn-close btn-sm" onClick={() => setStatus({ type: '', text: '' })}></button>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="erp-panel p-0 overflow-hidden shadow-sm">
            <div className="erp-panel-header bg-dark text-white border-0">
              <span className="fw-bold">Barcode Scanner Interface</span>
            </div>
            <div className="p-0 bg-black">
              <MobileScanner
                items={items}
                warehouses={warehouses}
                inventory={inventory}
                fetchData={fetchData}
                onScanDetected={handleScannerPopulate}
              />
            </div>
            <div className="p-3 bg-light border-top erp-text-muted small">
              <span className="text-primary me-2">■</span>
              The scanner feed stays live here for quick barcode captures. Once a product is detected, switch to the <strong>STOCK</strong> tab to apply lot numbers, quantities, and serials.
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="erp-panel shadow-sm">
            <div className="erp-panel-header d-flex justify-content-between align-items-center">
              <span>Inventory Movement Protocol</span>
            </div>
            <div className="p-4">
              
              {/* MODE SELECTOR */}
              <div className="btn-group w-100 mb-4 shadow-sm" role="group">
                <button 
                  type="button" 
                  className={`btn erp-btn ${txMode === 'in' ? 'btn-success fw-bold' : 'btn-light border'}`}
                  onClick={() => setTxMode('in')}
                >
                  📥 RECEIVE (IN)
                </button>
                <button 
                  type="button" 
                  className={`btn erp-btn ${txMode === 'out' ? 'btn-danger fw-bold' : 'btn-light border'}`}
                  onClick={() => setTxMode('out')}
                >
                  📤 DISPATCH (OUT)
                </button>
                <button 
                  type="button" 
                  className={`btn erp-btn ${txMode === 'transfer' ? 'btn-warning fw-bold' : 'btn-light border'}`}
                  onClick={() => setTxMode('transfer')}
                >
                  🔁 TRANSFER
                </button>
              </div>

              <div className="erp-instruction-box mb-4" style={{
                backgroundColor: txMode === 'in' ? '#f0fdf4' : txMode === 'out' ? '#fef2f2' : '#fffbeb',
                borderLeft: `4px solid ${txMode === 'in' ? '#22c55e' : txMode === 'out' ? '#ef4444' : '#f59e0b'}`
              }}>
                <span className="fw-semibold small text-uppercase" style={{color: '#475569'}}>
                  {txMode === 'in' ? 'Add stock & generate serials' : txMode === 'out' ? 'Dispatch stock from warehouse' : 'Transfer stock between warehouses'}
                </span>
              </div>

              {/* FORM GRID */}
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="erp-label">Master Item ID <span className="text-danger">*</span></label>
                    <select className="form-select erp-input" value={txForm.itemId} onChange={(e) => setTxForm({ ...txForm, itemId: e.target.value })}>
                      <option value="">-- Select Product --</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.itemCode}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="erp-label">Source Warehouse <span className="text-danger">*</span></label>
                    <select className="form-select erp-input" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}>
                      <option value="">-- Select Location --</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="erp-label">Quantity <span className="text-danger">*</span></label>
                    <input type="number" className="form-control erp-input font-monospace text-end" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} min="0" placeholder="0" />
                  </div>

                  {/* Dynamic Lot Fields based on Mode */}
                  {txMode === 'in' ? (
                    <div className="col-md-8">
                      <label className="erp-label">Assign Lot / Batch Number</label>
                      <input type="text" className="form-control erp-input font-monospace" value={txForm.lotNumber} onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })} placeholder="Scan or Type (Optional)" />
                    </div>
                  ) : (
                    <div className="col-md-8">
                      <label className="erp-label">Select Source Lot <span className="text-danger">*</span></label>
                      <select className="form-select erp-input font-monospace" value={txForm.lotId} onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })}>
                        <option value="">-- Choose Active Lot --</option>
                        {getAvailableLots().map((lot) => (
                          <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
                            {lot.lotNumber || 'UNASSIGNED'} (Available Qty: {lot.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Transfer specific fields */}
                {txMode === 'transfer' && (
                  <div className="row g-3 mb-4 p-3 bg-light border rounded">
                    <div className="col-md-12">
                      <label className="erp-label text-warning">Destination Warehouse <span className="text-danger">*</span></label>
                      <select className="form-select erp-input" value={txForm.destWarehouseId} onChange={(e) => setTxForm({ ...txForm, destWarehouseId: e.target.value })}>
                        <option value="">
                          {warehouses.filter((warehouse) => warehouse.id !== parseInt(txForm.warehouseId, 10)).length > 0
                            ? '-- Select Destination Bin --'
                            : 'No other warehouses available'}
                        </option>
                        {warehouses
                          .filter((warehouse) => warehouse.id !== parseInt(txForm.warehouseId, 10))
                          .map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-end pt-3 border-top mt-2">
                  <button
                    type="button"
                    onClick={(e) => (txMode === 'in' ? openSerialGenerationModal() : handleStockTransaction(e))}
                    className={`btn erp-btn px-5 py-2 fw-bold ${txMode === 'in' ? 'btn-success' : txMode === 'out' ? 'btn-danger' : 'btn-warning'}`}
                  >
                    {txMode === 'in' ? 'RECEIVE & GENERATE SERIALS' : txMode === 'out' ? 'EXECUTE DISPATCH' : 'EXECUTE TRANSFER'}
                  </button>
                </div>
              </form>

              {/* Dynamic Lot Summary specific to selected item/warehouse */}
              {selectedItemId && selectedWarehouseId && (
                <div className="mt-5 p-4 border rounded bg-light">
                  <h6 className="erp-section-title mb-3">Bin Location Lot Summary</h6>
                  {lotsLoading ? (
                    <div className="text-muted small">Synchronizing lot data...</div>
                  ) : lotOptions.length === 0 ? (
                    <div className="text-muted small">No active stock units registered for this product/warehouse sequence.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {lotOptions.map((lot) => {
                        const quantity = Number(lot.quantity) || 0;
                        const isAvailable = quantity > 0;
                        return (
                          <div key={`${lot.lotId ?? 'lot'}-${lot.lotNumber || 'unknown'}`} className="erp-lot-row">
                            <div>
                              <div className="fw-bold font-monospace text-dark">{lot.lotNumber || 'UNASSIGNED'}</div>
                              <div className="erp-text-muted small" style={{ color: isAvailable ? '#15803d' : '#b91c1c' }}>
                                {isAvailable ? 'Ready for distribution' : 'Depleted Lot'}
                              </div>
                            </div>
                            <div className={`fw-bold fs-5 font-monospace ${isAvailable ? 'text-dark' : 'text-danger'}`}>
                              {quantity}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* SERIAL GENERATION MODAL */}
      {showSerialModal && (
        <div className="erp-modal-overlay">
          <div className="erp-dialog erp-dialog-md">
            <div className="erp-dialog-header">
              <h6 className="m-0 fw-bold">Serial Number Allocation</h6>
              <button className="btn-close btn-close-white" onClick={() => setShowSerialModal(false)}></button>
            </div>
            <div className="erp-dialog-body">
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light border rounded">
                <div>
                  <span className="erp-label m-0">Inbound Qty</span>
                  <span className="fs-5 fw-bold font-monospace text-success">{serialGenerationForm.quantity}</span>
                </div>
                <button className="btn btn-sm btn-outline-primary fw-bold" onClick={generateSerialNumbers}>
                  + Generate Sequence
                </button>
              </div>

              {serialGenerationForm.generatedSerials.length > 0 ? (
                <div className="border rounded overflow-hidden" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                <div className="text-center py-4 text-muted small border rounded bg-white">
                  Click generate to create unique serials based on item prefix.
                </div>
              )}
            </div>
            <div className="p-3 bg-light border-top d-flex justify-content-end gap-2">
              <button className="btn btn-light border erp-btn" onClick={() => setShowSerialModal(false)}>Discard</button>
              <button 
                className="btn btn-primary erp-btn px-4" 
                onClick={confirmStockTransactionWithSerials}
                disabled={serialGenerationForm.generatedSerials.length === 0}
              >
                Commit to Ledger
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

        .erp-app-wrapper {
          background-color: var(--erp-bg);
          color: var(--erp-text-main);
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          font-size: 0.85rem;
        }

        .erp-text-muted { color: var(--erp-text-muted) !important; }

        .erp-tabs {
          display: flex;
          gap: 20px;
        }
        .erp-tab {
          background: none;
          border: none;
          padding: 10px 16px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        .erp-tab:hover { color: var(--erp-primary); }
        .erp-tab.active {
          color: var(--erp-primary);
        }
        .erp-tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0; width: 100%; height: 3px;
          background-color: var(--erp-primary);
        }

        .erp-panel {
          background: var(--erp-surface);
          border: 1px solid var(--erp-border);
          border-radius: 4px;
        }
        .erp-panel-header {
          background-color: #f8f9fa;
          border-bottom: 1px solid var(--erp-border);
          padding: 12px 16px;
          font-weight: 600;
          color: #34495e;
          font-size: 0.9rem;
          text-transform: uppercase;
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
        }

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
          font-weight: 500;
          letter-spacing: 0.2px;
        }
        .erp-instruction-box {
          padding: 12px 16px;
          border-radius: 3px;
        }

        .erp-lot-row {
          display: flex; justify-content: space-between; align-items: center;
          background: white; border: 1px solid var(--erp-border);
          padding: 10px 16px; border-radius: 3px;
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
        }
        .erp-dialog-md { max-width: 500px; }
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
      `}</style>
    </div>
  );
}