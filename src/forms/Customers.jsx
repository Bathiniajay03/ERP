import React, { useCallback, useEffect, useState } from "react";
import api from "../services/apiClient";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [form, setForm] = useState({
    customerCode: "",
   companyName: "",
   contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
   country: "India",
    customerType: "Retail",
    paymentTerms: "Net30",
   creditLimit: 0,
    notes: ""
  });

  const fetchCustomers = useCallback(async () => {
   setLoading(true);
    try {
     const res = await api.get("/customers");
     setCustomers(res.data || []);
    } catch (err) {
     setMessage(err?.response?.data || "Failed to load customers");
    } finally {
     setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleCreate = async (e) => {
   e.preventDefault();
    setLoading(true);
    try {
      await api.post("/customers", form);
     setMessage("Customer created successfully!");
     setForm({ customerCode: "", companyName: "", contactPerson: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "", country: "India", customerType: "Retail", paymentTerms: "Net30", creditLimit: 0, notes: "" });
     setShowForm(false);
     fetchCustomers();
    } catch (err) {
     setMessage(err?.response?.data || "Failed to create customer");
    } finally {
     setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
     const res = await api.get(`/customers/${id}`);
     setSelectedCustomer(res.data);
    } catch (err) {
     setMessage(err?.response?.data || "Failed to load customer details");
    }
  };

  return (
    <div className="container-fluid py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Customer Management</h2>
          <p className="text-muted mb-0">Manage customer accounts and relationships</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close Form" : "+ Add Customer"}
        </button>
      </div>

      {message && <div className={`alert alert-${message.includes("success") ? "success" : "info"} py-2`}>{message}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-3">Create New Customer</h5>
          <form onSubmit={handleCreate} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Customer Code *</label>
              <input className="form-control" value={form.customerCode} onChange={(e) => setForm({...form, customerCode: e.target.value})} placeholder="CUST-001" required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Company Name *</label>
              <input className="form-control" value={form.companyName} onChange={(e) => setForm({...form, companyName: e.target.value})} placeholder="Company Pvt Ltd" required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Contact Person</label>
              <input className="form-control" value={form.contactPerson} onChange={(e) => setForm({...form, contactPerson: e.target.value})} placeholder="John Doe" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+91 9876543210" />
            </div>
            <div className="col-md-4">
              <label className="form-label">Customer Type</label>
              <select className="form-select" value={form.customerType} onChange={(e) => setForm({...form, customerType: e.target.value})}>
                <option>Retail</option><option>Wholesale</option><option>Distributor</option><option>Corporate</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Address</label>
              <input className="form-control" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="Street address" />
            </div>
            <div className="col-md-3">
              <label className="form-label">City</label>
              <input className="form-control" value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} placeholder="Hyderabad" />
            </div>
            <div className="col-md-3">
              <label className="form-label">State</label>
              <input className="form-control" value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} placeholder="Telangana" />
            </div>
            <div className="col-md-3">
              <label className="form-label">Payment Terms</label>
              <select className="form-select" value={form.paymentTerms} onChange={(e) => setForm({...form, paymentTerms: e.target.value})}>
                <option>Net30</option><option>Net60</option><option>Net90</option><option>COD</option><option>Advance</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Credit Limit (₹)</label>
              <input type="number" className="form-control" value={form.creditLimit} onChange={(e) => setForm({...form, creditLimit: Number(e.target.value)})} placeholder="100000" />
            </div>
            <div className="col-12">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows="2" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional information..."></textarea>
            </div>
            <div className="col-12">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Customer"}
            </button>
            </div>
          </form>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h5 className="fw-bold mb-3">Customer Directory</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr><th>Code</th><th>Company</th><th>Contact</th><th>Email</th><th>Phone</th><th>Type</th><th>Credit Limit</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.map((cust) => (
                <tr key={cust.id}>
                  <td><strong>{cust.customerCode}</strong></td>
                  <td>{cust.companyName}</td>
                  <td>{cust.contactPerson || "-"}</td>
                  <td>{cust.email || "-"}</td>
                  <td>{cust.phone || "-"}</td>
                  <td><span className={`badge ${cust.customerType === "Wholesale" ? "bg-primary" : "bg-secondary"}`}>{cust.customerType}</span></td>
                  <td>₹{(cust.creditLimit || 0).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewDetails(cust.id)}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Customer Details - {selectedCustomer.companyName}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedCustomer(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6"><strong>Customer Code:</strong><p>{selectedCustomer.customerCode}</p></div>
                  <div className="col-md-6"><strong>Contact Person:</strong><p>{selectedCustomer.contactPerson || "-"}</p></div>
                  <div className="col-md-6"><strong>Email:</strong><p>{selectedCustomer.email || "-"}</p></div>
                  <div className="col-md-6"><strong>Phone:</strong><p>{selectedCustomer.phone || "-"}</p></div>
                  <div className="col-12"><strong>Address:</strong><p>{selectedCustomer.address || "-"}</p><p>{selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.zipCode}</p></div>
                  <div className="col-md-4"><strong>Customer Type:</strong><p>{selectedCustomer.customerType}</p></div>
                  <div className="col-md-4"><strong>Payment Terms:</strong><p>{selectedCustomer.paymentTerms}</p></div>
                  <div className="col-md-4"><strong>Credit Limit:</strong><p>₹{(selectedCustomer.creditLimit || 0).toLocaleString()}</p></div>
                  <div className="col-md-6"><strong>Outstanding Balance:</strong><p className="text-danger">₹{(selectedCustomer.outstandingBalance || 0).toLocaleString()}</p></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
