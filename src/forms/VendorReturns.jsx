// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { smartErpApi } from "../services/smartErpApi";
// import DocumentAttachments from "../components/DocumentAttachments";

// const DEFAULT_LINE = () => ({
//   itemId: "",
//   warehouseId: "",
//   quantity: 1,
//   unitCost: 0,
//   barcode: "",
//   lotNumber: "",
//   serialNumbers: ""
// });

// const reasonOptions = ["Damaged", "Expired", "Wrong Item", "Quality Issue"];
// const returnTypeOptions = ["Refund", "Replacement", "CreditNote"];

// export default function VendorReturns() {
//   const [vendors, setVendors] = useState([]);
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
//   const [returns, setReturns] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [formLoading, setFormLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [actionState, setActionState] = useState({ id: null, action: "" });
//   const [selectedReturnId, setSelectedReturnId] = useState(null);
//   const [returnForm, setReturnForm] = useState({
//     vendorId: "",
//     purchaseOrderId: "",
//     returnType: "Refund",
//     returnReason: "Damaged",
//     notes: "",
//     lines: [DEFAULT_LINE()]
//   });

//   const loadData = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [vendorRes, poRes, itemRes, whRes, returnsRes] = await Promise.all([
//         smartErpApi.getVendors(),
//         smartErpApi.getPurchaseOrders(),
//         smartErpApi.stockItems(),
//         smartErpApi.warehouses(),
//         smartErpApi.getVendorReturns()
//       ]);

//       setVendors(vendorRes.data || []);
//       setPurchaseOrders(poRes.data || []);
//       setItems(itemRes.data || []);
//       setWarehouses(whRes.data || []);
//       const returnList = returnsRes.data || [];
//       setReturns(returnList);
//       setSelectedReturnId((prev) => prev ?? (returnList[0]?.id ?? null));
//       setMessage("");
//     } catch (err) {
//       setMessage(err?.response?.data || "Unable to load vendor return data.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const addLine = () =>
//     setReturnForm((prev) => ({
//       ...prev,
//       lines: [...prev.lines, DEFAULT_LINE()]
//     }));

//   const updateLine = (index, patch) =>
//     setReturnForm((prev) => ({
//       ...prev,
//       lines: prev.lines.map((line, idx) => (idx === index ? { ...line, ...patch } : line))
//     }));

//   const removeLine = (index) =>
//     setReturnForm((prev) => ({
//       ...prev,
//       lines: prev.lines.filter((_, idx) => idx !== index)
//     }));

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setFormLoading(true);
//     setMessage("");

//     try {
//       if (!returnForm.vendorId || !returnForm.purchaseOrderId) {
//         setMessage("Select vendor and purchase order before submitting.");
//         setFormLoading(false);
//         return;
//       }

//       const lines = returnForm.lines
//         .map((line) => ({
//           itemId: Number(line.itemId),
//           warehouseId: Number(line.warehouseId),
//           quantity: Number(line.quantity),
//           unitCost: Number(line.unitCost),
//           barcode: line.barcode,
//           lotNumber: line.lotNumber,
//           serialNumbers: line.serialNumbers
//         }))
//         .filter((line) => line.itemId > 0 && line.warehouseId > 0 && line.quantity > 0);

//       if (lines.length === 0) {
//         setMessage("Add at least one valid return line.");
//         setFormLoading(false);
//         return;
//       }

//       await smartErpApi.createVendorReturn({
//         vendorId: Number(returnForm.vendorId),
//         purchaseOrderId: Number(returnForm.purchaseOrderId),
//         returnType: returnForm.returnType,
//         returnReason: returnForm.returnReason,
//         notes: returnForm.notes,
//         items: lines
//       });

//       setMessage("Vendor return request submitted.");
//       setReturnForm({
//         vendorId: "",
//         purchaseOrderId: "",
//         returnType: "Refund",
//         returnReason: "Damaged",
//         notes: "",
//         lines: [DEFAULT_LINE()]
//       });
//       await loadData();
//     } catch (err) {
//       setMessage(err?.response?.data || "Vendor return creation failed.");
//     } finally {
//       setFormLoading(false);
//     }
//   };

//   const handleApprove = async (id) => {
//     setActionState({ id, action: "approve" });
//     setMessage("");
//     try {
//       await smartErpApi.approveVendorReturn(id, { isApproved: true });
//       setMessage("Return approved.");
//       await loadData();
//     } catch (err) {
//       setMessage(err?.response?.data || "Approval failed.");
//     } finally {
//       setActionState({ id: null, action: "" });
//     }
//   };

