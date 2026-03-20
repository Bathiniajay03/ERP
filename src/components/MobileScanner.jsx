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

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [currentItem, setCurrentItem] = useState(null);
  const [detectedBarcode, setDetectedBarcode] = useState('');
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  const [poMode, setPoMode] = useState(false);
  const [poLoading, setPoLoading] = useState(false);
  const [poList, setPoList] = useState([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [currentPoLine, setCurrentPoLine] = useState(null);
  const defaultWarehouseId = warehouses.length ? String(warehouses[0].id) : '';
  const selectedPo = useMemo(
    () => poList.find((po) => po.poNumber === selectedPoNumber) ?? null,
    [poList, selectedPoNumber]
  );
  const [txForm, setTxForm] = useState({
    itemId: '',
    warehouseId: defaultWarehouseId,
    lotId: '',
    quantity: '',
    lotNumber: '',
    prefix: ''
  });
  const [loading, setLoading] = useState(false);
  const [availableLots, setAvailableLots] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);

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

  const generateAutoLotNumber = useCallback(() => {
    const today = new Date();
    const dateCode = today.toISOString().split("T")[0].replace(/-/g, "");
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    return `LOT-${dateCode}-${suffix}`;
  }, []);

  const loadPendingPurchaseOrders = useCallback(async () => {
    setPoLoading(true);
    try {
      const response = await api.get('/purchase-orders/pending');
      const list = response.data || [];
      setPoList(list);
      const hasSelection = selectedPoNumber && list.some((po) => po.poNumber === selectedPoNumber);
      if (!hasSelection) {
        setSelectedPoNumber(list[0]?.poNumber ?? '');
        setCurrentPoLine(null);
      }
    } catch (error) {
      setPoList([]);
      setSelectedPoNumber('');
      setCurrentPoLine(null);
    } finally {
      setPoLoading(false);
    }
  }, [selectedPoNumber]);

  useEffect(() => {
    loadAvailableLots();
    setTxForm((prev) => ({ ...prev, lotId: '' }));
  }, [loadAvailableLots]);

  useEffect(() => {
    if (poMode) {
      void loadPendingPurchaseOrders();
    } else {
      setPoList([]);
      setSelectedPoNumber('');
      setCurrentPoLine(null);
    }
  }, [poMode, loadPendingPurchaseOrders]);

  useEffect(() => {
    if (poMode && selectedPo && selectedPo.lines && selectedPo.lines.length > 0) {
      setTxForm((prev) => ({
        ...prev,
        warehouseId: String(selectedPo.lines[0].warehouseId)
      }));
    }
  }, [poMode, selectedPo]);

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
      setDetectedBarcode(trimmed);
      let allowScanRecording = true;
      try {
        const response = await api.get(`/items/barcode/${encodeURIComponent(trimmed)}`);
        const payload = response.data;
        const assignedWarehouseId = payload.inventory?.warehouseId ?? warehouses[0]?.id ?? '';
        setCurrentItem({
          itemId: payload.itemId,
          itemCode: payload.itemCode,
          description: payload.itemName
        });
        setTxForm((prev) => ({
          ...prev,
          itemId: String(payload.itemId),
          warehouseId: prev.warehouseId || (assignedWarehouseId ? String(assignedWarehouseId) : '')
        }));
        if (poMode) {
          if (!selectedPo) {
            showStatus('warning', 'Select a PO before receiving stock.');
            setCurrentPoLine(null);
            allowScanRecording = false;
          } else {
            const match = selectedPo.lines.find((line) => line.itemId === payload.itemId);
            if (!match) {
              showStatus('error', `${payload.itemCode} is not part of ${selectedPo.poNumber}`);
              setCurrentPoLine(null);
              allowScanRecording = false;
            } else {
              setCurrentPoLine(match);
              setTxForm((prev) => ({
                ...prev,
                warehouseId: String(match.warehouseId)
              }));
              showStatus('info', `PO ${selectedPo.poNumber} pending ${match.pendingQty}`);
            }
          }
        }
        onScanDetected({
          itemId: payload.itemId,
          warehouseId: assignedWarehouseId,
          lotId: payload.inventory?.lotId ?? null,
          lotNumber: payload.inventory?.lotNumber ?? ''
        });
        const statusType = payload.isNew ? 'info' : 'success';
        const statusMessage = payload.isNew
          ? `New item auto-created (${payload.itemCode})`
          : `Scanned: ${payload.itemCode}`;
        showStatus(statusType, statusMessage);
        stopCamera();
        fetchData();
        if (allowScanRecording) {
          recordBarcodeScan(trimmed);
        }
        return payload;
      } catch (err) {
        console.error('Barcode lookup failed', err);
        const status = err?.response?.status;
        if (status === 404) {
          showStatus('error', 'Item not found for OUT');
        } else {
          showStatus('error', 'Failed to resolve barcode');
        }
        return null;
      }
    },
    [fetchData, onScanDetected, showStatus, stopCamera, warehouses, recordBarcodeScan, poMode, selectedPo]
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

  useEffect(() => {
    if (!txForm.warehouseId && warehouses.length > 0) {
      setTxForm((prev) => ({ ...prev, warehouseId: String(warehouses[0].id) }));
    }
  }, [txForm.warehouseId, warehouses]);

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
            if (result) {
              handleDetectedCode(result.getText());
            }
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

  const handleStockIn = async () => {
    if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity) {
      return showStatus('error', 'Provide item, warehouse, and quantity');
    }

    const requestedQty = parseFloat(txForm.quantity);
    if (poMode && currentPoLine && requestedQty > currentPoLine.pendingQty) {
      return showStatus('error', 'Quantity exceeds PO pending amount');
    }

    setLoading(true);
    try {
      if (poMode) {
        if (!selectedPo) {
          showStatus('error', 'Select a PO before receiving stock.');
          setLoading(false);
          return;
        }
        if (!currentPoLine) {
          showStatus('error', 'Scan the PO item first.');
          setLoading(false);
          return;
        }

        const lotInput = txForm.lotNumber?.trim();
        const lotNumberForRequest = lotInput || generateAutoLotNumber();

        const payload = {
          poId: selectedPo.id,
          itemId: parseInt(txForm.itemId, 10),
          warehouseId: parseInt(txForm.warehouseId, 10),
          quantity: requestedQty,
          lotNumber: lotNumberForRequest,
          scannerDeviceId: 'MOBILE-SCAN'
        };
        const response = await api.post('/purchase-orders/receive', payload);
        showStatus('success', 'PO Item Received Successfully');
        setCurrentPoLine(null);
        setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotNumber: '', lotId: '' }));
        resetScanState();
        await loadPendingPurchaseOrders();
        fetchData();
        void loadAvailableLots();
        void startCamera();
        return;
      }

      const payload = {
        itemId: parseInt(txForm.itemId, 10),
        warehouseId: parseInt(txForm.warehouseId, 10),
        quantity: requestedQty,
        lotNumber: txForm.lotNumber?.trim() || null
      };
      const response = await api.post('/stock/in', payload);
      const payloadMessage = response.data?.message || 'Stock IN recorded';
      const statusType = response.data?.success ? 'success' : 'error';
      showStatus(statusType, payloadMessage);
      if (response.data?.success !== false) {
        setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotNumber: '', lotId: '' }));
        resetScanState();
        fetchData();
        void loadAvailableLots();
        void startCamera();
      }
    } catch (err) {
      console.error('Stock IN failed', err);
      showStatus('error', err.response?.data?.message || err.response?.data || 'Stock IN failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStockOut = async () => {
    if (!txForm.itemId || !txForm.warehouseId || !txForm.lotId || !txForm.quantity) {
      return showStatus('error', 'Provide item, warehouse, lot, and quantity');
    }
    setLoading(true);
    try {
      const payload = {
        itemId: parseInt(txForm.itemId, 10),
        warehouseId: parseInt(txForm.warehouseId, 10),
        lotId: parseInt(txForm.lotId, 10),
        quantity: parseFloat(txForm.quantity)
      };
      const response = await api.post('/stock/out', payload);
      const message = response.data?.message || 'Stock OUT recorded';
      const statusType = response.data?.success ? 'success' : 'error';
      showStatus(statusType, message);
      if (response.data?.success !== false) {
        setTxForm((prev) => ({ ...prev, itemId: '', quantity: '', lotId: '' }));
        resetScanState();
        fetchData();
        void loadAvailableLots();
        void startCamera();
      }
    } catch (err) {
      console.error('Stock OUT failed', err);
      showStatus('error', err.response?.data?.message || err.response?.data || 'Stock OUT failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.cameraWrapper}>
        <video ref={videoRef} style={styles.video} autoPlay muted playsInline />
        <div style={styles.scanOverlay}>
          <div style={styles.scanLine} />
          <p style={styles.cameraHint}>{cameraActive ? 'Point camera at barcode' : 'Starting camera...'}</p>
        </div>
      </div>

      {cameraError && <div style={styles.cameraError}>⚠️ {cameraError}</div>}

      {status.text && (
        <div style={statusStyle(status.type)}>
          {status.text}
        </div>
      )}

      <form onSubmit={handleManualSubmit} style={styles.manualForm}>
        <input
          type="text"
          placeholder="Type barcode and press Enter"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          style={styles.manualInput}
        />
        <button type="submit" style={styles.manualButton} disabled={!manualInput}>Lookup</button>
      </form>

      <div style={styles.modeSwitcher}>
        <button
          style={{
            ...styles.modeButton,
            ...(poMode ? {} : styles.modeButtonActive)
          }}
          type="button"
          onClick={() => {
            setPoMode(false);
            setCurrentPoLine(null);
          }}
        >
          Normal scan
        </button>
        <button
          style={{
            ...styles.modeButton,
            ...(poMode ? styles.modeButtonActive : {})
          }}
          type="button"
          onClick={() => setPoMode(true)}
        >
          PO receive mode
        </button>
      </div>

      {poMode && (
        <div style={styles.poPanel}>
        <div style={styles.poHeader}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Pending POs</label>
            <select
              style={{ ...styles.select, width: '100%' }}
              value={selectedPoNumber}
              onChange={(e) => {
                setSelectedPoNumber(e.target.value);
                setCurrentPoLine(null);
              }}
            >
              <option value="">Select PO...</option>
                {poList.map((po) => (
                  <option key={po.poNumber} value={po.poNumber}>
                    {po.poNumber} · {po.totalPending.toFixed(0)} pending
                  </option>
                ))}
              </select>
          </div>
          <div>
            {poLoading ? (
              <span style={styles.smallText}>Loading...</span>
            ) : (
              <span style={styles.smallText}>{selectedPo ? selectedPo.supplierName : 'No PO selected'}</span>
            )}
          </div>
        </div>
        {selectedPo && (
          <div style={styles.poWarehouse}>
            <span>Warehouse</span>
            <strong>
              {currentPoLine?.warehouseName ||
                selectedPo.lines[0]?.warehouseName ||
                'N/A'}
            </strong>
          </div>
        )}
        {selectedPo ? (
          <div style={styles.poLines}>
              {selectedPo.lines.map((line) => (
                <div key={line.lineId} style={styles.poLineItem}>
                  <div>
                    <strong>{line.itemCode}</strong> <small className="text-muted">{line.itemName}</small>
                  </div>
                  <div style={styles.poQty}>
                    <span>Pending {line.pendingQty.toFixed(0)}</span>
                  </div>
                </div>
              ))}
              {currentPoLine && (
                <div style={styles.currentLineInfo}>
                  <div><strong>Receiving:</strong> {currentPoLine.itemCode}</div>
                  <div style={styles.currentLineStats}>
                    <span>Ordered: {currentPoLine.orderedQty}</span>
                    <span>Received: {currentPoLine.receivedQty}</span>
                    <span>Pending: {currentPoLine.pendingQty}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.emptyLine}>No pending PO lines to show</div>
          )}
        </div>
      )}

      {currentItem && (
        <div style={styles.itemCard}>
          <p><strong>{currentItem.itemCode}</strong> · {currentItem.description}</p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Detected barcode: {detectedBarcode}</p>
        </div>
      )}

      <div style={styles.txGrid}>
        <div>
          <label style={styles.label}>Warehouse</label>
          <select
            value={txForm.warehouseId}
            onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}
            style={styles.select}
            disabled={poMode}
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={styles.label}>Lot</label>
          <select
            value={txForm.lotId}
            onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })}
            style={styles.select}
            disabled={lotsLoading}
          >
            <option value="">{lotsLoading ? 'Loading lots…' : 'Select lot'}</option>
            {availableLots
              .filter((lot) => lot.lotId !== null && lot.quantity > 0)
              .map((lot) => (
                <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
                  {lot.lotNumber || 'Unassigned'} (Qty: {lot.quantity})
                </option>
              ))}
          </select>
        </div>
        <div>
          <label style={styles.label}>Quantity</label>
          <input
            type="number"
            value={txForm.quantity}
            onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Lot Number (IN)</label>
          <input
            type="text"
            value={txForm.lotNumber}
            onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.buttonRow}>
        <button type="button" onClick={handleStockIn} disabled={loading} style={{ ...styles.actionBtn, backgroundColor: '#10b981' }}>
          {loading ? 'Processing...' : 'Stock IN'}
        </button>
        <button type="button" onClick={handleStockOut} disabled={loading} style={{ ...styles.actionBtn, backgroundColor: '#ef4444' }}>
          {loading ? 'Processing...' : 'Stock OUT'}
        </button>
      </div>
    </div>
  );
}

