import React, { useEffect, useMemo, useState } from 'react';
import { smartErpApi } from '../services/smartErpApi';
import DocumentAttachments from '../components/DocumentAttachments';

export default function PurchaseOrders() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [poForm, setPoForm] = useState({
    vendorId: '',
    reason: 'Manual replenishment request',
    lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
  });
  const [vendorForm, setVendorForm] = useState({
    vendorCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: ''
  });

  const [receiveForm, setReceiveForm] = useState({
    poId: '',
    purchaseOrderLineId: '',
    quantity: 0,
    lotNumber: '',
    scannerDeviceId: 'PO-SCN-01'
  });

  const loadData = async () => {
    try {
      const [itemRes, whRes, poRes, vendorRes] = await Promise.all([
        smartErpApi.stockItems(),
        smartErpApi.warehouses(),
        smartErpApi.getPurchaseOrders(),
        smartErpApi.getVendors()
      ]);

      setItems(itemRes.data || []);
      setWarehouses(whRes.data || []);
      setVendors(vendorRes.data || []);
      const normalizedPos = (poRes.data || []).map((po) => {
        const lines = Array.isArray(po.lines) && po.lines.length > 0
          ? po.lines
          : [{
              lineId: po.id,
              itemId: po.itemId,
              itemCode: po.itemCode,
              warehouseId: po.warehouseId,
              warehouseName: po.warehouseName,
              quantity: po.quantity,
              receivedQuantity: po.receivedQuantity,
              pendingQuantity: po.pendingQuantity,
              status: po.status
            }];

        const totalQuantity = po.totalQuantity ?? lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
        const receivedQuantity = po.receivedQuantity ?? lines.reduce((sum, line) => sum + Number(line.receivedQuantity || 0), 0);

        return {
          ...po,
          totalQuantity,
          receivedQuantity,
          pendingQuantity: po.pendingQuantity ?? (totalQuantity - receivedQuantity),
          lines
        };
      });

      setPurchaseOrders(normalizedPos);
    } catch (err) {
      setMessage(err?.response?.data || 'Failed to load purchase-order data.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedPoNumber && purchaseOrders.length > 0) {
      setSelectedPoNumber(purchaseOrders[0].poNumber);
    }
  }, [purchaseOrders, selectedPoNumber]);

  const selectedPo = useMemo(
    () => purchaseOrders.find((po) => po.poNumber === selectedPoNumber) || null,
    [purchaseOrders, selectedPoNumber]
  );

  const selectedReceivePo = useMemo(
    () => purchaseOrders.find((po) => Number(po.id) === Number(receiveForm.poId)) || null,
    [purchaseOrders, receiveForm.poId]
  );

  const pendingLines = useMemo(
    () => (selectedReceivePo?.lines || []).filter((line) => Number(line.pendingQuantity) > 0),
    [selectedReceivePo]
  );

  const addPoLine = () => {
    setPoForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { itemId: '', warehouseId: '', quantity: 1 }]
    }));
  };

  const removePoLine = (idx) => {
    setPoForm((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((_, i) => i !== idx)
    }));
  };

  const updatePoLine = (idx, patch) => {
    setPoForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === idx ? { ...line, ...patch } : line))
    }));
  };

  const createPo = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      if (!poForm.vendorId) {
        setMessage('Create/select vendor first.');
        setLoading(false);
        return;
      }

      const lines = poForm.lines
        .map((line) => ({
          itemId: Number(line.itemId),
          warehouseId: Number(line.warehouseId),
          quantity: Number(line.quantity)
        }))
        .filter((line) => line.itemId > 0 && line.warehouseId > 0 && line.quantity > 0);

      if (!lines.length) {
        setMessage('Add at least one valid PO line.');
        setLoading(false);
        return;
      }

      const res = await smartErpApi.createPurchaseOrder({
        vendorId: Number(poForm.vendorId),
        reason: poForm.reason,
        lines
      });

      setPoForm({
        vendorId: '',
        reason: 'Manual replenishment request',
        lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
      });

      setSelectedPoNumber(res?.data?.poNumber || '');
      setMessage(`Purchase Order created: ${res?.data?.poNumber || ''}`);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || 'PO creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const createVendor = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await smartErpApi.createVendor({
        vendorCode: vendorForm.vendorCode,
        name: vendorForm.name,
        contactPerson: vendorForm.contactPerson || null,
        phone: vendorForm.phone || null,
        email: vendorForm.email || null
      });

      setVendorForm({
        vendorCode: '',
        name: '',
        contactPerson: '',
        phone: '',
        email: ''
      });
      setPoForm((prev) => ({ ...prev, vendorId: String(res.data.id) }));
      setMessage(`Vendor created: ${res.data.vendorCode} - ${res.data.name}`);
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || 'Vendor creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const receivePoLine = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      if (!receiveForm.poId || !receiveForm.purchaseOrderLineId) {
        setMessage('Select PO and PO line.');
        setLoading(false);
        return;
      }

      const res = await smartErpApi.receivePurchaseOrder(Number(receiveForm.poId), {
        purchaseOrderLineId: Number(receiveForm.purchaseOrderLineId),
        quantity: Number(receiveForm.quantity),
        lotNumber: receiveForm.lotNumber || null,
        scannerDeviceId: receiveForm.scannerDeviceId
      });

      setMessage(`${res?.data?.message || 'Received'} (${res?.data?.poNumber || ''})`);
      setReceiveForm({
        poId: '',
        purchaseOrderLineId: '',
        quantity: 0,
        lotNumber: '',
        scannerDeviceId: 'PO-SCN-01'
      });
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data || 'PO receiving failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold m-0">Purchase Orders</h3>
          <small className="text-muted">Create PO with lines and receive PO line-by-line.</small>
        </div>
        <button className="btn btn-outline-primary" onClick={loadData}>Refresh</button>
      </div>

      {message && <div className="alert alert-info py-2">{message}</div>}

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3">Create Vendor</h6>
            <form className="row g-2 mb-4" onSubmit={createVendor}>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Vendor Code"
                  value={vendorForm.vendorCode}
                  onChange={(e) => setVendorForm((prev) => ({ ...prev, vendorCode: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-8">
                <input
                  className="form-control"
                  placeholder="Vendor Name"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Contact Person"
                  value={vendorForm.contactPerson}
                  onChange={(e) => setVendorForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Phone"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  placeholder="Email"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-outline-primary w-100" disabled={loading}>Create Vendor</button>
              </div>
            </form>

            <h6 className="fw-bold mb-3">Create Purchase Order</h6>
            <form onSubmit={createPo}>
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={poForm.vendorId}
                    onChange={(e) => setPoForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.vendorCode} - {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <input
                    className="form-control"
                    placeholder="Reason"
                    value={poForm.reason}
                    onChange={(e) => setPoForm((prev) => ({ ...prev, reason: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {poForm.lines.map((line, idx) => (
                <div key={idx} className="row g-2 mb-2 align-items-center">
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={line.itemId}
                      onChange={(e) => updatePoLine(idx, { itemId: e.target.value })}
                      required
                    >
                      <option value="">Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>{item.itemCode} - {item.description}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={line.warehouseId}
                      onChange={(e) => updatePoLine(idx, { warehouseId: e.target.value })}
                      required
                    >
                      <option value="">Warehouse</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      value={line.quantity}
                      onChange={(e) => updatePoLine(idx, { quantity: e.target.value })}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="col-md-1 d-grid">
                    <button type="button" className="btn btn-outline-danger" onClick={() => removePoLine(idx)}>x</button>
                  </div>
                </div>
              ))}

              <div className="d-flex gap-2 mt-3">
                <button type="button" className="btn btn-outline-secondary" onClick={addPoLine}>Add Line</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Create PO</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3">Receive Purchase Order Line</h6>
            <form className="row g-2" onSubmit={receivePoLine}>
              <div className="col-md-12">
                <select
                  className="form-select"
                  value={receiveForm.poId}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, poId: e.target.value, purchaseOrderLineId: '' }))}
                  required
                >
                  <option value="">Select PO</option>
                  {purchaseOrders.filter((po) => Number(po.pendingQuantity) > 0).map((po) => (
                    <option key={po.poNumber} value={po.id}>
                      {po.poNumber} - Pending {po.pendingQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-12">
                <select
                  className="form-select"
                  value={receiveForm.purchaseOrderLineId}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, purchaseOrderLineId: e.target.value }))}
                  required
                >
                  <option value="">Select PO Line</option>
                  {pendingLines.map((line) => (
                    <option key={line.lineId} value={line.lineId}>
                      Line {line.lineId} - {line.itemCode} - {line.warehouseName} - Pending {line.pendingQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Receive Qty (0=full pending)"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-md-6">
                <input
                  className="form-control"
                  placeholder="Lot Number (optional)"
                  value={receiveForm.lotNumber}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, lotNumber: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <input
                  className="form-control"
                  placeholder="Scanner Device ID"
                  value={receiveForm.scannerDeviceId}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, scannerDeviceId: e.target.value }))}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-success w-100" disabled={loading}>Receive Line</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold m-0">PO Ledger</h6>
          <select
            className="form-select"
            style={{ maxWidth: 320 }}
            value={selectedPoNumber}
            onChange={(e) => setSelectedPoNumber(e.target.value)}
          >
            <option value="">All Purchase Orders</option>
            {purchaseOrders.map((po) => (
              <option key={po.poNumber} value={po.poNumber}>{po.poNumber}</option>
            ))}
          </select>
        </div>

        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Reason</th>
                <th>Total</th>
                <th>Received</th>
                <th>Pending</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(selectedPo ? [selectedPo] : purchaseOrders).map((po) => (
                <tr key={po.poNumber}>
                  <td>{po.poNumber}</td>
                  <td>{po.reason}</td>
                  <td>{po.totalQuantity}</td>
                  <td>{po.receivedQuantity}</td>
                  <td>{po.pendingQuantity}</td>
                  <td>{po.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedPo && (
          <div className="mt-3">
            <h6 className="fw-bold mb-2">PO Lines - {selectedPo.poNumber}</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th>Line ID</th>
                    <th>Item</th>
                    <th>Warehouse</th>
                    <th>Qty</th>
                    <th>Received</th>
                    <th>Pending</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedPo.lines || []).map((line) => (
                    <tr key={line.lineId}>
                      <td>{line.lineId}</td>
                      <td>{line.itemCode || line.itemId}</td>
                      <td>{line.warehouseName || line.warehouseId}</td>
                      <td>{line.quantity}</td>
                      <td>{line.receivedQuantity}</td>
                      <td>{line.pendingQuantity}</td>
                      <td>{line.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <DocumentAttachments
        entityType="PurchaseOrder"
        entityId={selectedPo?.id}
        entityLabel={selectedPo?.poNumber || "Purchase Order"}
      />
    </div>
  );
}
