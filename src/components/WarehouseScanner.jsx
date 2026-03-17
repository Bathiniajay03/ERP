import React, { useEffect, useRef, useState, useCallback } from 'react';
import { smartErpApi } from '../services/smartErpApi';

const SCAN_COOLDOWN_MS = 1000;

export default function WarehouseScanner() {
  const manualInputRef = useRef(null);
  
  const [, setDetectedBarcode] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [stockInfo, setStockInfo] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lotNumber, setLotNumber] = useState('');
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState([]);
  const lastScan = useRef({ barcode: '', timestamp: 0 });

  const showStatus = useCallback((type, text) => {
    setStatus({ type, text });
    setTimeout(() => setStatus({ type: '', text: '' }), 4000);
  }, []);

  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await smartErpApi.warehouses();
      const data = response.data || [];
      setWarehouses(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedWarehouseId(String(data[0].id));
      }
    } catch (error) {
      console.error('warehouse load failed', error);
      showStatus('error', 'Unable to load warehouses');
    }
  }, [showStatus]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await smartErpApi.stockItems();
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('items load failed', error);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
    fetchItems();
  }, [fetchWarehouses, fetchItems]);

  const fetchItemDetails = async (barcode) => {
    setCurrentItem(null);
    setStockInfo([]);
    try {
      const normalized = (barcode || '').trim().toLowerCase();
      
      // Search in local items first
      const match = items.find(
        (item) =>
          (item.barcode || '').toLowerCase() === normalized ||
          (item.itemCode || '').toLowerCase() === normalized
      );

      if (!match) {
        showStatus('error', 'Item not found for barcode: ' + barcode);
        return;
      }

      setCurrentItem(match);
      
      const inventoryRes = await smartErpApi.stockInventory();
      const filtered = (inventoryRes.data || []).filter(
        (record) => record.itemId === match.id
      );
      setStockInfo(filtered);
      showStatus('success', `Found: ${match.itemCode} - ${match.description || ''}`);
    } catch (error) {
      console.error('fetch item failed', error);
      showStatus('error', 'Failed to load item details');
    }
  };

  const handleBarcodeInput = (e) => {
    const code = e.target.value.trim();
    if (code && code.length > 0) {
      const now = Date.now();
      if (
        code !== lastScan.current.barcode ||
        now - lastScan.current.timestamp >= SCAN_COOLDOWN_MS
      ) {
        lastScan.current = { barcode: code, timestamp: now };
        setDetectedBarcode(code);
        fetchItemDetails(code);
        e.target.value = '';
      }
    }
  };

  const sanitizePrefix = () => {
    if (!currentItem) return 'ITEM';
    const candidate = currentItem.itemCode || currentItem.serialPrefix || 'ITEM';
    const cleaned = candidate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return cleaned.substring(0, 8) || 'ITEM';
  };

  const generateSerialNumbers = () => {
    if (!currentItem) {
      showStatus('error', 'Scan an item before generating serial numbers');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      showStatus('error', 'Enter a valid quantity');
      return;
    }
    const prefix = sanitizePrefix();
    const serials = Array.from({ length: qty }, (_, idx) => {
      const counter = String(idx + 1).padStart(4, '0');
      return `${prefix}-${counter}`;
    });
    setSerialNumbers(serials);
    showStatus('success', `✓ Generated ${serials.length} serial numbers`);
  };

  const handleSaveStock = async () => {
    if (!currentItem) {
      showStatus('error', 'Scan an item first');
      return;
    }
    if (!selectedWarehouseId) {
      showStatus('error', 'Select a warehouse');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      showStatus('error', 'Enter a valid quantity');
      return;
    }

    setIsSaving(true);
    
    try {
      await smartErpApi.receiveInventory({
        itemId: currentItem.id,
        quantity: qty,
        warehouseId: Number(selectedWarehouseId),
        lotNumber: lotNumber.trim() || null,
        serialNumbers: serialNumbers.length > 0 ? serialNumbers : null
      });
      
      showStatus('success', '✓ Stock received successfully!');
      setQuantity(1);
      setLotNumber('');
      setSerialNumbers([]);
      setDetectedBarcode('');
      setCurrentItem(null);
      setStockInfo([]);
      
      // Refocus input for next scan
      if (manualInputRef.current) {
        manualInputRef.current.focus();
      }
    } catch (error) {
      console.error('save failed', error);
      showStatus('error', error?.response?.data?.message || 'Failed to save stock');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setQuantity(1);
    setLotNumber('');
    setSerialNumbers([]);
    setDetectedBarcode('');
    setCurrentItem(null);
    setStockInfo([]);
    setStatus({ type: '', text: '' });
    if (manualInputRef.current) {
      manualInputRef.current.focus();
    }
  };

  const mapWarehouseName = (warehouseId) => {
    const wh = warehouses.find((w) => w.id === warehouseId);
    return wh ? wh.name : 'Unknown';
  };

  return (
    <div style={{ padding: '20px', background: '#f5f7fb', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '20px', color: '#1a365d' }}>📦 Warehouse Stock Entry</h2>

      {status.text && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '6px',
            backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: status.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`,
            fontWeight: '500'
          }}
        >
          {status.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#1a365d' }}>🔍 Scan Barcode</h4>
          <input
            ref={manualInputRef}
            type="text"
            placeholder="Point scanner here or type barcode manually..."
            onKeyUp={handleBarcodeInput}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '16px',
              marginBottom: '10px'
            }}
          />
          <p style={{ fontSize: '12px', color: '#64748b', margin: '10px 0 0' }}>
            ℹ️ Scanner compatible: CODE_128, CODE_39, QR_CODE, EAN, UPC, PDF417
          </p>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#1a365d' }}>📋 Item Details</h4>
          {currentItem ? (
            <div style={{ fontSize: '14px' }}>
              <p style={{ margin: '6px 0' }}><strong>Code:</strong> {currentItem.itemCode}</p>
              <p style={{ margin: '6px 0' }}><strong>Name:</strong> {currentItem.description || '—'}</p>
              <p style={{ margin: '6px 0' }}><strong>UPC:</strong> {currentItem.barcode || '—'}</p>
              <p style={{ margin: '6px 0', color: '#166534', fontWeight: '600' }}>✓ Ready to receive</p>
            </div>
          ) : (
            <p style={{ color: '#64748b', margin: '0', fontSize: '14px' }}>Scan a barcode to see item details...</p>
          )}
        </div>
      </div>

      {currentItem && stockInfo.length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#1a365d' }}>📊 Current Stock</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Warehouse</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Lot</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {stockInfo.map((record, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{mapWarehouseName(record.warehouseId)}</td>
                  <td style={{ padding: '10px' }}>{record.lotNumber || '—'}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>{record.quantity || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#1a365d' }}>✏️ Stock Entry Form</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>Item Code</span>
            <input type="text" value={currentItem?.itemCode || ''} readOnly style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f1f5f9' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>Quantity *</span>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={{ padding: '10px', border: '2px solid #cbd5e1', borderRadius: '4px' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>Warehouse *</span>
            <select value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)} style={{ padding: '10px', border: '2px solid #cbd5e1', borderRadius: '4px' }}>
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: '600', marginBottom: '5px', fontSize: '14px' }}>Lot Number</span>
            <input type="text" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} placeholder="Optional" style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
          </label>
        </div>

        {serialNumbers.length > 0 && (
          <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>
            <p style={{ fontSize: '12px', margin: '0 0 8px 0', fontWeight: '600' }}>Generated Serial Numbers: {serialNumbers.length}</p>
            <p style={{ fontSize: '12px', margin: 0, color: '#0369a1' }}>{serialNumbers.join(', ')}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={generateSerialNumbers}
            disabled={!currentItem}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: currentItem ? 'pointer' : 'not-allowed',
              opacity: currentItem ? 1 : 0.5
            }}
          >
            Generate Serials
          </button>

          <button
            onClick={handleSaveStock}
            disabled={!currentItem || isSaving}
            style={{
              padding: '10px 20px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: currentItem && !isSaving ? 'pointer' : 'not-allowed',
              opacity: currentItem && !isSaving ? 1 : 0.5
            }}
          >
            {isSaving ? 'Saving...' : '✓ Receive Stock'}
          </button>

          <button
            onClick={handleClear}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
