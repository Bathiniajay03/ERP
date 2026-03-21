// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
// import api from '../services/apiClient';

// const SCAN_COOLDOWN_MS = 2000;

// export default function MobileScanner({
//   items = [],
//   warehouses = [],
//   inventory = [],
//   fetchData = () => {},
//   onScanDetected = () => {}
// }) {
//   const videoRef = useRef(null);
//   const codeReaderRef = useRef(null);
//   const lastScan = useRef({ barcode: '', timestamp: 0 });

//   const [cameraActive, setCameraActive] = useState(false);
//   const [cameraError, setCameraError] = useState('');
//   const [manualInput, setManualInput] = useState('');
//   const [status, setStatus] = useState({ type: '', text: '' });
//   const [currentItem, setCurrentItem] = useState(null);
//   const [detectedBarcode, setDetectedBarcode] = useState('');
//   const [lastScannedBarcode, setLastScannedBarcode] = useState('');
//   const [poMode, setPoMode] = useState(false);
//   const [poLoading, setPoLoading] = useState(false);
//   const [poList, setPoList] = useState([]);
//   const [selectedPoNumber, setSelectedPoNumber] = useState('');
//   const [currentPoLine, setCurrentPoLine] = useState(null);
//   const defaultWarehouseId = warehouses.length ? String(warehouses[0].id) : '';
//   const selectedPo = useMemo(
//     () => poList.find((po) => po.poNumber === selectedPoNumber) ?? null,
//     [poList, selectedPoNumber]
//   );
//   const [txForm, setTxForm] = useState({
//     itemId: '',
//     warehouseId: defaultWarehouseId,
//     lotId: '',
//     quantity: '',
//     lotNumber: '',
//     prefix: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [availableLots, setAvailableLots] = useState([]);
//   const [lotsLoading, setLotsLoading] = useState(false);

//   const showStatus = useCallback((type, text) => {
//     setStatus({ type, text });
//     setTimeout(() => setStatus({ type: '', text: '' }), 4000);
//   }, []);

//   const findBackCamera = useCallback(async () => {
//     if (!navigator?.mediaDevices?.enumerateDevices) return undefined;

//     try {
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const videoDevices = devices.filter((device) => device.kind === 'videoinput');
//       const backCamera = videoDevices.find((device) =>
//         /(back|rear|environment)/i.test(device.label || '')
//       );
//       return backCamera?.deviceId ?? videoDevices[0]?.deviceId;
//     } catch (error) {
//       console.error('Camera enumeration failed', error);
//       return undefined;
//     }
//   }, []);

//   const recordBarcodeScan = useCallback((barcode) => {
//     const previousBarcode = lastScannedBarcode;
//     setTxForm((prev) => {
//       const prevQty = parseInt(prev.quantity, 10) || 0;
//       const nextQty = barcode === previousBarcode ? prevQty + 1 : 1;
//       return { ...prev, quantity: String(nextQty) };
//     });
//     setLastScannedBarcode(barcode);
//   }, [lastScannedBarcode]);

//   const resetScanState = useCallback(() => {
//     setLastScannedBarcode('');
//     setDetectedBarcode('');
//     setCurrentItem(null);
//   }, []);

//   const scannerItemId = parseInt(txForm.itemId, 10);
//   const scannerWarehouseId = parseInt(txForm.warehouseId, 10);

//   const loadAvailableLots = useCallback(async () => {
//     if (!scannerItemId || !scannerWarehouseId) {
//       setAvailableLots([]);
//       return;
//     }
//     setLotsLoading(true);
//     try {
//       const res = await api.get('/stock/lots', {
//         params: { itemId: scannerItemId, warehouseId: scannerWarehouseId }
//       });
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
//   }, [scannerItemId, scannerWarehouseId]);

//   const generateAutoLotNumber = useCallback(() => {
//     const today = new Date();
//     const dateCode = today.toISOString().split("T")[0].replace(/-/g, "");
//     const suffix = Math.floor(Math.random() * 9000) + 1000;
//     return `LOT-${dateCode}-${suffix}`;
//   }, []);

//   const loadPendingPurchaseOrders = useCallback(async () => {
//     setPoLoading(true);
//     try {
//       const response = await api.get('/purchase-orders/pending');
//       const list = response.data || [];
//       setPoList(list);
//       const hasSelection = selectedPoNumber && list.some((po) => po.poNumber === selectedPoNumber);
//       if (!hasSelection) {
//         setSelectedPoNumber(list[0]?.poNumber ?? '');
//         setCurrentPoLine(null);
//       }
//     } catch (error) {
//       setPoList([]);
//       setSelectedPoNumber('');
//       setCurrentPoLine(null);
//     } finally {
//       setPoLoading(false);
//     }
//   }, [selectedPoNumber]);

//   useEffect(() => {
//     loadAvailableLots();
//     setTxForm((prev) => ({ ...prev, lotId: '' }));
//   }, [loadAvailableLots]);

//   useEffect(() => {
//     if (poMode) {
//       void loadPendingPurchaseOrders();
//     } else {
//       setPoList([]);
//       setSelectedPoNumber('');
//       setCurrentPoLine(null);
//     }
//   }, [poMode, loadPendingPurchaseOrders]);

//   useEffect(() => {
//     if (poMode && selectedPo && selectedPo.lines && selectedPo.lines.length > 0) {
//       setTxForm((prev) => ({
//         ...prev,
//         warehouseId: String(selectedPo.lines[0].warehouseId)
//       }));
//     }
//   }, [poMode, selectedPo]);

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
//       setDetectedBarcode(trimmed);
//       let allowScanRecording = true;
//       try {
//         const response = await api.get(`/items/barcode/${encodeURIComponent(trimmed)}`);
//         const payload = response.data;
//         const assignedWarehouseId = payload.inventory?.warehouseId ?? warehouses[0]?.id ?? '';
//         setCurrentItem({
//           itemId: payload.itemId,
//           itemCode: payload.itemCode,
//           description: payload.itemName
//         });
//         setTxForm((prev) => ({
//           ...prev,
//           itemId: String(payload.itemId),
//           warehouseId: prev.warehouseId || (assignedWarehouseId ? String(assignedWarehouseId) : '')
//         }));
//         if (poMode) {
//           if (!selectedPo) {
//             showStatus('warning', 'Select a PO before receiving stock.');
//             setCurrentPoLine(null);
//             allowScanRecording = false;
//           } else {
//             const match = selectedPo.lines.find((line) => line.itemId === payload.itemId);
//             if (!match) {
//               showStatus('error', `${payload.itemCode} is not part of ${selectedPo.poNumber}`);
//               setCurrentPoLine(null);
//               allowScanRecording = false;
//             } else {
//               setCurrentPoLine(match);
//               setTxForm((prev) => ({
//                 ...prev,
//                 warehouseId: String(match.warehouseId)
//               }));
//               showStatus('info', `PO ${selectedPo.poNumber} pending ${match.pendingQty}`);
//             }
//           }
//         }
//         onScanDetected({
//           itemId: payload.itemId,
//           warehouseId: assignedWarehouseId,
//           lotId: payload.inventory?.lotId ?? null,
//           lotNumber: payload.inventory?.lotNumber ?? ''
//         });
//         const statusType = payload.isNew ? 'info' : 'success';
//         const statusMessage = payload.isNew
//           ? `New item auto-created (${payload.itemCode})`
//           : `Scanned: ${payload.itemCode}`;
//         showStatus(statusType, statusMessage);
//         stopCamera();
//         fetchData();
//         if (allowScanRecording) {
//           recordBarcodeScan(trimmed);
//         }
//         return payload;
//       } catch (err) {
//         console.error('Barcode lookup failed', err);
//         const status = err?.response?.status;
//         if (status === 404) {
//           showStatus('error', 'Item not found for OUT');
//         } else {
//           showStatus('error', 'Failed to resolve barcode');
//         }
//         return null;
//       }
//     },
//     [fetchData, onScanDetected, showStatus, stopCamera, warehouses, recordBarcodeScan, poMode, selectedPo]
//   );

