import React, { useEffect, useState } from 'react';
import api from '../services/apiClient';
import WarehouseScanner from '../components/WarehouseScanner';
import MobileScanner from '../components/MobileScanner';

export default function Operations() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock');

  // Stock Transaction State
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
  
  // Serial Generation Modal State
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialGenerationForm, setSerialGenerationForm] = useState({
    itemId: null,
    warehouseId: '',
    quantity: 0,
    lotNumber: '',
    prefix: '',
    generatedSerials: []
  });

  // Sales Workflow State
  const [salesForm, setSalesForm] = useState({
    customerName: '',
    itemId: '',
    warehouseId: '',
    quantity: 1
  });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, whRes, invRes] = await Promise.all([
        api.get('/stock/items'),
        api.get('/warehouses'),
        api.get('/stock/inventory')
      ]);
      setItems(itemsRes.data || []);
      setWarehouses(whRes.data || []);
      setInventory(invRes.data || []);
    } catch (err) {
      showStatus('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatus = (type, text) => {
    setStatus({ type, text });
    setTimeout(() => setStatus({ type: '', text: '' }), 4000);
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
          (i) => i.itemId === selectedItemId && i.warehouseId === selectedWarehouseId
        )
      : [];

  const getAvailableLots = () => {
    if (!selectedItemId || !selectedWarehouseId) return [];
    return matchingLots.filter((lot) => lot.lotId !== null && (Number(lot.quantity) || 0) > 0);
  };

  const openSerialGenerationModal = () => {
    const item = items.find(i => i.id === parseInt(txForm.itemId));
    const prefix = txForm.prefix || (item ? item.itemCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) : '');
    
    setSerialGenerationForm({
      itemId: parseInt(txForm.itemId),
      warehouseId: txForm.warehouseId,
      quantity: parseInt(txForm.quantity),
      lotNumber: txForm.lotNumber,
      prefix: prefix,
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
    setSerialGenerationForm(prev => ({ ...prev, generatedSerials: serials }));
  };

  const confirmStockTransactionWithSerials = async () => {
   setLoading(true);
    try {
      // 1. Execute Stock In FIRST to create the lot
     const params = {
       itemId: serialGenerationForm.itemId,
       warehouseId: parseInt(serialGenerationForm.warehouseId),
        qty: parseFloat(serialGenerationForm.quantity),
        lotNumber: serialGenerationForm.lotNumber.trim() || null
      };
      
      await api.post('/stock/in', null, { params });
      
      // 2. Now fetch the inventory to get the created lot ID
     const inventoryRes = await api.get('/stock/inventory');
     const inventoryList = inventoryRes.data || [];
      
      // Find the lot we just created/updated
     const matchingInventory = inventoryList.find(inv => 
        inv.itemId === serialGenerationForm.itemId && 
        inv.warehouseId === parseInt(serialGenerationForm.warehouseId) &&
        inv.lotNumber === (serialGenerationForm.lotNumber.trim() || null)
      );
      
     const lotId = matchingInventory ? matchingInventory.lotId: null;
      
      // 3. Generate Serials AFTER stock receipt (now lot exists!)
      if (lotId) {
        await api.post("/smart-erp/inventory/generate-serials", {
         itemId: serialGenerationForm.itemId,
         warehouseId: parseInt(serialGenerationForm.warehouseId),
          quantity: serialGenerationForm.quantity,
          lotId: lotId  // Pass the actual lot ID now!
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
    if (!txForm.itemId || !txForm.warehouseId || !txForm.quantity) return showStatus('error', 'Missing fields');
    if (txMode === 'transfer' && !txForm.destWarehouseId) return showStatus('error', 'Please select destination warehouse');
    if ((txMode === 'out' || txMode === 'transfer') && !txForm.lotId) return showStatus('error', 'Please select a lot');

    try {
      const params = {
        itemId: parseInt(txForm.itemId),
        warehouseId: parseInt(txForm.warehouseId),
        qty: parseFloat(txForm.quantity)
      };

      if (txMode === 'out' || txMode === 'transfer') params.lotId = parseInt(txForm.lotId);
      if (txMode === 'transfer') params.destWhId = parseInt(txForm.destWarehouseId);
      if (txMode === 'in' && txForm.lotNumber) params.lotNumber = txForm.lotNumber;

      await api.post(`/stock/${txMode}`, null, { params });
      showStatus('success', `Stock ${txMode.toUpperCase()} successful`);
      setTxForm({ itemId: '', warehouseId: '', destWarehouseId: '', quantity: '', lotNumber: '', lotId: '', prefix: '' });
      fetchData();
    } catch (err) {
      showStatus('error', err.response?.data || 'Transaction failed');
    }
  };

  // Logic for sales, picking, shipping etc remains same but UI is cleaned below
  const createSalesOrder = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/smart-erp/orders', {
        customerName: salesForm.customerName.trim(),
        items: [{
          itemId: parseInt(salesForm.itemId),
          warehouseId: parseInt(salesForm.warehouseId),
          quantity: parseInt(salesForm.quantity)
        }]
      });
      setCurrentOrder({
        id: response.data.orderId,
        orderNumber: response.data.orderNumber,
        totalAmount: response.data.totals?.totalAmount || 0,
        status: 'Created'
      });
      showStatus('success', `Order #${response.data.orderNumber} created!`);
    } catch (err) { showStatus('error', 'Order failed'); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Operations Command Center</h2>
          <p style={styles.subtitle}>Stock management & order fulfillment</p>
        </div>
        <button onClick={fetchData} disabled={loading} style={styles.refreshBtn}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {status.text && (
        <div style={{
          ...styles.statusMessage,
          backgroundColor: status.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: status.type === 'success' ? '#166534' : '#991b1b',
          borderWidth: '1px', borderStyle: 'solid', borderColor: status.type === 'success' ? '#166534' : '#991b1b'
        }}>
          {status.text}
        </div>
      )}

      <div style={styles.tabs}>
        {['stock', 'sales', 'scanner'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} 
            style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'stock' && (
        <>
          <WarehouseScanner />
          <div style={styles.card}>
          <h3 style={styles.cardTitle}>Stock Movement</h3>
          <div style={styles.modeSelector}>
            {['in', 'out', 'transfer'].map(mode => (
              <button key={mode} onClick={() => {setTxMode(mode);}}
                style={{
                  ...styles.modeBtn,
                  ...(txMode === mode ? {
                    backgroundColor: mode === 'in' ? '#10b981' : mode === 'out' ? '#ef4444' : '#f59e0b',
                    color: '#fff',
                    borderColor: mode === 'in' ? '#059669' : mode === 'out' ? '#dc2626' : '#d97706'
                  } : {})
                }}>
                {mode.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{
            ...styles.infoBox,
            backgroundColor: txMode === 'in' ? '#d1fae5' : txMode === 'out' ? '#fee2e2' : '#fef3c7',
            borderColor: txMode === 'in' ? '#059669' : txMode === 'out' ? '#dc2626' : '#d97706'
          }}>
            {txMode === 'in' ? 'ðŸ“¥ Add stock + generate serials' : txMode === 'out' ? 'ðŸ“¤ Dispatch stock from warehouse' : 'ðŸ”„ Transfer stock between warehouses'}
          </div>

          <form onSubmit={(e) => e.preventDefault()} style={styles.formGrid}>
             {/* Product Select */}
             <div style={styles.formGroup}>
              <label style={styles.label}>Product</label>
              <select value={txForm.itemId} onChange={(e) => setTxForm({...txForm, itemId: e.target.value})} style={styles.select}>
                <option value="">-- Select --</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
              </select>
            </div>
            {/* Warehouse Select */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Warehouse</label>
              <select value={txForm.warehouseId} onChange={(e) => setTxForm({...txForm, warehouseId: e.target.value})} style={styles.select}>
                <option value="">-- Select --</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            {/* Quantity */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Quantity</label>
              <input type="number" value={txForm.quantity} onChange={(e) => setTxForm({...txForm, quantity: e.target.value})} style={styles.input} />
            </div>

            {txMode === 'in' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Lot Number</label>
                <input type="text" value={txForm.lotNumber} onChange={(e) => setTxForm({...txForm, lotNumber: e.target.value})} style={styles.input} />
              </div>
            )}

            {txMode !== 'in' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Lot</label>
                <select value={txForm.lotId} onChange={(e) => setTxForm({...txForm, lotId: e.target.value})} style={styles.select}>
                  <option value="">-- Choose Lot --</option>
                  {getAvailableLots().map(l => <option key={l.id} value={l.lotId}>{l.lotNumber} (Qty: {l.quantity})</option>)}
                </select>
              </div>
            )}

            {txMode === 'transfer' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Destination Warehouse</label>
                <select value={txForm.destWarehouseId} onChange={(e) => setTxForm({...txForm, destWarehouseId: e.target.value})} style={styles.select}>
                  <option value="">-- Select Destination --</option>
                  {warehouses.filter(w => w.id !== parseInt(txForm.warehouseId)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            )}

            <button type="button" onClick={(e) => txMode === 'in' ? openSerialGenerationModal() : handleStockTransaction(e)}
              style={{ ...styles.submitBtn, backgroundColor: txMode === 'in' ? '#10b981' : txMode === 'out' ? '#ef4444' : '#f59e0b' }}>
              {txMode === 'in' ? '📦 Generate & Receive' : txMode === 'out' ? '🚚 Execute STOCK OUT' : '🔁 Execute TRANSFER'}
            </button>
          </form>

          {selectedItemId && selectedWarehouseId && (
            <div style={styles.lotSummary}>
              <h4 style={{ marginTop: 0, marginBottom: '12px' }}>Lot overview</h4>
              {matchingLots.length === 0 ? (
                <p style={styles.emptyText}>No lots registered for this product/warehouse combination yet.</p>
              ) : (
                <div style={styles.lotGrid}>
                  {matchingLots.map((lot) => {
                    const quantity = Number(lot.quantity) || 0;
                    const statusColor = quantity > 0 ? '#064e3b' : '#b91c1c';
                    return (
                      <div key={`${lot.lotId ?? 'lot'}-${lot.lotNumber || 'unknown'}`} style={styles.lotCard}>
                        <div style={styles.lotLine}><strong>Lot:</strong> {lot.lotNumber || 'Unassigned'}</div>
                        <div style={styles.lotLine}><strong>Qty:</strong> {quantity}</div>
                        <div style={{ ...styles.lotLine, color: statusColor, fontSize: '12px' }}>
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

      {activeTab === 'scanner' && (
        <MobileScanner 
          items={items}
          warehouses={warehouses}
          onStatus={showStatus}
          onRefresh={fetchData}
        />
      )}

      {/* Serial Modal Placeholder Logic follows Bootstrap classes provided in original */}
      {showSerialModal && (
        <div className="modal d-block" style={{ background: "rgba(15, 23, 42, 0.7)", position: 'fixed', top:0, left:0, width:'100%', height:'100%', zIndex: 1050 }}>
           <div className="modal-dialog modal-dialog-centered modal-lg">
             <div className="modal-content">
                <div className="modal-header"><h5>Generate Serials</h5></div>
                <div className="modal-body">
                   <p>Quantity: {serialGenerationForm.quantity}</p>
                   <button className="btn btn-primary" onClick={generateSerialNumbers}>Generate List</button>
                   <div style={{maxHeight: '200px', overflowY: 'auto', marginTop: '10px'}}>
                      {serialGenerationForm.generatedSerials.map((s, i) => <div key={i}>{s.serialNumber}</div>)}
                   </div>
                </div>
                <div className="modal-footer">
                   <button className="btn btn-success" onClick={confirmStockTransactionWithSerials}>Confirm & Save</button>
                   <button className="btn btn-secondary" onClick={() => setShowSerialModal(false)}>Close</button>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '20px', background: '#f5f5f5', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '20px', background: '#fff', borderRadius: '8px', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  subtitle: { color: '#666', margin: 0 },
  refreshBtn: { padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  statusMessage: { padding: '12px', borderRadius: '6px', marginBottom: '20px' },
  tabs: { display: 'flex', gap: '10px', marginBottom: '20px' },
  tab: { flex: 1, padding: '12px', background: '#e9ecef', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  activeTab: { background: '#fff', color: '#007bff', borderWidth: '2px', borderStyle: 'solid', borderColor: '#007bff' },
  card: { background: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  cardTitle: { marginBottom: '20px' },
  modeSelector: { display: 'flex', gap: '10px', marginBottom: '20px' },
  modeBtn: { 
    flex: 1, padding: '12px', background: '#f8f9fa', 
    borderWidth: '2px', borderStyle: 'solid', borderColor: '#dee2e6', 
    borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
  },
  infoBox: { padding: '12px', borderRadius: '6px', marginBottom: '16px', borderWidth: '1px', borderStyle: 'solid', fontSize: '13px', backgroundColor: '#fff' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' },
  input: { padding: '10px', borderWidth: '2px', borderStyle: 'solid', borderColor: '#dee2e6', borderRadius: '6px' },
  select: { padding: '10px', borderWidth: '2px', borderStyle: 'solid', borderColor: '#dee2e6', borderRadius: '6px', backgroundColor: '#fff' },
  lotSummary: { marginTop: '24px', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff' },
  lotGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '12px' },
  lotCard: { borderRadius: '6px', border: '1px dashed #d1d5db', padding: '12px', background: '#f9fafb' },
  lotLine: { marginBottom: '6px', fontSize: '14px' },
  emptyText: { color: '#6b7280', margin: 0 },
  submitBtn: { padding: '12px', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', gridColumn: '1 / -1' }
};


