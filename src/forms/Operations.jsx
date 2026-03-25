import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/apiClient';
import MobileScanner from '../components/MobileScanner';

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
  
  const [activeTab, setActiveTab] = useState('stock');
  const [txMode, setTxMode] = useState('in'); // 'in', 'out', 'transfer', 'bulk'
  
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
    quantity: 0,
    prefix: '',
    generatedSerials: []
  });
  
  const [availableSerials, setAvailableSerials] = useState([]);
  const [serialLoading, setSerialLoading] = useState(false);
  const [serialError, setSerialError] = useState('');
  const [selectedSerialIds, setSelectedSerialIds] = useState(new Set());

  const [lotOptions, setLotOptions] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);

  const parseNumber = (value) => {
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const toggleSerialSelection = useCallback((serialId) => {
    setSelectedSerialIds((prev) => {
      const next = new Set(prev);
      if (next.has(serialId)) {
        next.delete(serialId);
      } else {
        next.add(serialId);
      }
      return next;
    });
  }, []);

  const showStatus = useCallback((type, text) => {
    const normalized = formatStatusMessage(text);
    setStatus({ type, text: normalized });
    if (normalized) {
      setTimeout(() => setStatus({ type: '', text: '' }), 4500);
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
      showStatus('error', 'Failed to load master data');
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

  const selectedItemId = parseNumber(txForm.itemId);
  const selectedWarehouseId = parseNumber(txForm.warehouseId);
  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === txForm.itemId),
    [items, txForm.itemId]
  );
  const isSerialTracked = Boolean(selectedItem?.serialPrefix);
  const requiresSerialSelection = isSerialTracked && (txMode === 'out' || txMode === 'transfer');
  const requiresLotNumberForIn = Boolean(selectedItem?.isLotTracked && txMode === 'in');
  const lotNumberValue = txForm.lotNumber?.trim() ?? '';

  // Load available lots dynamically when item/warehouse changes
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

  const fetchSerialsForLot = useCallback(async () => {
      if (
      !requiresSerialSelection ||
      !selectedItemId ||
      !selectedWarehouseId ||
      !txForm.lotId
    ) {
      setAvailableSerials([]);
      return;
    }

    const lotIdNumber = Number(txForm.lotId);
    if (!Number.isFinite(lotIdNumber)) {
      setAvailableSerials([]);
      setSerialError('Select a lot before loading serial numbers.');
      return;
    }

    setSerialLoading(true);
    try {
      const params = {
        itemId: selectedItemId,
        warehouseId: selectedWarehouseId,
        lotId: lotIdNumber,
        status: 'AVAILABLE'
      };
      if (lotNumberValue) {
        params.lotNumber = lotNumberValue;
      }
      const response = await api.get('/stock/serials', { params });
      setAvailableSerials(Array.isArray(response.data) ? response.data : []);
      setSerialError('');
      setSelectedSerialIds(new Set());
    } catch (error) {
      console.error('Serial fetch failed', error);
      setAvailableSerials([]);
      setSerialError('Unable to load serial numbers for this lot.');
    } finally {
      setSerialLoading(false);
    }
  }, [requiresSerialSelection, selectedItemId, selectedWarehouseId, txForm.lotId]);

  useEffect(() => {
    loadLotOptions();
    // Reset lot selection when switching items
    setTxForm((prev) => ({ ...prev, lotId: '' }));
  }, [loadLotOptions]);

  useEffect(() => {
    fetchSerialsForLot();
  }, [fetchSerialsForLot]);

  useEffect(() => {
    setSelectedSerialIds(new Set());
  }, [selectedItemId, selectedWarehouseId, txForm.lotId, txMode, isSerialTracked]);

  // Auto-Select Lot for OUT / TRANSFER
  useEffect(() => {
    if (lotOptions.length > 0 && (txMode === 'out' || txMode === 'transfer')) {
      const validLot = lotOptions.find(l => l.quantity > 0);
      if (validLot && !txForm.lotId) {
        setTxForm(prev => ({
          ...prev,
          lotId: String(validLot.lotId),
          lotNumber: validLot.lotNumber || prev.lotNumber
        }));
      }
    }
  }, [lotOptions, txMode, txForm.lotId]);

  const getAvailableLots = () => lotOptions.filter((lot) => lot.lotId !== null && lot.quantity > 0);

  // --- SERIAL GENERATION ---
  const openSerialGenerationModal = () => {
    if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity || parseFloat(txForm.quantity) <= 0) {
      return showStatus('error', 'Valid Item, Warehouse, and Quantity required.');
    }
    
    const item = items.find((i) => i.id === parseInt(txForm.itemId, 10));
    const prefix = txForm.prefix || (item ? item.itemCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) : 'SN');

    setSerialGenerationForm({
      quantity: parseFloat(txForm.quantity),
      prefix,
      generatedSerials: []
    });
    setShowSerialModal(true);
  };

  const generateSerialNumbers = () => {
    const qty = serialGenerationForm.quantity;
    if (qty <= 0 || qty > 100) return showStatus('warning', 'Limit: 1-100 units per batch');
    
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const serials = Array.from({ length: qty }, (_, i) => ({
      serialNumber: `${serialGenerationForm.prefix}-${dateStr}-${String(i + 1).padStart(4, '0')}`,
      status: 'Available'
    }));

    setSerialGenerationForm(prev => ({ ...prev, generatedSerials: serials }));
  };

  // --- UNIFIED TRANSACTION PROTOCOL ---
  const handleStockTransaction = async (e) => {
    e?.preventDefault();

    // 1. HANDLE BULK TRANSFER
    if (txMode === 'bulk') {
      if (!txForm.warehouseId || !txForm.destWarehouseId) {
        return showStatus('error', 'Please select Source and Destination Warehouses');
      }
      if (txForm.warehouseId === txForm.destWarehouseId) {
        return showStatus('error', 'Source and Destination cannot be the same');
      }

      setLoading(true);
      try {
        const response = await api.post('/stock/bulk-transfer', null, {
          params: { sourceWhId: txForm.warehouseId, destWhId: txForm.destWarehouseId }
        });
        showStatus('success', response.data || 'Bulk Transfer Successful');
        
        setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
        setTxMode('in');
        fetchData();
      } catch (err) {
        showStatus('error', err.response?.data?.message || err.response?.data || 'Bulk Transfer failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. HANDLE STANDARD TRANSACTIONS (IN / OUT / XFER)
    const itemId = parseNumber(txForm.itemId);
    const warehouseId = parseNumber(txForm.warehouseId);
    const quantity = parseNumber(txForm.quantity);
    const lotIdNumber = parseNumber(txForm.lotId);
    const destWhId = parseNumber(txForm.destWarehouseId);

    if (!itemId || !warehouseId || !quantity) {
      return showStatus('error', 'Please select item, warehouse, and quantity');
    }

    if (txMode === 'in' && selectedItem?.isLotTracked && !lotNumberValue) {
      return showStatus('error', 'Lot-tracked receipts require a lot number.');
    }

    setLoading(true);
    try {
      const numericQuantity = Number(quantity ?? 0);
      const selectedSerialArray = Array.from(selectedSerialIds);
      if (requiresSerialSelection) {
        if (!Number.isFinite(numericQuantity) || numericQuantity <= 0 || !Number.isInteger(numericQuantity)) {
          setLoading(false);
          return showStatus('error', 'Serial tracked transactions require a whole number quantity.');
        }
        if (selectedSerialArray.length !== numericQuantity) {
          setLoading(false);
          return showStatus('error', 'Select one serial number per unit before continuing.');
        }
      }

      let endpoint = `/stock/${txMode}`;
      let payload = {
        itemId,
        warehouseId,
        quantity
      };

      // Add mode-specific payload data
      if (txMode === 'in') {
        payload.lotNumber = lotNumberValue || null;
      } 
      else if (txMode === 'out') {
        if (!lotIdNumber) {
            setLoading(false);
            return showStatus('error', 'Source lot required for dispatch');
        }
        payload.lotId = lotIdNumber;
      } 
      else if (txMode === 'transfer') {
        if (!lotIdNumber || !destWhId) {
            setLoading(false);
            return showStatus('error', 'Lot and Destination Warehouse required');
        }
        payload.lotId = lotIdNumber;
        payload.toWarehouseId = destWhId;
      }

      if (requiresSerialSelection) {
        payload.serialIds = selectedSerialArray;
      }

      const response = await api.post(endpoint, payload);
      showStatus('success', response.data?.message || `Stock ${txMode.toUpperCase()} successful`);
      
      setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
      setSerialGenerationForm({ quantity: 0, prefix: '', generatedSerials: [] });
      setShowSerialModal(false);
      fetchData();
      setSelectedSerialIds(new Set());
      setAvailableSerials([]);
      setSerialError('');
      
    } catch (err) {
      showStatus('error', err.response?.data?.message || err.response?.data || `Transaction failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1000px' }}>
        
        {/* HEADER / TABS ROW */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-2">
          <div className="erp-tabs border-0 m-0">
            {MODE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
                }}
                className={`erp-tab ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
          <button 
            onClick={fetchData} 
            disabled={loading} 
            className="btn btn-sm btn-light border d-flex align-items-center gap-2 text-muted fw-bold shadow-sm" 
            style={{ borderRadius: '3px', marginBottom: '8px' }}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            Refresh API
          </button>
        </div>

        {status.text && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4 shadow-sm`} style={{
            backgroundColor: status.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: status.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${status.type === 'error' ? '#f87171' : '#4ade80'}`
          }}>
            <span className="fw-semibold">{status.text}</span>
            <button className="btn-close btn-sm" onClick={() => setStatus({ type: '', text: '' })}></button>
          </div>
        )}

        {/* SCANNER TAB */}
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
              The scanner feed stays live here. Once a product is detected, switch to the <strong>STOCK</strong> tab to apply quantities and execute movements.
            </div>
          </div>
        )}

        {/* STOCK OPS TAB */}
        {activeTab === 'stock' && (
          <div className="erp-panel shadow-sm">
            <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
              <span className="fw-bold fs-6">Inventory Movement Protocol</span>
            </div>
            <div className="p-4 bg-white">
              
              {/* MODE SELECTOR */}
              <div className="btn-group w-100 mb-4 shadow-sm flex-wrap" role="group">
                <button type="button" className={`btn erp-btn ${txMode === 'in' ? 'btn-success fw-bold' : 'btn-light border'}`} onClick={() => { setTxMode('in'); setTxForm(p => ({...p, lotId: '', destWarehouseId: ''})); }}>📥 IN</button>
                <button type="button" className={`btn erp-btn ${txMode === 'out' ? 'btn-danger fw-bold' : 'btn-light border'}`} onClick={() => { setTxMode('out'); setTxForm(p => ({...p, lotNumber: '', destWarehouseId: ''})); }}>📤 OUT</button>
                <button type="button" className={`btn erp-btn ${txMode === 'transfer' ? 'btn-warning fw-bold text-dark' : 'btn-light border'}`} onClick={() => { setTxMode('transfer'); setTxForm(p => ({...p, lotNumber: ''})); }}>🔁 XFER</button>
                <button type="button" className={`btn erp-btn ${txMode === 'bulk' ? 'btn-info fw-bold text-dark' : 'btn-light border'}`} onClick={() => { setTxMode('bulk'); setTxForm(p => ({...p, itemId: '', quantity: '', lotNumber: '', lotId: ''})); }}>🔄 BULK</button>
              </div>

              <div className="erp-instruction-box mb-4" style={{
                backgroundColor: txMode === 'in' ? '#f0fdf4' : txMode === 'out' ? '#fef2f2' : txMode === 'bulk' ? '#ecfeff' : '#fffbeb',
                borderLeft: `4px solid ${txMode === 'in' ? '#22c55e' : txMode === 'out' ? '#ef4444' : txMode === 'bulk' ? '#0ea5e9' : '#f59e0b'}`
              }}>
                <span className="fw-semibold small text-uppercase" style={{color: '#475569'}}>
                  {txMode === 'in' ? 'Add stock & generate serials' : txMode === 'out' ? 'Dispatch stock & select serials' : txMode === 'bulk' ? 'Move all stock from one location to another' : 'Transfer specific stock & serials between warehouses'}
                </span>
              </div>

              {/* FORM GRID */}
              <form onSubmit={(e) => e.preventDefault()}>
                
                {/* ALWAYS ENABLED: Master Item ID & Source Warehouse */}
                {txMode !== 'bulk' && (
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="erp-label">Master Item ID <span className="text-danger">*</span></label>
                      <select className="form-select erp-input fw-bold text-primary font-monospace" value={txForm.itemId} onChange={(e) => setTxForm({ ...txForm, itemId: e.target.value })}>
                        <option value="">-- Select Product --</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>{item.itemCode}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="erp-label">Active Warehouse <span className="text-danger">*</span></label>
                      <select className="form-select erp-input fw-bold text-dark" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}>
                        <option value="">-- Select Location --</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* BULK MODE: Dual Warehouse Selection */}
                {txMode === 'bulk' && (
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="erp-label">Move FROM <span className="text-danger">*</span></label>
                      <select className="form-select erp-input fw-bold text-dark" value={txForm.warehouseId} onChange={(e) => setTxForm({ ...txForm, warehouseId: e.target.value })}>
                        <option value="">-- Source --</option>
                        {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="erp-label text-warning">Move TO <span className="text-danger">*</span></label>
                      <select className="form-select erp-input fw-bold text-primary" value={txForm.destWarehouseId} onChange={(e) => setTxForm({ ...txForm, destWarehouseId: e.target.value })}>
                        <option value="">-- Target --</option>
                        {warehouses.filter(w => w.id !== parseInt(txForm.warehouseId)).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* DISABLED FIELDSET: Locks Quantity and Lot details until an item is selected */}
                <fieldset disabled={!txForm.itemId && txMode !== 'bulk'}>
                  
                  {/* REGULAR MODES: Quantity and Lots */}
                  {txMode !== 'bulk' && (
                    <div className="row g-3 mb-4">
                      <div className="col-md-4">
                        <label className="erp-label">Quantity <span className="text-danger">*</span></label>
                        <input type="number" className="form-control erp-input font-monospace text-end fw-bold" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} min="0" placeholder="0" />
                      </div>

                      {txMode === 'in' ? (
                        <div className="col-md-8">
                          <label className="erp-label">
                            Assign Lot / Batch String
                            {requiresLotNumberForIn && (
                              <span className="text-danger small ms-2">Required</span>
                            )}
                          </label>
                          <input
                            type="text"
                            className="form-control erp-input font-monospace"
                            value={txForm.lotNumber}
                            onChange={(e) => setTxForm({ ...txForm, lotNumber: e.target.value })}
                            placeholder="Type custom lot (Optional)"
                            required={requiresLotNumberForIn}
                          />
                          {requiresLotNumberForIn && !lotNumberValue && (
                            <div className="text-danger small mt-1">
                              Custom lot batch is required for lot-tracked products.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="col-md-8">
                          <label className="erp-label">Select Source Lot <span className="text-danger">*</span></label>
                          <select
                            className="form-select erp-input font-monospace"
                            value={txForm.lotId}
                            onChange={(e) => {
                              const value = e.target.value;
                              const matchedLot = lotOptions.find((lot) => String(lot.lotId) === value);
                              setTxForm({
                                ...txForm,
                                lotId: value,
                                lotNumber: matchedLot?.lotNumber ?? ""
                              });
                            }}
                            disabled={lotsLoading}
                          >
                            <option value="">{lotsLoading ? 'Loading...' : '-- Choose Active Lot --'}</option>
                            {getAvailableLots().map((lot) => (
                              <option key={`${lot.lotId}-${lot.lotNumber}`} value={lot.lotId}>
                                {lot.lotNumber || 'UNASSIGNED'} (Avail: {lot.quantity})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transfer Specific Field */}
                  {txMode === 'transfer' && (
                    <div className="row g-3 mb-4 p-3 bg-light border rounded m-0">
                      <div className="col-md-12 p-0">
                        <label className="erp-label text-warning">Destination Warehouse <span className="text-danger">*</span></label>
                        <select className="form-select erp-input fw-bold text-primary" value={txForm.destWarehouseId} onChange={(e) => setTxForm({ ...txForm, destWarehouseId: e.target.value })}>
                          <option value="">-- Select Destination Bin --</option>
                          {warehouses.filter((w) => w.id !== parseInt(txForm.warehouseId, 10)).map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="d-flex flex-column gap-2 pt-3 border-top mt-2">
                    {txMode !== 'bulk' && (
                      <button type="button" onClick={openSerialGenerationModal} disabled={loading || !txForm.itemId || !txForm.warehouseId || !txForm.quantity} className="btn btn-outline-primary erp-btn w-100 fw-bold py-2 shadow-sm">
                        + ASSIGN SERIAL NUMBERS
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStockTransaction}
                      disabled={
                        loading ||
                        (txMode === 'bulk'
                          ? (!txForm.warehouseId || !txForm.destWarehouseId)
                          : (!txForm.itemId || !txForm.warehouseId || !txForm.quantity || (requiresLotNumberForIn && !lotNumberValue))
                        )
                      }
                      className={`btn erp-btn w-100 py-3 fw-bold fs-6 shadow-sm ${txMode === 'in' ? 'btn-success' : txMode === 'out' ? 'btn-danger' : txMode === 'bulk' ? 'btn-info text-dark' : 'btn-warning text-dark'}`}
                    >
                      {loading ? 'PROCESSING...' : txMode === 'in' ? 'EXECUTE RECEIPT' : txMode === 'out' ? 'EXECUTE DISPATCH' : txMode === 'bulk' ? 'EXECUTE BULK TRANSFER' : 'EXECUTE TRANSFER'}
                    </button>
                  </div>
                </fieldset>
              </form>

              {/* Dynamic Lot Summary specific to selected item/warehouse */}
              {selectedItemId && selectedWarehouseId && txMode !== 'bulk' && (
                <div className="mt-5 p-4 border rounded bg-light shadow-sm">
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

              {requiresSerialSelection && (
                <div className="mt-4 p-4 border rounded bg-white shadow-sm">
                  <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
                    <div className="me-3">
                      <div className="fw-bold">Serial Selection</div>
                      <div className="text-muted small">
                        Scan or choose serials before executing the {txMode.toUpperCase()} transaction.
                      </div>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={fetchSerialsForLot}
                        disabled={serialLoading}
                      >
                        {serialLoading ? <span className="spinner-border spinner-border-sm" /> : 'Refresh'}
                      </button>
                      <span className="badge bg-info text-dark">
                        {selectedSerialIds.size}/{Number(txForm.quantity ?? 0)}
                      </span>
                    </div>
                  </div>
                  {serialError && <div className="text-danger small mb-2">{serialError}</div>}
                  {serialLoading ? (
                    <div className="text-center text-muted py-3">Loading serial numbers...</div>
                  ) : availableSerials.length === 0 ? (
                    <div className="text-muted small py-3">No serial numbers found for the selected lot.</div>
                  ) : (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {availableSerials.map((serial) => (
                        <label key={serial.id} className="d-flex align-items-start gap-2 serial-entry">
                          <input
                            type="checkbox"
                            disabled={serial.status !== 'AVAILABLE'}
                            checked={selectedSerialIds.has(serial.id)}
                            onChange={() => toggleSerialSelection(serial.id)}
                          />
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark">{serial.serialNumber}</div>
                            <div className="text-muted small">
                              {serial.status}
                              {serial.purchaseOrderNumber && (
                                <span className="d-block">PO: {serial.purchaseOrderNumber}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-muted small">{serial.createdDate}</span>
                        </label>
                      ))}
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
        <div className="erp-modal-overlay" style={{ zIndex: 1060 }}>
          <div className="erp-dialog erp-dialog-md w-100 mx-3">
            <div className="erp-dialog-header">
              <h6 className="m-0 fw-bold">Serial Number Allocation / Verification</h6>
              <button className="btn-close btn-close-white" onClick={() => setShowSerialModal(false)}></button>
            </div>
            <div className="erp-dialog-body bg-white p-3">
              <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light border rounded">
                <div>
                  <span className="erp-label m-0">Target Qty</span>
                  <span className="fs-5 fw-bold font-monospace text-primary">{serialGenerationForm.quantity}</span>
                </div>
                <button className="btn btn-sm btn-outline-primary fw-bold erp-btn" onClick={generateSerialNumbers}>
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
                <div className="text-center py-4 text-muted small border rounded bg-light shadow-sm">
                  Click generate to assign unique serials for this transaction.
                </div>
              )}
            </div>
            <div className="p-3 bg-light border-top d-flex justify-content-end gap-2">
              <button className="btn btn-light border erp-btn" onClick={() => setShowSerialModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary erp-btn px-4" 
                onClick={() => {
                  setShowSerialModal(false);
                  handleStockTransaction(); 
                }}
                disabled={serialGenerationForm.generatedSerials.length === 0 || loading}
              >
                {loading ? 'Saving...' : 'Commit & Execute TX'}
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
          overflow: hidden;
        }
        .erp-panel-header {
          background-color: #f8f9fa;
          border-bottom: 1px solid var(--erp-border);
          padding: 12px 16px;
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
          padding: 8px 10px;
        }
        .erp-input:focus {
          border-color: var(--erp-primary);
          box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
        }
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.8rem;
          padding: 6px 14px;
          transition: transform 0.1s ease;
        }
        .erp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .erp-label {
          font-size: 0.75rem;
          font-weight: 700;
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

        .erp-instruction-box {
          padding: 12px 16px;
          border-radius: 3px;
        }

        .erp-lot-row {
          display: flex; justify-content: space-between; align-items: center;
          background: white; border: 1px solid var(--erp-border);
          padding: 10px 16px; border-radius: 3px;
        }

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
        .erp-dialog-md { max-width: 500px; }
        .erp-dialog-header {
          background-color: var(--erp-primary);
          color: white;
          padding: 12px 20px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .serial-entry {
          border: 1px solid var(--erp-border);
          border-radius: 5px;
          padding: 10px;
        }
        .serial-entry input {
          margin-top: 6px;
        }
        .erp-dialog-body {
          padding: 0;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}