//   const handleDetectedCode = useCallback(async (code) => {
//     const trimmed = (code || '').trim();
//     if (!trimmed) return;
//     const now = Date.now();
//     if (
//       trimmed !== lastScan.current.barcode ||
//       now - lastScan.current.timestamp >= SCAN_COOLDOWN_MS
//     ) {
//       lastScan.current = { barcode: trimmed, timestamp: now };
//       await resolveBarcode(trimmed);
//     }
//   }, [resolveBarcode]);

//   useEffect(() => {
//     if (!txForm.warehouseId && warehouses.length > 0) {
//       setTxForm((prev) => ({ ...prev, warehouseId: String(warehouses[0].id) }));
//     }
//   }, [txForm.warehouseId, warehouses]);

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
//       if (codeReaderRef.current) {
//         codeReaderRef.current.reset();
//       } else {
//         codeReaderRef.current = new BrowserMultiFormatReader();
//       }

//       const deviceId = await findBackCamera();

//       codeReaderRef.current
//         .decodeFromVideoDevice(
//           deviceId ?? undefined,
//           videoRef.current,
//           (result, error) => {
//             if (result) {
//               handleDetectedCode(result.getText());
//             }
//             if (error && !(error instanceof NotFoundException)) {
//               console.error('Decode error', error);
//             }
//           }
//         )
//         .catch((err) => {
//           console.error('Camera error:', err);
//           setCameraError(`Camera unavailable: ${err.message}`);
//           setCameraActive(false);
//           showStatus('warning', 'Camera denied – using manual entry');
//         });

//       setCameraActive(true);
//       showStatus('success', 'Camera ready – point at a barcode');
//     } catch (err) {
//       console.error('Start camera failed', err);
//       setCameraError(`Camera unavailable: ${err.message}`);
//       setCameraActive(false);
//       showStatus('warning', 'Camera denied – use manual entry');
//     }
//   }, [handleDetectedCode, showStatus, findBackCamera]);

//   useEffect(() => {
//     void startCamera();
//     return stopCamera;
//   }, [startCamera, stopCamera]);

//   const handleStockIn = async () => {
//     if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity) {
//       return showStatus('error', 'Provide item, warehouse, and quantity');
//     }

//     const requestedQty = parseFloat(txForm.quantity);
//     if (poMode && currentPoLine && requestedQty > currentPoLine.pendingQty) {
//       return showStatus('error', 'Quantity exceeds PO pending amount');
//     }

//     setLoading(true);
//     try {
//       if (poMode) {
//         if (!selectedPo) {
//           showStatus('error', 'Select a PO before receiving stock.');
//           setLoading(false);
//           return;
//         }
//         if (!currentPoLine) {
//           showStatus('error', 'Scan the PO item first.');
//           setLoading(false);
//           return;
//         }

//         const lotInput = txForm.lotNumber?.trim();
//         const lotNumberForRequest = lotInput || generateAutoLotNumber();

//         const payload = {
//           poId: selectedPo.id,
//           itemId: parseInt(txForm.itemId, 10),
//           warehouseId: parseInt(txForm.warehouseId, 10),
//           quantity: requestedQty,
//           lotNumber: lotNumberForRequest,
//           scannerDeviceId: 'MOBILE-SCAN'
//         };
//         const response = await api.post('/purchase-orders/receive', payload);
//         showStatus('success', 'PO Item Received Successfully');
//         setCurrentPoLine(null);
//         setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotNumber: '', lotId: '' }));
//         resetScanState();
//         await loadPendingPurchaseOrders();
//         fetchData();
//         void loadAvailableLots();
//         void startCamera();
//         return;
//       }

//       const payload = {
//         itemId: parseInt(txForm.itemId, 10),
//         warehouseId: parseInt(txForm.warehouseId, 10),
//         quantity: requestedQty,
//         lotNumber: txForm.lotNumber?.trim() || null
//       };
//       const response = await api.post('/stock/in', payload);
//       const payloadMessage = response.data?.message || 'Stock IN recorded';
//       const statusType = response.data?.success ? 'success' : 'error';
//       showStatus(statusType, payloadMessage);
//       if (response.data?.success !== false) {
//         setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotNumber: '', lotId: '' }));
//         resetScanState();
//         fetchData();
//         void loadAvailableLots();
//         void startCamera();
//       }
//     } catch (err) {
//       console.error('Stock IN failed', err);
//       showStatus('error', err.response?.data?.message || err.response?.data || 'Stock IN failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStockOut = async () => {
//     if (!txForm.itemId || !txForm.warehouseId || !txForm.lotId || !txForm.quantity) {
//       return showStatus('error', 'Provide item, warehouse, lot, and quantity');
//     }
//     setLoading(true);
//     try {
//       const payload = {
//         itemId: parseInt(txForm.itemId, 10),
//         warehouseId: parseInt(txForm.warehouseId, 10),
//         lotId: parseInt(txForm.lotId, 10),
//         quantity: parseFloat(txForm.quantity)
//       };
//       const response = await api.post('/stock/out', payload);
//       const message = response.data?.message || 'Stock OUT recorded';
//       const statusType = response.data?.success ? 'success' : 'error';
//       showStatus(statusType, message);
//       if (response.data?.success !== false) {
//         setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotId: '' }));
//         resetScanState();
//         fetchData();
//         void loadAvailableLots();
//         void startCamera();
//       }
//     } catch (err) {
//       console.error('Stock OUT failed', err);
//       showStatus('error', err.response?.data?.message || err.response?.data || 'Stock OUT failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.cameraWrapper}>
//         <video ref={videoRef} style={styles.video} autoPlay muted playsInline />
//         <div style={styles.scanOverlay}>
//           <div style={styles.scanLine} />
//           <p style={styles.cameraHint}>{cameraActive ? 'Point camera at barcode' : 'Starting camera...'}</p>
//         </div>
//       </div>

//       {cameraError && <div style={styles.cameraError}>⚠️ {cameraError}</div>}

//       {status.text && (
//         <div style={statusStyle(status.type)}>
//           {status.text}
//         </div>
//       )}

//       <form onSubmit={handleManualSubmit} style={styles.manualForm}>
//         <input
//           type="text"
//           placeholder="Type barcode and press Enter"
//           value={manualInput}
//           onChange={(e) => setManualInput(e.target.value)}
//           style={styles.manualInput}
//         />
//         <button type="submit" style={styles.manualButton} disabled={!manualInput}>Lookup</button>
//       </form>

//       <div style={styles.modeSwitcher}>
//         <button
//           style={{
//             ...styles.modeButton,
//             ...(poMode ? {} : styles.modeButtonActive)
//           }}
//           type="button"
//           onClick={() => {
//             setPoMode(false);
//             setCurrentPoLine(null);
//           }}
//         >
//           Normal scan
//         </button>
//         <button
//           style={{
//             ...styles.modeButton,
//             ...(poMode ? styles.modeButtonActive : {})
//           }}
//           type="button"
//           onClick={() => setPoMode(true)}
//         >
//           PO receive mode
//         </button>
//       </div>

//       {poMode && (
//         <div style={styles.poPanel}>
//         <div style={styles.poHeader}>
//           <div style={{ flex: 1 }}>
//             <label style={styles.label}>Pending POs</label>
//             <select
//               style={{ ...styles.select, width: '100%' }}
//               value={selectedPoNumber}
//               onChange={(e) => {
//                 setSelectedPoNumber(e.target.value);
//                 setCurrentPoLine(null);
//               }}
//             >
//               <option value="">Select PO...</option>
//                 {poList.map((po) => (
//                   <option key={po.poNumber} value={po.poNumber}>
//                     {po.poNumber} · {po.totalPending.toFixed(0)} pending
//                   </option>
//                 ))}
//               </select>
//           </div>
//           <div>
//             {poLoading ? (
//               <span style={styles.smallText}>Loading...</span>
//             ) : (
//               <span style={styles.smallText}>{selectedPo ? selectedPo.supplierName : 'No PO selected'}</span>
//             )}
//           </div>
//         </div>
//         {selectedPo && (
//           <div style={styles.poWarehouse}>
//             <span>Warehouse</span>
//             <strong>
//               {currentPoLine?.warehouseName ||
//                 selectedPo.lines[0]?.warehouseName ||
//                 'N/A'}
//             </strong>
//           </div>
//         )}
//         {selectedPo ? (
//           <div style={styles.poLines}>
//               {selectedPo.lines.map((line) => (
//                 <div key={line.lineId} style={styles.poLineItem}>
//                   <div>
//                     <strong>{line.itemCode}</strong> <small className="text-muted">{line.itemName}</small>
//                   </div>
//                   <div style={styles.poQty}>
//                     <span>Pending {line.pendingQty.toFixed(0)}</span>
//                   </div>
//                 </div>
//               ))}
//               {currentPoLine && (
//                 <div style={styles.currentLineInfo}>
//                   <div><strong>Receiving:</strong> {currentPoLine.itemCode}</div>
//                   <div style={styles.currentLineStats}>
//                     <span>Ordered: {currentPoLine.orderedQty}</span>
//                     <span>Received: {currentPoLine.receivedQty}</span>
//                     <span>Pending: {currentPoLine.pendingQty}</span>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ) : (
//             <div style={styles.emptyLine}>No pending PO lines to show</div>
//           )}
//         </div>
//       )}

