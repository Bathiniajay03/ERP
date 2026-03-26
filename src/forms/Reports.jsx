// import React, { useEffect, useState } from 'react';
// import api from '../services/apiClient';

// export default function Reports() {
//   const [transactions, setTransactions] = useState([]);
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
  
//   const [filterDate, setFilterDate] = useState('');
//   const [filterItemId, setFilterItemId] = useState('');
//   const [filterWarehouseId, setFilterWarehouseId] = useState('');
//   const [filterType, setFilterType] = useState('');
  
//   const [loading, setLoading] = useState(true);
//   const [errorMessage, setErrorMessage] = useState('');

//   // --- Bulletproof .NET / SQL Server Date Parser ---
//   const safeParseDate = (tx) => {
//     let dateStr = tx.transactionDate || tx.createdAt || tx.createdDate || tx.date;
//     if (!dateStr) return new Date(0);
    
//     // .NET SQL Server returns 'YYYY-MM-DDTHH:mm:ss' without the 'Z' for UTC.
//     // If it lacks a timezone indicator ('Z' or '+05:30'), we force it to UTC by appending 'Z'
//     if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
//       // Also replaces SQL spaces with 'T' just in case (e.g. '2026-03-21 10:04:00' -> '2026-03-21T10:04:00Z')
//       dateStr = dateStr.replace(' ', 'T') + 'Z';
//     }
    
//     const d = new Date(dateStr);
//     return isNaN(d.getTime()) ? new Date(0) : d;
//   };

//   const fetchLedgerData = async () => {
//     setLoading(true);
//     try {
//       const [txRes, itemRes, whRes] = await Promise.allSettled([
//         api.get('/reports/transactions'),
//         api.get('/stock/items'),
//         api.get('/warehouses')
//       ]);

//       if (itemRes.status === 'fulfilled') setItems(itemRes.value.data || []);
//       if (whRes.status === 'fulfilled') setWarehouses(whRes.value.data || []);

//       const rawTx = txRes.status === 'fulfilled' ? (txRes.value.data || []) : [];
      
//       // Robust Sorting: Guarantees newest transactions are ALWAYS at the top
//       const sortedTx = rawTx
//         .map(t => ({
//           ...t,
//           parsedDate: safeParseDate(t)
//         }))
//         .sort((a, b) => {
//           const timeA = a.parsedDate.getTime();
//           const timeB = b.parsedDate.getTime();
//           // Fallback to sorting by ID if transactions happened in the exact same millisecond
//           if (timeA === timeB) return (b.id || 0) - (a.id || 0);
//           return timeB - timeA; 
//         })
//         .slice(0, 500); 
        
//       setTransactions(sortedTx);

//       const hasFailure = [txRes, itemRes, whRes].some((x) => x.status === 'rejected');
//       setErrorMessage(hasFailure ? 'Some ledger data failed to load. Showing available records.' : '');
//     } catch (e) {
//       console.error('Ledger fetch failed', e);
//       setErrorMessage('Unable to load transaction ledger right now.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLedgerData();
//   }, []);

//   if (loading && transactions.length === 0) return (
//     <div className="erp-app-wrapper d-flex flex-column justify-content-center align-items-center vh-100">
//       <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status"></div>
//       <p className="text-muted fw-bold small text-uppercase" style={{letterSpacing: '1px'}}>Loading Transaction Ledger...</p>
//     </div>
//   );

//   const txTypes = Array.from(new Set(transactions.map((t) => t.transactionType))).filter(Boolean).sort();

//   const getLocalDateString = (dateObj) => {
//     if (dateObj.getTime() === 0) return '';
//     const year = dateObj.getFullYear();
//     const month = String(dateObj.getMonth() + 1).padStart(2, '0');
//     const day = String(dateObj.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`; 
//   };

//   const filteredTransactions = transactions.filter((tx) => {
//     const txDateStr = getLocalDateString(tx.parsedDate);
//     const matchDate = !filterDate || txDateStr === filterDate;
//     const matchItem = !filterItemId || String(tx.itemId) === String(filterItemId);
//     const matchWh = !filterWarehouseId || String(tx.warehouseId) === String(filterWarehouseId);
//     const matchType = !filterType || tx.transactionType === filterType;
//     return matchDate && matchItem && matchWh && matchType;
//   });

