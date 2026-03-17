import React, { useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";
import DocumentAttachments from "../components/DocumentAttachments";

export default function Finance() {
  const [transactions, setTransactions] = useState([]);
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
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await smartErpApi.stockTransactions();
      // Using stock transactions as fallback - finance transactions would be similar
      setTransactions(res.data || []);
      setError("");
    } catch (err) {
      setError("Failed to load transactions");
      console.error(err);
    } finally {
      setLoading(false);
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

  const filteredTransactions = transactions.filter((t) =>
    t.transactionType?.toLowerCase().includes(filter.toLowerCase()) ||
    t.referenceNumber?.toLowerCase().includes(filter.toLowerCase())
  );

  const selectedInvoice = useMemo(() => {
    if (!selectedInvoiceId) return null;
    return invoices.find((invoice) => invoice.id === Number(selectedInvoiceId)) ?? null;
  }, [invoices, selectedInvoiceId]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Finance & Payments</h1>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={fetchTransactions} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Record Payment
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted">Total Transactions</h6>
              <h3>{transactions.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted">Total Revenue</h6>
              <h3 className="text-success">
                ${transactions.filter(t => t.transactionType === 'Sale').reduce((sum, t) => sum + Math.abs(t.changeInQuantity), 0).toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted">Pending Payments</h6>
              <h3 className="text-warning">{transactions.filter(t => t.status === 'Pending').length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted">Completed Today</h6>
              <h3 className="text-info">
                {transactions.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Transaction History</h5>
          <input
            type="text"
            className="form-control w-25"
            placeholder="Search transactions..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id}>
                        <td>#{t.id}</td>
                        <td>
                          <span className={`badge ${
                            t.transactionType === 'Sale' ? 'bg-success' :
                            t.transactionType === 'Purchase' ? 'bg-primary' :
                            'bg-secondary'
                          }`}>
                            {t.transactionType || 'Transaction'}
                          </span>
                        </td>
                        <td>{t.referenceNumber || 'N/A'}</td>
                        <td>${Math.abs(t.changeInQuantity)?.toFixed(2)}</td>
                        <td>
                          <span className={`badge ${
                            t.status === 'Completed' ? 'bg-success' :
                            t.status === 'Pending' ? 'bg-warning' :
                            'bg-secondary'
                          }`}>
                            {t.status || 'Pending'}
                          </span>
                        </td>
                        <td>{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>

    <div className="card border-0 shadow-sm rounded-4 mt-4">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-3">
          <h5 className="mb-0">Invoices</h5>
          <select
            className="form-select form-select-sm"
            value={selectedInvoiceId || ""}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedInvoiceId(value ? Number(value) : null);
            }}
          >
            <option value="">Select invoice</option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoiceNumber} ({invoice.salesOrderNumber || "SO"}) - ${invoice.totalAmount}
              </option>
            ))}
          </select>
        </div>
        {invoiceLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading invoices...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Invoice #</th>
                  <th>Sales Order</th>
                  <th>Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-muted text-center py-3">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.salesOrderNumber || invoice.salesOrderId}</td>
                      <td>${invoice.totalAmount}</td>
                      <td>{new Date(invoice.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <DocumentAttachments
          entityType="Invoice"
          entityId={selectedInvoice?.id}
          entityLabel={selectedInvoice?.invoiceNumber || "Invoice"}
        />
      </div>
    </div>

    {/* Payment Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Record Payment</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleRecordPayment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Sales Order ID</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.salesOrderId}
                      onChange={(e) => setFormData({...formData, salesOrderId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Payment Method</label>
                    <select
                      className="form-select"
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
                  <div className="mb-3">
                    <label className="form-label">Transaction Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.reference}
                      onChange={(e) => setFormData({...formData, reference: e.target.value})}
                      placeholder="Check #, Transaction ID, etc."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Record Payment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
