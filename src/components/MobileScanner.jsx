import React, { useState, useRef, useEffect } from 'react';
import api from '../services/apiClient';

export default function MobileScanner({ items, warehouses, onStatus, onRefresh }) {
  const [scannedItem, setScannedItem] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedLot, setSelectedLot] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [operation, setOperation] = useState('in');
  const [destWarehouse, setDestWarehouse] = useState('');
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" } // Back camera
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      onStatus('error', 'Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const scanBarcode = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    // For demo purposes, we'll use a mock barcode
    // In real implementation, you'd use a barcode scanning library
    const mockBarcode = "123456789";
    await processBarcode(mockBarcode);
  };

  const processBarcode = async (barcode) => {
    try {
      setLoading(true);
      const response = await api.get(`/items/barcode/${barcode}`);
      const itemData = response.data;
      setScannedItem(itemData);

      // Load lots for this item
      await loadLots(itemData.itemId);

      onStatus('success', `Scanned: ${itemData.itemName}`);
    } catch (err) {
      onStatus('error', 'Item not found');
    } finally {
      setLoading(false);
    }
  };

  const loadLots = async (itemId) => {
    try {
      const response = await api.get('/lots', { params: { itemId } });
      setLots(response.data || []);
    } catch (err) {
      console.error('Failed to load lots:', err);
    }
  };

  const handleStockOperation = async () => {
    if (!scannedItem || !selectedWarehouse) {
      onStatus('error', 'Please select warehouse');
      return;
    }

    try {
      setLoading(true);

      const operationData = {
        itemId: scannedItem.itemId,
        warehouseId: selectedWarehouse,
        lotId: selectedLot || null,
        quantity: quantity
      };

      let endpoint = '';
      if (operation === 'in') {
        endpoint = '/api/scanneroperations/stock-in';
      } else if (operation === 'out') {
        endpoint = '/api/scanneroperations/stock-out';
      } else if (operation === 'transfer') {
        if (!destWarehouse) {
          onStatus('error', 'Please select destination warehouse');
          return;
        }
        operationData.destWarehouseId = destWarehouse;
        operationData.sourceWarehouseId = selectedWarehouse;
        endpoint = '/api/scanneroperations/transfer';
      }

      await api.post(endpoint, operationData);

      onStatus('success', `${operation.toUpperCase()} operation completed`);
      resetForm();
      onRefresh();

    } catch (err) {
      onStatus('error', 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setScannedItem(null);
    setSelectedWarehouse('');
    setSelectedLot('');
    setQuantity(1);
    setDestWarehouse('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h3 style={styles.title}>Mobile Barcode Scanner</h3>

        {/* Camera View */}
        <div style={styles.cameraContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.camera}
          />
          <button
            onClick={scanBarcode}
            disabled={loading}
            style={styles.scanButton}
          >
            {loading ? 'Scanning...' : 'Scan Barcode'}
          </button>
        </div>

        {/* Scanned Item Display */}
        {scannedItem && (
          <div style={styles.itemCard}>
            <h4>Scanned Item</h4>
            <p><strong>Name:</strong> {scannedItem.itemName}</p>
            <p><strong>Code:</strong> {scannedItem.itemCode}</p>
          </div>
        )}

        {/* Operation Form */}
        {scannedItem && (
          <div style={styles.form}>
            <div style={styles.formRow}>
              <label>Warehouse:</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                style={styles.select}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Lot Number:</label>
              <select
                value={selectedLot}
                onChange={(e) => setSelectedLot(e.target.value)}
                style={styles.select}
              >
                <option value="">Select Lot (Optional)</option>
                {lots.map(lot => (
                  <option key={lot.id} value={lot.id}>{lot.lotNumber}</option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Operation:</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                style={styles.select}
              >
                <option value="in">Stock IN</option>
                <option value="out">Stock OUT</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {operation === 'transfer' && (
              <div style={styles.formRow}>
                <label>Destination Warehouse:</label>
                <select
                  value={destWarehouse}
                  onChange={(e) => setDestWarehouse(e.target.value)}
                  style={styles.select}
                >
                  <option value="">Select Destination</option>
                  {warehouses.filter(wh => wh.id !== selectedWarehouse).map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={styles.formRow}>
              <label>Quantity:</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
                style={styles.input}
              />
            </div>

            <button
              onClick={handleStockOperation}
              disabled={loading || !selectedWarehouse}
              style={styles.submitButton}
            >
              {loading ? 'Processing...' : `Execute ${operation.toUpperCase()}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px' },
  card: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  title: { marginBottom: '20px', color: '#333' },
  cameraContainer: { position: 'relative', marginBottom: '20px' },
  camera: { width: '100%', maxWidth: '400px', borderRadius: '8px' },
  scanButton: {
    position: 'absolute',
    bottom: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 20px',
    background: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  itemCard: { background: '#f8f9fa', padding: '16px', borderRadius: '6px', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '8px' },
  select: { padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
  input: { padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
  submitButton: {
    padding: '12px',
    background: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};