//   const handleShip = async (id) => {
//     setActionState({ id, action: "ship" });
//     setMessage("");
//     try {
//       await smartErpApi.shipVendorReturn(id, { notes: "Shipped from portal" });
//       setMessage("Return marked as shipped.");
//       await loadData();
//     } catch (err) {
//       setMessage(err?.response?.data || "Shipping failed.");
//     } finally {
//       setActionState({ id: null, action: "" });
//     }
//   };

//   const handleRefund = async (id) => {
//     setActionState({ id, action: "refund" });
//     setMessage("");
//     try {
//       await smartErpApi.refundVendorReturn(id, {});
//       setMessage("Refund processed.");
//       await loadData();
//     } catch (err) {
//       setMessage(err?.response?.data || "Refund failed.");
//     } finally {
//       setActionState({ id: null, action: "" });
//     }
//   };

//   const vendorReturnRows = useMemo(
//     () =>
//       returns.map((item) => ({
//         id: item.id,
//         number: item.returnNumber,
//         vendorName: item.vendorName,
//         type: item.returnType,
//         reason: item.returnReason,
//         status: item.status,
//         approved: item.isApproved,
//         shippedAt: item.shippedAt,
//         totalQuantity: item.totalQuantity,
//         totalAmount: item.totalAmount,
//         createdAt: item.createdAt
//       })),
//     [returns]
//   );

//   const selectedReturn = useMemo(() => {
//     if (!selectedReturnId) return null;
//     return returns.find((item) => item.id === Number(selectedReturnId)) ?? null;
//   }, [returns, selectedReturnId]);

//   const displayPurchaseOrders = purchaseOrders.map((po) => ({
//     id: po.id,
//     label: `${po.poNumber} | Pending ${po.pendingQuantity}`
//   }));

//   return (
//     <div className="container-fluid py-4">
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <div>
//           <h3 className="fw-bold m-0">Vendor Returns</h3>
//           <small className="text-muted">Initiate RMAs, monitor statuses, and trigger approvals.</small>
//         </div>
//         <button className="btn btn-outline-primary" onClick={loadData} disabled={loading}>
//           Refresh
//         </button>
//       </div>

//       {message && <div className="alert alert-info">{message}</div>}

//       <div className="card shadow-sm border-0 mb-4">
//         <div className="card-body">
//           <h5 className="fw-bold">Create Vendor Return</h5>
//           <form className="row g-3 mt-3" onSubmit={handleSubmit}>
//             <div className="col-md-4">
//               <label className="form-label">Vendor</label>
//               <select
//                 className="form-select"
//                 value={returnForm.vendorId}
//                 onChange={(e) => setReturnForm((prev) => ({ ...prev, vendorId: e.target.value }))}
//                 required
//               >
//                 <option value="">Select vendor</option>
//                 {vendors.map((vendor) => (
//                   <option key={vendor.id} value={vendor.id}>
//                     {vendor.vendorCode} - {vendor.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-md-4">
//               <label className="form-label">Purchase Order</label>
//               <select
//                 className="form-select"
//                 value={returnForm.purchaseOrderId}
//                 onChange={(e) => setReturnForm((prev) => ({ ...prev, purchaseOrderId: e.target.value }))}
//                 required
//               >
//                 <option value="">Select PO</option>
//                 {displayPurchaseOrders.map((po) => (
//                   <option key={po.id} value={po.id}>
//                     {po.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-md-2">
//               <label className="form-label">Return Type</label>
//               <select
//                 className="form-select"
//                 value={returnForm.returnType}
//                 onChange={(e) => setReturnForm((prev) => ({ ...prev, returnType: e.target.value }))}
//               >
//                 {returnTypeOptions.map((type) => (
//                   <option key={type} value={type}>
//                     {type}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-md-2">
//               <label className="form-label">Return Reason</label>
//               <select
//                 className="form-select"
//                 value={returnForm.returnReason}
//                 onChange={(e) => setReturnForm((prev) => ({ ...prev, returnReason: e.target.value }))}
//               >
//                 {reasonOptions.map((reason) => (
//                   <option key={reason} value={reason}>
//                     {reason}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="col-12">
//               <label className="form-label">Notes</label>
//               <textarea
//                 className="form-control"
//                 value={returnForm.notes}
//                 onChange={(e) => setReturnForm((prev) => ({ ...prev, notes: e.target.value }))}
//                 rows={2}
//                 placeholder="Special instructions or reference numbers"
//               />
//             </div>

