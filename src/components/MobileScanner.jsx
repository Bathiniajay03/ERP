import React, { useState, useRef, useEffect } from 'react';
import { smartErpApi } from '../services/smartErpApi';

const SCAN_COOLDOWN_MS = 800;

export default function MobileScanner() {
  const manualInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  const [mode, setMode] = useState('selectMode');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [detectedBarcode, setDetectedBarcode] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  
  const [stockInData, setStockInData] = useState({
    quantity: 1,
    warehouseId: '',
    lotNumber: ''
  });
  
  const [stockOutData, setStockOutData] = useState({
    quantity: 1,
    warehouseId: '',
    lotNumber: ''
  });
  
  const [warehouses, setWarehouses] = useState([]);
  const [stockInfo, setStockInfo] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const lastScan = useRef({ barcode: '', timestamp: 0 });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (mode !== 'selectMode') {
      startCamera();
      focusInput();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        showStatus('success', '✓ Camera opened - Scan barcode or type manually');
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(`Camera unavailable: ${err.message}`);
      setCameraActive(false);
      showStatus('warning', '⚠️ Camera denied - Using manual input only');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const fetchInitialData = async () => {
    try {
      const [itemsRes, whRes] = await Promise.all([
        smartErpApi.stockItems(),
        smartErpApi.warehouses()
      ]);
      const itemsData = Array.isArray(itemsRes.data) ? itemsRes.data : [];
      const whData = Array.isArray(whRes.data) ? whRes.data : [];
      
      setItems(itemsData);
      setWarehouses(whData);
      
      if (whData.length > 0) {
        const firstWarehouseId = String(whData[0].id);
        setStockInData(prev => ({ ...prev, warehouseId: firstWarehouseId }));
        setStockOutData(prev => ({ ...prev, warehouseId: firstWarehouseId }));
      }
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Failed to load initial data', error);
      showStatus('error', '❌ Failed to load warehouses and items');
      setDataLoaded(true);
    }
  };

  const focusInput = () => {
    setTimeout(() => {
      if (manualInputRef.current) manualInputRef.current.focus();
    }, 100);
  };

  const showStatus = (type, text) => {
    setStatus({ type, text });
    setTimeout(() => setStatus({ type: '', text: '' }), 4000);
  };

  const handleBarcodeInput = async (e) => {
    if (e.key !== 'Enter') return;
    
    const code = e.target.value.trim();
    if (!code) return;

    const now = Date.now();
    if (code !== lastScan.current.barcode || now - lastScan.current.timestamp >= SCAN_COOLDOWN_MS) {
      lastScan.current = { barcode: code, timestamp: now };
      setDetectedBarcode(code);
      await fetchItemDetails(code);
      e.target.value = '';
    }
  };

  const fetchItemDetails = async (barcode) => {
    setCurrentItem(null);
    setStockInfo([]);
    try {
      const normalized = (barcode || '').trim().toLowerCase();
      const match = items.find(
        (item) =>
          (item.barcode || '').toLowerCase() === normalized ||
          (item.itemCode || '').toLowerCase() === normalized
      );

      if (!match) {
        showStatus('error', '❌ Item not found: ' + barcode);
        return;
      }

      setCurrentItem(match);
      const inventoryRes = await smartErpApi.stockInventory();
      const filtered = (inventoryRes.data || []).filter(
        (record) => record.itemId === match.id
      );
      setStockInfo(filtered);
      showStatus('success', `✅ Scanned: ${match.itemCode} - ${match.description || ''}`);
    } catch (error) {
      console.error('Fetch item failed', error);
      showStatus('error', 'Failed to load item details');
    }
  };

  const handleStockIn = async () => {
    if (!currentItem) {
      showStatus('error', '⚠️ Please scan an item first');
      return;
    }
    if (!stockInData.warehouseId || stockInData.warehouseId === '') {
      showStatus('error', '⚠️ Please select a warehouse');
      focusInput();
      return;
    }
    const qty = Number(stockInData.quantity);
    if (!qty || qty <= 0) {
      showStatus('error', '⚠️ Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await smartErpApi.receiveInventory({
        itemId: currentItem.id,
        quantity: qty,
        warehouseId: Number(stockInData.warehouseId),
        lotNumber: stockInData.lotNumber.trim() || null
      });
      showStatus('success', '✅ Stock IN saved successfully!');
      resetStockIn();
    } catch (error) {
      console.error('Stock IN failed', error);
      showStatus('error', error?.response?.data?.message || 'Failed to save stock');
    } finally {
      setLoading(false);
    }
  };

  const handleStockOut = async () => {
    if (!currentItem) {
      showStatus('error', '⚠️ Please scan an item first');
      return;
    }
    if (!stockOutData.warehouseId || stockOutData.warehouseId === '') {
      showStatus('error', '⚠️ Please select a warehouse');
      focusInput();
      return;
    }
    const qty = Number(stockOutData.quantity);
    if (!qty || qty <= 0) {
      showStatus('error', '⚠️ Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await smartErpApi.deviceEvent({
        deviceType: 'MobileScanner',
        eventType: 'StockOut',
        payload: detectedBarcode,
        itemId: currentItem.id,
        quantity: qty,
        warehouseId: Number(stockOutData.warehouseId),
        lotNumber: stockOutData.lotNumber.trim() || null
      });
      showStatus('success', '✅ Stock OUT saved successfully!');
      resetStockOut();
    } catch (error) {
      console.error('Stock OUT failed', error);
      showStatus('error', error?.response?.data?.message || 'Failed to save stock out');
    } finally {
      setLoading(false);
    }
  };

  const resetStockIn = () => {
    setDetectedBarcode('');
    setCurrentItem(null);
    setStockInfo([]);
    setStockInData(prev => ({ ...prev, quantity: 1, lotNumber: '' }));
    focusInput();
  };

  const resetStockOut = () => {
    setDetectedBarcode('');
    setCurrentItem(null);
    setStockInfo([]);
    setStockOutData(prev => ({ ...prev, quantity: 1, lotNumber: '' }));
    focusInput();
  };

  const mapWarehouseName = (warehouseId) => {
    const wh = warehouses.find((w) => w.id === warehouseId);
    return wh ? wh.name : 'Unknown';
  };

  // MODE SELECTION
  if (mode === 'selectMode') {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>📦 Mobile Operations</h1>
          <p style={styles.subtitle}>Select operation type</p>
        </div>

        <div style={styles.modeGrid}>
          <button
            onClick={() => {
              setMode('stockIn');
              resetStockIn();
            }}
            style={styles.modeButton}
          >
            <div style={styles.modeIcon}>📥</div>
            <div style={styles.modeName}>Stock IN</div>
            <div style={styles.modeDescription}>Receive inventory</div>
          </button>

          <button
            onClick={() => {
              setMode('stockOut');
              resetStockOut();
            }}
            style={styles.modeButton}
          >
            <div style={styles.modeIcon}>📤</div>
            <div style={styles.modeName}>Stock OUT</div>
            <div style={styles.modeDescription}>Issue inventory</div>
          </button>
        </div>
      </div>
    );
  }

  // STOCK IN / OUT SCREENS
  const isStockIn = mode === 'stockIn';
  const operationData = isStockIn ? stockInData : stockOutData;
  const setOperationData = isStockIn ? setStockInData : setStockOutData;
  const handleSave = isStockIn ? handleStockIn : handleStockOut;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => setMode('selectMode')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>{isStockIn ? '📥 Stock IN' : '📤 Stock OUT'}</h1>
      </div>

      {status.text && (
        <div
          style={{
            ...styles.statusBox,
            backgroundColor: status.type === 'success' ? '#dcfce7' : status.type === 'warning' ? '#fef3c7' : '#fee2e2',
            borderColor: status.type === 'success' ? '#86efac' : status.type === 'warning' ? '#fcd34d' : '#fca5a5',
            color: status.type === 'success' ? '#166534' : status.type === 'warning' ? '#92400e' : '#991b1b'
          }}
        >
          {status.text}
        </div>
      )}

      {cameraActive && (
        <div style={styles.cameraSection}>
          <video ref={videoRef} autoPlay playsInline muted style={styles.videoElement} />
          <div style={styles.cameraOverlay}>
            <div style={styles.scanLine}></div>
            <p style={styles.cameraText}>Point at barcode</p>
          </div>
        </div>
      )}

      {cameraError && <div style={styles.cameraErrorBox}>⚠️ {cameraError}</div>}

      <div style={styles.scanSection}>
        <label style={styles.label}>
          {cameraActive ? '📱 Or type barcode manually' : '🔍 Enter Barcode'}
        </label>
        <input
          ref={manualInputRef}
          type="text"
          placeholder={cameraActive ? "Type or scan..." : "Type barcode and press Enter..."}
          onKeyUp={handleBarcodeInput}
          autoFocus
          style={styles.input}
        />
      </div>

      {currentItem && (
        <div style={styles.itemCard}>
          <p style={{ marginTop: 0, color: '#166534', fontWeight: '600' }}>✓ Item Found</p>
          <p style={styles.itemText}><strong>Code:</strong> {currentItem.itemCode}</p>
          <p style={styles.itemText}><strong>Name:</strong> {currentItem.description || '—'}</p>
          <p style={styles.itemText}><strong>Barcode:</strong> {currentItem.barcode || '—'}</p>
        </div>
      )}

      {currentItem && stockInfo.length > 0 && (
        <div style={styles.stockCard}>
          <strong style={{ display: 'block', marginBottom: '10px' }}>📊 Current Stock</strong>
          {stockInfo.map((record, idx) => (
            <div key={idx} style={styles.stockRow}>
              <span>{mapWarehouseName(record.warehouseId)}</span>
              <span>{record.lotNumber || '—'}</span>
              <span style={{ fontWeight: '600' }}>Qty: {record.quantity || 0}</span>
            </div>
          ))}
        </div>
      )}

      {currentItem && (
        <div style={styles.formCard}>
          <div style={styles.formGrid}>
            <label style={styles.formLabel}>
              <span style={styles.labelText}>Warehouse *</span>
              <select
                value={operationData.warehouseId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    setOperationData(prev => ({ ...prev, warehouseId: value }));
                  }
                }}
                style={styles.select}
              >
                <option value="">-- Select Warehouse --</option>
                {warehouses && warehouses.length > 0 ? (
                  warehouses.map((w) => (
                    <option key={w.id} value={String(w.id)}>
                      {w.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No warehouses available</option>
                )}
              </select>
            </label>

            <label style={styles.formLabel}>
              <span style={styles.labelText}>Quantity *</span>
              <input
                type="number"
                min="1"
                value={operationData.quantity}
                onChange={(e) => setOperationData(prev => ({ ...prev, quantity: e.target.value }))}
                style={styles.inputField}
              />
            </label>

            <label style={styles.formLabel}>
              <span style={styles.labelText}>Lot Number</span>
              <input
                type="text"
                placeholder="Optional"
                value={operationData.lotNumber}
                onChange={(e) => setOperationData(prev => ({ ...prev, lotNumber: e.target.value }))}
                style={styles.inputField}
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || !currentItem}
            style={{
              ...styles.saveButton,
              opacity: !currentItem || loading ? 0.5 : 1,
              cursor: !currentItem || loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Saving...' : (isStockIn ? '✓ Save Stock IN' : '✓ Save Stock OUT')}
          </button>

          <button
            onClick={() => (isStockIn ? resetStockIn() : resetStockOut())}
            style={styles.clearButton}
          >
            Clear Form
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { 
    padding: 'max(16px, 2vw)', 
    background: '#f5f7fb', 
    minHeight: '100vh', 
    fontFamily: 'system-ui',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: { 
    position: 'relative', 
    marginBottom: '28px', 
    textAlign: 'center',
    paddingTop: '10px'
  },
  backButton: { 
    position: 'absolute', 
    left: '0', 
    top: '0', 
    padding: '10px 16px', 
    background: '#6b7280', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '15px',
    transition: 'background 0.2s'
  },
  title: { 
    margin: '0 0 8px', 
    fontSize: 'clamp(24px, 6vw, 32px)', 
    color: '#1a365d', 
    fontWeight: '700' 
  },
  subtitle: { 
    margin: '0', 
    fontSize: 'clamp(13px, 3vw, 16px)', 
    color: '#64748b' 
  },
  modeGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: 'clamp(12px, 4vw, 24px)', 
    marginTop: '40px' 
  },
  modeButton: { 
    padding: 'clamp(20px, 5vw, 32px) clamp(16px, 4vw, 24px)', 
    background: '#fff', 
    border: '2px solid #cbd5e1', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontSize: '16px', 
    textAlign: 'center', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'all 0.3s'
  },
  modeIcon: { 
    fontSize: 'clamp(40px, 10vw, 56px)', 
    marginBottom: '16px' 
  },
  modeName: { 
    fontSize: 'clamp(16px, 4vw, 20px)', 
    fontWeight: '700', 
    color: '#1a365d', 
    marginBottom: '8px' 
  },
  modeDescription: { 
    fontSize: 'clamp(12px, 2.5vw, 14px)', 
    color: '#64748b' 
  },
  statusBox: { 
    padding: '14px 18px', 
    borderRadius: '8px', 
    border: '1px solid', 
    marginBottom: '20px', 
    fontWeight: '500',
    fontSize: '14px',
    animation: 'slideIn 0.3s ease'
  },
  cameraSection: { 
    position: 'relative', 
    background: '#000', 
    borderRadius: '12px', 
    overflow: 'hidden', 
    marginBottom: '20px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    aspectRatio: '16 / 9',
    width: '100%'
  },
  videoElement: { 
    width: '100%', 
    height: '100%', 
    display: 'block', 
    objectFit: 'cover' 
  },
  cameraOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    pointerEvents: 'none' 
  },
  scanLine: { 
    width: '70%', 
    height: '4px', 
    background: '#10b981', 
    borderRadius: '2px', 
    marginBottom: '16px', 
    boxShadow: '0 0 15px #10b981',
    animation: 'pulse 2s infinite'
  },
  cameraText: { 
    color: '#fff', 
    fontSize: '16px', 
    fontWeight: '600', 
    textShadow: '0 2px 4px rgba(0,0,0,0.5)', 
    margin: 0 
  },
  cameraErrorBox: { 
    background: '#fee2e2', 
    color: '#991b1b', 
    padding: '14px 16px', 
    borderRadius: '8px', 
    marginBottom: '18px', 
    fontSize: '14px', 
    border: '2px solid #fca5a5' 
  },
  scanSection: { 
    background: '#fff', 
    padding: '20px', 
    borderRadius: '10px', 
    marginBottom: '20px', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
  },
  label: { 
    display: 'block', 
    fontWeight: '700', 
    color: '#1a365d', 
    marginBottom: '12px', 
    fontSize: 'clamp(13px, 3vw, 15px)' 
  },
  input: { 
    width: '100%', 
    padding: '14px 16px', 
    border: '2px solid #cbd5e1', 
    borderRadius: '8px', 
    fontSize: '16px', 
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  itemCard: { 
    background: '#fff', 
    padding: '18px', 
    borderRadius: '10px', 
    marginBottom: '18px', 
    border: '2px solid #86efac', 
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)' 
  },
  itemText: { 
    margin: '8px 0', 
    fontSize: 'clamp(13px, 2.5vw, 14px)', 
    color: '#334155',
    lineHeight: '1.5'
  },
  stockCard: { 
    background: '#f0f9ff', 
    padding: '18px', 
    borderRadius: '10px', 
    marginBottom: '18px', 
    fontSize: 'clamp(13px, 2.5vw, 14px)', 
    border: '2px solid #e0f2fe' 
  },
  stockRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: '10px 0', 
    borderBottom: '1px solid #e0f2fe',
    gap: '12px'
  },
  formCard: { 
    background: '#fff', 
    padding: '24px', 
    borderRadius: '10px', 
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)' 
  },
  formGrid: { 
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '18px', 
    marginBottom: '22px' 
  },
  formLabel: { 
    display: 'flex', 
    flexDirection: 'column' 
  },
  labelText: { 
    fontWeight: '700', 
    color: '#1a365d', 
    fontSize: 'clamp(13px, 3vw, 15px)', 
    marginBottom: '8px' 
  },
  select: { 
    padding: '12px 14px', 
    border: '2px solid #cbd5e1', 
    borderRadius: '8px', 
    fontSize: '14px', 
    boxSizing: 'border-box',
    background: '#fff',
    cursor: 'pointer',
    transition: 'border-color 0.2s'
  },
  inputField: { 
    padding: '12px 14px', 
    border: '2px solid #cbd5e1', 
    borderRadius: '8px', 
    fontSize: '14px', 
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  saveButton: { 
    width: '100%', 
    padding: '16px', 
    background: '#10b981', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '8px', 
    fontWeight: '700', 
    fontSize: 'clamp(14px, 3vw, 16px)', 
    marginBottom: '12px', 
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
  },
  clearButton: { 
    width: '100%', 
    padding: '14px', 
    background: '#e2e8f0', 
    color: '#1a365d', 
    border: 'none', 
    borderRadius: '8px', 
    fontWeight: '600', 
    fontSize: 'clamp(13px, 3vw, 15px)', 
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};
