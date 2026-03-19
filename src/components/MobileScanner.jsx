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
  const defaultWarehouseId = warehouses.length ? String(warehouses[0].id) : '';
  const [txForm, setTxForm] = useState({
    itemId: '',
    warehouseId: defaultWarehouseId,
    lotId: '',
    quantity: '',
    lotNumber: '',
    prefix: ''
  });
  const [loading, setLoading] = useState(false);

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

  const matchingLots = useMemo(() => {
    const itemId = parseInt(txForm.itemId, 10);
    const warehouseId = parseInt(txForm.warehouseId, 10);
    if (!itemId || !warehouseId) return [];
    return inventory.filter((record) => record.itemId === itemId && record.warehouseId === warehouseId);
  }, [inventory, txForm]);

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
        onScanDetected({
          itemId: payload.itemId,
          warehouseId: assignedWarehouseId,
          lotId: payload.inventory?.lotId ?? null,
          lotNumber: payload.inventory?.lotNumber ?? ''
        });
        const statusMessage = payload.isNew ? 'New item auto-created' : `Scanned: ${payload.itemCode}`;
        showStatus('success', statusMessage);
        stopCamera();
        fetchData();
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
    [fetchData, onScanDetected, showStatus, stopCamera, warehouses]
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
    setLoading(true);
    try {
      const payload = {
        itemId: parseInt(txForm.itemId, 10),
        warehouseId: parseInt(txForm.warehouseId, 10),
        quantity: parseFloat(txForm.quantity),
        lotNumber: txForm.lotNumber || null
      };
      await api.post('/stock/in', payload);
      showStatus('success', 'Stock IN recorded');
      setTxForm((prev) => ({ ...prev, quantity: '', lotNumber: '', lotId: '' }));
      fetchData();
      void startCamera();
    } catch (err) {
      console.error('Stock IN failed', err);
      showStatus('error', err.response?.data || 'Stock IN failed');
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
      await api.post('/stock/out', {
        itemId: parseInt(txForm.itemId, 10),
        warehouseId: parseInt(txForm.warehouseId, 10),
        lotId: parseInt(txForm.lotId, 10),
        quantity: parseFloat(txForm.quantity)
      });
      showStatus('success', 'Stock OUT recorded');
      setTxForm((prev) => ({ ...prev, quantity: '', lotId: '' }));
      fetchData();
      void startCamera();
    } catch (err) {
      console.error('Stock OUT failed', err);
      showStatus('error', err.response?.data || 'Stock OUT failed');
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
        <div style={statusStyle(
          status.type === 'success' ? '#dcfce7' : '#fee2e2',
          status.type === 'success' ? '#166534' : '#991b1b'
        )}>
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
          >
            <option value="">Select lot</option>
            {matchingLots.map((lot) => (
              <option key={lot.lotId} value={lot.lotId}>{lot.lotNumber || 'Unassigned'} (Qty: {lot.quantity})</option>
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

const statusStyle = (background, color) => ({
  margin: '12px 0',
  padding: '10px',
  borderRadius: '8px',
  background,
  color,
  display: 'flex',
  justifyContent: 'space-between'
});

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
  }
};