//             {returnForm.lines.map((line, idx) => (
//               <div key={`line-${idx}`} className="row g-2 align-items-end">
//                 <div className="col-md-3">
//                   <label className="form-label">Item</label>
//                   <select
//                     className="form-select"
//                     value={line.itemId}
//                     onChange={(e) => updateLine(idx, { itemId: e.target.value })}
//                     required
//                   >
//                     <option value="">Item</option>
//                     {items.map((item) => (
//                       <option key={item.id} value={item.id}>
//                         {item.itemCode} - {item.description}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="col-md-2">
//                   <label className="form-label">Warehouse</label>
//                   <select
//                     className="form-select"
//                     value={line.warehouseId}
//                     onChange={(e) => updateLine(idx, { warehouseId: e.target.value })}
//                     required
//                   >
//                     <option value="">Warehouse</option>
//                     {warehouses.map((wh) => (
//                       <option key={wh.id} value={wh.id}>
//                         {wh.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="col-md-1">
//                   <label className="form-label">Qty</label>
//                   <input
//                     type="number"
//                     min="0.01"
//                     step="0.01"
//                     className="form-control"
//                     value={line.quantity}
//                     onChange={(e) => updateLine(idx, { quantity: e.target.value })}
//                     required
//                   />
//                 </div>
//                 <div className="col-md-1">
//                   <label className="form-label">Unit Cost</label>
//                   <input
//                     type="number"
//                     min="0"
//                     step="0.01"
//                     className="form-control"
//                     value={line.unitCost}
//                     onChange={(e) => updateLine(idx, { unitCost: e.target.value })}
//                   />
//                 </div>
//                 <div className="col-md-1">
//                   <label className="form-label">Barcode</label>
//                   <input
//                     className="form-control"
//                     value={line.barcode}
//                     onChange={(e) => updateLine(idx, { barcode: e.target.value })}
//                   />
//                 </div>
//                 <div className="col-md-2">
//                   <label className="form-label">Lot Number</label>
//                   <input
//                     className="form-control"
//                     value={line.lotNumber}
//                     onChange={(e) => updateLine(idx, { lotNumber: e.target.value })}
//                   />
//                 </div>
//                 <div className="col-md-2">
//                   <label className="form-label">Serials (comma separated)</label>
//                   <input
//                     className="form-control"
//                     value={line.serialNumbers}
//                     onChange={(e) => updateLine(idx, { serialNumbers: e.target.value })}
//                   />
//                 </div>
//                 <div className="col-md-0 d-grid">
//                   <button
//                     type="button"
//                     className="btn btn-outline-danger btn-sm mt-1"
//                     onClick={() => removeLine(idx)}
//                     disabled={returnForm.lines.length === 1}
//                   >
//                     ×
//                   </button>
//                 </div>
//               </div>
//             ))}

//             <div className="col-12 d-flex flex-wrap gap-2">
//               <button type="button" className="btn btn-outline-secondary" onClick={addLine}>
//                 Add line
//               </button>
//               <button type="submit" className="btn btn-primary" disabled={formLoading}>
//                 {formLoading ? "Submitting..." : "Create Return"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>

//       <div className="card shadow-sm border-0">
//         <div className="card-body">
//           <div className="d-flex justify-content-between align-items-center mb-3">
//             <h5 className="fw-bold mb-0">Vendor Return History</h5>
//             <span className="badge bg-secondary">{returns.length} records</span>
//           </div>

