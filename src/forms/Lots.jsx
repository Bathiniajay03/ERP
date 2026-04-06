import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";
import JsBarcode from "jsbarcode";

export default function Lots() {
  const [inventory, setInventory] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  
  // State for the modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lotSerials, setLotSerials] = useState({});
  const [serialsLoadingLot, setSerialsLoadingLot] = useState(null);
  const [serialsErrorLot, setSerialsErrorLot] = useState('');
  const [openLotForSerials, setOpenLotForSerials] = useState(null);
  const [detailSerial, setDetailSerial] = useState(null);
  const [serialModalStatus, setSerialModalStatus] = useState({ type: "", text: "" });
  const [modalDispatching, setModalDispatching] = useState(false);
  const barcodeRef = useRef(null);

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

  // 1. Map raw inventory to rich rows (only show lots with available quantity > 0)
  const inventoryRows = useMemo(() => {
    const itemsById = new Map(items.map((item) => [item.id, item]));
    const warehousesById = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));

    return inventory
      .filter((entry) => {
        const quantity = Number(entry.quantity || entry.Quantity || 0);
        const reservedQuantity = Number(entry.reservedQuantity || entry.ReservedQuantity || 0);
        const availableQuantity = quantity - reservedQuantity;
        return availableQuantity > 0; // Only show lots with available stock
      })
      .map((entry) => {
        const resolvedItemId = entry.ItemId ?? entry.itemId;
        const resolvedWarehouseId = entry.WarehouseId ?? entry.warehouseId;
        const warehouse = warehousesById.get(resolvedWarehouseId);
        const item = itemsById.get(resolvedItemId);
        const lotNumber =
          (entry.lotNumber || entry.LotNumber || entry.lotId || "").trim() === "-" ||
          !(entry.lotNumber || entry.LotNumber)
            ? "General Inventory"
            : entry.lotNumber || entry.LotNumber;
        const quantity = Number(entry.quantity || entry.Quantity || 0);
        const reservedQuantity = Number(entry.reservedQuantity || entry.ReservedQuantity || 0);
        const availableQuantity = quantity - reservedQuantity;
        const storageHint = warehouse?.name || item?.WarehouseLocation || "Main Storage";

        return {
          id: entry.id ?? entry.Id,
          lotId: entry.lotId ?? entry.LotId,
          itemId: resolvedItemId,
          warehouseId: resolvedWarehouseId,
          lotNumber,
          itemCode: item?.itemCode || `Item-${entry.itemId || entry.ItemId}`,
          itemName: item?.description || "Unknown product",
          warehouseName: warehouse?.name || `WH-${entry.warehouseId || entry.WarehouseId}`,
          quantity: availableQuantity, // Show available quantity instead of total
          totalQuantity: quantity, // Keep total for reference
          reservedQuantity,
          storage: storageHint,
          locationCode: entry.locationCode || entry.LocationCode || item?.WarehouseLocation || "N/A"
        };
      });
  }, [inventory, items, warehouses]);

  // 2. Group those rows by Product (Item Code)
  const groupedProducts = useMemo(() => {
    const groups = {};
    inventoryRows.forEach((row) => {
      if (!groups[row.itemCode]) {
        groups[row.itemCode] = {
          itemCode: row.itemCode,
          itemId: row.itemId,
          itemName: row.itemName,
          totalQuantity: 0,
          lots: []
        };
      }
      groups[row.itemCode].totalQuantity += row.quantity;
      groups[row.itemCode].lots.push(row);
    });
    
    // Sort products alphabetically
    return Object.values(groups).sort((a, b) => a.itemCode.localeCompare(b.itemCode));
  }, [inventoryRows]);

  // 3. Filter the grouped products
  const filteredGroups = useMemo(() => {
    if (!filter) return groupedProducts;
    const normalized = filter.toLowerCase();
    
    return groupedProducts.filter((group) =>
      group.itemCode.toLowerCase().includes(normalized) ||
      group.itemName.toLowerCase().includes(normalized) ||
      // Also search within the lots of this product
      group.lots.some(lot => 
        lot.lotNumber.toLowerCase().includes(normalized) || 
        lot.warehouseName.toLowerCase().includes(normalized)
      )
    );
  }, [filter, groupedProducts]);

  const summary = useMemo(() => {
    const uniqueLots = new Set(
      inventoryRows.map((row) => (row.lotId != null ? `lot-${row.lotId}` : `general-${row.itemCode}-${row.warehouseName}`))
    );
    const totalQuantity = inventoryRows.reduce((sum, row) => sum + row.quantity, 0);
    return {
      lots: uniqueLots.size,
      items: groupedProducts.length,
      quantity: totalQuantity
    };
  }, [inventoryRows, groupedProducts]);

  const loadLotSerials = useCallback(async (lot) => {
    if (!selectedProduct?.itemId || !lot?.lotId || !lot?.warehouseId) return;
    const lotId = lot.lotId;
    setSerialsErrorLot('');
    setSerialsLoadingLot(lotId);
    try {
      const response = await smartErpApi.stockSerials({
        itemId: selectedProduct.itemId,
        warehouseId: lot.warehouseId,
        lotId,
        lotNumber: lot.lotNumber
      });
      const payload = Array.isArray(response.data) ? response.data : [];
      setLotSerials((prev) => ({
        ...prev,
        [lotId]: payload.map((serial) => ({
          ...serial,
          warehouseId: lot.warehouseId,
          warehouseName: lot.warehouseName,
          lotNumber: lot.lotNumber,
          lotId
        }))
      }));
    } catch (error) {
      console.error("Failed to load lot serials", error);
      setLotSerials((prev) => ({ ...prev, [lotId]: [] }));
      setSerialsErrorLot("Unable to load serial numbers for this lot.");
    } finally {
      setSerialsLoadingLot(null);
    }
  }, [selectedProduct]);

  const toggleLotSerials = useCallback((lot) => {
    if (!lot.lotId || !lot.warehouseId) return;

      if (openLotForSerials === lot.lotId) {
        setOpenLotForSerials(null);
        return;
      }

      setOpenLotForSerials(lot.lotId);
      if (!lotSerials[lot.lotId]) {
        loadLotSerials(lot);
      }
  }, [lotSerials, loadLotSerials, openLotForSerials]);

  useEffect(() => {
    setLotSerials({});
    setOpenLotForSerials(null);
    setSerialsErrorLot('');
  }, [selectedProduct?.itemId]);

  const showSerialDetails = useCallback((serial, lot) => {
    if (!serial) return;
    setDetailSerial({
      ...serial,
      warehouseId: lot?.warehouseId,
      warehouseName: lot?.warehouseName,
      lotNumber: lot?.lotNumber,
      lotId: lot?.lotId,
      itemId: selectedProduct?.itemId,
      itemCode: selectedProduct?.itemCode
    });
    setSerialModalStatus({ type: "", text: "" });
  }, [selectedProduct]);

  const closeSerialModal = useCallback(() => {
    setDetailSerial(null);
  }, []);

  useEffect(() => {
    if (!detailSerial || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, detailSerial.serialNumber, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        margin: 6
      });
    } catch (error) {
      console.warn("Barcode rendering failed", error);
    }
  }, [detailSerial]);

  const copySerialNumber = useCallback(async () => {
    if (!detailSerial) return;
    try {
      await navigator.clipboard.writeText(detailSerial.serialNumber);
      setSerialModalStatus({ type: "success", text: "Serial copied to clipboard." });
    } catch {
      setSerialModalStatus({ type: "error", text: "Unable to copy serial." });
    }
  }, [detailSerial]);

  const downloadSerialBarcode = useCallback(() => {
    if (!detailSerial || !barcodeRef.current) return;
    const svgElement = barcodeRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${detailSerial.serialNumber}-barcode.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, [detailSerial]);

  const dispatchSerialFromModal = useCallback(async () => {
    if (!detailSerial) return;
    setModalDispatching(true);
    try {
      await smartErpApi.stockOut({
        itemId: detailSerial.itemId,
        warehouseId: detailSerial.warehouseId,
        quantity: 1,
        lotNumber: detailSerial.lotNumber,
        serialNumbers: [detailSerial.serialNumber],
        reason: "Serial dispatched from lot view"
      });
      setSerialModalStatus({ type: "success", text: "Serial dispatched successfully." });
      setLotSerials((prev) => ({
        ...prev,
        [detailSerial.lotId]: prev[detailSerial.lotId]?.filter((serial) => serial.id !== detailSerial.id)
      }));
      setDetailSerial(null);
    } catch (error) {
      setSerialModalStatus({ type: "error", text: error?.response?.data || "Dispatch failed." });
    } finally {
      setModalDispatching(false);
    }
  }, [detailSerial]);

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Lot & Batch Tracking</h4>
            <span className="erp-text-muted small text-uppercase">Granular Inventory Genealogy</span>
          </div>
          <div className="d-flex gap-2 align-items-center">
             <span className="text-muted small fw-bold">Filter:</span>
             <input
              className="form-control form-control-sm erp-input"
              style={{ width: '250px' }}
              placeholder="Search product, lot, or bin..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className={`alert erp-alert py-2 mb-4`} style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
            <span className="fw-semibold">{error}</span>
          </div>
        )}

        {/* KPI DASHBOARD */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#0f4c81' }}>
              <span className="erp-kpi-label">Products Covered</span>
              <span className="erp-kpi-value text-dark">{summary.items}</span>
              <span className="text-muted" style={{ fontSize: '0.65rem' }}>Items with lot genealogy entries</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#6366f1' }}>
              <span className="erp-kpi-label">Active Lots & Batches</span>
              <span className="erp-kpi-value text-dark">{summary.lots}</span>
              <span className="text-muted" style={{ fontSize: '0.65rem' }}>Distinct tracking numbers in system</span>
            </div>
          </div>
          <div className="col-md-4">
            <div className="erp-kpi-box" style={{ borderLeftColor: '#059669' }}>
              <span className="erp-kpi-label">Total Units Tracked</span>
              <span className="erp-kpi-value text-success font-monospace">{summary.quantity.toFixed(0)}</span>
              <span className="text-muted" style={{ fontSize: '0.65rem' }}>Global sum of all tracked units</span>
            </div>
          </div>
        </div>

        {/* MASTER DATA GRID */}
        <div className="erp-panel d-flex flex-column shadow-sm" style={{ height: "calc(100vh - 240px)", minHeight: '400px' }}>
          <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Product Lot Aggregation</span>
            <span className="badge bg-secondary">{filteredGroups.length} Products</span>
          </div>
          
          <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
            {loading ? (
              <div className="d-flex flex-column align-items-center justify-content-center h-100">
                <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }}></div>
                <span className="small text-muted text-uppercase fw-bold">Synchronizing Genealogy...</span>
              </div>
            ) : (
              <table className="table erp-table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Product Code</th>
                    <th style={{ width: '35%' }}>Description</th>
                    <th className="text-center">Active Lots</th>
                    <th className="text-end">Total Available Qty</th>
                    <th className="text-center" style={{ width: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-5">
                        No product lot data matched your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((group) => (
                      <tr 
                        key={group.itemCode} 
                        onClick={() => setSelectedProduct(group)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view detailed lots"
                        className={selectedProduct?.itemCode === group.itemCode ? "table-primary" : ""}
                      >
                        <td><span className="fw-bold font-monospace text-dark">{group.itemCode}</span></td>
                        <td><span className="text-truncate d-block text-muted">{group.itemName}</span></td>
                        <td className="text-center">
                          <span className="badge bg-secondary rounded-pill px-2 py-1">
                            {group.lots.length} {group.lots.length === 1 ? 'Lot' : 'Lots'}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={`fw-bold font-monospace ${group.totalQuantity > 0 ? 'text-success' : 'text-danger'}`}>
                            {group.totalQuantity.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-center">
                           <button className="btn btn-sm btn-light border erp-btn text-primary">View Lots</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* DETAILED LOT MODAL */}
      {selectedProduct && (
        <div className="erp-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="erp-dialog erp-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="erp-dialog-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="m-0 fw-bold">{selectedProduct.itemCode}</h5>
                <small className="opacity-75">{selectedProduct.itemName}</small>
              </div>
              <button className="btn-close btn-close-white" onClick={() => setSelectedProduct(null)}></button>
            </div>
            
            <div className="erp-dialog-body bg-light p-0">
              <div className="p-4 border-bottom bg-white">
                 <div className="row">
                   <div className="col-md-6">
                     <span className="erp-meta-label">Total Product Quantity</span>
                     <div className={`fs-4 fw-bold font-monospace ${selectedProduct.totalQuantity > 0 ? 'text-success' : 'text-danger'}`}>
                       {selectedProduct.totalQuantity.toFixed(2)}
                     </div>
                   </div>
                   <div className="col-md-6 text-md-end">
                     <span className="erp-meta-label">Total Tracked Batches</span>
                     <div className="fs-4 fw-bold font-monospace text-dark">
                       {selectedProduct.lots.length}
                     </div>
                   </div>
                 </div>
              </div>

              <div className="p-4">
                <h6 className="erp-section-title mb-3">Individual Lot Breakdown</h6>
                <div className="border rounded overflow-hidden shadow-sm bg-white">
                  <table className="table erp-table table-sm table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Lot / Batch #</th>
                        <th>Warehouse</th>
                        <th>Storage / Bin</th>
                        <th className="text-end">Quantity</th>
                        <th className="text-center">Serials</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct.lots.map((lot) => (
                        <React.Fragment key={`${lot.id}-${lot.lotNumber}`}>
                          <tr>
                            <td className="fw-bold font-monospace text-dark">{lot.lotNumber}</td>
                            <td className="text-muted">{lot.warehouseName}</td>
                            <td className="text-muted">
                              <span className="d-block">{lot.storage}</span>
                              {lot.locationCode !== 'N/A' && <span className="small text-secondary">Bin: {lot.locationCode}</span>}
                            </td>
                            <td className="text-end fw-bold font-monospace">
                              {lot.quantity.toFixed(2)}
                            </td>
                            <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => toggleLotSerials(lot)}
                              disabled={!lot.lotId}
                              title={!lot.lotId ? "Lot not assigned" : undefined}
                            >
                              {openLotForSerials === lot.lotId ? 'Hide Serials' : 'View Serials'}
                            </button>
                            </td>
                            <td className="text-center">
                              <span className={`erp-status-tag ${lot.quantity > 0 ? 'tag-success' : 'tag-danger'}`}>
                                {lot.quantity > 0 ? 'AVAILABLE' : 'DEPLETED'}
                              </span>
                            </td>
                          </tr>
                          {openLotForSerials === lot.lotId && (
                            <tr>
                              <td colSpan="6" className="bg-light serial-detail">
                                {serialsLoadingLot === lot.lotId ? (
                                  <div className="text-muted small py-2">Loading serial numbers...</div>
                                ) : serialsErrorLot ? (
                                  <div className="text-danger small py-2">{serialsErrorLot}</div>
                                ) : lotSerials[lot.lotId]?.length ? (
                                  <div className="d-flex flex-wrap gap-2">
                                {lotSerials[lot.lotId].map((serial) => (
                                  <div
                                    key={serial.id}
                                    className="serial-chip"
                                    role="button"
                                    tabIndex={0}
                                    title="Click to view serial details and actions"
                                    onClick={() => showSerialDetails(serial, lot)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        showSerialDetails(serial, lot);
                                      }
                                    }}
                                  >
                                    <div className="fw-bold">{serial.serialNumber}</div>
                                    <div className="text-muted small">{serial.status}</div>
                                    {serial.purchaseOrderNumber && (
                                      <div className="text-muted small">PO: {serial.purchaseOrderNumber}</div>
                                    )}
                                  </div>
                                ))}
                                  </div>
                                ) : (
                                  <div className="text-muted small py-2">No serial numbers linked to this lot.</div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white border-top text-end">
              <button className="btn btn-secondary erp-btn px-4" onClick={() => setSelectedProduct(null)}>Close Window</button>
            </div>
          </div>
        </div>
      )}

      {detailSerial && (
        <div className="erp-modal-overlay" onClick={closeSerialModal}>
          <div className="erp-dialog erp-dialog-md" onClick={(e) => e.stopPropagation()}>
            <div className="erp-dialog-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="m-0 fw-bold">{detailSerial.serialNumber}</h5>
                <small className="opacity-75">Serial details & barcode</small>
              </div>
              <button className="btn-close btn-close-white" onClick={closeSerialModal}></button>
            </div>
            <div className="erp-dialog-body p-3">
              {serialModalStatus.text && (
                <div className={`alert ${serialModalStatus.type === "error" ? "alert-danger" : "alert-success"} py-2 small`}>
                  {serialModalStatus.text}
                </div>
              )}
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="text-muted small">Serial Number</div>
                  <div className="fw-bold font-monospace">{detailSerial.serialNumber}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted small">Item Code</div>
                  <div>{detailSerial.itemCode || `Item ${detailSerial.itemId || "N/A"}`}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted small">Warehouse</div>
                  <div>{detailSerial.warehouseName || `WH-${detailSerial.warehouseId || "N/A"}`}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted small">Lot</div>
                  <div>{detailSerial.lotNumber || "General"}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted small">Status</div>
                  <div className="fw-semibold">{detailSerial.status}</div>
                </div>
                {detailSerial.purchaseOrderNumber && (
                  <div className="col-md-6">
                    <div className="text-muted small">Purchase Order</div>
                    <div>{detailSerial.purchaseOrderNumber}</div>
                  </div>
                )}
              </div>
              <div className="barcode-preview mt-4 text-center border rounded p-3">
                <svg ref={barcodeRef} aria-label="Serial barcode"></svg>
                <div className="text-muted small mt-2">{detailSerial.serialNumber}</div>
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={copySerialNumber}>
                  Copy Serial
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={downloadSerialBarcode}>
                  Download Barcode
                </button>
                {detailSerial.status === "AVAILABLE" && (
                  <button
                    type="button"
                    className="btn btn-success flex-grow-1"
                    onClick={dispatchSerialFromModal}
                    disabled={modalDispatching}
                  >
                    {modalDispatching ? "Dispatching..." : "Dispatch Serial"}
                  </button>
                )}
              </div>
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
          font-size: 0.85rem;
          padding: 6px 14px;
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
          padding: 12px 16px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }
        .table-primary { background-color: #e0f2fe !important; }

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
        .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

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
        .erp-dialog-lg { max-width: 900px; }
        .erp-dialog-md { max-width: 520px; }
        .erp-dialog-header {
          background-color: var(--erp-primary);
          color: white;
          padding: 16px 24px;
          display: flex; justify-content: space-between; align-items: center;
        }
        .erp-dialog-body {
          overflow-y: auto;
        }
        .serial-detail {
          padding: 12px;
          border-radius: 4px;
        }
        .serial-chip {
          border: 1px solid var(--erp-border);
          border-radius: 4px;
          padding: 8px 12px;
          background: #f8fafc;
          cursor: pointer;
        }
        .serial-chip:focus-visible {
          outline: 2px solid var(--erp-primary);
        }
        .barcode-preview svg {
          width: 100%;
          height: 88px;
        }
        .erp-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #90a4ae;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--erp-border);
          padding-bottom: 4px;
          margin-bottom: 12px;
        }
        .erp-meta-label { font-size: 0.7rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 700; margin-bottom: 4px; }
      `}</style>
    </div>
  );
}
