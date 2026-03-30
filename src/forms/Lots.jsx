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
  const [expandedWarehouse, setExpandedWarehouse] = useState(null); // New state for drill-down
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

  const inventoryRows = useMemo(() => {
    const itemsById = new Map(items.map((item) => [String(item.id), item]));
    const warehousesById = new Map(warehouses.map((warehouse) => [String(warehouse.id), warehouse]));

    return inventory.map((entry) => {
      const resolvedItemId = String(entry.ItemId ?? entry.itemId);
      const resolvedWarehouseId = String(entry.WarehouseId ?? entry.warehouseId);
      const warehouse = warehousesById.get(resolvedWarehouseId);
      const item = itemsById.get(resolvedItemId);
      
      const rawLot = entry.lotNumber || entry.LotNumber || entry.lotId || "";
      const lotNumber =
        String(rawLot).trim() === "-" || !(entry.lotNumber || entry.LotNumber)
          ? "General Inventory"
          : String(entry.lotNumber || entry.LotNumber);
          
      const quantity = Number(entry.quantity || entry.Quantity || 0);
      const storageHint = warehouse?.name || item?.WarehouseLocation || "Main Storage";

      return {
        id: entry.id ?? entry.Id,
        lotId: entry.lotId ?? entry.LotId,
        itemId: resolvedItemId,
        warehouseId: resolvedWarehouseId,
        lotNumber,
        itemCode: item?.itemCode || `Item-${resolvedItemId}`,
        itemName: item?.description || item?.itemName || "Unknown product",
        warehouseName: warehouse?.name || `WH-${resolvedWarehouseId}`,
        quantity,
        storage: storageHint,
        locationCode: entry.locationCode || entry.LocationCode || item?.WarehouseLocation || "N/A"
      };
    });
  }, [inventory, items, warehouses]);

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
    return Object.values(groups).sort((a, b) => a.itemCode.localeCompare(b.itemCode));
  }, [inventoryRows]);

  // Group lots by Warehouse for the drill-down view
  const warehousesForSelectedProduct = useMemo(() => {
    if (!selectedProduct) return [];
    const whGroup = {};
    selectedProduct.lots.forEach(lot => {
        if (!whGroup[lot.warehouseId]) {
            whGroup[lot.warehouseId] = {
                warehouseId: lot.warehouseId,
                warehouseName: lot.warehouseName,
                totalQty: 0,
                lots: []
            };
        }
        whGroup[lot.warehouseId].totalQty += lot.quantity;
        whGroup[lot.warehouseId].lots.push(lot);
    });
    return Object.values(whGroup);
  }, [selectedProduct]);

  const filteredGroups = useMemo(() => {
    if (!filter) return groupedProducts;
    const normalized = filter.toLowerCase();
    return groupedProducts.filter((group) =>
      group.itemCode?.toLowerCase().includes(normalized) ||
      group.itemName?.toLowerCase().includes(normalized) ||
      group.lots.some(lot => 
        lot.lotNumber?.toLowerCase().includes(normalized) || 
        lot.warehouseName?.toLowerCase().includes(normalized)
      )
    );
  }, [filter, groupedProducts]);

  const summary = useMemo(() => {
    const uniqueLots = new Set(
      inventoryRows.map((row) => `${row.lotId || row.lotNumber || row.id}-${row.itemCode}-${row.warehouseId}`)
    );
    const totalQuantity = inventoryRows.reduce((sum, row) => sum + row.quantity, 0);
    return { lots: uniqueLots.size, items: groupedProducts.length, quantity: totalQuantity };
  }, [inventoryRows, groupedProducts]);

  const loadLotSerials = useCallback(async (lot) => {
    const identifier = lot?.lotId || lot?.lotNumber || lot?.id;
    if (!selectedProduct?.itemId || !identifier || !lot?.warehouseId) return;
    
    const lotKey = `${identifier}_${lot.warehouseId}`;
    setSerialsErrorLot('');
    setSerialsLoadingLot(lotKey);
    try {
      const response = await smartErpApi.stockSerials({
        itemId: selectedProduct.itemId,
        warehouseId: lot.warehouseId,
        lotId: lot.lotId,
        lotNumber: lot.lotNumber
      });
      const payload = Array.isArray(response.data) ? response.data : [];
      setLotSerials((prev) => ({
        ...prev,
        [lotKey]: payload.map((serial) => ({
          ...serial,
          warehouseId: lot.warehouseId,
          warehouseName: lot.warehouseName,
          lotNumber: lot.lotNumber,
          lotId: lot.lotId
        }))
      }));
    } catch (error) {
      setLotSerials((prev) => ({ ...prev, [lotKey]: [] }));
      setSerialsErrorLot("Unable to load serial numbers for this lot.");
    } finally {
      setSerialsLoadingLot(null);
    }
  }, [selectedProduct]);

  const toggleLotSerials = useCallback((lot) => {
    const identifier = lot.lotId || lot.lotNumber || lot.id;
    if (!identifier || !lot.warehouseId) return;
    const lotKey = `${identifier}_${lot.warehouseId}`;
    if (openLotForSerials === lotKey) {
      setOpenLotForSerials(null);
      return;
    }
    setOpenLotForSerials(lotKey);
    if (!lotSerials[lotKey]) loadLotSerials(lot);
  }, [lotSerials, loadLotSerials, openLotForSerials]);

  useEffect(() => {
    setLotSerials({});
    setOpenLotForSerials(null);
    setExpandedWarehouse(null);
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

  const closeSerialModal = useCallback(() => setDetailSerial(null), []);

  useEffect(() => {
    if (!detailSerial || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, detailSerial.serialNumber, {
        format: "CODE128", width: 2, height: 60, displayValue: true, margin: 6
      });
    } catch (error) { console.warn("Barcode rendering failed", error); }
  }, [detailSerial]);

  const copySerialNumber = useCallback(async () => {
    if (!detailSerial) return;
    try {
      await navigator.clipboard.writeText(detailSerial.serialNumber);
      setSerialModalStatus({ type: "success", text: "Serial copied to clipboard." });
    } catch { setSerialModalStatus({ type: "error", text: "Unable to copy serial." }); }
  }, [detailSerial]);

  const downloadSerialBarcode = useCallback(() => {
    if (!detailSerial || !barcodeRef.current) return;
    const svgString = new XMLSerializer().serializeToString(barcodeRef.current);
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
      setLotSerials((prev) => {
        const identifier = detailSerial.lotId || detailSerial.lotNumber || detailSerial.id;
        const lotKey = `${identifier}_${detailSerial.warehouseId}`;
        return { ...prev, [lotKey]: prev[lotKey]?.filter((s) => s.id !== detailSerial.id) };
      });
      setDetailSerial(null);
    } catch (error) {
      setSerialModalStatus({ type: "error", text: error?.response?.data || "Dispatch failed." });
    } finally { setModalDispatching(false); }
  }, [detailSerial]);

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
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
                    <tr><td colSpan="5" className="text-center text-muted py-5">No product lot data matched your filter.</td></tr>
                  ) : (
                    filteredGroups.map((group) => (
                      <tr 
                        key={group.itemCode} 
                        onClick={() => setSelectedProduct(group)}
                        style={{ cursor: 'pointer' }}
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

      {/* UPDATED MODAL WITH DRILL-DOWN: Items -> Warehouses -> Lots */}
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
                      <span className="erp-meta-label">Warehouses Found</span>
                      <div className="fs-4 fw-bold font-monospace text-dark">
                        {warehousesForSelectedProduct.length}
                      </div>
                    </div>
                  </div>
              </div>

              <div className="p-4">
                <h6 className="erp-section-title mb-3">Warehouse Breakdown (Click to see Lots)</h6>
                <div className="border rounded overflow-hidden shadow-sm bg-white">
                  <table className="table erp-table table-sm table-hover mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Warehouse Location</th>
                        <th className="text-center">Lot Count</th>
                        <th className="text-end">On-Hand Qty</th>
                        <th className="text-center" style={{ width: '100px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warehousesForSelectedProduct.map((wh) => (
                        <React.Fragment key={wh.warehouseId}>
                          {/* WAREHOUSE ROW */}
                          <tr 
                            onClick={() => setExpandedWarehouse(expandedWarehouse === wh.warehouseId ? null : wh.warehouseId)}
                            style={{ cursor: 'pointer', backgroundColor: expandedWarehouse === wh.warehouseId ? '#f8fafc' : 'transparent' }}
                          >
                            <td className="fw-bold"><i className={`bi bi-chevron-${expandedWarehouse === wh.warehouseId ? 'down' : 'right'} me-2`}></i>{wh.warehouseName}</td>
                            <td className="text-center"><span className="badge bg-light text-dark border">{wh.lots.length}</span></td>
                            <td className="text-end fw-bold font-monospace text-primary">{wh.totalQty.toFixed(2)}</td>
                            <td className="text-center">
                                <button className="btn btn-sm btn-link p-0 text-decoration-none">
                                    {expandedWarehouse === wh.warehouseId ? 'Collapse' : 'Show Lots'}
                                </button>
                            </td>
                          </tr>

                          {/* LOTS DRILL-DOWN (VISIBLE WHEN WAREHOUSE EXPANDED) */}
                          {expandedWarehouse === wh.warehouseId && (
                            <tr>
                                <td colSpan="4" className="p-0 border-0">
                                    <div className="p-3 bg-light border-top border-bottom">
                                        <table className="table table-sm table-bordered bg-white mb-0">
                                            <thead className="small text-uppercase bg-light">
                                                <tr>
                                                    <th>Lot Number</th>
                                                    <th>Bin / Storage</th>
                                                    <th className="text-end">Qty</th>
                                                    <th className="text-center">Serials</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {wh.lots.map((lot, idx) => {
                                                    const identifier = lot.lotId || lot.lotNumber || lot.id;
                                                    const lotKey = `${identifier}_${lot.warehouseId}`;
                                                    return (
                                                        <React.Fragment key={idx}>
                                                            <tr>
                                                                <td className="font-monospace fw-bold">{lot.lotNumber}</td>
                                                                <td className="small text-muted">{lot.storage} {lot.locationCode !== 'N/A' && `[${lot.locationCode}]`}</td>
                                                                <td className="text-end font-monospace">{lot.quantity.toFixed(2)}</td>
                                                                <td className="text-center">
                                                                    <button 
                                                                        className="btn btn-xs btn-outline-secondary py-0 px-2"
                                                                        style={{ fontSize: '0.7rem' }}
                                                                        onClick={(e) => { e.stopPropagation(); toggleLotSerials(lot); }}
                                                                        disabled={lot.lotNumber === "General Inventory"}
                                                                    >
                                                                        {openLotForSerials === lotKey ? 'Hide' : 'View'}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            {/* SERIALS LEVEL */}
                                                            {openLotForSerials === lotKey && (
                                                                <tr>
                                                                    <td colSpan="4" className="bg-white p-2">
                                                                        {serialsLoadingLot === lotKey ? (
                                                                            <div className="small text-muted">Loading...</div>
                                                                        ) : lotSerials[lotKey]?.length ? (
                                                                            <div className="d-flex flex-wrap gap-1">
                                                                                {lotSerials[lotKey].map(s => (
                                                                                    <span 
                                                                                        key={s.id} 
                                                                                        className="badge border text-dark fw-normal" 
                                                                                        style={{ cursor: 'pointer', backgroundColor: '#f1f5f9' }}
                                                                                        onClick={() => showSerialDetails(s, lot)}
                                                                                    >
                                                                                        {s.serialNumber}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        ) : <div className="small text-muted">No serials</div>}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
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

      {/* SERIAL DETAIL MODAL */}
      {detailSerial && (
        <div className="erp-modal-overlay" onClick={closeSerialModal}>
          <div className="erp-dialog erp-dialog-md" onClick={(e) => e.stopPropagation()}>
            <div className="erp-dialog-header d-flex justify-content-between align-items-center">
              <div><h5 className="m-0 fw-bold">{detailSerial.serialNumber}</h5><small className="opacity-75">Serial details</small></div>
              <button className="btn-close btn-close-white" onClick={closeSerialModal}></button>
            </div>
            <div className="erp-dialog-body p-3">
              {serialModalStatus.text && <div className={`alert ${serialModalStatus.type === "error" ? "alert-danger" : "alert-success"} py-2 small`}>{serialModalStatus.text}</div>}
              <div className="row g-3">
                <div className="col-md-6"><div className="text-muted small">Serial Number</div><div className="fw-bold font-monospace">{detailSerial.serialNumber}</div></div>
                <div className="col-md-6"><div className="text-muted small">Item</div><div>{detailSerial.itemCode}</div></div>
                <div className="col-md-6"><div className="text-muted small">Warehouse</div><div>{detailSerial.warehouseName}</div></div>
                <div className="col-md-6"><div className="text-muted small">Lot</div><div>{detailSerial.lotNumber}</div></div>
              </div>
              <div className="barcode-preview mt-4 text-center border rounded p-3"><svg ref={barcodeRef}></svg></div>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={copySerialNumber}>Copy</button>
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={downloadSerialBarcode}>Download</button>
                {detailSerial.status === "AVAILABLE" && (
                  <button type="button" className="btn btn-success flex-grow-1" onClick={dispatchSerialFromModal} disabled={modalDispatching}>
                    {modalDispatching ? "Dispatching..." : "Dispatch Serial"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Existing CSS preserved */
        :root { --erp-primary: #0f4c81; --erp-bg: #eef2f5; --erp-surface: #ffffff; --erp-border: #cfd8dc; --erp-text-main: #263238; --erp-text-muted: #607d8b; }
        .erp-app-wrapper { background-color: var(--erp-bg); color: var(--erp-text-main); font-family: 'Segoe UI', sans-serif; font-size: 0.85rem; }
        .erp-text-muted { color: var(--erp-text-muted) !important; }
        .erp-kpi-box { background: var(--erp-surface); border: 1px solid var(--erp-border); padding: 16px 20px; border-left: 4px solid var(--erp-primary); border-radius: 4px; display: flex; flex-direction: column; gap: 4px; }
        .erp-kpi-label { font-size: 0.75rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 700; }
        .erp-kpi-value { font-size: 1.75rem; font-weight: 700; }
        .erp-panel { background: var(--erp-surface); border: 1px solid var(--erp-border); border-radius: 4px; overflow: hidden; }
        .erp-panel-header { border-bottom: 1px solid var(--erp-border); padding: 12px 16px; font-size: 0.9rem; text-transform: uppercase; }
        .erp-input { border-radius: 3px; border-color: #b0bec5; font-size: 0.85rem; padding: 6px 10px; }
        .erp-btn { border-radius: 3px; font-weight: 600; font-size: 0.85rem; padding: 6px 14px; }
        .erp-table { font-size: 0.85rem; }
        .erp-table thead th { background-color: #f1f5f9; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; position: sticky; top: 0; z-index: 10; border-bottom: 2px solid #cbd5e1; padding: 10px 16px; }
        .erp-table tbody td { padding: 12px 16px; vertical-align: middle; border-color: #e2e8f0; }
        .table-primary { background-color: #e0f2fe !important; }
        .erp-modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(38, 50, 56, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1050; }
        .erp-dialog { background: var(--erp-surface); border-radius: 4px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
        .erp-dialog-lg { max-width: 900px; }
        .erp-dialog-md { max-width: 520px; }
        .erp-dialog-header { background-color: var(--erp-primary); color: white; padding: 16px 24px; display: flex; justify-content: space-between; }
        .erp-dialog-body { overflow-y: auto; }
        .barcode-preview svg { width: 100%; height: 88px; }
        .erp-section-title { font-size: 0.75rem; font-weight: 700; color: #90a4ae; text-transform: uppercase; border-bottom: 1px solid var(--erp-border); padding-bottom: 4px; }
        .erp-meta-label { font-size: 0.7rem; text-transform: uppercase; color: var(--erp-text-muted); font-weight: 700; }
        .btn-xs { padding: 1px 5px; font-size: 0.75rem; }
      `}</style>
    </div>
  );
}