//         <div className="table-responsive">
//           <table className="table table-hover">
//             <thead>
//                 <tr>
//                   <th>Return #</th>
//                   <th>Vendor</th>
//                   <th>Type</th>
//                   <th>Reason</th>
//                   <th>Status</th>
//                   <th>Qty</th>
//                   <th>Amount</th>
//                   <th>Created</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {vendorReturnRows.map((row) => (
//                   <tr key={row.id}>
//                     <td>{row.number}</td>
//                     <td>{row.vendorName}</td>
//                     <td>{row.type}</td>
//                     <td>{row.reason}</td>
//                     <td>
//                       {row.status}
//                       {row.shippedAt && <small className="text-muted d-block">Shipped {new Date(row.shippedAt).toLocaleString()}</small>}
//                     </td>
//                     <td>{row.totalQuantity}</td>
//                     <td>{row.totalAmount}</td>
//                     <td>{new Date(row.createdAt).toLocaleString()}</td>
//                     <td>
//                       {!row.approved && (
//                         <button
//                           className="btn btn-sm btn-outline-success me-1"
//                           onClick={() => handleApprove(row.id)}
//                           disabled={actionState.id === row.id && actionState.action === "approve"}
//                         >
//                           {actionState.id === row.id && actionState.action === "approve" ? "Approving..." : "Approve"}
//                         </button>
//                       )}
//                       {row.approved && !row.shippedAt && (
//                         <button
//                           className="btn btn-sm btn-outline-primary me-1"
//                           onClick={() => handleShip(row.id)}
//                           disabled={actionState.id === row.id && actionState.action === "ship"}
//                         >
//                           {actionState.id === row.id && actionState.action === "ship" ? "Shipping..." : "Ship"}
//                         </button>
//                       )}
//                       {row.type === "Refund" && row.status !== "Refunded" && (
//                         <button
//                           className="btn btn-sm btn-outline-warning"
//                           onClick={() => handleRefund(row.id)}
//                           disabled={actionState.id === row.id && actionState.action === "refund"}
//                         >
//                           {actionState.id === row.id && actionState.action === "refund" ? "Refunding..." : "Refund"}
//                         </button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {/* <div className="mt-4">
//         <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
//           <label className="form-label mb-0">Attachments for</label>
//           <select
//             className="form-select form-select-sm"
//             value={selectedReturnId || ""}
//             onChange={(event) => {
//               const val = event.target.value;
//               setSelectedReturnId(val ? Number(val) : null);
//             }}
//           >
//             <option value="">Select a return</option>
//             {returns.map((ret) => (
//               <option key={ret.id} value={ret.id}>
//                 {ret.returnNumber}
//               </option>
//             ))}
//           </select>
//         </div>
//         <DocumentAttachments
//           entityType="VendorReturn"
//           entityId={selectedReturn?.id}
//           entityLabel={selectedReturn?.returnNumber || "Vendor Return"}
//         />
//       </div> */}
//     </div>
//   );
// }




