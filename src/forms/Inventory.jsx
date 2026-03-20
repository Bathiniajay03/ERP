// import React, { useEffect, useState } from "react";
// import { smartErpApi } from "../services/smartErpApi";

// export default function Inventory() {
//   const [inventory, setInventory] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [filter, setFilter] = useState("");

//   useEffect(() => {
//     fetchInventory();
//   }, []);

//   const fetchInventory = async () => {
//     try {
//       setLoading(true);
//       const res = await smartErpApi.stockInventory();
//       setInventory(res.data || []);
//       setError("");
//     } catch (err) {
//       setError("Failed to load inventory");
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredInventory = inventory.filter((item) =>
//     item.itemName?.toLowerCase().includes(filter.toLowerCase()) ||
//     item.itemCode?.toLowerCase().includes(filter.toLowerCase()) ||
//     item.warehouseName?.toLowerCase().includes(filter.toLowerCase())
//   );

//   const getTotalValue = () => {
//     return inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toFixed(2);
//   };

//   const getLowStockItems = () => {
//     return inventory.filter(item => item.quantity < item.minStock).length;
//   };

//   return (
//     <div className="dashboard-page">
//       <div className="page-header">
//         <h1>Inventory Management</h1>
//         <button className="btn btn-primary" onClick={fetchInventory} disabled={loading}>
//           {loading ? "Loading..." : "Refresh"}
//         </button>
//       </div>

//       {error && <div className="alert alert-danger">{error}</div>}

//       <div className="row mb-4">
//         <div className="col-md-3">
//           <div className="card">
//             <div className="card-body">
//               <h6 className="text-muted">Total Items</h6>
//               <h3>{inventory.length}</h3>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card">
//             <div className="card-body">
//               <h6 className="text-muted">Total Value</h6>
//               <h3>${getTotalValue()}</h3>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card">
//             <div className="card-body">
//               <h6 className="text-muted">Low Stock Items</h6>
//               <h3 className="text-danger">{getLowStockItems()}</h3>
//             </div>
//           </div>
//         </div>
//         <div className="col-md-3">
//           <div className="card">
//             <div className="card-body">
//               <h6 className="text-muted">Warehouses</h6>
//               <h3>{new Set(inventory.map(i => i.warehouseId)).size}</h3>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="card">
//         <div className="card-header d-flex justify-content-between align-items-center">
//           <h5 className="mb-0">Stock Levels</h5>
//           <input
//             type="text"
//             className="form-control w-25"
//             placeholder="Search inventory..."
//             value={filter}
//             onChange={(e) => setFilter(e.target.value)}
//           />
//         </div>
//         <div className="card-body p-0">
//           {loading ? (
//             <div className="text-center py-5">
//               <div className="spinner-border text-primary" role="status">
//                 <span className="visually-hidden">Loading...</span>
//               </div>
//             </div>
//           ) : (
//             <div className="table-responsive">
//               <table className="table table-hover mb-0">
//                 <thead className="table-light">
//                   <tr>
//                     <th>Item Code</th>
//                     <th>Item Name</th>
//                     <th>Warehouse</th>
//                     <th>Lot / Batch</th>
//                     <th>Quantity</th>
//                     <th>Unit Cost</th>
//                     <th>Total Value</th>
//                     <th>Min Stock</th>
//                     <th>Max Stock</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredInventory.length === 0 ? (
//                     <tr>
//                       <td colSpan="9" className="text-center py-4 text-muted">
//                         No inventory found
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredInventory.map((item) => (
//                       <tr key={item.id}>
//                         <td><strong>{item.itemCode}</strong></td>
//                           <td>{item.itemName}</td>
//                           <td>{item.warehouseName || `WH-${item.warehouseId}`}</td>
//                           <td>{item.lotNumber || "General"}</td>
//                         <td>
//                           <span className={`badge ${item.quantity < item.minStock ? 'bg-danger' : 'bg-success'}`}>
//                             {item.quantity}
//                           </span>
//                         </td>
//                         <td>${Number(item.unitCost)?.toFixed(2)}</td>
//                         <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
//                         <td>{item.minStock}</td>
//                         <td>{item.maxStock}</td>
//                         <td>
//                           {item.quantity === 0 ? (
//                             <span className="badge bg-danger">Out of Stock</span>
//                           ) : item.quantity < item.minStock ? (
//                             <span className="badge bg-warning">Low Stock</span>
//                           ) : item.quantity > item.maxStock ? (
//                             <span className="badge bg-info">Overstocked</span>
//                           ) : (
//                             <span className="badge bg-success">In Stock</span>
//                           )}
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState, useMemo } from "react";
import { smartErpApi } from "../services/smartErpApi";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await smartErpApi.stockInventory();
      setInventory(res.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load inventory");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Group the raw inventory by Item Code to prevent duplicates in the main table
  const groupedInventory = useMemo(() => {
    const map = {};
    inventory.forEach(item => {
      const code = item.itemCode || item.itemId; // Grouping key
      if (!map[code]) {
        map[code] = {
          ...item,
          totalQuantity: 0,
          totalValue: 0,
          lots: [],
          uniqueWarehouses: new Set()
        };
      }
      
      const qty = Number(item.quantity) || 0;
      const cost = Number(item.unitCost) || 0;
      
      map[code].totalQuantity += qty;
      map[code].totalValue += (qty * cost);
      map[code].uniqueWarehouses.add(item.warehouseName || `WH-${item.warehouseId}`);
      map[code].lots.push(item); // Store the individual lot details here
    });
    return Object.values(map);
  }, [inventory]);

  // 2. Filter based on the grouped data
  const filteredInventory = groupedInventory.filter((group) =>
    group.itemName?.toLowerCase().includes(filter.toLowerCase()) ||
    group.itemCode?.toLowerCase().includes(filter.toLowerCase()) ||
    Array.from(group.uniqueWarehouses).some(wh => wh.toLowerCase().includes(filter.toLowerCase()))
  );

  const getTotalValue = () => {
    return groupedInventory.reduce((sum, group) => sum + group.totalValue, 0).toFixed(2);
  };

  const getLowStockItems = () => {
    return groupedInventory.filter(group => group.totalQuantity < group.minStock).length;
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-4 pt-3">
      <div className="container-fluid px-4">
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Inventory Ledger</h4>
            <span className="erp-text-muted small text-uppercase">Global Stock & Valuation</span>
          </div>
          <button 
            className="btn btn-primary erp-btn d-flex align-items-center gap-2" 
            onClick={fetchInventory} 
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            {loading ? "Syncing..." : "Refresh Ledger"}
          </button>
        </div>

        {error && (
          <div className="alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
            <span className="fw-semibold">{error}</span>
            <button className="btn-close btn-sm" onClick={() => setError("")}></button>
          </div>
        )}

        {/* KPI DASHBOARD */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#0f4c81' }}>
              <span className="erp-kpi-label">Active SKUs</span>
              <span className="erp-kpi-value text-dark">{groupedInventory.length}</span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#059669' }}>
              <span className="erp-kpi-label">Total Valuation</span>
              <span className="erp-kpi-value text-success font-monospace">{getTotalValue()}</span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: getLowStockItems() > 0 ? '#dc2626' : '#94a3b8' }}>
              <span className="erp-kpi-label">Low Stock Alerts</span>
              <span className={`erp-kpi-value ${getLowStockItems() > 0 ? 'text-danger' : 'text-dark'}`}>
                {getLowStockItems()}
              </span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#6366f1' }}>
              <span className="erp-kpi-label">Storage Locations</span>
              <span className="erp-kpi-value text-dark">{new Set(inventory.map(i => i.warehouseId)).size}</span>
            </div>
          </div>
        </div>

        {/* DATA GRID */}
        <div className="erp-panel d-flex flex-column shadow-sm" style={{ height: "calc(100vh - 240px)" }}>
          <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Stock Levels & Balances</span>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Filter:</span>
              <input
                type="text"
                className="form-control form-control-sm erp-input"
                style={{ width: '250px' }}
                placeholder="Item, Code, or Location..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100">
                <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }}></div>
                <span className="small text-muted text-uppercase fw-bold">Retrieving Data...</span>
              </div>
            ) : (
              <table className="table erp-table table-hover table-bordered mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Item Code</th>
                    <th style={{ width: '20%' }}>Description</th>
                    <th>Warehouse</th>
                    <th>Lots / Batches</th>
                    <th className="text-end">Total Qty On Hand</th>
                    <th className="text-end">Unit Cost</th>
                    <th className="text-end">Total Value</th>
                    <th className="text-end">Min</th>
                    <th className="text-end">Max</th>
                    <th className="text-center" style={{ width: '120px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-5 text-muted">
                        No inventory records found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((group) => {
                      const isLowStock = group.totalQuantity < group.minStock;
                      const isOut = group.totalQuantity === 0;
                      const isOver = group.totalQuantity > group.maxStock;
                      
                      const whArray = Array.from(group.uniqueWarehouses);
                      const warehouseDisplay = whArray.length > 1 ? "Multiple Locations" : whArray[0];

                      return (
                        <tr 
                          key={group.itemCode} 
                          className={isOut ? "table-danger" : isLowStock ? "table-warning" : ""}
                          onClick={() => setSelectedItem(group)}
                          style={{ cursor: 'pointer' }}
                          title="Click to view lot details"
                        >
                          <td><span className="fw-bold font-monospace text-dark">{group.itemCode}</span></td>
                          <td><span className="text-truncate d-block" style={{ maxWidth: '250px' }} title={group.itemName}>{group.itemName}</span></td>
                          <td>{warehouseDisplay}</td>
                          <td className="font-monospace text-muted">{group.lots.length} active lots</td>
                          
                          <td className={`text-end font-monospace fw-bold ${isOut ? 'text-danger' : isLowStock ? 'text-danger' : 'text-dark'}`}>
                            {group.totalQuantity}
                          </td>
                          <td className="text-end font-monospace text-muted">{Number(group.unitCost)?.toFixed(2)}</td>
                          <td className="text-end font-monospace fw-semibold">{group.totalValue.toFixed(2)}</td>
                          
                          <td className="text-end text-muted small">{group.minStock}</td>
                          <td className="text-end text-muted small">{group.maxStock}</td>
                          
                          <td className="text-center">
                            {isOut ? (
                              <span className="erp-status-tag tag-danger">OUT OF STOCK</span>
                            ) : isLowStock ? (
                              <span className="erp-status-tag tag-warning">LOW STOCK</span>
                            ) : isOver ? (
                              <span className="erp-status-tag tag-info">OVERSTOCKED</span>
                            ) : (
                              <span className="erp-status-tag tag-success">OPTIMAL</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ITEM DETAILS & LOT BREAKDOWN MODAL */}
      {selectedItem && (
        <div className="erp-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="erp-dialog erp-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="erp-dialog-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="m-0 fw-bold">{selectedItem.itemCode}</h5>
                <small className="opacity-75">{selectedItem.itemName}</small>
              </div>
              <button className="btn-close btn-close-white" onClick={() => setSelectedItem(null)}></button>
            </div>
            
            <div className="erp-dialog-body">
              {/* Top Summary Info */}
              <div className="row g-3 mb-4 p-3 bg-light border rounded">
                <div className="col-sm-3">
                  <div className="erp-meta-label">Total Qty On Hand</div>
                  <div className={`erp-meta-value fs-4 fw-bold font-monospace ${selectedItem.totalQuantity === 0 ? 'text-danger' : 'text-success'}`}>
                    {selectedItem.totalQuantity}
                  </div>
                </div>
                <div className="col-sm-3">
                  <div className="erp-meta-label">Total Value</div>
                  <div className="erp-meta-value font-monospace mt-2 fw-bold">{selectedItem.totalValue.toFixed(2)}</div>
                </div>
                <div className="col-sm-3">
                  <div className="erp-meta-label">Min Stock</div>
                  <div className="erp-meta-value font-monospace mt-2">{selectedItem.minStock}</div>
                </div>
                <div className="col-sm-3">
                  <div className="erp-meta-label">Overall Status</div>
                  <div className="mt-2">
                   {selectedItem.totalQuantity === 0 ? (
                      <span className="erp-status-tag tag-danger">OUT OF STOCK</span>
                    ) : selectedItem.totalQuantity < selectedItem.minStock ? (
                      <span className="erp-status-tag tag-warning">LOW STOCK</span>
                    ) : selectedItem.totalQuantity > selectedItem.maxStock ? (
                      <span className="erp-status-tag tag-info">OVERSTOCKED</span>
                    ) : (
                      <span className="erp-status-tag tag-success">OPTIMAL</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Lot Table */}
              <h6 className="erp-section-title mb-3">Lot & Location Breakdown</h6>
              <div className="border rounded overflow-hidden">
                <table className="table table-sm table-hover mb-0 erp-table">
                  <thead className="table-light">
                    <tr>
                      <th>Warehouse Location</th>
                      <th>Lot / Batch ID</th>
                      <th className="text-end">Quantity</th>
                      <th className="text-end">Valuation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.lots.map((lot, idx) => (
                      <tr key={idx}>
                        <td className="text-muted">{lot.warehouseName || `WH-${lot.warehouseId}`}</td>
                        <td className="fw-bold font-monospace">{lot.lotNumber || "UNASSIGNED"}</td>
                        <td className="text-end font-monospace fw-bold text-dark">{lot.quantity}</td>
                        <td className="text-end font-monospace text-muted">{(lot.quantity * lot.unitCost).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
            <div className="p-3 bg-light border-top text-end">
              <button className="btn btn-secondary erp-btn px-4" onClick={() => setSelectedItem(null)}>Close Window</button>
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

        /* KPI Boxes */
        .erp-kpi-box {
          background: var(--erp-surface); 
          border: 1px solid var(--erp-border);
          padding: 16px 20px; 
          border-left: 4px solid var(--erp-primary);
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .erp-kpi-label { 
          font-size: 0.75rem; 
          text-transform: uppercase; 
          color: var(--erp-text-muted); 
          font-weight: 700; 
          letter-spacing: 0.5px;
        }
        .erp-kpi-value { 
          font-size: 1.75rem; 
          font-weight: 700; 
          line-height: 1;
        }

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
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #34495e;
        }

        /* Meta Data Labels for Modal */
        .erp-meta-label { font-size: 0.7rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 600; }
        .erp-meta-value { font-size: 0.95rem; font-weight: 500; color: #212529; }

        /* Inputs & Buttons */
        .erp-input {
          border-radius: 3px;
          border-color: #b0bec5;
          font-size: 0.85rem;
        }
        .erp-input:focus {
          border-color: var(--erp-primary);
          box-shadow: 0 0 0 2px rgba(15, 76, 129, 0.2);
        }
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.85rem;
          padding: 8px 16px;
        }

        /* Data Table */
        .erp-table-container::-webkit-scrollbar { width: 8px; height: 8px; }
        .erp-table-container::-webkit-scrollbar-thumb { background: #b0bec5; border-radius: 4px; }
        .erp-table-container::-webkit-scrollbar-track { background: #eceff1; }
        
        .erp-table { font-size: 0.85rem; }
        .erp-table thead th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 2px solid #cbd5e1;
          padding: 10px 16px;
          white-space: nowrap;
        }
        .erp-table tbody td {
          padding: 10px 16px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }
        .table-warning { background-color: #fffbeb !important; }
        .table-danger { background-color: #fef2f2 !important; }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          white-space: nowrap;
        }
        .tag-success { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }

        /* Modals / Dialogs */
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
        .erp-dialog-md { max-width: 600px; }
        .erp-dialog-lg { max-width: 800px; }
        .erp-dialog-header {
          background-color: var(--erp-primary);
          color: white;
          padding: 12px 20px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .erp-dialog-body {
          padding: 20px;
          overflow-y: auto;
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
      `}</style>
    </div>
  );
}
