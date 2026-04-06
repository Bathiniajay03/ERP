

import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/apiClient';

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null); 
  
  const [filterDate, setFilterDate] = useState('');
  const [filterItemId, setFilterItemId] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // --- IMPROVED DATE PARSER ---
  const safeParseDate = (tx) => {
    let dateStr = tx.transactionDate || tx.createdAt || tx.createdDate || tx.date;
    if (!dateStr) return new Date(0);
    
    // Ensure string format is ISO-like for consistent sorting
    if (typeof dateStr === 'string') {
        dateStr = dateStr.replace(' ', 'T');
        if (!dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
            dateStr += 'Z';
        }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

  const fetchLedgerData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, itemRes, whRes] = await Promise.allSettled([
        api.get('/reports/transactions'),
        api.get('/stock/items'),
        api.get('/warehouses')
      ]);

      if (itemRes.status === 'fulfilled') setItems(itemRes.value.data || []);
      if (whRes.status === 'fulfilled') setWarehouses(whRes.value.data || []);

      const rawTx = txRes.status === 'fulfilled' ? (txRes.value.data || []) : [];
      
      // MANDATORY SORTING: Forces the absolute newest transactions to index 0
      const sortedTx = rawTx
        .map(t => ({ 
            ...t, 
            parsedDate: safeParseDate(t),
            displayQty: t.quantity // Preserve original quantity
        }))
        .sort((a, b) => {
            const diff = b.parsedDate.getTime() - a.parsedDate.getTime();
            if (diff === 0) return (b.id || 0) - (a.id || 0); // Tie-breaker using ID
            return diff;
        });
        
      setTransactions(sortedTx);
    } catch (e) {
      setErrorMessage('Critical error loading ledger.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLedgerData(); }, [fetchLedgerData]);

  const filteredTransactions = transactions.filter((tx) => {
    const txDateStr = tx.parsedDate.toISOString().split('T')[0];
    const matchDate = !filterDate || txDateStr === filterDate;
    const matchItem = !filterItemId || String(tx.itemId) === String(filterItemId);
    const matchWh = !filterWarehouseId || String(tx.warehouseId) === String(filterWarehouseId);
    return matchDate && matchItem && matchWh;
  });

  const getItem = (id) => items.find((i) => i.id === id) || { itemCode: id };
  const getWarehouse = (id) => warehouses.find((w) => w.id === id) || { name: id };

  const formatDisplayDate = (dateObj) => {
    if (!dateObj || dateObj.getTime() === 0) return '---';
    return dateObj.toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    }).toLowerCase();
  };

  const normalizeSerialNumbers = (serials) => {
    if (!serials) return [];
    if (Array.isArray(serials)) return serials;
    if (typeof serials === 'string') {
      return serials
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };
  const isOutboundTransaction = (transactionType) => {
    const normalized = String(transactionType || '').toUpperCase();
    return normalized.includes('OUT') || normalized.includes('TRF') || normalized.includes('SALE') || normalized.includes('CUSTOMER');
  };

  const getTransactionQuantity = (tx) => {
    const qty = Number(tx.quantity || 0);
    if (isOutboundTransaction(tx.transactionType || tx.type)) {
      return -Math.abs(qty);
    }
    return Math.abs(qty);
  };

  const formatTransactionQuantity = (tx) => {
    const qty = getTransactionQuantity(tx);
    return qty > 0 ? `+${qty}` : `${qty}`;
  };

  const getTransactionSerials = (tx) => {
    const serials = normalizeSerialNumbers(tx.serialNumbers);
    const qty = Math.abs(getTransactionQuantity(tx));
    return qty > 0 ? serials.slice(0, qty) : serials;
  };

  const transactionBadgeClass = (transactionType) => {
    const normalized = String(transactionType || '').toUpperCase();
    if (normalized.includes('TRANSFER') || normalized.includes('TRF')) return 'bg-info';
    if (normalized.includes('OUT')) return 'bg-danger';
    if (normalized.includes('IN')) return 'bg-success';
    return 'bg-secondary';
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1600px' }}>
        
        <div className="d-flex justify-content-between align-items-center border-bottom mb-4 pb-3 no-print">
          <div>
            <h4 className="fw-bold m-0">Inventory Ledger</h4>
            <span className="text-muted small fw-bold">REAL-TIME TRANSACTION AUDIT</span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-dark fw-bold" onClick={() => window.print()}>🖨️ Print Full Ledger</button>
            <button className="btn btn-primary shadow-sm fw-bold" onClick={fetchLedgerData} disabled={loading}>↻ Refresh</button>
          </div>
        </div>

        <div className="erp-panel shadow-sm border-0 rounded-3 overflow-hidden">
          {/* Filter Bar */}
          <div className="row g-2 p-3 bg-white border-bottom m-0 no-print">
            <div className="col-md-3">
              <label className="erp-label">Date Filter</label>
              <input type="date" className="form-control" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="erp-label">Item / SKU</label>
              <select className="form-select" value={filterItemId} onChange={(e) => setFilterItemId(e.target.value)}>
                <option value="">All Catalog</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
              </select>
            </div>
            <div className="col-md-3">
                <label className="erp-label">Warehouse</label>
                <select className="form-select" value={filterWarehouseId} onChange={(e) => setFilterWarehouseId(e.target.value)}>
                  <option value="">All Locations</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-light border w-100" onClick={() => { setFilterDate(''); setFilterItemId(''); setFilterWarehouseId(''); }}>Clear</button>
            </div>
          </div>

          <div className="table-responsive" style={{ height: '75vh', overflowY: 'auto' }}>
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light sticky-top">
                <tr className="small text-muted text-uppercase">
                  <th className="ps-4">Date & Time</th>
                  <th>Product Identification</th>
                  <th>Warehouse Bin</th>
                  <th>Lot Number</th>
                  <th className="text-end">Quantity</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredTransactions.map((tx, idx) => (
                  <tr key={idx} onClick={() => setSelectedTx(tx)} style={{ cursor: 'pointer' }} className="ledger-row">
                    <td className="ps-4 font-monospace small">{formatDisplayDate(tx.parsedDate)}</td>
                    <td className="fw-bold">{getItem(tx.itemId).itemCode}</td>
                    <td>{getWarehouse(tx.warehouseId).name}</td>
                    <td className="font-monospace">{tx.lotNumber || '---'}</td>
                    <td className={`text-end fw-bold ${getTransactionQuantity(tx) < 0 ? 'text-danger' : 'text-success'}`}>
                      {formatTransactionQuantity(tx)}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${transactionBadgeClass(tx.transactionType)}`} style={{fontSize: '11px'}}>
                        {tx.transactionType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- TRANSACTION DETAIL SLIDE-OVER --- */}
      {selectedTx && (
        <div className="tx-overlay" onClick={() => setSelectedTx(null)}>
          <div className="tx-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header p-4 bg-dark text-white d-flex justify-content-between align-items-center">
              <h5 className="m-0">Audit Entry Details</h5>
              <button className="btn-close btn-close-white" onClick={() => setSelectedTx(null)}></button>
            </div>
            <div className="p-4">
              <div className="text-center mb-4 p-4 rounded bg-light border">
                <h1 className={`display-3 fw-bold ${getTransactionQuantity(selectedTx) < 0 ? 'text-danger' : 'text-success'}`}>
                    {formatTransactionQuantity(selectedTx)}
                </h1>
                <span className="fw-bold text-muted">UNITS {selectedTx.transactionType}</span>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <label>Timestamp</label>
                  <span>{formatDisplayDate(selectedTx.parsedDate)}</span>
                </div>
                <div className="info-item">
                  <label>Product Identification</label>
                  <span>{getItem(selectedTx.itemId).itemCode}</span>
                </div>
                <div className="info-item">
                  <label>Warehouse Bin</label>
                  <span>{getWarehouse(selectedTx.warehouseId).name}</span>
                </div>
                <div className="info-item">
                  <label>Lot Number</label>
                  <span className="font-monospace text-primary">{selectedTx.lotNumber || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Transaction Action</label>
                  <span className="badge bg-secondary">{selectedTx.transactionType}</span>
                </div>
                {selectedTx.reference && (
                  <div className="info-item">
                    <label>Reference</label>
                    <span>{selectedTx.reference}</span>
                  </div>
                )}
                {(() => {
                  const serials = getTransactionSerials(selectedTx);
                  if (serials.length > 0) {
                    return (
                      <div className="info-item full-width">
                        <label>Scanned Serials</label>
                        <div className="p-2 bg-light border rounded mt-1 font-monospace small" style={{maxHeight: '150px', overflowY: 'auto'}}>
                          {serials.map((sn, i) => <div key={i}>• {sn}</div>)}
                        </div>
                      </div>
                    );
                  }
                  if (selectedTx.transactionType?.toUpperCase().includes('OUT') || selectedTx.transactionType?.toUpperCase().includes('TRANSFER')) {
                    return (
                      <div className="info-item full-width">
                        <label>Serials</label>
                        <div className="p-2 bg-light border rounded mt-1 text-muted small">
                          No serial numbers were captured for this transaction.
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <div className="p-4 mt-auto border-top">
                <button className="btn btn-primary w-100 py-2 fw-bold" onClick={() => window.print()}>Print Receipt</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .erp-label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .ledger-row:hover { background-color: #f8fafc !important; }
        
        .tx-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 3000; display: flex; justify-content: flex-end; }
        .tx-drawer { width: 420px; height: 100%; background: white; animation: slideRight 0.3s ease; display: flex; flex-direction: column; }
        @keyframes slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .info-grid { display: flex; flex-direction: column; gap: 15px; }
        .info-item { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
        .info-item label { font-size: 0.8rem; color: #64748b; font-weight: 600; }
        .info-item span { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
        .full-width { flex-direction: column; align-items: flex-start; border: none; }
        
        @media print {
            .no-print, .btn, .tx-overlay, .sidebar-wrapper { display: none !important; }
            .erp-main-content { margin: 0 !important; padding: 0 !important; width: 100% !important; }
            .table-responsive { height: auto !important; overflow: visible !important; }
            .table thead th { background: #eee !important; color: black !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}