//   const itemName = (id) => items.find((i) => i.id === id)?.itemCode || id;
//   const warehouseName = (id) => warehouses.find((w) => w.id === id)?.name || id;

//   // --- Clean AM/PM Local Time Formatting ---
//   const formatDisplayDate = (dateObj) => {
//     if (!dateObj || dateObj.getTime() === 0) return '---';
//     return dateObj.toLocaleString('en-IN', {
//       day: '2-digit', month: 'short', year: 'numeric',
//       hour: '2-digit', minute: '2-digit', hour12: true
//     });
//   };

//   return (
//     <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
//       <div className="container-fluid px-4" style={{ maxWidth: '1500px' }}>
        
//         <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
//           <div>
//             <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Global Transaction Ledger</h4>
//             <span className="erp-text-muted small text-uppercase">Historical Inventory Movements & Audit Trail</span>
//           </div>
//           <button className="btn btn-primary erp-btn d-flex align-items-center gap-2 shadow-sm" onClick={fetchLedgerData} disabled={loading}>
//             {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
//             Refresh Ledger
//           </button>
//         </div>

//         {errorMessage && (
//           <div className="alert erp-alert py-2 mb-4" style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
//             <span className="fw-semibold">{errorMessage}</span>
//           </div>
//         )}

//         <div className="erp-panel shadow-sm">
//           <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
//             <span className="fw-bold">Ledger Entries</span>
//             <span className="badge bg-secondary">{filteredTransactions.length} Records</span>
//           </div>
          
//           <div className="bg-white">
//             <div className="row g-3 p-3 bg-light border-bottom m-0">
//               <div className="col-md-3">
//                 <label className="erp-label">Filter Date</label>
//                 <input type="date" className="form-control erp-input" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
//               </div>
//               <div className="col-md-3">
//                 <label className="erp-label">Item / SKU</label>
//                 <select className="form-select erp-input font-monospace" value={filterItemId} onChange={(e) => setFilterItemId(e.target.value)}>
//                   <option value="">All Catalog Items</option>
//                   {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
//                 </select>
//               </div>
//               <div className="col-md-3">
//                 <label className="erp-label">Location / Warehouse</label>
//                 <select className="form-select erp-input" value={filterWarehouseId} onChange={(e) => setFilterWarehouseId(e.target.value)}>
//                   <option value="">All Warehouses</option>
//                   {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
//                 </select>
//               </div>
//               <div className="col-md-2">
//                 <label className="erp-label">Tx Type</label>
//                 <select className="form-select erp-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
//                   <option value="">All Types</option>
//                   {txTypes.map((t) => <option key={t} value={t}>{t}</option>)}
//                 </select>
//               </div>
//               <div className="col-md-1 d-flex align-items-end">
//                 <button className="btn btn-outline-secondary erp-btn w-100 fw-bold" onClick={() => {
//                   setFilterDate(''); setFilterItemId(''); setFilterWarehouseId(''); setFilterType('');
//                 }}>Reset</button>
//               </div>
//             </div>

//             <div className="erp-table-container overflow-auto" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
//               <table className="table erp-table table-hover mb-0 align-middle">
//                 <thead className="table-light">
//                   <tr>
//                     <th style={{ width: '18%' }}>Timestamp</th>
//                     <th style={{ width: '20%' }}>Item Code</th>
//                     <th style={{ width: '20%' }}>Warehouse</th>
//                     <th>Lot / Batch</th>
//                     <th className="text-end pe-4">Quantity</th>
//                     <th className="text-center" style={{ width: '140px' }}>Tx Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredTransactions.length > 0 ? (
//                     filteredTransactions.map((tx, idx) => (
//                       <tr key={idx}>
//                         <td className="text-dark small fw-bold font-monospace pe-3">{formatDisplayDate(tx.parsedDate)}</td>
//                         <td className="fw-bold font-monospace text-primary pe-3">{itemName(tx.itemId)}</td>
//                         <td className="text-dark pe-3">{warehouseName(tx.warehouseId)}</td>
//                         <td className="font-monospace text-muted pe-3">{tx.lotNumber || '---'}</td>
//                         <td className={`text-end font-monospace fw-bold fs-6 pe-4 ${tx.quantity < 0 ? 'text-danger' : 'text-success'}`}>
//                           {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
//                         </td>
//                         <td className="text-center">
//                           <span className={`erp-status-tag ${tx.quantity < 0 ? 'tag-danger' : 'tag-success'}`}>
//                             {tx.transactionType || 'UNKNOWN'}
//                           </span>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan="6" className="text-center py-5 text-muted">No records match the selected criteria.</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>