const statusStyle = (type) => {
  const palette = {
    success: { background: '#dcfce7', color: '#166534', border: '#166534' },
    info: { background: '#e0f2fe', color: '#0369a1', border: '#0369a1' },
    warning: { background: '#fef3c7', color: '#92400e', border: '#92400e' },
    error: { background: '#fee2e2', color: '#991b1b', border: '#991b1b' }
  };
  const style = palette[type] || palette.error;
  return {
    margin: '12px 0',
    padding: '10px',
    borderRadius: '8px',
    border: `1px solid ${style.border}`,
    background: style.background,
    color: style.color,
    display: 'flex',
    justifyContent: 'space-between'
  };
};

const styles = {
  container: {
    padding: '16px',
    background: '#f5f7fb',
    minHeight: '100vh'
  },
  cameraWrapper: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#000',
    minHeight: '240px',
    marginBottom: '16px'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  scanOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  scanLine: {
    width: '70%',
    height: '3px',
    background: '#10b981',
    borderRadius: '999px',
    boxShadow: '0 0 10px rgba(16,185,129,0.8)'
  },
  cameraHint: {
    color: '#fff',
    fontWeight: '600',
    marginTop: '12px',
    textShadow: '0 2px 8px rgba(0,0,0,0.6)'
  },
  cameraError: {
    background: '#fee2e2',
    color: '#991b1b',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  manualForm: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px'
  },
  manualInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1'
  },
  manualButton: {
    padding: '0 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#2563eb',
    color: '#fff',
    cursor: 'pointer'
  },
  itemCard: {
    background: '#fff',
    padding: '14px',
    borderRadius: '10px',
    marginBottom: '16px',
    boxShadow: '0 8px 16px rgba(15,23,42,0.08)'
  },
  txGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#0f172a'
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1'
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  actionBtn: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer'
  },
  modeSwitcher: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  modeButton: {
    flex: 1,
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    fontWeight: '600',
    cursor: 'pointer'
  },
  modeButtonActive: {
    background: '#0f172a',
    color: '#fff',
    borderColor: '#0f172a'
  },
  poPanel: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '12px',
    marginBottom: '16px',
    background: '#fff',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)'
  },
  poHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    marginBottom: '12px'
  },
  poLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  poLineItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9'
  },
  poQty: {
    color: '#0f172a',
    fontWeight: '600'
  },
  currentLineInfo: {
    marginTop: '10px',
    padding: '8px',
    borderRadius: '10px',
    background: '#f8fafc',
    border: '1px dashed #cbd5e1'
  },
  currentLineStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '0.85rem',
    color: '#475569',
    marginTop: '6px'
  },
  emptyLine: {
    padding: '10px',
    borderRadius: '8px',
    background: '#fefce8',
    color: '#92400e'
  },
  smallText: {
    fontSize: '0.75rem',
    color: '#475569'
  }
  ,
  poWarehouse: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    background: '#f1f5f9',
    borderRadius: '10px',
    marginBottom: '10px'
  }
};
