import React, { useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";
// import DocumentAttachments from "../components/DocumentAttachments";

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [vendorReturns, setVendorReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    salesOrderId: "",
    amount: "",
    paymentMethod: "Credit Card",
    reference: ""
  });
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  useEffect(() => {
    fetchTransactions();
    fetchVendorReturns();
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await smartErpApi.reportsTransactions();
      const data = (res.data || []).map((tx) => ({
        ...tx,
        quantity: Number(tx.quantity || tx.Quantity || 0),
        transactionType: tx.transactionType || tx.TransactionType || "MOVE",
        lotNumber: tx.lotNumber || tx.lotNumber === "-" ? tx.lotNumber : tx.LotNumber,
        warehouseName: tx.warehouseName || tx.Warehouse?.name || `WH-${tx.warehouseId}`,
        itemName: tx.itemName || tx.itemCode || `Item-${tx.itemId}`,
        transactionDate: tx.transactionDate || tx.TransactionDate
      }));
      setTransactions(data);
      setError("");
    } catch (err) {
      setError("Failed to load transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorReturns = async () => {
    try {
      const res = await smartErpApi.getVendorReturns();
      setVendorReturns(res.data || []);
    } catch (err) {
      console.error("Failed to load vendor returns", err);
    }
  };

  const fetchInvoices = async () => {
    setInvoiceLoading(true);
    try {
      const res = await smartErpApi.getInvoices();
      const data = res.data || [];
      setInvoices(data);
      setSelectedInvoiceId((prev) => prev ?? (data[0]?.id ?? null));
    } catch (err) {
      setError("Failed to load invoices");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await smartErpApi.recordSalesPayment({
        salesOrderId: Number(formData.salesOrderId),
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod,
        transactionReference: formData.reference
      });
      alert("Payment recorded successfully!");
      setShowModal(false);
      fetchTransactions();
    } catch (err) {
      alert("Failed to record payment: " + err.message);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const query = filter.toLowerCase();
    return (
      t.transactionType?.toLowerCase().includes(query) ||
      t.itemName?.toLowerCase().includes(query) ||
      t.warehouseName?.toLowerCase().includes(query) ||
      (t.lotNumber || "").toLowerCase().includes(query)
    );
  });

  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return null;
    return invoices.find((invoice) => invoice.id === Number(selectedInvoiceId)) ?? null;
  }, [invoices, selectedInvoiceId]);

  return (
    <div className="erp-app-wrapper min-vh-100 pb-4 pt-3">
      <div className="container-fluid px-4">
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Finance & Reconciliation</h4>
            <span className="erp-text-muted small text-uppercase">Movements, Invoices & Returns</span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" onClick={() => { fetchTransactions(); fetchVendorReturns(); fetchInvoices(); }} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
              Refresh Data
            </button>
            <button className="btn btn-primary erp-btn" onClick={() => setShowModal(true)}>
              + Record Payment
            </button>
          </div>
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
              <span className="erp-kpi-label">Total Movements</span>
              <div className="d-flex justify-content-between align-items-end">
                <span className="erp-kpi-value text-dark">{transactions.length}</span>
                <div className="text-end" style={{ fontSize: '0.7rem' }}>
                  <div className="text-success fw-bold">{transactions.filter((t) => t.transactionType === 'IN').length} IN</div>
                  <div className="text-danger fw-bold">{transactions.filter((t) => t.transactionType === 'OUT').length} OUT</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#059669' }}>
              <span className="erp-kpi-label">Net Stock Impact</span>
              <span className="erp-kpi-value text-success font-monospace">
                {transactions.reduce((sum, t) => {
                  if (t.transactionType === 'IN') return sum + t.quantity;
                  if (t.transactionType === 'OUT') return sum - t.quantity;
                  return sum;
                }, 0)}
              </span>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#f59e0b' }}>
              <span className="erp-kpi-label">Tracked Lots</span>
              <div className="d-flex justify-content-between align-items-end">
                <span className="erp-kpi-value text-dark">{new Set(transactions.map((t) => t.lotNumber || "-")).size}</span>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Distinct tags</span>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#6366f1' }}>
              <span className="erp-kpi-label">Active Warehouses</span>
              <span className="erp-kpi-value text-dark">{new Set(transactions.map((t) => t.warehouseName)).size}</span>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT GRID */}
        <div className="row g-4">
          
          {/* LEFT COLUMN: TRANSACTIONS */}
          <div className="col-xl-8">
            <div className="erp-panel d-flex flex-column shadow-sm mb-4" style={{ height: "400px" }}>
              <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
                <span className="fw-bold">Transaction History Ledger</span>
                <input
                  type="text"
                  className="form-control form-control-sm erp-input w-auto"
                  placeholder="Filter transactions..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
                {loading ? (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100">
                    <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }}></div>
                  </div>
                ) : (
                  <table className="table erp-table table-hover table-bordered mb-0 align-middle">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th className="text-center">Type</th>
                        <th>Item Reference</th>
                        <th>Location</th>
                        <th>Lot / Batch</th>
                        <th className="text-end">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">No transactions found in ledger.</td>
                        </tr>
                      ) : (
                        filteredTransactions.map((t) => (
                          <tr key={t.id}>
                            <td className="text-muted small">{new Date(t.transactionDate).toLocaleString()}</td>
                            <td className="text-center">
                              <span className={`erp-status-tag ${t.transactionType === "IN" ? "tag-success" : t.transactionType === "OUT" ? "tag-danger" : "tag-info"}`}>
                                {t.transactionType || "MOVE"}
                              </span>
                            </td>
                            <td className="fw-bold text-dark">{t.itemName}</td>
                            <td>{t.warehouseName}</td>
                            <td className="font-monospace text-muted">{t.lotNumber || "—"}</td>
                            <td className={`text-end font-monospace fw-bold ${t.transactionType === "OUT" ? "text-danger" : "text-dark"}`}>{t.quantity}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* VENDOR RETURNS */}
            <div className="erp-panel d-flex flex-column shadow-sm" style={{ height: "350px" }}>
              <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
                <span className="fw-bold">Vendor Return Authorizations</span>
              </div>
              <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
                <table className="table erp-table table-hover table-bordered mb-0 align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>ID</th>
                      <th>Vendor Reference</th>
                      <th>RMA Number</th>
                      <th className="text-end">Total Amt</th>
                      <th className="text-center">Status</th>
                      <th className="text-end">Date Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorReturns.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4 text-muted">No vendor returns active.</td></tr>
                    ) : (
                      vendorReturns.filter((vendor) =>
                        vendor.vendorName?.toLowerCase().includes(filter.toLowerCase()) ||
                        vendor.returnNumber?.toLowerCase().includes(filter.toLowerCase())
                      ).map((vendor) => (
                        <tr key={vendor.id}>
                          <td className="text-muted">#{vendor.id}</td>
                          <td className="fw-bold text-dark">{vendor.vendorName || vendor.vendorId}</td>
                          <td className="font-monospace">{vendor.returnNumber}</td>
                          <td className="text-end font-monospace">${(vendor.totalAmount || 0).toFixed(2)}</td>
                          <td className="text-center">
                            <span className={`erp-status-tag ${vendor.status === "Completed" ? "tag-success" : "tag-warning"}`}>
                              {vendor.status}
                            </span>
                          </td>
                          <td className="text-end text-muted small">{new Date(vendor.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INVOICES */}
          <div className="col-xl-4">
            <div className="erp-panel d-flex flex-column shadow-sm h-100">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold d-block mb-2">Invoice Ledger</span>
                <select
                  className="form-select erp-input font-monospace"
                  value={selectedInvoiceId || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedInvoiceId(value ? Number(value) : null);
                  }}
                >
                  <option value="">-- Select Invoice context --</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} | SO: {invoice.salesOrderNumber || "N/A"} | ${invoice.totalAmount}
                    </option>
                  ))}
                </select>
              </div>
              <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
                {invoiceLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : (
                  <table className="table erp-table table-hover mb-0 align-middle">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th className="text-end">Total</th>
                        <th className="text-end">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-4 text-muted">No invoices generated.</td></tr>
                      ) : (
                        invoices.map((invoice) => (
                          <tr key={invoice.id} className={selectedInvoiceId === invoice.id ? "table-primary" : ""}>
                            <td>
                              <div className="fw-bold font-monospace text-dark">{invoice.invoiceNumber}</div>
                              <div className="text-muted" style={{ fontSize: '0.65rem' }}>SO: {invoice.salesOrderNumber || invoice.salesOrderId}</div>
                            </td>
                            <td className="text-end font-monospace fw-semibold">${invoice.totalAmount}</td>
                            <td className="text-end text-muted" style={{ fontSize: '0.7rem' }}>
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Document Attachments Component Placeholder */}
              {/* <div className="p-3 border-top bg-light">
                <DocumentAttachments
                  entityType="Invoice"
                  entityId={selectedInvoice?.id}
                  entityLabel={selectedInvoice?.invoiceNumber || "Invoice"}
                />
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showModal && (
        <div className="erp-modal-overlay">
          <div className="erp-dialog erp-dialog-md">
            <div className="erp-dialog-header">
              <h6 className="m-0 fw-bold">Record Incoming Payment</h6>
              <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
            </div>
            <div className="erp-dialog-body">
              <form onSubmit={handleRecordPayment}>
                <div className="mb-3">
                  <label className="erp-label">Sales Order ID <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control erp-input font-monospace"
                    value={formData.salesOrderId}
                    onChange={(e) => setFormData({...formData, salesOrderId: e.target.value})}
                    placeholder="e.g. 10045"
                    required
                  />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="erp-label">Payment Amount <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control erp-input text-end font-monospace"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="erp-label">Payment Method <span className="text-danger">*</span></label>
                    <select
                      className="form-select erp-input"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    >
                      <option>Credit Card</option>
                      <option>Bank Transfer</option>
                      <option>Cash</option>
                      <option>Check</option>
                      <option>Credit Note</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="erp-label">Transaction Reference</label>
                  <input
                    type="text"
                    className="form-control erp-input font-monospace"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Check #, Auth Code, Txn ID..."
                  />
                </div>
                
                <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                  <button type="button" className="btn btn-light border erp-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary erp-btn px-4">Post Payment to Ledger</button>
                </div>
              </form>
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
          font-size: 0.7rem; 
          text-transform: uppercase; 
          color: var(--erp-text-muted); 
          font-weight: 700; 
          letter-spacing: 0.5px;
        }
        .erp-kpi-value { 
          font-size: 1.5rem; 
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
          padding: 10px 16px;
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
          font-weight: 600;
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
        .table-primary { background-color: #f0f4f8 !important; }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 3px 6px;
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

        /* Modals */
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
        .erp-dialog-body {
          padding: 20px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}