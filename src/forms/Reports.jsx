import React, { useEffect, useState } from 'react';
import api from '../services/apiClient';

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterItemId, setFilterItemId] = useState('');
  const [filterWarehouseId, setFilterWarehouseId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [dashRes, analyticsRes, txRes, itemRes, whRes] = await Promise.allSettled([
        api.get('/smart-erp/dashboard/realtime'),
        api.get('/smart-erp/analytics/report'),
        api.get('/reports/transactions'),
        api.get('/stock/items'),
        api.get('/warehouses')
      ]);

      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
      if (itemRes.status === 'fulfilled') setItems(itemRes.value.data || []);
      if (whRes.status === 'fulfilled') setWarehouses(whRes.value.data || []);

      const sortedTx = ((txRes.status === 'fulfilled' ? txRes.value.data : []) || [])
        .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
        .slice(0, 500);
      setTransactions(sortedTx);
      const hasFailure = [dashRes, analyticsRes, txRes, itemRes, whRes].some((x) => x.status === 'rejected');
      setErrorMessage(hasFailure ? 'Some report data failed to load. Showing available data.' : '');
    } catch (e) {
      console.error('Report fetch failed', e);
      setErrorMessage('Unable to load reports right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p className="text-muted fw-bold">Generating Enterprise Reports...</p>
      </div>
    </div>
  );

  const sales = analytics?.salesReports || {};
  const whEff = analytics?.warehouseEfficiency || {};
  const finance = dashboard?.financeDashboard || {};
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
    <div style={styles.page}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bold text-dark m-0">Analytics & Reporting</h2>
          <p className="text-muted mb-0">Unified operational intelligence and transaction history</p>
        </div>
        <button className="btn btn-primary px-4 shadow-sm" onClick={fetchReports}>
          Refresh All Data
        </button>
      </div>
      {errorMessage && <div className="alert alert-warning py-2">{errorMessage}</div>}

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <SummaryCard title="Total Orders" value={sales.totalOrders} color="#3b82f6" />
        <SummaryCard title="Total Revenue" value={`$${(sales.totalRevenue || 0).toLocaleString()}`} color="#10b981" />
        <SummaryCard title="Avg Order Value" value={`$${(sales.averageOrderValue || 0).toFixed(2)}`} color="#8b5cf6" />
        <SummaryCard title="Receivables" value={`$${(finance.receivables || 0).toLocaleString()}`} color="#f59e0b" />
        <SummaryCard title="Inv. Turnover" value={analytics?.inventoryTurnover} color="#ec4899" />
      </div>

      <div className="row g-4 mb-4">
        {/* Warehouse & Demand Insights */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 h-100">
            <h5 className="fw-bold border-bottom pb-2 mb-3">Operational Efficiency</h5>
            <div className="d-flex justify-content-between mb-2">
              <span>Total Pick Tasks</span>
              <span className="fw-bold">{whEff.totalPickTasks ?? 0}</span>
            </div>
            <div className="d-flex justify-content-between mb-4">
              <span>Completion Rate</span>
              <span className="badge bg-success">
                {whEff.totalPickTasks > 0 ? ((whEff.completedPickTasks / whEff.totalPickTasks) * 100).toFixed(1) : 0}%
              </span>
            </div>
            
            <h6 className="fw-bold text-muted small text-uppercase">Demand Trends</h6>
            <p className="small text-dark bg-light p-2 rounded">
              {analytics?.demandTrends || 'No significant trends detected.'}
            </p>
          </div>
        </div>

        {/* Robot Productivity Table */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
            <h5 className="fw-bold border-bottom pb-2 mb-3">Fleet Productivity</h5>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-uppercase">
                    <th>Robot</th>
                    <th>Battery</th>
                    <th>Location</th>
                    <th>Current Task</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.robotProductivity || []).map((robot, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{robot.robot}</td>
                      <td>
                        <div className="progress" style={{ height: '6px', width: '60px' }}>
                          <div 
                            className={`progress-bar ${robot.batteryLevel < 20 ? 'bg-danger' : 'bg-success'}`} 
                            style={{ width: `${robot.batteryLevel}%` }}
                          ></div>
                        </div>
                        <small className="text-muted">{robot.batteryLevel}%</small>
                      </td>
                      <td>{robot.location}</td>
                      <td className="small">{robot.currentTask}</td>
                      <td>
                        <span className={`badge rounded-pill ${robot.status === 'Idle' ? 'bg-info' : 'bg-warning'}`}>
                          {robot.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Ledger with Advanced Filters */}
      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h5 className="fw-bold mb-4">Transaction Ledger</h5>
        
        <div className="row g-3 mb-4 bg-light p-3 rounded-3 mx-0 border">
          <div className="col-md-3">
            <label className="form-label small fw-bold">Filter Date</label>
            <input type="date" className="form-control" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-bold">Item</label>
            <select className="form-select" value={filterItemId} onChange={(e) => setFilterItemId(e.target.value)}>
              <option value="">All Catalog Items</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-bold">Warehouse</label>
            <select className="form-select" value={filterWarehouseId} onChange={(e) => setFilterWarehouseId(e.target.value)}>
              <option value="">All Warehouses</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-bold">Tx Type</label>
            <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {txTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-md-2 d-flex align-items-end">
            <button className="btn btn-outline-secondary w-100" onClick={() => {
              setFilterDate(''); setFilterItemId(''); setFilterWarehouseId(''); setFilterType('');
            }}>Reset</button>
          </div>
        </div>

        <div className="table-responsive" style={{ maxHeight: '500px' }}>
          <table className="table table-sm table-striped">
            <thead className="table-dark sticky-top">
              <tr>
                <th>Timestamp</th>
                <th>Item Code</th>
                <th>Warehouse</th>
                <th>Lot/Batch</th>
                <th>Qty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, idx) => (
                  <tr key={idx}>
                    <td>{new Date(tx.transactionDate).toLocaleString()}</td>
                    <td className="fw-semibold">{itemName(tx.itemId)}</td>
                    <td>{warehouseName(tx.warehouseId)}</td>
                    <td><code className="text-dark">{tx.lotNumber || '-'}</code></td>
                    <td className={`fw-bold ${tx.quantity < 0 ? 'text-danger' : 'text-success'}`}>
                      {tx.quantity}
                    </td>
                    <td><span className="badge bg-secondary opacity-75">{tx.transactionType}</span></td>
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
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className="col">
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-4" style={{ borderColor: color }}>
        <p className="text-muted small fw-bold text-uppercase mb-1">{title}</p>
        <h4 className="fw-bold m-0" style={{ color: '#1e293b' }}>{value ?? 0}</h4>
      </div>
    </div>
  );
}

const styles = {
  page: { 
    padding: '40px', 
    background: '#f8fafc', 
    minHeight: '100vh', 
    fontFamily: '"Inter", sans-serif' 
  }
};
