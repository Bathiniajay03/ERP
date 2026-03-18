import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/apiClient';
import WarehouseScanner from '../components/WarehouseScanner';
import MobileScanner from '../components/MobileScanner';
import './Operations.css';

const MODE_TABS = ['stock', 'sales', 'scanner'];

export default function Operations() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scanner');

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
  }, []);

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

  const showStatus = (type, text) => {
    const normalized = formatStatusMessage(text);
    setStatus({ type, text: normalized });
    if (normalized) {
      setTimeout(() => setStatus({ type: '', text: '' }), 4000);
    }
  };

  const parseId = (value) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const selectedItemId = parseId(txForm.itemId);
  const selectedWarehouseId = parseId(txForm.warehouseId);
  const matchingLots =
    selectedItemId && selectedWarehouseId
      ? inventory.filter(
          (entry) => entry.itemId === selectedItemId && entry.warehouseId === selectedWarehouseId
        )
      : [];

  const getAvailableLots = () => {
    if (!selectedItemId || !selectedWarehouseId) return [];
    return matchingLots.filter((lot) => lot.lotId !== null && (Number(lot.quantity) || 0) > 0);
  };

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
        qty: parseFloat(serialGenerationForm.quantity),
        lotNumber: serialGenerationForm.lotNumber.trim() || null
      };

      await api.post('/stock/in', null, { params: payload });

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

      showStatus('success', `Stock IN & ${serialGenerationForm.quantity} serials synced!`);
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

    if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity) {
      return showStatus('error', 'Missing fields');
    }
    if (txMode === 'transfer' && !txForm.destWarehouseId) {
      return showStatus('error', 'Please select destination warehouse');
    }
    if ((txMode === 'out' || txMode === 'transfer') && !txForm.lotId) {
      return showStatus('error', 'Please select a lot');
    }

    try {
      const params = {
        itemId: parseInt(txForm.itemId, 10),
        warehouseId: parseInt(txForm.warehouseId, 10),
        qty: parseFloat(txForm.quantity)
      };
      if (txMode === 'out' || txMode === 'transfer') {
        params.lotId = parseInt(txForm.lotId, 10);
      }
      if (txMode === 'transfer') {
        params.destWhId = parseInt(txForm.destWarehouseId, 10);
      }
      if (txMode === 'in' && txForm.lotNumber) {
        params.lotNumber = txForm.lotNumber;
      }

      await api.post(`/stock/${txMode}`, null, { params });
      showStatus('success', `Stock ${txMode.toUpperCase()} successful`);
      setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
      fetchData();
    } catch (err) {
      showStatus('error', err.response?.data || 'Transaction failed');
    }
  };

  const modeOptions = {
    in: { label: '📦 Add stock + generate serials', background: '#d1fae5', border: '#059669' },
    out: { label: '🚚 Dispatch stock from warehouse', background: '#fee2e2', border: '#dc2626' },
    transfer: { label: '🔁 Transfer stock between warehouses', background: '#fef3c7', border: '#d97706' }
  };

  const currentModeInfo = modeOptions[txMode] || modeOptions.in;
  const modeButtonAccent = {
    in: { backgroundColor: '#10b981', borderColor: '#059669', color: '#fff' },
    out: { backgroundColor: '#ef4444', borderColor: '#dc2626', color: '#fff' },
    transfer: { backgroundColor: '#f59e0b', borderColor: '#d97706', color: '#111827' }
  };

  return (
    <div className="operations-wrapper">
      <div className="operations-header">
        <div className="operations-title-block">
          <h2>Operations Command Center</h2>
          <p>Stock management & order fulfillment</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="operations-refresh-btn"
        >
          {loading ? 'Refreshing data…' : 'Refresh Data'}
        </button>
      </div>

      {status.text && (
        <div
          className="status-alert"
          style={{
            backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: status.type === 'success' ? '#166534' : '#991b1b',
            borderColor: status.type === 'success' ? '#166534' : '#991b1b'
          }}
        >
          {status.text}
        </div>
      )}

      <div className="tabs-grid">
        {MODE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'scanner' && (
        <>
          <div className="scanner-panel focus">
            <MobileScanner
              items={items}
              warehouses={warehouses}
              inventory={inventory}
              fetchData={fetchData}
              onScanDetected={handleScannerPopulate}
            />
          </div>
          <p className="operations-scanner-callout">
            The scanner feed stays live here for quick barcode captures. Once a product is detected,
            switch to the STOCK tab to apply lot numbers, quantities, and serials.
          </p>
        </>
      )}
{/* 
      {activeTab === 'sales' && (
        <div className="operations-card">
          <h3 style={{ margin: 0 }}>Sales operations</h3>
          <p style={{ marginTop: '8px', color: '#475569' }}>
            Sales workflows are in progress. Use the STOCK tab to move inventory for now.
          </p>
        </div>
      )} */}

      {activeTab === 'stock' && (
        <>
          {/* <WarehouseScanner /> */}
          <div className="operations-card">
            <h3 style={{ margin: 0 }}>Stock Movement</h3>
            <div className="mode-selector">
              {['in', 'out', 'transfer'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`mode-btn ${txMode === mode ? 'active' : ''}`}
                  style={txMode === mode ? modeButtonAccent[mode] : undefined}
                  onClick={() => setTxMode(mode)}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>

            <div
              className="mode-info"
              style={{
                backgroundColor: currentModeInfo.background,
                borderColor: currentModeInfo.border
              }}
            >
              {currentModeInfo.label}
            </div>

            <form className="operation-form-grid" onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label>Product</label>
                <select
                  value={txForm.itemId}
                  onChange={(e) => setTxForm({ ...txForm, itemId: e.target.value })}
                >
                  <option value="">-- Select --</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Warehouse</label>
                <select
                  value={txForm.warehouseId}
                  onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}
                >
                  <option value="">-- Select --</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={txForm.quantity}
                  onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                  min="0"
                />
              </div>

              {txMode === 'in' && (
                <div className="form-group">
                  <label>Lot Number</label>
                  <input
                    type="text"
                    value={txForm.lotNumber}
                    onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })}
                    placeholder="Enter lot number"
                  />
                </div>
              )}

              {txMode !== 'in' && (
                <div className="form-group">
                  <label>Select Lot</label>
                  <select
                    value={txForm.lotId}
                    onChange={(e) => setTxForm({ ...txForm, lotId: e.target.value })}
                  >
                    <option value="">-- Choose Lot --</option>
                    {getAvailableLots().map((lot) => (
                      <option key={lot.id} value={lot.lotId}>
                        {lot.lotNumber || 'Unassigned'} (Qty: {lot.quantity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {txMode === 'transfer' && (
                <div className="form-group">
                  <label>Destination Warehouse</label>
                  <select
                    value={txForm.destWarehouseId}
                    onChange={(e) => setTxForm({ ...txForm, destWarehouseId: e.target.value })}
                  >
                    <option value="">-- Select Destination --</option>
                    {warehouses
                      .filter((warehouse) => warehouse.id !== parseInt(txForm.warehouseId, 10))
                      .map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={(e) => (txMode === 'in' ? openSerialGenerationModal() : handleStockTransaction(e))}
                  className={`stock-${txMode}`}
                >
                  {txMode === 'in'
                    ? '📦 Generate & Receive'
                    : txMode === 'out'
                    ? '🚚 Execute STOCK OUT'
                    : '🔁 Execute TRANSFER'}
                </button>
              </div>
            </form>

            {selectedItemId && selectedWarehouseId && (
              <div className="lot-summary">
                <h4 style={{ margin: 0, marginBottom: '12px' }}>Lot overview</h4>
                {matchingLots.length === 0 ? (
                  <p className="lot-card-line">
                    No lots registered for this product/warehouse combination yet.
                  </p>
                ) : (
                  <div className="lot-grid">
                    {matchingLots.map((lot) => {
                      const quantity = Number(lot.quantity) || 0;
                      const statusColor = quantity > 0 ? '#064e3b' : '#b91c1c';
                      return (
                        <div
                          key={`${lot.lotId ?? 'lot'}-${lot.lotNumber || 'unknown'}`}
                          className="lot-card"
                        >
                          <div className="lot-card-line">
                            <strong>Lot:</strong> {lot.lotNumber || 'Unassigned'}
                          </div>
                          <div className="lot-card-line">
                            <strong>Qty:</strong> {quantity}
                          </div>
                          <div className="lot-card-line" style={{ color: statusColor, fontSize: '12px' }}>
                            {quantity > 0 ? 'Ready for dispatch' : 'Empty lot'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Serial Modal Placeholder Logic follows Bootstrap classes provided in original */}
      {showSerialModal && (
        <div className="modal d-block" style={{ background: 'rgba(15, 23, 42, 0.7)', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Generate Serials</h5>
              </div>
              <div className="modal-body">
                <p>Quantity: {serialGenerationForm.quantity}</p>
                <button className="btn btn-primary mb-2" onClick={generateSerialNumbers}>
                  Generate List
                </button>
                <div style={{ maxHeight: '220px', overflowY: 'auto', marginTop: '10px' }}>
                  {serialGenerationForm.generatedSerials.map((s, i) => (
                    <div key={i}>{s.serialNumber}</div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={confirmStockTransactionWithSerials}>
                  Confirm & Save
                </button>
                <button className="btn btn-secondary" onClick={() => setShowSerialModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