import React, { useCallback, useEffect, useMemo, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";
// import DocumentAttachments from "../components/DocumentAttachments";

const DEFAULT_LINE = () => ({
  itemId: "",
  warehouseId: "",
  quantity: 1,
  unitCost: 0,
  barcode: "",
  lotNumber: "",
  serialNumbers: ""
});

const reasonOptions = ["Damaged", "Expired", "Wrong Item", "Quality Issue"];
const returnTypeOptions = ["Refund", "Replacement", "CreditNote"];

export default function VendorReturns() {
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [actionState, setActionState] = useState({ id: null, action: "" });
  const [selectedReturnId, setSelectedReturnId] = useState(null);
  const [returnForm, setReturnForm] = useState({
    vendorId: "",
    purchaseOrderId: "",
    returnType: "Refund",
    returnReason: "Damaged",
    notes: "",
    lines: [DEFAULT_LINE()]
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorRes, poRes, itemRes, whRes, returnsRes] = await Promise.all([
        smartErpApi.getVendors(),
        smartErpApi.getPurchaseOrders(),
        smartErpApi.stockItems(),
        smartErpApi.warehouses(),
        smartErpApi.getVendorReturns()
      ]);

      setVendors(vendorRes.data || []);
      setPurchaseOrders(poRes.data || []);
      setItems(itemRes.data || []);
      setWarehouses(whRes.data || []);
      const returnList = returnsRes.data || [];
      setReturns(returnList);
      setSelectedReturnId((prev) => prev ?? (returnList[0]?.id ?? null));
      setMessage({ text: "", type: "" });
    } catch (err) {
      setMessage({ text: err?.response?.data || "Unable to load vendor return data.", type: "danger" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addLine = () =>
    setReturnForm((prev) => ({
      ...prev,
      lines: [...prev.lines, DEFAULT_LINE()]
    }));

  const updateLine = (index, patch) =>
    setReturnForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, idx) => (idx === index ? { ...line, ...patch } : line))
    }));

  const removeLine = (index) =>
    setReturnForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index)
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (!returnForm.vendorId || !returnForm.purchaseOrderId) {
        setMessage({ text: "Select vendor and purchase order before submitting.", type: "warning" });
        setFormLoading(false);
        return;
      }

      const lines = returnForm.lines
        .map((line) => ({
          itemId: Number(line.itemId),
          warehouseId: Number(line.warehouseId),
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost),
          barcode: line.barcode,
          lotNumber: line.lotNumber,
          serialNumbers: line.serialNumbers
        }))
        .filter((line) => line.itemId > 0 && line.warehouseId > 0 && line.quantity > 0);

      if (lines.length === 0) {
        setMessage({ text: "Add at least one valid return line.", type: "warning" });
        setFormLoading(false);
        return;
      }

      await smartErpApi.createVendorReturn({
        vendorId: Number(returnForm.vendorId),
        purchaseOrderId: Number(returnForm.purchaseOrderId),
        returnType: returnForm.returnType,
        returnReason: returnForm.returnReason,
        notes: returnForm.notes,
        items: lines
      });

      setMessage({ text: "✓ Vendor return request submitted successfully.", type: "success" });
      setReturnForm({
        vendorId: "",
        purchaseOrderId: "",
        returnType: "Refund",
        returnReason: "Damaged",
        notes: "",
        lines: [DEFAULT_LINE()]
      });
      await loadData();
    } catch (err) {
      setMessage({ text: err?.response?.data || "Vendor return creation failed.", type: "danger" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionState({ id, action: "approve" });
    setMessage({ text: "", type: "" });
    try {
      await smartErpApi.approveVendorReturn(id, { isApproved: true });
      setMessage({ text: "✓ Return approved successfully.", type: "success" });
      await loadData();
    } catch (err) {
      setMessage({ text: err?.response?.data || "Approval failed.", type: "danger" });
    } finally {
      setActionState({ id: null, action: "" });
    }
  };

  const handleShip = async (id) => {
    setActionState({ id, action: "ship" });
    setMessage({ text: "", type: "" });
    try {
      await smartErpApi.shipVendorReturn(id, { notes: "Shipped from portal" });
      setMessage({ text: "✓ Return marked as shipped.", type: "success" });
      await loadData();
    } catch (err) {
      setMessage({ text: err?.response?.data || "Shipping failed.", type: "danger" });
    } finally {
      setActionState({ id: null, action: "" });
    }
  };

  const handleRefund = async (id) => {
    setActionState({ id, action: "refund" });
    setMessage({ text: "", type: "" });
    try {
      await smartErpApi.refundVendorReturn(id, {});
      setMessage({ text: "✓ Refund processed successfully.", type: "success" });
      await loadData();
    } catch (err) {
      setMessage({ text: err?.response?.data || "Refund failed.", type: "danger" });
    } finally {
      setActionState({ id: null, action: "" });
    }
  };

  const vendorReturnRows = useMemo(
    () =>
      returns.map((item) => ({
        id: item.id,
        number: item.returnNumber,
        vendorName: item.vendorName,
        type: item.returnType,
        reason: item.returnReason,
        status: item.status,
        approved: item.isApproved,
        shippedAt: item.shippedAt,
        totalQuantity: item.totalQuantity,
        totalAmount: item.totalAmount,
        createdAt: item.createdAt
      })),
    [returns]
  );

  // eslint-disable-next-line no-unused-vars
  const selectedReturn = useMemo(() => {
    if (!selectedReturnId) return null;
    return returns.find((item) => item.id === Number(selectedReturnId)) ?? null;
  }, [returns, selectedReturnId]);

  const displayPurchaseOrders = purchaseOrders.map((po) => ({
    id: po.id,
    label: `${po.poNumber} | Pending ${po.pendingQuantity}`
  }));

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "refunded" || s === "completed") return "tag-success";
    if (s === "approved" || s === "shipped") return "tag-info";
    if (s === "rejected" || s === "cancelled") return "tag-danger";
    return "tag-warning";
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Vendor Returns (RMA)</h4>
            <span className="erp-text-muted small text-uppercase">Return Authorizations & Processing</span>
          </div>
          <button 
            className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" 
            onClick={loadData} 
            disabled={loading}
          >
            {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
            Refresh Data
          </button>
        </div>

        {/* ALERT */}
        {message.text && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{
            backgroundColor: message.type === 'success' ? '#f0fdf4' : message.type === 'warning' ? '#fffbeb' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : message.type === 'warning' ? '#92400e' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : message.type === 'warning' ? '#fde68a' : '#fecaca'}`
          }}>
            <span className="fw-semibold">{message.text}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage({ text: "", type: "" })}></button>
          </div>
        )}

        {/* CREATE RMA PANEL */}
        <div className="erp-panel shadow-sm mb-4">
          <div className="erp-panel-header bg-light">
            <span className="fw-bold">Initiate Vendor Return Request</span>
          </div>
          <div className="p-4 bg-white">
            <form onSubmit={handleSubmit}>
              
              {/* HEADER FIELDS */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="erp-label">Vendor <span className="text-danger">*</span></label>
                  <select
                    className="form-select erp-input"
                    value={returnForm.vendorId}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, vendorId: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.vendorCode} - {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="erp-label">Source Purchase Order <span className="text-danger">*</span></label>
                  <select
                    className="form-select erp-input font-monospace"
                    value={returnForm.purchaseOrderId}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, purchaseOrderId: e.target.value }))}
                    required
                  >
                    <option value="">-- Select PO --</option>
                    {displayPurchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="erp-label">Return Type <span className="text-danger">*</span></label>
                  <select
                    className="form-select erp-input"
                    value={returnForm.returnType}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, returnType: e.target.value }))}
                  >
                    {returnTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="erp-label">Reason <span className="text-danger">*</span></label>
                  <select
                    className="form-select erp-input"
                    value={returnForm.returnReason}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, returnReason: e.target.value }))}
                  >
                    {reasonOptions.map((reason) => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-12">
                  <label className="erp-label">Additional Notes</label>
                  <input
                    className="form-control erp-input"
                    value={returnForm.notes}
                    onChange={(e) => setReturnForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special instructions or internal reference numbers..."
                  />
                </div>
              </div>

              {/* LINE ITEMS */}
              <h6 className="erp-section-title mb-3">Return Line Items</h6>
              <div className="bg-light p-3 border rounded mb-4">
                {returnForm.lines.map((line, idx) => (
                  <div key={idx} className="row g-2 align-items-start mb-3 pb-3 border-bottom position-relative erp-line-item">
                    
                    {/* Row Number Indicator */}
                    <div className="position-absolute d-flex align-items-center justify-content-center bg-secondary text-white rounded-circle fw-bold" style={{ width: '22px', height: '22px', fontSize: '0.7rem', top: '30px', left: '-10px', zIndex: 1 }}>
                      {idx + 1}
                    </div>

                    <div className="col-md-3 ps-3">
                      <label className="erp-label">Item <span className="text-danger">*</span></label>
                      <select
                        className="form-select erp-input"
                        value={line.itemId}
                        onChange={(e) => updateLine(idx, { itemId: e.target.value })}
                        required
                      >
                        <option value="">Item...</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>{item.itemCode} - {item.description}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="erp-label">Warehouse <span className="text-danger">*</span></label>
                      <select
                        className="form-select erp-input"
                        value={line.warehouseId}
                        onChange={(e) => updateLine(idx, { warehouseId: e.target.value })}
                        required
                      >
                        <option value="">Warehouse...</option>
                        {warehouses.map((wh) => (
                          <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-1">
                      <label className="erp-label">Qty <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="form-control erp-input font-monospace text-end px-1"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, { quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-1">
                      <label className="erp-label">Cost</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control erp-input font-monospace text-end px-1"
                        value={line.unitCost}
                        onChange={(e) => updateLine(idx, { unitCost: e.target.value })}
                      />
                    </div>
                    <div className="col-md-1">
                      <label className="erp-label">Barcode</label>
                      <input
                        className="form-control erp-input px-1"
                        value={line.barcode}
                        onChange={(e) => updateLine(idx, { barcode: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="erp-label">Lot / Batch #</label>
                      <input
                        className="form-control erp-input font-monospace"
                        value={line.lotNumber}
                        onChange={(e) => updateLine(idx, { lotNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-md-1">
                      <label className="erp-label">Serials</label>
                      <input
                        className="form-control erp-input px-1"
                        placeholder="Comma sep"
                        value={line.serialNumbers}
                        onChange={(e) => updateLine(idx, { serialNumbers: e.target.value })}
                      />
                    </div>
                    <div className="col-md-1 d-flex align-items-end justify-content-end">
                      <button
                        type="button"
                        className="btn btn-outline-danger erp-btn w-100 fw-bold px-1"
                        onClick={() => removeLine(idx)}
                        disabled={returnForm.lines.length === 1}
                        title="Remove Line Item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-light border erp-btn fw-bold text-primary mt-1" onClick={addLine}>
                  + Add Line Item
                </button>
              </div>

              <div className="d-flex justify-content-end pt-3 border-top mt-4">
                <button type="submit" className="btn btn-primary erp-btn px-5 py-2 fw-bold" disabled={formLoading}>
                  {formLoading ? "Processing..." : "Create Return Authorization"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RETURN HISTORY DATA GRID */}
        <div className="erp-panel d-flex flex-column shadow-sm mb-4" style={{ minHeight: '400px' }}>
          <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Return Authorization History</span>
            <span className="badge bg-secondary">{returns.length} Records</span>
          </div>
          
          <div className="erp-table-container flex-grow-1 overflow-auto bg-white">
            <table className="table erp-table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Return #</th>
                  <th>Vendor</th>
                  <th>Type & Reason</th>
                  <th className="text-end">Total Qty</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Status</th>
                  <th className="text-end">Created</th>
                  <th className="text-center" style={{ width: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorReturnRows.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-5 text-muted">No vendor returns found in ledger.</td></tr>
                ) : (
                  vendorReturnRows.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-bold font-monospace text-dark">{row.number}</td>
                      <td className="fw-semibold text-dark">{row.vendorName}</td>
                      <td>
                        <span className="d-block">{row.type}</span>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{row.reason}</span>
                      </td>
                      <td className="text-end font-monospace fw-bold">{row.totalQuantity}</td>
                      <td className="text-end font-monospace fw-bold">{(row.totalAmount || 0).toFixed(2)}</td>
                      <td className="text-center">
                        <span className={`erp-status-tag ${getStatusColor(row.status)}`}>{row.status}</span>
                        {row.shippedAt && <span className="d-block text-muted mt-1" style={{ fontSize: '0.65rem' }}>Shipped: {new Date(row.shippedAt).toLocaleDateString()}</span>}
                      </td>
                      <td className="text-end text-muted small">{new Date(row.createdAt).toLocaleDateString()}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1 flex-wrap">
                          {!row.approved && (
                            <button
                              className="btn btn-sm btn-outline-success erp-btn"
                              onClick={() => handleApprove(row.id)}
                              disabled={actionState.id === row.id && actionState.action === "approve"}
                            >
                              {actionState.id === row.id && actionState.action === "approve" ? "..." : "Approve"}
                            </button>
                          )}
                          {row.approved && !row.shippedAt && (
                            <button
                              className="btn btn-sm btn-outline-primary erp-btn"
                              onClick={() => handleShip(row.id)}
                              disabled={actionState.id === row.id && actionState.action === "ship"}
                            >
                              {actionState.id === row.id && actionState.action === "ship" ? "..." : "Ship"}
                            </button>
                          )}
                          {row.type === "Refund" && row.status !== "Refunded" && (
                            <button
                              className="btn btn-sm btn-outline-warning erp-btn text-dark"
                              onClick={() => handleRefund(row.id)}
                              disabled={actionState.id === row.id && actionState.action === "refund"}
                            >
                              {actionState.id === row.id && actionState.action === "refund" ? "..." : "Refund"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DOCUMENT ATTACHMENTS (Placeholder format) */}
        {/* <div className="erp-panel shadow-sm">
          <div className="erp-panel-header bg-light d-flex justify-content-between align-items-center">
            <span className="fw-bold">Attachments & Documents</span>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Context:</span>
              <select
                className="form-select form-select-sm erp-input font-monospace"
                style={{ width: '250px' }}
                value={selectedReturnId || ""}
                onChange={(event) => {
                  const val = event.target.value;
                  setSelectedReturnId(val ? Number(val) : null);
                }}
              >
                <option value="">-- Select a return --</option>
                {returns.map((ret) => (
                  <option key={ret.id} value={ret.id}>
                    {ret.returnNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="bg-white">
             <DocumentAttachments
               entityType="VendorReturn"
               entityId={selectedReturn?.id}
               entityLabel={selectedReturn?.returnNumber || "Vendor Return"}
             />
          </div>
        </div> */}

      </div>

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
          font-weight: 700;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
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

        /* Specific overrides for line items */
        .erp-line-item:last-child {
          border-bottom: none !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
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
          padding: 10px 12px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }

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
        .tag-warning { background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
        .tag-danger { background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .tag-info { background-color: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
        .tag-secondary { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
      `}</style>
    </div>
  );
}