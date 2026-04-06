import React, { useState, useEffect, useCallback } from "react";
import { packerApi } from "../services/packerApi";
import "../forms/Operations.css";

export default function PackerManagement({ onPackersLoaded, onAssignPacker }) {
  const [packers, setPackers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPackerId, setEditingPackerId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    phone: "",
    email: "",
    department: "Packing",
    isActive: true
  });

  // Load packers
  const loadPackers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await packerApi.getAllPackers();
      const packersList = Array.isArray(response.data) ? response.data : [];
      setPackers(packersList);
      if (onPackersLoaded) {
        onPackersLoaded(packersList);
      }
      setMessage("");
    } catch (error) {
      setMessage("Failed to load packers: " + (error?.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [onPackersLoaded]);

  // Load packers on mount
  useEffect(() => {
    loadPackers();
  }, [loadPackers]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      employeeId: "",
      phone: "",
      email: "",
      department: "Packing",
      isActive: true
    });
    setEditingPackerId(null);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Create or update packer
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setMessage("Packer name is required");
      return;
    }
    if (!formData.employeeId.trim()) {
      setMessage("Employee ID is required");
      return;
    }

    setLoading(true);
    try {
      if (editingPackerId) {
        // Update existing packer
        await packerApi.updatePacker(editingPackerId, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          department: formData.department,
          isActive: formData.isActive
        });
        setMessage("Packer updated successfully!");
      } else {
        // Create new packer
        await packerApi.createPacker(formData);
        setMessage("Packer created successfully!");
      }

      resetForm();
      setShowForm(false);
      await loadPackers();
    } catch (error) {
      setMessage(`Error: ${error?.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit packer
  const handleEdit = (packer) => {
    setFormData({
      name: packer.name,
      employeeId: packer.employeeId,
      phone: packer.phone,
      email: packer.email,
      department: packer.department || "Packing",
      isActive: packer.isActive
    });
    setEditingPackerId(packer.id);
    setShowForm(true);
  };

  // Delete packer
  const handleDelete = async (packerId) => {
    if (!window.confirm("Are you sure you want to delete this packer?")) {
      return;
    }

    setLoading(true);
    try {
      await packerApi.deletePacker(packerId);
      setMessage("Packer deleted successfully!");
      await loadPackers();
    } catch (error) {
      setMessage(`Error deleting packer: ${error?.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Deactivate packer
  const handleDeactivate = async (packerId) => {
    if (!window.confirm("Deactivate this packer?")) {
      return;
    }

    setLoading(true);
    try {
      await packerApi.deactivatePacker(packerId);
      setMessage("Packer deactivated successfully!");
      await loadPackers();
    } catch (error) {
      setMessage(`Error deactivating packer: ${error?.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="packer-management-section">
      <div className="packer-header">
        <h3>📦 Packer Management</h3>
        <button
          className={`btn ${showForm ? "btn-secondary" : "btn-primary"}`}
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Cancel" : "+ Add New Packer"}
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes("Error") ? "alert-danger" : "alert-success"}`}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="packer-form">
          <h4>{editingPackerId ? "Edit Packer" : "Create New Packer"}</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label>Packer Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label>Employee ID *</label>
              <input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                placeholder="e.g., EMP001"
                disabled={editingPackerId !== null}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="10-digit phone number"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="packer@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              >
                <option value="Packing">Packing</option>
                <option value="Shipping">Shipping</option>
                <option value="Quality Check">Quality Check</option>
                <option value="Warehouse">Warehouse</option>
              </select>
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? "Saving..." : editingPackerId ? "Update Packer" : "Create Packer"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && !showForm && <p className="loading-text">Loading packers...</p>}

      {!showForm && packers.length > 0 && (
        <div className="packers-list">
          <h4>Active Packers ({packers.filter(p => p.isActive).length})</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Department</th>
                <th>Orders</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packers.map(packer => (
                <tr key={packer.id} className={packer.isActive ? "" : "inactive-row"}>
                  <td><strong>{packer.name}</strong></td>
                  <td>{packer.employeeId}</td>
                  <td>{packer.phone || "---"}</td>
                  <td>{packer.email || "---"}</td>
                  <td>{packer.department || "Packing"}</td>
                  <td className="text-center">{packer.assignedOrders || 0}</td>
                  <td>
                    <span className={`badge ${packer.isActive ? "badge-success" : "badge-secondary"}`}>
                      {packer.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(packer)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    {packer.isActive && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleDeactivate(packer.id)}
                        title="Deactivate"
                      >
                        🔒
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(packer.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!showForm && packers.length === 0 && !loading && (
        <div className="empty-state">
          <p>No packers found. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
