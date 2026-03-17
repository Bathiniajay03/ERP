import React, { useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";
import DocumentAttachments from "../components/DocumentAttachments";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(null);

  const [form, setForm] = useState({
    vendorCode: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: ""
  });

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await smartErpApi.getVendors();
      setVendors(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVendors(); }, []);

  useEffect(() => {
    if (vendors.length > 0 && !selectedVendorId) {
      setSelectedVendorId(vendors[0].id);
    }
  }, [vendors, selectedVendorId]);

  const selectedVendor = useMemo(() => {
    if (!selectedVendorId) return null;
    return vendors.find((vendor) => vendor.id === Number(selectedVendorId)) ?? null;
  }, [vendors, selectedVendorId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await smartErpApi.createVendor(form);
      setMessage("Vendor created successfully!");
      setForm({ vendorCode: "", name: "", contactPerson: "", phone: "", email: "" });
      setShowForm(false);
      fetchVendors();
    } catch (err) {
      setMessage(err?.response?.data || "Failed to create vendor");
    }
  };

  return (
    <div className="container-fluid py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Vendor Management</h2>
          <p className="text-muted mb-0">Manage vendor accounts and supplier relationships</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close Form" : "+ Add Vendor"}
        </button>
      </div>

      {message && <div className={`alert alert-${message.includes("success") ? "success" : "info"} py-2`}>{message}</div>}

      {showForm && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <h5 className="fw-bold mb-3">Create New Vendor</h5>
          <form onSubmit={handleCreate} className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Vendor Code *</label>
              <input className="form-control" value={form.vendorCode} onChange={(e) => setForm({...form, vendorCode: e.target.value})} placeholder="VEND-001" required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Company Name *</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Supplier Pvt Ltd" required />
            </div>
            <div className="col-md-4">
              <label className="form-label">Contact Person</label>
              <input className="form-control" value={form.contactPerson} onChange={(e) => setForm({...form, contactPerson: e.target.value})} placeholder="Jane Smith" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="contact@supplier.com" />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+91 9876543210" />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary">Create Vendor</button>
            </div>
          </form>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-4">
        <h5 className="fw-bold mb-3">Vendor Directory</h5>
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr><th>Code</th><th>Company</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>Status</th><th>Created</th></tr>
              </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                    <td className="fw-semibold">{vendor.vendorCode}</td>
                    <td>{vendor.name}</td>
                    <td>{vendor.contactPerson || "-"}</td>
                    <td>{vendor.email || "-"}</td>
                    <td>{vendor.phone || "-"}</td>
                    <td>
                      <span className={`badge ${vendor.isActive ? "bg-success" : "bg-secondary"}`}>
                        {vendor.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{new Date(vendor.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {vendors.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No vendors found. Create your first vendor to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
          <label className="form-label mb-0">Vendor documents</label>
          <select
            className="form-select form-select-sm"
            value={selectedVendorId || ""}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedVendorId(value ? Number(value) : null);
            }}
          >
            <option value="">Select a vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.vendorCode} - {vendor.name}
              </option>
            ))}
          </select>
        </div>
        <DocumentAttachments
          entityType="Vendor"
          entityId={selectedVendor?.id}
          entityLabel={selectedVendor?.name || "Vendor"}
        />
      </div>
    </div>
  );
}