//       {currentItem && (
//         <div style={styles.itemCard}>
//           <p><strong>{currentItem.itemCode}</strong> · {currentItem.description}</p>
//           <p className="text-muted" style={{ fontSize: '0.9rem' }}>Detected barcode: {detectedBarcode}</p>
//         </div>
//       )}

//       <div style={styles.txGrid}>
//         <div>
//           <label style={styles.label}>Warehouse</label>
//           <select
//             value={txForm.warehouseId}
//             onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}
//             style={styles.select}
//             disabled={poMode}
//           >
//             <option value="">Select warehouse</option>
//             {warehouses.map((w) => (
//               <option key={w.id} value={w.id}>{w.name}</option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label style={styles.label}>Lot</label>
//           <select
//             value={txForm.lotId}
//             onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })}
//             style={styles.select}
//             disabled={lotsLoading}
//           >
//             <option value="">{lotsLoading ? 'Loading lots…' : 'Select lot'}</option>
//             {availableLots
//               .filter((lot) => lot.lotId !== null && lot.quantity > 0)
//               .map((lot) => (
//                 <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
//                   {lot.lotNumber || 'Unassigned'} (Qty: {lot.quantity})
//                 </option>
//               ))}
//           </select>
//         </div>
//         <div>
//           <label style={styles.label}>Quantity</label>
//           <input
//             type="number"
//             value={txForm.quantity}
//             onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
//             style={styles.input}
//           />
//         </div>
//         <div>
//           <label style={styles.label}>Lot Number (IN)</label>
//           <input
//             type="text"
//             value={txForm.lotNumber}
//             onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })}
//             style={styles.input}
//           />
//         </div>
//       </div>

//       <div style={styles.buttonRow}>
//         <button type="button" onClick={handleStockIn} disabled={loading} style={{ ...styles.actionBtn, backgroundColor: '#10b981' }}>
//           {loading ? 'Processing...' : 'Stock IN'}
//         </button>
//         <button type="button" onClick={handleStockOut} disabled={loading} style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}>
//           {loading ? 'Processing...' : 'Stock OUT'}
//         </button>
//       </div>
//     </div>
//   );
// }

// const statusStyle = (type) => {
//   const palette = {
//     success: { background: '#dcfce7', color: '#166534', border: '#166534' },
//     info: { background: '#e0f2fe', color: '#0369a1', border: '#0369a1' },
//     warning: { background: '#fef3c7', color: '#92400e', border: '#92400e' },
//     error: { background: '#fee2e2', color: '#991b1b', border: '#991b1b' }
//   };
//   const style = palette[type] || palette.error;
//   return {
//     margin: '12px 0',
//     padding: '10px',
//     borderRadius: '8px',
//     border: `1px solid ${style.border}`,
//     background: style.background,
//     color: style.color,
//     display: 'flex',
//     justifyContent: 'space-between'
//   };
// };

// const styles = {
//   container: {
//     padding: '16px',
//     background: '#f5f7fb',
//     minHeight: '100vh'
//   },
//   cameraWrapper: {
//     position: 'relative',
//     borderRadius: '12px',
//     overflow: 'hidden',
//     background: '#000',
//     minHeight: '240px',
//     marginBottom: '16px'
//   },
//   video: {
//     width: '100%',
//     height: '100%',
//     objectFit: 'cover'
//   },
//   scanOverlay: {
//     position: 'absolute',
//     inset: 0,
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     pointerEvents: 'none'
//   },
//   scanLine: {
//     width: '70%',
//     height: '3px',
//     background: '#10b981',
//     borderRadius: '999px',
//     boxShadow: '0 0 10px rgba(16,185,129,0.8)'
//   },
//   cameraHint: {
//     color: '#fff',
//     fontWeight: '600',
//     marginTop: '12px',
//     textShadow: '0 2px 8px rgba(0,0,0,0.6)'
//   },
//   cameraError: {
//     background: '#fee2e2',
//     color: '#991b1b',
//     padding: '10px',
//     borderRadius: '8px',
//     marginBottom: '12px'
//   },
//   manualForm: {
//     display: 'flex',
//     gap: '10px',
//     marginBottom: '16px'
//   },
//   manualInput: {
//     flex: 1,
//     padding: '10px 14px',
//     borderRadius: '8px',
//     border: '1px solid #cbd5e1'
//   },
//   manualButton: {
//     padding: '0 18px',
//     borderRadius: '8px',
//     border: 'none',
//     background: '#2563eb',
//     color: '#fff',
//     cursor: 'pointer'
//   },
//   itemCard: {
//     background: '#fff',
//     padding: '14px',
//     borderRadius: '10px',
//     marginBottom: '16px',
//     boxShadow: '0 8px 16px rgba(15,23,42,0.08)'
//   },
//   txGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
//     gap: '12px',
//     marginBottom: '16px'
//   },
//   label: {
//     display: 'block',
//     marginBottom: '4px',
//     fontSize: '0.85rem',
//     fontWeight: '600',
//     color: '#0f172a'
//   },
//   select: {
//     width: '100%',
//     padding: '10px',
//     borderRadius: '8px',
//     border: '1px solid #cbd5e1'
//   },
//   input: {
//     width: '100%',
//     padding: '10px',
//     borderRadius: '8px',
//     border: '1px solid #cbd5e1'
//   },
//   buttonRow: {
//     display: 'flex',
//     gap: '10px',
//     flexWrap: 'wrap'
//   },
//   actionBtn: {
//     flex: 1,
//     padding: '12px',
//     border: 'none',
//     borderRadius: '10px',
//     color: '#fff',
//     fontWeight: '600',
//     cursor: 'pointer'
//   },
//   modeSwitcher: {
//     display: 'flex',
//     gap: '8px',
//     marginBottom: '16px'
//   },
//   modeButton: {
//     flex: 1,
//     padding: '10px',
//     borderRadius: '10px',
//     border: '1px solid #cbd5e1',
//     background: '#fff',
//     color: '#0f172a',
//     fontWeight: '600',
//     cursor: 'pointer'
//   },
//   modeButtonActive: {
//     background: '#0f172a',
//     color: '#fff',
//     borderColor: '#0f172a'
//   },
//   poPanel: {
//     border: '1px solid #e2e8f0',
//     borderRadius: '12px',
//     padding: '12px',
//     marginBottom: '16px',
//     background: '#fff',
//     boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)'
//   },
//   poHeader: {
//     display: 'flex',
//     gap: '12px',
//     alignItems: 'flex-end',
//     marginBottom: '12px'
//   },
//   poLines: {
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '6px'
//   },
//   poLineItem: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     padding: '8px 0',
//     borderBottom: '1px solid #f1f5f9'
//   },
//   poQty: {
//     color: '#0f172a',
//     fontWeight: '600'
//   },
//   currentLineInfo: {
//     marginTop: '10px',
//     padding: '8px',
//     borderRadius: '10px',
//     background: '#f8fafc',
//     border: '1px dashed #cbd5e1'
//   },
//   currentLineStats: {
//     display: 'flex',
//     gap: '12px',
//     fontSize: '0.85rem',
//     color: '#475569',
//     marginTop: '6px'
//   },
//   emptyLine: {
//     padding: '10px',
//     borderRadius: '8px',
//     background: '#fefce8',
//     color: '#92400e'
//   },
//   smallText: {
//     fontSize: '0.75rem',
//     color: '#475569'
//   }
//   ,
//   poWarehouse: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: '8px',
//     background: '#f1f5f9',
//     borderRadius: '10px',
//     marginBottom: '10px'
//   }
// };



// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
// import api from '../services/apiClient';

// const SCAN_COOLDOWN_MS = 2000;

// export default function MobileScanner({
//   items = [],
//   warehouses = [],
//   inventory = [],
//   fetchData = () => {},
//   onScanDetected = () => {}
// }) {
//   const videoRef = useRef(null);
//   const codeReaderRef = useRef(null);
//   const lastScan = useRef({ barcode: '', timestamp: 0 });

//   const [cameraActive, setCameraActive] = useState(false);
//   const [cameraError, setCameraError] = useState('');
//   const [manualInput, setManualInput] = useState('');
//   const [status, setStatus] = useState({ type: '', text: '' });
//   const [currentItem, setCurrentItem] = useState(null);
//   const [detectedBarcode, setDetectedBarcode] = useState('');
//   const [lastScannedBarcode, setLastScannedBarcode] = useState('');
//   const [poMode, setPoMode] = useState(false);
//   const [poLoading, setPoLoading] = useState(false);
//   const [poList, setPoList] = useState([]);
//   const [selectedPoNumber, setSelectedPoNumber] = useState('');
//   const [currentPoLine, setCurrentPoLine] = useState(null);
//   const defaultWarehouseId = warehouses.length ? String(warehouses[0].id) : '';
  
//   const selectedPo = useMemo(
//     () => poList.find((po) => po.poNumber === selectedPoNumber) ?? null,
//     [poList, selectedPoNumber]
//   );
  
//   const [txForm, setTxForm] = useState({
//     itemId: '',
//     warehouseId: defaultWarehouseId,
//     lotId: '',
//     quantity: '',
//     lotNumber: '',
//     prefix: ''
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [availableLots, setAvailableLots] = useState([]);
//   const [lotsLoading, setLotsLoading] = useState(false);

//   const showStatus = useCallback((type, text) => {
//     setStatus({ type, text });
//     setTimeout(() => setStatus({ type: '', text: '' }), 4000);
//   }, []);

//   const findBackCamera = useCallback(async () => {
//     if (!navigator?.mediaDevices?.enumerateDevices) return undefined;

//     try {
//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const videoDevices = devices.filter((device) => device.kind === 'videoinput');
//       const backCamera = videoDevices.find((device) =>
//         /(back|rear|environment)/i.test(device.label || '')
//       );
//       return backCamera?.deviceId ?? videoDevices[0]?.deviceId;
//     } catch (error) {
//       console.error('Camera enumeration failed', error);
//       return undefined;
//     }
//   }, []);

//   const recordBarcodeScan = useCallback((barcode) => {
//     const previousBarcode = lastScannedBarcode;
//     setTxForm((prev) => {
//       const prevQty = parseInt(prev.quantity, 10) || 0;
//       const nextQty = barcode === previousBarcode ? prevQty + 1 : 1;
//       return { ...prev, quantity: String(nextQty) };
//     });
//     setLastScannedBarcode(barcode);
//   }, [lastScannedBarcode]);

//   const resetScanState = useCallback(() => {
//     setLastScannedBarcode('');
//     setDetectedBarcode('');
//     setCurrentItem(null);
//   }, []);

//   const scannerItemId = parseInt(txForm.itemId, 10);
//   const scannerWarehouseId = parseInt(txForm.warehouseId, 10);

//   const loadAvailableLots = useCallback(async () => {
//     if (!scannerItemId || !scannerWarehouseId) {
//       setAvailableLots([]);
//       return;
//     }
//     setLotsLoading(true);
//     try {
//       const res = await api.get('/stock/lots', {
//         params: { itemId: scannerItemId, warehouseId: scannerWarehouseId }
//       });
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
//   }, [scannerItemId, scannerWarehouseId]);

//   const generateAutoLotNumber = useCallback(() => {
//     const today = new Date();
//     const dateCode = today.toISOString().split("T")[0].replace(/-/g, "");
//     const suffix = Math.floor(Math.random() * 9000) + 1000;
//     return `LOT-${dateCode}-${suffix}`;
//   }, []);

//   const loadPendingPurchaseOrders = useCallback(async () => {
//     setPoLoading(true);
//     try {
//       const response = await api.get('/purchase-orders/pending');
//       const list = response.data || [];
//       setPoList(list);
//       const hasSelection = selectedPoNumber && list.some((po) => po.poNumber === selectedPoNumber);
//       if (!hasSelection) {
//         setSelectedPoNumber(list[0]?.poNumber ?? '');
//         setCurrentPoLine(null);
//       }
//     } catch (error) {
//       setPoList([]);
//       setSelectedPoNumber('');
//       setCurrentPoLine(null);
//     } finally {
//       setPoLoading(false);
//     }
//   }, [selectedPoNumber]);

//   useEffect(() => {
//     loadAvailableLots();
//     setTxForm((prev) => ({ ...prev, lotId: '' }));
//   }, [loadAvailableLots]);

//   useEffect(() => {
//     if (poMode) {
//       void loadPendingPurchaseOrders();
//     } else {
//       setPoList([]);
//       setSelectedPoNumber('');
//       setCurrentPoLine(null);
//     }
//   }, [poMode, loadPendingPurchaseOrders]);

//   useEffect(() => {
//     if (poMode && selectedPo && selectedPo.lines && selectedPo.lines.length > 0) {
//       setTxForm((prev) => ({
//         ...prev,
//         warehouseId: String(selectedPo.lines[0].warehouseId)
//       }));
//     }
//   }, [poMode, selectedPo]);

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
//       setDetectedBarcode(trimmed);
//       let allowScanRecording = true;
//       try {
//         const response = await api.get(`/items/barcode/${encodeURIComponent(trimmed)}`);
//         const payload = response.data;
//         const assignedWarehouseId = payload.inventory?.warehouseId ?? warehouses[0]?.id ?? '';
//         setCurrentItem({
//           itemId: payload.itemId,
//           itemCode: payload.itemCode,
//           description: payload.itemName
//         });
//         setTxForm((prev) => ({
//           ...prev,
//           itemId: String(payload.itemId),
//           warehouseId: prev.warehouseId || (assignedWarehouseId ? String(assignedWarehouseId) : '')
//         }));
//         if (poMode) {
//           if (!selectedPo) {
//             showStatus('warning', 'Select a PO before receiving stock.');
//             setCurrentPoLine(null);
//             allowScanRecording = false;
//           } else {
//             const match = selectedPo.lines.find((line) => line.itemId === payload.itemId);
//             if (!match) {
//               showStatus('error', `${payload.itemCode} is not part of ${selectedPo.poNumber}`);
//               setCurrentPoLine(null);
//               allowScanRecording = false;
//             } else {
//               setCurrentPoLine(match);
//               setTxForm((prev) => ({
//                 ...prev,
//                 warehouseId: String(match.warehouseId)
//               }));
//               showStatus('info', `PO ${selectedPo.poNumber} pending ${match.pendingQty}`);
//             }
//           }
//         }
//         onScanDetected({
//           itemId: payload.itemId,
//           warehouseId: assignedWarehouseId,
//           lotId: payload.inventory?.lotId ?? null,
//           lotNumber: payload.inventory?.lotNumber ?? ''
//         });
//         const statusType = payload.isNew ? 'info' : 'success';
//         const statusMessage = payload.isNew
//           ? `New item auto-created (${payload.itemCode})`
//           : `Scanned: ${payload.itemCode}`;
//         showStatus(statusType, statusMessage);
//         stopCamera();
//         fetchData();
//         if (allowScanRecording) {
//           recordBarcodeScan(trimmed);
//         }
//         return payload;
//       } catch (err) {
//         console.error('Barcode lookup failed', err);
//         const status = err?.response?.status;
//         if (status === 404) {
//           showStatus('error', 'Item not found for OUT');
//         } else {
//           showStatus('error', 'Failed to resolve barcode');
//         }
//         return null;
//       }
//     },
//     [fetchData, onScanDetected, showStatus, stopCamera, warehouses, recordBarcodeScan, poMode, selectedPo]
//   );