//       </div>

//       <style>{`
//         :root {
//           --erp-primary: #0f4c81;
//           --erp-bg: #eef2f5;
//           --erp-surface: #ffffff;
//           --erp-border: #cfd8dc;
//           --erp-text-main: #263238;
//           --erp-text-muted: #607d8b;
//         }

//         .erp-app-wrapper {
//           background-color: var(--erp-bg);
//           color: var(--erp-text-main);
//           font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
//           font-size: 0.85rem;
//         }

//         .erp-text-muted { color: var(--erp-text-muted) !important; }

//         .erp-panel { background: var(--erp-surface); border: 1px solid var(--erp-border); border-radius: 4px; overflow: hidden; }
//         .erp-panel-header { border-bottom: 1px solid var(--erp-border); padding: 12px 16px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: #34495e; }

//         .erp-input { border-radius: 3px; border-color: #b0bec5; font-size: 0.85rem; padding: 6px 10px; }
//         .erp-input:focus { border-color: var(--erp-primary); box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2); }
//         .erp-btn { border-radius: 3px; font-weight: 600; letter-spacing: 0.2px; font-size: 0.8rem; padding: 6px 14px; }
//         .erp-label { font-size: 0.75rem; font-weight: 700; color: var(--erp-text-muted); text-transform: uppercase; margin-bottom: 6px; display: block; }

//         .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
//         .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
//         .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
//         .erp-table { font-size: 0.85rem; }
//         .erp-table thead th {
//           background-color: #f1f5f9;
//           color: #475569;
//           font-weight: 700;
//           text-transform: uppercase;
//           font-size: 0.75rem;
//           position: sticky;
//           top: 0;
//           z-index: 10;
//           border-bottom: 2px solid #cbd5e1;
//           padding: 12px 16px;
//           white-space: nowrap;
//         }
//         .erp-table tbody td {
//           padding: 12px 16px;
//           vertical-align: middle;
//           border-color: #e2e8f0;
//         }

//         .erp-status-tag {
//           font-size: 0.7rem;
//           font-weight: 700;
//           padding: 4px 8px;
//           border-radius: 2px;
//           text-transform: uppercase;
//           letter-spacing: 0.5px;
//           display: inline-block;
//           white-space: nowrap;
//         }
//         .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
//         .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
//       `}</style>
//     </div>
//   );
// }

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
                    <td className={`text-end fw-bold ${tx.quantity < 0 ? 'text-danger' : 'text-success'}`}>
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </td>
                    <td className="text-center">
                      <span className={`badge ${tx.transactionType === 'IN' ? 'bg-success' : 'bg-danger'}`} style={{fontSize: '11px'}}>
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
                <h1 className={`display-3 fw-bold ${selectedTx.quantity < 0 ? 'text-danger' : 'text-success'}`}>
                    {selectedTx.quantity > 0 ? `+${selectedTx.quantity}` : selectedTx.quantity}
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
                {selectedTx.serialNumbers && (
                   <div className="info-item full-width">
                     <label>Scanned Serials</label>
                     <div className="p-2 bg-light border rounded mt-1 font-monospace small" style={{maxHeight: '150px', overflowY: 'auto'}}>
                        {selectedTx.serialNumbers.map((sn, i) => <div key={i}>• {sn}</div>)}
                     </div>
                   </div>
                )}
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