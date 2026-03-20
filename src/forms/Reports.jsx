import React, { useEffect, useState } from 'react';
import api from '../services/apiClient';

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  const [filterDate, setFilterDate] = useState('');
  const [filterItemId, setFilterItemId] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      // Only fetching data required for the Transaction Ledger
      const [txRes, itemRes, whRes] = await Promise.allSettled([
        api.get('/reports/transactions'),
        api.get('/stock/items'),
        api.get('/warehouses')
      ]);

      if (itemRes.status === 'fulfilled') setItems(itemRes.value.data || []);
      if (whRes.status === 'fulfilled') setWarehouses(whRes.value.data || []);

      const sortedTx = ((txRes.status === 'fulfilled' ? txRes.value.data : []) || [])
        .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
        .slice(0, 500); // Limit to recent 500 for performance
      setTransactions(sortedTx);

      const hasFailure = [txRes, itemRes, whRes].some((x) => x.status === 'rejected');
      setErrorMessage(hasFailure ? 'Some ledger data failed to load. Showing available records.' : '');
    } catch (e) {
      console.error('Ledger fetch failed', e);
      setErrorMessage('Unable to load transaction ledger right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  if (loading && transactions.length === 0) return (
    <div className="erp-app-wrapper d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status"></div>
      <p className="text-muted fw-bold small text-uppercase" style={{letterSpacing: '1px'}}>Loading Transaction Ledger...</p>
    </div>
  );

  const txTypes = Array.from(new Set(transactions.map((t) => t.transactionType))).sort();

  const filteredTransactions = transactions.filter((tx) => {
    const parsed = new Date(tx.transactionDate);
    const txDate = Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
    const matchDate = !filterDate || txDate === filterDate;
    const matchItem = !filterItemId || String(tx.itemId) === String(filterItemId);
    const matchWh = !filterWarehouseId || String(tx.warehouseId) === String(filterWarehouseId);
    const matchType = !filterType || tx.transactionType === filterType;
    return matchDate && matchItem && matchWh && matchType;
  });

  const itemName = (id) => items.find((i) => i.id === id)?.itemCode || id;
  const warehouseName = (id) => warehouses.find((w) => w.id === id)?.name || id;

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Global Transaction Ledger</h4>
            <span className="erp-text-muted small text-uppercase">Historical Inventory Movements & Audit Trail</span>
          </div>
          <button className="btn btn-primary erp-btn d-flex align-items-center gap-2" onClick={fetchLedgerData} disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            Refresh Ledger
          </button>
        </div>

        {errorMessage && (
          <div className="alert erp-alert py-2 mb-4" style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
            <span className="fw-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Transaction Ledger with Advanced Filters */}
        <div className="erp-panel shadow-sm">
          <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
            <span className="fw-bold">Ledger Entries</span>
            <span className="badge bg-secondary">{filteredTransactions.length} Records</span>
          </div>
          
          <div className="bg-white">
            {/* Filter Bar */}
            <div className="row g-3 p-3 bg-light border-bottom m-0">
              <div className="col-md-3">
                <label className="erp-label">Filter Date</label>
                <input type="date" className="form-control erp-input" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="erp-label">Item / SKU</label>
                <select className="form-select erp-input" value={filterItemId} onChange={(e) => setFilterItemId(e.target.value)}>
                  <option value="">All Catalog Items</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="erp-label">Location / Warehouse</label>
                <select className="form-select erp-input" value={filterWarehouseId} onChange={(e) => setFilterWarehouseId(e.target.value)}>
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <label className="erp-label">Tx Type</label>
                <select className="form-select erp-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="">All Types</option>
                  {txTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-1 d-flex align-items-end">
                <button className="btn btn-outline-secondary erp-btn w-100" onClick={() => {
                  setFilterDate(''); setFilterItemId(''); setFilterWarehouseId(''); setFilterType('');
                }}>Reset</button>
              </div>
            </div>

            {/* Ledger Data Grid */}
            <div className="erp-table-container overflow-auto" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
              <table className="table erp-table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '15%' }}>Timestamp</th>
                    <th style={{ width: '20%' }}>Item Code</th>
                    <th style={{ width: '20%' }}>Warehouse</th>
                    <th>Lot / Batch</th>
                    <th className="text-end">Quantity</th>
                    <th className="text-center" style={{ width: '120px' }}>Tx Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx, idx) => (
                      <tr key={idx}>
                        <td className="text-muted small">{new Date(tx.transactionDate).toLocaleString()}</td>
                        <td className="fw-bold font-monospace text-dark">{itemName(tx.itemId)}</td>
                        <td className="text-dark">{warehouseName(tx.warehouseId)}</td>
                        <td className="font-monospace text-muted">{tx.lotNumber || '---'}</td>
                        <td className={`text-end font-monospace fw-bold ${tx.quantity < 0 ? 'text-danger' : 'text-success'}`}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td className="text-center">
                          <span className={`erp-status-tag ${tx.quantity < 0 ? 'tag-danger' : 'tag-success'}`}>
                            {tx.transactionType}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">No records match the selected criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

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

        /* Panels */
        .erp-panel {
          background: var(--erp-surface);
          border: 1px solid var(--erp-border);
          border-radius: 4px;
          overflow: hidden;
        }
        .erp-panel-header {
          border-bottom: 1px solid var(--erp-border);
          padding: 12px 16px;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #34495e;
        }

        /* Inputs & Buttons */
        .erp-input {
          border-radius: 3px;
          border-color: #b0bec5;
          font-size: 0.85rem;
          padding: 6px 10px;
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
        }
        .erp-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }

        /* Data Table */
        .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
        .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
        .erp-table { font-size: 0.8rem; }
        .erp-table thead th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.7rem;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #cbd5e1;
          padding: 8px 12px;
          white-space: nowrap;
        }
        .erp-table tbody td {
          padding: 8px 12px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          white-space: nowrap;
        }
        .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
      `}</style>
    </div>
  );
}