//   const handleDetectedCode = useCallback(async (code) => {
//     const trimmed = (code || '').trim();
//     if (!trimmed) return;
//     const now = Date.now();
//     if (
//       trimmed !== lastScan.current.barcode ||
//       now - lastScan.current.timestamp >= SCAN_COOLDOWN_MS
//     ) {
//       lastScan.current = { barcode: trimmed, timestamp: now };
//       await resolveBarcode(trimmed);
//     }
//   }, [resolveBarcode]);

//   useEffect(() => {
//     if (!txForm.warehouseId && warehouses.length > 0) {
//       setTxForm((prev) => ({ ...prev, warehouseId: String(warehouses[0].id) }));
//     }
//   }, [txForm.warehouseId, warehouses]);

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
//       if (codeReaderRef.current) {
//         codeReaderRef.current.reset();
//       } else {
//         codeReaderRef.current = new BrowserMultiFormatReader();
//       }

//       const deviceId = await findBackCamera();

//       codeReaderRef.current
//         .decodeFromVideoDevice(
//           deviceId ?? undefined,
//           videoRef.current,
//           (result, error) => {
//             if (result) {
//               handleDetectedCode(result.getText());
//             }
//             if (error && !(error instanceof NotFoundException)) {
//               console.error('Decode error', error);
//             }
//           }
//         )
//         .catch((err) => {
//           console.error('Camera error:', err);
//           setCameraError(`Camera unavailable: ${err.message}`);
//           setCameraActive(false);
//           showStatus('warning', 'Camera denied – using manual entry');
//         });

//       setCameraActive(true);
//       showStatus('success', 'Camera ready – point at a barcode');
//     } catch (err) {
//       console.error('Start camera failed', err);
//       setCameraError(`Camera unavailable: ${err.message}`);
//       setCameraActive(false);
//       showStatus('warning', 'Camera denied – use manual entry');
//     }
//   }, [handleDetectedCode, showStatus, findBackCamera]);

//   useEffect(() => {
//     void startCamera();
//     return stopCamera;
//   }, [startCamera, stopCamera]);

//   const handleStockIn = async () => {
//     if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity) {
//       return showStatus('error', 'Provide item, warehouse, and quantity');
//     }

//     const requestedQty = parseFloat(txForm.quantity);
//     if (poMode && currentPoLine && requestedQty > currentPoLine.pendingQty) {
//       return showStatus('error', 'Quantity exceeds PO pending amount');
//     }

//     setLoading(true);
//     try {
//       if (poMode) {
//         if (!selectedPo) {
//           showStatus('error', 'Select a PO before receiving stock.');
//           setLoading(false);
//           return;
//         }
//         if (!currentPoLine) {
//           showStatus('error', 'Scan the PO item first.');
//           setLoading(false);
//           return;
//         }

//         const lotInput = txForm.lotNumber?.trim();
//         const lotNumberForRequest = lotInput || generateAutoLotNumber();

//         const payload = {
//           poId: selectedPo.id,
//           itemId: parseInt(txForm.itemId, 10),
//           warehouseId: parseInt(txForm.warehouseId, 10),
//           quantity: requestedQty,
//           lotNumber: lotNumberForRequest,
//           scannerDeviceId: 'MOBILE-SCAN'
//         };
//         await api.post('/purchase-orders/receive', payload);
//         showStatus('success', 'PO Item Received Successfully');
//         setCurrentPoLine(null);
//         setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotNumber: '', lotId: '' }));
//         resetScanState();
//         await loadPendingPurchaseOrders();
//         fetchData();
//         void loadAvailableLots();
//         void startCamera();
//         return;
//       }

//       const payload = {
//         itemId: parseInt(txForm.itemId, 10),
//         warehouseId: parseInt(txForm.warehouseId, 10),
//         quantity: requestedQty,
//         lotNumber: txForm.lotNumber?.trim() || null
//       };
//       const response = await api.post('/stock/in', payload);
//       const payloadMessage = response.data?.message || 'Stock IN recorded';
//       const statusType = response.data?.success ? 'success' : 'error';
//       showStatus(statusType, payloadMessage);
      
//       if (response.data?.success !== false) {
//         setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotNumber: '', lotId: '' }));
//         resetScanState();
//         fetchData();
//         void loadAvailableLots();
//         void startCamera();
//       }
//     } catch (err) {
//       console.error('Stock IN failed', err);
//       showStatus('error', err.response?.data?.message || err.response?.data || 'Stock IN failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStockOut = async () => {
//     if (!txForm.itemId || !txForm.warehouseId || !txForm.lotId || !txForm.quantity) {
//       return showStatus('error', 'Provide item, warehouse, lot, and quantity');
//     }
//     setLoading(true);
//     try {
//       const payload = {
//         itemId: parseInt(txForm.itemId, 10),
//         warehouseId: parseInt(txForm.warehouseId, 10),
//         lotId: parseInt(txForm.lotId, 10),
//         quantity: parseFloat(txForm.quantity)
//       };
//       const response = await api.post('/stock/out', payload);
//       const message = response.data?.message || 'Stock OUT recorded';
//       const statusType = response.data?.success ? 'success' : 'error';
//       showStatus(statusType, message);
      
//       if (response.data?.success !== false) {
//         setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotId: '' }));
//         resetScanState();
//         fetchData();
//         void loadAvailableLots();
//         void startCamera();
//       }
//     } catch (err) {
//       console.error('Stock OUT failed', err);
//       showStatus('error', err.response?.data?.message || err.response?.data || 'Stock OUT failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Helper to style status messages
//   const getAlertClass = (type) => {
//     if (type === 'success') return 'alert-success border-success text-success';
//     if (type === 'error') return 'alert-danger border-danger text-danger';
//     if (type === 'warning') return 'alert-warning border-warning text-warning';
//     return 'alert-info border-info text-info';
//   };

//   return (
//     <div className="bg-white p-3 p-md-4 h-100 d-flex flex-column">
      
//       {/* MODE SWITCHER */}
//       <div className="btn-group w-100 mb-3 shadow-sm">
//         <button 
//           className={`btn erp-btn fw-bold ${!poMode ? 'btn-dark' : 'btn-outline-dark bg-white'}`}
//           onClick={() => { setPoMode(false); setCurrentPoLine(null); }}
//         >
//           Normal Scanner
//         </button>
//         <button 
//           className={`btn erp-btn fw-bold ${poMode ? 'btn-dark' : 'btn-outline-dark bg-white'}`}
//           onClick={() => setPoMode(true)}
//         >
//           PO Receive Mode
//         </button>
//       </div>

//       {/* PO CONTEXT PANEL */}
//       {poMode && (
//         <div className="p-3 mb-3 bg-light border rounded">
//           <div className="d-flex justify-content-between align-items-center mb-2">
//             <label className="erp-label m-0">Pending Purchase Orders</label>
//             {poLoading && <div className="spinner-border spinner-border-sm text-primary"></div>}
//           </div>
//           <select
//             className="form-select erp-input font-monospace mb-2"
//             value={selectedPoNumber}
//             onChange={(e) => {
//               setSelectedPoNumber(e.target.value);
//               setCurrentPoLine(null);
//             }}
//           >
//             <option value="">-- Select Target PO --</option>
//             {poList.map((po) => (
//               <option key={po.poNumber} value={po.poNumber}>
//                 {po.poNumber} ({po.totalPending.toFixed(0)} units pending)
//               </option>
//             ))}
//           </select>
          
//           <div className="d-flex justify-content-between align-items-center bg-white p-2 border rounded small">
//             <span className="text-muted fw-bold">Supplier:</span>
//             <span className="fw-semibold text-dark">{selectedPo ? selectedPo.supplierName : 'N/A'}</span>
//           </div>
          
//           {selectedPo && selectedPo.lines && selectedPo.lines.length > 0 ? (
//              <div className="mt-3 border-top pt-2">
//                <h6 className="erp-meta-label">PO Line Items</h6>
//                <div className="d-flex flex-column gap-1">
//                  {selectedPo.lines.map((line) => (
//                    <div key={line.lineId} className="d-flex justify-content-between align-items-center bg-white p-2 border rounded">
//                      <span className="fw-bold font-monospace">{line.itemCode}</span>
//                      <span className="badge bg-warning text-dark">Pend: {line.pendingQty}</span>
//                    </div>
//                  ))}
//                </div>
//              </div>
//           ) : (
//             selectedPo && <div className="mt-2 text-danger small fw-bold">No pending lines found for this PO.</div>
//           )}
//         </div>
//       )}

