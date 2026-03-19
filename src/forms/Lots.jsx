import React, { useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

export default function Lots() {
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const [inventoryRes, itemsRes, warehousesRes] = await Promise.all([
          smartErpApi.stockInventory(),
          smartErpApi.stockItems(),
          smartErpApi.warehouses()
        ]);
        setInventory(inventoryRes.data || []);
        setItems(itemsRes.data || []);
        setWarehouses(warehousesRes.data || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Unable to load lot overview at the moment.");
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, []);

  const inventoryRows = useMemo(() => {
    const itemsById = new Map(items.map((item) => [item.id, item]));
    const warehousesById = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));

    return inventory.map((entry) => {
      const warehouse = warehousesById.get(entry.WarehouseId);
      const item = itemsById.get(entry.ItemId);
      const lotNumber =
        (entry.lotNumber || entry.LotNumber || entry.lotId || "").trim() === "-" ||
        !(entry.lotNumber || entry.LotNumber)
          ? "General Inventory"
          : entry.lotNumber || entry.LotNumber;
      const quantity = Number(entry.quantity || entry.Quantity || 0);
      const storageHint = warehouse?.name || item?.WarehouseLocation || "Main Storage";

      return {
        id: entry.id ?? entry.Id,
        lotId: entry.lotId ?? entry.LotId,
        lotNumber,
        itemCode: item?.itemCode || `Item-${entry.itemId}`,
        itemName: item?.description || "Unknown product",
        warehouseName: warehouse?.name || `WH-${entry.warehouseId}`,
        quantity,
        storage: storageHint,
        locationCode: entry.locationCode || entry.LocationCode || item?.WarehouseLocation || "N/A"
      };
    });
  }, [inventory, items, warehouses]);

  const filteredRows = useMemo(() => {
    if (!filter) return inventoryRows;
    const normalized = filter.toLowerCase();
    return inventoryRows.filter(
      (row) =>
        row.itemCode.toLowerCase().includes(normalized) ||
        row.itemName.toLowerCase().includes(normalized) ||
        row.lotNumber.toLowerCase().includes(normalized) ||
        row.warehouseName.toLowerCase().includes(normalized)
    );
  }, [filter, inventoryRows]);

  const summary = useMemo(() => {
    const uniqueLots = new Set(
      inventoryRows.map((row) => (row.lotId != null ? `lot-${row.lotId}` : `general-${row.itemCode}-${row.warehouseName}`))
    );
    const uniqueItems = new Set(inventoryRows.map((row) => row.itemCode));
    const totalQuantity = inventoryRows.reduce((sum, row) => sum + row.quantity, 0);
    return {
      lots: uniqueLots.size,
      items: uniqueItems.size,
      quantity: totalQuantity
    };
  }, [inventoryRows]);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Lot Tracking</h1>
          <p className="text-muted mb-0">See every lot, where it lives, and how much stock remains.</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => setFilter("")}>
          Reset filter
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row gy-3 mb-4">
        <div className="col-sm-6 col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">Tracked Lots</h6>
              <h2 className="fw-bold">{summary.lots}</h2>
              <p className="mb-0 text-muted">Distinct lot numbers currently in stock.</p>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">Products Covered</h6>
              <h2 className="fw-bold">{summary.items}</h2>
              <p className="mb-0 text-muted">Items that currently have lot entries.</p>
            </div>
          </div>
        </div>
        <div className="col-sm-12 col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">Available Quantity</h6>
              <h2 className="fw-bold">{summary.quantity.toFixed(0)}</h2>
              <p className="mb-0 text-muted">Units ready across all tracked lots.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
          <h5 className="mb-0">Lot Details</h5>
          <input
            className="form-control form-control-sm w-auto"
            placeholder="Filter by item, lot or warehouse..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            disabled={loading}
          />
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading lots...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Item</th>
                    <th>Lot #</th>
                    <th>Warehouse</th>
                    <th>Quantity</th>
                    <th>Storage</th>
                    <th>Location Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        No lot data matched your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr key={`${row.id}-${row.lotNumber ?? "general"}`}>
                        <td>
                          <strong>{row.itemCode}</strong>
                          <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                            {row.itemName}
                          </div>
                        </td>
                        <td>{row.lotNumber}</td>
                        <td>{row.warehouseName}</td>
                        <td>
                          <span className={`badge ${row.quantity === 0 ? "bg-danger" : "bg-success"}`}>
                            {row.quantity.toFixed(0)}
                          </span>
                        </td>
                        <td>{row.storage}</td>
                        <td>{row.locationCode || "n/a"}</td>
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
