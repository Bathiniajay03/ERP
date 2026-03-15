import React, { useEffect, useRef, useState } from 'react';
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  NotFoundException
} from '@zxing/library';
import { smartErpApi } from '../services/smartErpApi';

const SCAN_COOLDOWN_MS = 2000;

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.PDF_417
]);

export default function WarehouseScanner() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const statusTimeout = useRef(null);

  const [detectedBarcode, setDetectedBarcode] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [stockInfo, setStockInfo] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lotNumber, setLotNumber] = useState('');
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const lastScan = useRef({ barcode: '', timestamp: 0 });

  const showStatus = (type, text) => {
    setStatus({ type, text });
    if (statusTimeout.current) {
      clearTimeout(statusTimeout.current);
    }
    statusTimeout.current = setTimeout(() => {
      setStatus({ type: '', text: '' });
    }, 4000);
  };

  const fetchWarehouses = async () => {
    try {
      const response = await smartErpApi.warehouses();
      const data = response.data || [];
      setWarehouses(data);
    } catch (error) {
      console.error('warehouse load failed', error);
      showStatus('error', 'Unable to load warehouses');
    }
  };

  const mapWarehouseName = (warehouseId) => {
    const wh = warehouses.find((w) => w.id === warehouseId);
    return wh ? wh.name : 'Unknown';
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (warehouses.length && !selectedWarehouseId) {
      setSelectedWarehouseId(String(warehouses[0].id));
    }
  }, [warehouses, selectedWarehouseId]);

  useEffect(() => {
    return () => {
      if (statusTimeout.current) {
        clearTimeout(statusTimeout.current);
      }
    };
  }, []);

  const fetchItemDetails = async (barcode) => {
    setCurrentItem(null);
    setStockInfo([]);
    try {
      const itemsRes = await smartErpApi.stockItems();
      const normalized = (barcode || '').trim().toLowerCase();
      const match = (itemsRes.data || []).find(
        (item) =>
          (item.barcode || '').toLowerCase() === normalized ||
          (item.itemCode || '').toLowerCase() === normalized
      );
      if (!match) {
        showStatus('error', 'Item not found for scanned barcode');
        return;
      }
      setCurrentItem(match);
      const inventoryRes = await smartErpApi.stockInventory();
      const filtered = (inventoryRes.data || []).filter(
        (record) => record.itemId === match.id
      );
      setStockInfo(filtered);
    } catch (error) {
      console.error('fetch item failed', error);
      showStatus('error', 'Failed to load item details');
    }
  };

  const handleScanResult = (code) => {
    if (!code) return;
    const now = Date.now();
    if (
      code === lastScan.current.barcode &&
      now - lastScan.current.timestamp < SCAN_COOLDOWN_MS
    ) {
      return;
    }
    lastScan.current = { barcode: code, timestamp: now };
    setDetectedBarcode(code);
    fetchItemDetails(code);
  };

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    const startScanner = async () => {
      try {
        // First request camera permission
        await navigator.mediaDevices.getUserMedia({ video: true });

        // Then enumerate video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length === 0) {
          throw new Error('No camera devices found');
        }

        const preferred = videoDevices[0]?.deviceId;

        await reader.decodeFromVideoDevice(
          preferred || undefined,
          videoRef.current,
          (result, error) => {
            if (result) {
              handleScanResult(result.getText());
            } else if (error && !(error instanceof NotFoundException)) {
              console.error('scan error', error);
            }
          }
        );
      } catch (error) {
        console.error('camera init failed', error);
        showStatus('error', `Unable to access camera: ${error.message}`);
      }
    };

    startScanner();

    return () => {
      reader.reset();
      readerRef.current = null;
    };
  }, []);

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
    const warehouse = warehouses.find((w) => w.id === Number(selectedWarehouseId));
    setIsSaving(true);
    try {
      await smartErpApi.deviceEvent({
        deviceType: 'Scanner',
        eventType: 'StockIn',
        payload: detectedBarcode,
        quantity: qty,
        lotNumber: lotNumber.trim() || null,
        serialNumbers,
        warehouse: warehouse
          ? { id: warehouse.id, name: warehouse.name, code: warehouse.code }
          : null,
        deviceId: 'BrowserCamera'
      });
      showStatus('success', 'Stock Added Successfully');
      setQuantity(1);
      setLotNumber('');
      setSerialNumbers([]);
    } catch (error) {
      console.error('save failed', error);
      showStatus('error', 'Failed to save stock');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setQuantity(1);
    setLotNumber('');
    setSerialNumbers([]);
    setStatus({ type: '', text: '' });
  };

  const selectedWarehouse = warehouses.find(
    (w) => String(w.id) === selectedWarehouseId
  );

  return (
    <section style={styles.wrapper}>
      <div style={styles.scannerGrid}>
        <div style={styles.cameraWrapper}>
          <video ref={videoRef} style={styles.video} muted playsInline autoPlay />
          <div style={styles.barcodeBadge}>
            <span style={{ fontWeight: 600 }}>Detected Barcode:</span>
            <p style={{ margin: '4px 0 0' }}>{detectedBarcode || 'Waiting for scan...'}</p>
          </div>
        </div>

        <div style={styles.detailsPanel}>
          <h3 style={styles.sectionHeading}>Item Details</h3>
          {currentItem ? (
            <div>
              <p>
                <strong>Name:</strong> {currentItem.description || '—'}
              </p>
              <p>
                <strong>Item Code:</strong> {currentItem.itemCode}
              </p>
              <p>
                <strong>Default Warehouse:</strong>{' '}
                {selectedWarehouse ? selectedWarehouse.name : 'Not selected'}
              </p>
              <div>
                <strong>Stock Information</strong>
                {stockInfo.length === 0 ? (
                  <p style={styles.emptyText}>No stock records available.</p>
                ) : (
      <table style={styles.stockTable}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Warehouse</th>
            <th style={styles.tableHeader}>Lot</th>
            <th style={styles.tableHeader}>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {stockInfo.map((record) => (
            <tr key={`${record.warehouseId}-${record.lotId ?? 'lot'}-${record.quantity ?? 0}`}>
                          <td style={styles.tableCell}>
                            {mapWarehouseName(record.warehouseId)}
                          </td>
                          <td style={styles.tableCell}>{record.lotNumber || '—'}</td>
                          <td style={styles.tableCell}>{record.quantity ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <p style={styles.emptyText}>Scan a barcode to populate item details.</p>
          )}
        </div>
      </div>

      <div style={styles.formPanel}>
        <h3 style={styles.sectionHeading}>Warehouse Stock Entry</h3>
        {status.text && (
          <div
            style={{
              ...styles.status,
              backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: status.type === 'success' ? '#166534' : '#991b1b',
              borderColor: status.type === 'success' ? '#166534' : '#991b1b'
            }}
          >
            {status.text}
          </div>
        )}

        <div style={styles.formGrid}>
          <label style={styles.label}>
            Item Name
            <input type="text" value={currentItem?.description || ''} readOnly style={styles.input} />
          </label>
          <label style={styles.label}>
            Barcode
            <input type="text" value={detectedBarcode} readOnly style={styles.input} />
          </label>
          <label style={styles.label}>
            Quantity
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Lot Number
            <input
              type="text"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Warehouse
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              style={styles.input}
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            onClick={generateSerialNumbers}
            style={{ ...styles.primaryBtn, marginRight: '12px' }}
            disabled={!currentItem || Number(quantity) <= 0}
          >
            Generate Serial Numbers
          </button>
          <button
            type="button"
            onClick={handleSaveStock}
            style={styles.successBtn}
            disabled={isSaving || !currentItem || Number(quantity) <= 0}
          >
            {isSaving ? 'Saving...' : 'Save Stock IN'}
          </button>
          <button type="button" onClick={handleClear} style={styles.secondaryBtn}>
            Clear
          </button>
        </div>

        <div style={styles.serialArea}>
          <h4 style={{ marginBottom: '8px' }}>Serial Numbers</h4>
          {serialNumbers.length === 0 ? (
            <p style={styles.emptyText}>No serial numbers generated yet.</p>
          ) : (
            <div style={styles.serialList}>
              {serialNumbers.map((serial) => (
                <div key={serial} style={styles.serialRow}>
                  {serial}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '0 0 24px'
  },
  scannerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  cameraWrapper: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: '320px'
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  barcodeBadge: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    right: '12px',
    padding: '12px',
    backgroundColor: 'rgba(15,23,42,0.82)',
    color: '#fff',
    borderRadius: '8px'
  },
  detailsPanel: {
    padding: '18px',
    borderRadius: '12px',
    background: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
  },
  sectionHeading: {
    margin: 0,
    marginBottom: '12px',
    fontSize: '18px'
  },
  emptyText: {
    margin: '0',
    color: '#6b7280'
  },
  stockTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px'
  },
  tableHeader: {
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    padding: '6px 4px'
  },
  tableCell: {
    padding: '6px 4px',
    borderBottom: '1px solid #f3f4f6'
  },
  formPanel: {
    padding: '20px',
    borderRadius: '12px',
    background: '#fff',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginTop: '12px'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a'
  },
  input: {
    marginTop: '6px',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #cbd5f5',
    fontSize: '14px'
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    marginTop: '20px',
    gap: '12px',
    alignItems: 'center'
  },
  primaryBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    color: '#fff',
    border: 'none',
    cursor: 'pointer'
  },
  successBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    cursor: 'pointer'
  },
  secondaryBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: '#e2e8f0',
    border: 'none',
    cursor: 'pointer'
  },
  status: {
    borderRadius: '8px',
    padding: '10px',
    border: '1px solid',
    marginBottom: '16px'
  },
  serialArea: {
    marginTop: '18px'
  },
  serialList: {
    maxHeight: '200px',
    overflowY: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px',
    backgroundColor: '#f8fafc'
  },
  serialRow: {
    padding: '6px 8px',
    borderBottom: '1px solid #e2e8f0',
    fontFamily: 'monospace'
  }
};