//       {/* CAMERA VIEWFINDER */}
//       <div className="position-relative bg-dark rounded-3 overflow-hidden shadow-sm mb-3" style={{ minHeight: '220px' }}>
//         <video ref={videoRef} className="w-100 h-100 object-fit-cover" autoPlay muted playsInline />
        
//         {/* Scanner Overlay */}
//         <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ pointerEvents: 'none' }}>
//           <div className="scanner-laser" style={{ width: '70%', height: '2px', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
//           <div className="text-white fw-bold mt-3 px-3 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)', fontSize: '0.8rem' }}>
//             {cameraActive ? 'Point camera at barcode' : 'Initializing camera...'}
//           </div>
//         </div>
//       </div>

//       {cameraError && <div className="alert alert-danger py-2 small fw-bold">⚠️ {cameraError}</div>}

//       {/* MANUAL INPUT */}
//       <form onSubmit={handleManualSubmit} className="d-flex gap-2 mb-3">
//         <input
//           type="text"
//           className="form-control erp-input font-monospace"
//           placeholder="Manual barcode entry..."
//           value={manualInput}
//           onChange={(e) => setManualInput(e.target.value)}
//         />
//         <button type="submit" className="btn btn-primary erp-btn px-4" disabled={!manualInput}>Lookup</button>
//       </form>

//       {/* STATUS MESSAGES */}
//       {status.text && (
//         <div className={`alert erp-alert py-2 fw-bold ${getAlertClass(status.type)}`}>
//           {status.text}
//         </div>
//       )}

//       {/* DETECTED ITEM INFO */}
//       {currentItem && (
//         <div className="alert alert-success d-flex flex-column mb-3 py-2 border-success">
//           <div className="d-flex justify-content-between align-items-center">
//              <span className="fw-bold font-monospace fs-5">{currentItem.itemCode}</span>
//              <span className="badge bg-success">Detected</span>
//           </div>
//           <span className="small text-dark mt-1">{currentItem.description}</span>
//           {currentPoLine && (
//             <div className="mt-2 pt-2 border-top border-success d-flex justify-content-between small fw-bold">
//               <span>PO Target Matched</span>
//               <span>Pending: {currentPoLine.pendingQty}</span>
//             </div>
//           )}
//         </div>
//       )}

//       {/* TRANSACTION FORM */}
//       <div className="row g-2 mb-3 flex-grow-1">
//         <div className="col-6">
//           <label className="erp-label">Warehouse</label>
//           <select className="form-select erp-input" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })} disabled={poMode}>
//             <option value="">-- Select --</option>
//             {warehouses.map((w) => (
//               <option key={w.id} value={w.id}>{w.name}</option>
//             ))}
//           </select>
//         </div>
//         <div className="col-6">
//           <label className="erp-label">Lot (For OUT)</label>
//           <select className="form-select erp-input" value={txForm.lotId} onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })} disabled={lotsLoading}>
//             <option value="">{lotsLoading ? 'Loading...' : '-- Select --'}</option>
//             {availableLots.filter((lot) => lot.lotId !== null && lot.quantity > 0).map((lot) => (
//               <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
//                 {lot.lotNumber || 'General'} (Qty: {lot.quantity})
//               </option>
//             ))}
//           </select>
//         </div>
//         <div className="col-6">
//           <label className="erp-label">Lot Number (For IN)</label>
//           <input type="text" className="form-control erp-input font-monospace" placeholder="Auto-generated if empty" value={txForm.lotNumber} onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })} />
//         </div>
//         <div className="col-6">
//           <label className="erp-label">Quantity</label>
//           <input type="number" className="form-control erp-input font-monospace fw-bold text-primary" placeholder="0" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} min="1" />
//         </div>
//       </div>

//       {/* ACTION BUTTONS */}
//       <div className="d-flex gap-2 mt-auto pt-3 border-top">
//         <button type="button" className="btn btn-success erp-btn w-100 fw-bold py-2" onClick={handleStockIn} disabled={loading}>
//           {loading ? 'Processing...' : '📥 RECEIVE (IN)'}
//         </button>
//         <button type="button" className="btn btn-danger erp-btn w-100 fw-bold py-2" onClick={handleStockOut} disabled={loading || poMode}>
//           {loading ? 'Processing...' : '📤 DISPATCH (OUT)'}
//         </button>
//       </div>

//       <style>{`
//         /* Scanner Specific Animations & Adjustments */
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
//       `}</style>
//     </div>
//   );
// }


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import api from '../services/apiClient';

const SCAN_COOLDOWN_MS = 2000;

