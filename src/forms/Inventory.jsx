import React, { useEffect, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

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

  const filteredInventory = inventory.filter((item) =>
    item.itemName?.toLowerCase().includes(filter.toLowerCase()) ||
    item.itemCode?.toLowerCase().includes(filter.toLowerCase()) ||
    item.warehouseName?.toLowerCase().includes(filter.toLowerCase())
  );

  const getTotalValue = () => {
    return inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toFixed(2);
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity < item.minStock).length;
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Inventory Management</h1>
        <button className="btn btn-primary" onClick={fetchInventory} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted">Total Items</h6>
              <h3>{inventory.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted">Total Value</h6>
              <h3>${getTotalValue()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted">Low Stock Items</h6>
              <h3 className="text-danger">{getLowStockItems()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted">Warehouses</h6>
              <h3>{new Set(inventory.map(i => i.warehouseId)).size}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Stock Levels</h5>
          <input
            type="text"
            className="form-control w-25"
            placeholder="Search inventory..."
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
                    <th>Item Code</th>
                    <th>Item Name</th>
                    <th>Warehouse</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Min Stock</th>
                    <th>Max Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4 text-muted">
                        No inventory found
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.itemCode}</strong></td>
                        <td>{item.itemName}</td>
                        <td>{item.warehouseName || `WH-${item.warehouseId}`}</td>
                        <td>
                          <span className={`badge ${item.quantity < item.minStock ? 'bg-danger' : 'bg-success'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td>${Number(item.unitCost)?.toFixed(2)}</td>
                        <td>${(item.quantity * item.unitCost).toFixed(2)}</td>
                        <td>{item.minStock}</td>
                        <td>{item.maxStock}</td>
                        <td>
                          {item.quantity === 0 ? (
                            <span className="badge bg-danger">Out of Stock</span>
                          ) : item.quantity < item.minStock ? (
                            <span className="badge bg-warning">Low Stock</span>
                          ) : item.quantity > item.maxStock ? (
                            <span className="badge bg-info">Overstocked</span>
                          ) : (
                            <span className="badge bg-success">In Stock</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