export default function MobileScanner({
  items = [],
  warehouses = [],
  inventory = [],
  fetchData = () => {},
  onScanDetected = () => {}
}) {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const lastScan = useRef({ barcode: '', timestamp: 0 });

  // Camera & Global States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [currentItem, setCurrentItem] = useState(null);
  const [detectedBarcode, setDetectedBarcode] = useState('');
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Transaction Protocol States
  const [txMode, setTxMode] = useState('in'); // 'in', 'out', 'transfer', 'po'
  const [txForm, setTxForm] = useState({
    itemId: '',
    warehouseId: '',
    destWarehouseId: '',
    lotId: '',
    quantity: '',
    lotNumber: ''
  });

  // PO Specific States
  const [poLoading, setPoLoading] = useState(false);
  const [poList, setPoList] = useState([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [currentPoLine, setCurrentPoLine] = useState(null);
  const selectedPo = useMemo(
    () => poList.find((po) => po.poNumber === selectedPoNumber) ?? null,
    [poList, selectedPoNumber]
  );

  // Lot Specific States
  const [availableLots, setAvailableLots] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);

  // Serial Generation Modal States
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialGenerationForm, setSerialGenerationForm] = useState({
    itemId: '',
    quantity: 0,
    generatedSerials: []
  });

  const showStatus = useCallback((type, text) => {
    setStatus({ type, text });
    setTimeout(() => setStatus({ type: '', text: '' }), 4000);
  }, []);

  const findBackCamera = useCallback(async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return undefined;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      const backCamera = videoDevices.find((device) =>
        /(back|rear|environment)/i.test(device.label || '')
      );
      return backCamera?.deviceId ?? videoDevices[0]?.deviceId;
    } catch (error) {
      console.error('Camera enumeration failed', error);
      return undefined;
    }
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

  const resetScanState = useCallback(() => {
    setLastScannedBarcode('');
    setDetectedBarcode('');
    setCurrentItem(null);
    setCurrentPoLine(null);
    setTxForm(prev => ({...prev, itemId: '', quantity: '', lotNumber: '', lotId: '', warehouseId: ''}));
    setAvailableLots([]);
  }, []);

  const scannerItemId = parseInt(txForm.itemId, 10);
  const scannerWarehouseId = parseInt(txForm.warehouseId, 10);

  const loadAvailableLots = useCallback(async () => {
    if (!scannerItemId || !scannerWarehouseId) {
      setAvailableLots([]);
      return;
    }
    setLotsLoading(true);
    try {
      const res = await api.get('/stock/lots', {
        params: { itemId: scannerItemId, warehouseId: scannerWarehouseId }
      });
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
  }, [scannerItemId, scannerWarehouseId]);

  // Auto-select lot when lots are loaded for OUT or TRANSFER
  useEffect(() => {
    if (availableLots.length > 0 && (txMode === 'out' || txMode === 'transfer')) {
      const validLot = availableLots.find(l => l.quantity > 0);
      if (validLot && !txForm.lotId) {
        setTxForm(prev => ({ ...prev, lotId: String(validLot.lotId) }));
      }
    }
  }, [availableLots, txMode, txForm.lotId]);

  useEffect(() => {
    loadAvailableLots();
  }, [loadAvailableLots]);

  const loadPendingPurchaseOrders = useCallback(async () => {
    setPoLoading(true);
    try {
      const response = await api.get('/purchase-orders/pending');
      const list = response.data || [];
      setPoList(list);
      const hasSelection = selectedPoNumber && list.some((po) => po.poNumber === selectedPoNumber);
      if (!hasSelection) {
        setSelectedPoNumber(list[0]?.poNumber ?? '');
      }
    } catch (error) {
      setPoList([]);
      setSelectedPoNumber('');
    } finally {
      setPoLoading(false);
    }
  }, [selectedPoNumber]);

  // Load POs if we switch to PO mode
  useEffect(() => {
    if (txMode === 'po') {
      void loadPendingPurchaseOrders();
    }
  }, [txMode, loadPendingPurchaseOrders]);

  const stopCamera = useCallback(() => {
    try {
      codeReaderRef.current?.reset();
    } catch (error) {
      console.error('Camera cleanup failed', error);
    }
    setCameraActive(false);
  }, []);

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
        
        // Auto-detect Warehouse from inventory payload, fallback to first available
        const autoWarehouseId = payload.inventory?.warehouseId ?? warehouses[0]?.id ?? '';
        
        setCurrentItem({
          itemId: payload.itemId,
          itemCode: payload.itemCode,
          description: payload.itemName,
          serialPrefix: payload.serialPrefix
        });
        
        setTxForm((prev) => ({
          ...prev,
          itemId: String(payload.itemId),
          warehouseId: String(autoWarehouseId),
          lotId: payload.inventory?.lotId ? String(payload.inventory.lotId) : prev.lotId
        }));

        // Handle PO Mode Specific Validations
        if (txMode === 'po') {
          if (!selectedPo) {
            showStatus('warning', 'Select a PO before scanning items.');
            allowScanRecording = false;
          } else {
            const match = selectedPo.lines.find((line) => line.itemId === payload.itemId);
            if (!match) {
              showStatus('error', `${payload.itemCode} is not part of PO ${selectedPo.poNumber}`);
              allowScanRecording = false;
            } else {
              setCurrentPoLine(match);
              setTxForm((prev) => ({ ...prev, warehouseId: String(match.warehouseId) }));
              showStatus('info', `PO Matched: Pending ${match.pendingQty}`);
            }
          }
        } else {
          const statusType = payload.isNew ? 'info' : 'success';
          const statusMessage = payload.isNew 
            ? `New item created (${payload.itemCode})` 
            : `Detected: ${payload.itemCode} at Location`;
          showStatus(statusType, statusMessage);
        }
        
        onScanDetected({
          itemId: payload.itemId,
          warehouseId: autoWarehouseId,
          lotId: payload.inventory?.lotId ?? null,
          lotNumber: payload.inventory?.lotNumber ?? ''
        });
        
        stopCamera();
        fetchData();
        
        if (allowScanRecording) {
          recordBarcodeScan(trimmed);
        }
        return payload;
      } catch (err) {
        console.error('Barcode lookup failed', err);
        showStatus('error', err?.response?.status === 404 ? 'Item not found in catalog' : 'Failed to resolve barcode');
        return null;
      }
    },
    [onScanDetected, showStatus, warehouses, recordBarcodeScan, txMode, selectedPo, stopCamera, fetchData]
  );

  const handleDetectedCode = useCallback(async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    const now = Date.now();
    if (
      trimmed !== lastScan.current.barcode ||
      now - lastScan.current.timestamp >= SCAN_COOLDOWN_MS
    ) {
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
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      } else {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      const deviceId = await findBackCamera();

      codeReaderRef.current
        .decodeFromVideoDevice(
          deviceId ?? undefined,
          videoRef.current,
          (result, error) => {
            if (result) handleDetectedCode(result.getText());
            if (error && !(error instanceof NotFoundException)) {
              console.error('Decode error', error);
            }
          }
        )
        .catch((err) => {
          console.error('Camera error:', err);
          setCameraError(`Camera unavailable: ${err.message}`);
          setCameraActive(false);
          showStatus('warning', 'Camera denied – using manual entry');
        });

      setCameraActive(true);
      showStatus('success', 'Camera ready – point at a barcode');
    } catch (err) {
      console.error('Start camera failed', err);
      setCameraError(`Camera unavailable: ${err.message}`);
      setCameraActive(false);
      showStatus('warning', 'Camera denied – use manual entry');
    }
  }, [handleDetectedCode, showStatus, findBackCamera]);

  useEffect(() => {
    void startCamera();
    return stopCamera;
  }, [startCamera, stopCamera]);

  // --- TRANSACTION LOGIC ---
  const handleStockTransaction = async (e) => {
    e?.preventDefault();
    if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity) {
      return showStatus('error', 'Provide valid item, warehouse, and quantity');
    }

    const requestedQty = parseFloat(txForm.quantity);

    setLoading(true);
    try {
      let endpoint = '';
      let payload = {
        itemId: parseInt(txForm.itemId, 10),
        warehouseId: parseInt(txForm.warehouseId, 10),
        quantity: requestedQty,
      };

      if (txMode === 'po') {
        if (!selectedPo || !currentPoLine) return showStatus('error', 'Valid PO and PO Line required');
        if (requestedQty > currentPoLine.pendingQty) return showStatus('error', 'Quantity exceeds PO pending amount');
        
        endpoint = '/purchase-orders/receive';
        payload.poId = selectedPo.id;
        payload.lotNumber = txForm.lotNumber?.trim() || `LOT-${Date.now().toString().slice(-6)}`;
        payload.scannerDeviceId = 'MOBILE-SCAN';
      } 
      else if (txMode === 'in') {
        endpoint = '/stock/in';
        payload.lotNumber = txForm.lotNumber?.trim() || null;
        if (serialGenerationForm.generatedSerials.length > 0) {
          payload.serialNumbers = serialGenerationForm.generatedSerials.map(s => s.serialNumber);
        }
      } 
      else if (txMode === 'out') {
        if (!txForm.lotId) return showStatus('error', 'Source lot required for dispatch');
        endpoint = '/stock/out';
        payload.lotId = parseInt(txForm.lotId, 10);
      } 
      else if (txMode === 'transfer') {
        if (!txForm.lotId || !txForm.destWarehouseId) return showStatus('error', 'Lot and Dest Warehouse required');
        endpoint = '/stock/transfer';
        payload.lotId = parseInt(txForm.lotId, 10);
        payload.destinationWarehouseId = parseInt(txForm.destWarehouseId, 10);
      }

      const response = await api.post(endpoint, payload);
      const message = response.data?.message || `Stock ${txMode.toUpperCase()} recorded`;
      showStatus('success', message);
      
      // Cleanup after success
      resetScanState();
      setSerialGenerationForm({ itemId: '', quantity: 0, generatedSerials: [] });
      setShowSerialModal(false);
      fetchData();
      if (txMode === 'po') void loadPendingPurchaseOrders();
      void startCamera();
      
    } catch (err) {
      console.error(`Stock ${txMode} failed`, err);
      showStatus('error', err.response?.data?.message || err.response?.data || `Stock ${txMode.toUpperCase()} failed`);
    } finally {
      setLoading(false);
    }
  };

  const openSerialGenerationModal = () => {
    if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity || parseFloat(txForm.quantity) <= 0) {
      return showStatus('error', 'Scan item and enter valid quantity first');
    }
    setSerialGenerationForm({
      itemId: txForm.itemId,
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
      
      {/* CAMERA VIEWFINDER */}
      <div className="position-relative bg-dark rounded-3 overflow-hidden shadow-sm mb-3" style={{ minHeight: '220px' }}>
        <video ref={videoRef} className="w-100 h-100 object-fit-cover" autoPlay muted playsInline />
        
        {/* Scanner Overlay */}
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" style={{ pointerEvents: 'none' }}>
          <div className="scanner-laser" style={{ width: '70%', height: '2px', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
          <div className="text-white fw-bold mt-3 px-3 py-1 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.5)', fontSize: '0.8rem' }}>
            {cameraActive ? 'Point camera at barcode' : 'Initializing camera...'}
          </div>
        </div>
      </div>

      {cameraError && <div className="alert alert-danger py-2 small fw-bold">⚠️ {cameraError}</div>}

      {/* MANUAL INPUT */}
      <form onSubmit={handleManualSubmit} className="d-flex gap-2 mb-3">
        <input
          type="text"
          className="form-control erp-input font-monospace"
          placeholder="Manual barcode entry..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
        />
        <button type="submit" className="btn btn-primary erp-btn px-4" disabled={!manualInput}>Lookup</button>
      </form>

      {/* STATUS MESSAGES */}
      {status.text && (
        <div className={`alert erp-alert py-2 fw-bold ${getAlertClass(status.type)}`}>
          {status.text}
        </div>
      )}

      {/* INVENTORY MOVEMENT PROTOCOL */}
      <div className="erp-panel shadow-sm flex-grow-1 d-flex flex-column mb-3">
        <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
          <span>Inventory Movement Protocol</span>
        </div>
        <div className="p-3 bg-white flex-grow-1 d-flex flex-column">
          
          {/* MODE SELECTOR */}
          <div className="btn-group w-100 mb-3 shadow-sm flex-wrap" role="group">
            <button 
              type="button" 
              className={`btn erp-btn ${txMode === 'in' ? 'btn-success fw-bold' : 'btn-light border'}`}
              onClick={() => { setTxMode('in'); resetScanState(); }}
            >
              📥 IN
            </button>
            <button 
              type="button" 
              className={`btn erp-btn ${txMode === 'out' ? 'btn-danger fw-bold' : 'btn-light border'}`}
              onClick={() => { setTxMode('out'); resetScanState(); }}
            >
              📤 OUT
            </button>
            <button 
              type="button" 
              className={`btn erp-btn ${txMode === 'transfer' ? 'btn-warning fw-bold' : 'btn-light border'}`}
              onClick={() => { setTxMode('transfer'); resetScanState(); }}
            >
              🔁 XFER
            </button>
            <button 
              type="button" 
              className={`btn erp-btn ${txMode === 'po' ? 'btn-primary fw-bold' : 'btn-light border'}`}
              onClick={() => { setTxMode('po'); resetScanState(); }}
            >
              📦 PO RECV
            </button>
          </div>

          {/* DETECTED ITEM CONTEXT (Replaces Manual Select) */}
          <div className="mb-3">
            <label className="erp-label">Detected Item Context</label>
            {currentItem ? (
              <div className="p-3 bg-light border border-success rounded d-flex justify-content-between align-items-center shadow-sm">
                <div>
                  <div className="fw-bold font-monospace text-dark fs-5">{currentItem.itemCode}</div>
                  <div className="text-muted small">{currentItem.description}</div>
                </div>
                <button className="btn btn-sm btn-outline-danger erp-btn" onClick={resetScanState}>Clear</button>
              </div>
            ) : (
              <div className="p-3 bg-light border border-warning rounded text-center text-muted small shadow-sm">
                 Please scan a barcode or enter it manually to set the active item context.
              </div>
            )}
          </div>

          {/* PO CONTEXT (Only visible in PO Mode) */}
          {txMode === 'po' && (
            <div className="p-3 mb-3 bg-light border rounded shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="erp-label m-0">Target Purchase Order <span className="text-danger">*</span></label>
                {poLoading && <div className="spinner-border spinner-border-sm text-primary"></div>}
              </div>
              <select
                className="form-select erp-input font-monospace mb-2"
                value={selectedPoNumber}
                onChange={(e) => {
                  setSelectedPoNumber(e.target.value);
                  setCurrentPoLine(null);
                }}
              >
                <option value="">-- Select Pending PO --</option>
                {poList.map((po) => (
                  <option key={po.poNumber} value={po.poNumber}>
                    {po.poNumber} ({po.totalPending.toFixed(0)} units pending)
                  </option>
                ))}
              </select>
              
              {currentPoLine && (
                <div className="d-flex justify-content-between align-items-center bg-white p-2 border rounded small border-success">
                  <span className="text-muted fw-bold">Matched PO Line:</span>
                  <span className="fw-bold text-success">Pending Qty: {currentPoLine.pendingQty}</span>
                </div>
              )}
            </div>
          )}

          {/* FORM GRID (Enabled only if item is scanned) */}
          <fieldset disabled={!currentItem}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="row g-2 mb-3">
                <div className="col-12">
                  <label className="erp-label">Active Warehouse <span className="text-danger">*</span></label>
                  <select className="form-select erp-input" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })} disabled={txMode === 'po'}>
                    <option value="">-- Select Location --</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-4">
                  <label className="erp-label">Qty <span className="text-danger">*</span></label>
                  <input type="number" className="form-control erp-input font-monospace text-end" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} min="0" placeholder="0" />
                </div>

                {/* Dynamic Lot Fields */}
                {txMode === 'in' || txMode === 'po' ? (
                  <div className="col-8">
                    <label className="erp-label">Assign Lot / Batch Number</label>
                    <input type="text" className="form-control erp-input font-monospace" value={txForm.lotNumber} onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })} placeholder="Auto-generated if empty" />
                  </div>
                ) : (
                  <div className="col-8">
                    <label className="erp-label">Select Source Lot <span className="text-danger">*</span></label>
                    <select className="form-select erp-input font-monospace" value={txForm.lotId} onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })} disabled={lotsLoading}>
                      <option value="">{lotsLoading ? 'Loading...' : '-- Choose Active Lot --'}</option>
                      {availableLots.filter(l => l.quantity > 0).map((lot) => (
                        <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
                          {lot.lotNumber || 'UNASSIGNED'} (Avail: {lot.quantity})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Transfer specific fields */}
              {txMode === 'transfer' && (
                <div className="row g-2 mb-3 p-2 bg-light border rounded">
                  <div className="col-12">
                    <label className="erp-label text-warning">Destination Warehouse <span className="text-danger">*</span></label>
                    <select className="form-select erp-input" value={txForm.destWarehouseId} onChange={(e) => setTxForm({ ...txForm, destWarehouseId: e.target.value })}>
                      <option value="">-- Select Destination Bin --</option>
                      {warehouses
                        .filter((warehouse) => warehouse.id !== parseInt(txForm.warehouseId, 10))
                        .map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end pt-3 border-top mt-auto">
                <button
                  type="button"
                  onClick={(e) => (txMode === 'in' ? openSerialGenerationModal() : handleStockTransaction(e))}
                  disabled={loading || !txForm.itemId || !txForm.warehouseId || !txForm.quantity || (txMode === 'po' && !currentPoLine)}
                  className={`btn erp-btn w-100 py-2 fw-bold ${txMode === 'in' ? 'btn-success' : txMode === 'out' ? 'btn-danger' : txMode === 'transfer' ? 'btn-warning text-dark' : 'btn-primary'}`}
                >
                  {loading ? 'PROCESSING...' : txMode === 'in' ? 'RECEIVE & GEN SERIALS' : txMode === 'out' ? 'EXECUTE DISPATCH' : txMode === 'transfer' ? 'EXECUTE TRANSFER' : 'RECEIVE PO STOCK'}
                </button>
              </div>
            </form>
          </fieldset>
        </div>
      </div>

      {/* SERIAL GENERATION MODAL */}
      {showSerialModal && (
        <div className="erp-modal-overlay">
          <div className="erp-dialog erp-dialog-md w-100 m-3">
            <div className="erp-dialog-header">
              <h6 className="m-0 fw-bold">Serial Number Allocation</h6>
              <button className="btn-close btn-close-white" onClick={() => setShowSerialModal(false)}></button>
            </div>
            <div className="erp-dialog-body p-3 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light border rounded">
                <div>
                  <span className="erp-label m-0">Inbound Qty</span>
                  <span className="fs-5 fw-bold font-monospace text-success">{serialGenerationForm.quantity}</span>
                </div>
                <button className="btn btn-sm btn-outline-primary fw-bold erp-btn" onClick={generateSerialNumbers}>
                  + Generate
                </button>
              </div>

              {serialGenerationForm.generatedSerials.length > 0 ? (
                <div className="border rounded overflow-hidden" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="table table-sm table-striped m-0 font-monospace" style={{ fontSize: '0.8rem' }}>
                    <thead className="table-light sticky-top">
                      <tr>
                        <th className="ps-3 text-uppercase text-muted">S/N</th>
                        <th className="text-uppercase text-muted">Identifier</th>
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
                  Click generate to create unique serials based on item prefix.
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