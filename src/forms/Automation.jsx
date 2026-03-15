// import React, { useEffect, useState } from 'react';
// import { smartErpApi } from '../services/smartErpApi';

// export default function Automation() {
//   const [health, setHealth] = useState(null);
//   const [robots, setRobots] = useState([]);
//   const [items, setItems] = useState([]);
//   const [warehouses, setWarehouses] = useState([]);
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [result, setResult] = useState('');

//   const [registerRobotForm, setRegisterRobotForm] = useState({ robotCode: '', currentLocation: 'A01', batteryLevel: 100 });
//   const [updateRobotForm, setUpdateRobotForm] = useState({ robotId: '', status: 'Idle', currentLocation: 'A01', batteryLevel: 100 });
//   const [deviceForm, setDeviceForm] = useState({ deviceType: 'RFID', deviceId: 'RFID-GATE-01', eventType: 'Move', itemId: '', warehouseId: '', payload: 'A12-R03-B05' });
//   const [poForm, setPoForm] = useState({ itemId: '', warehouseId: '', quantity: 100, reason: 'Manual replenishment request' });
//   const [receivePoForm, setReceivePoForm] = useState({ poId: '', quantity: 0, scannerDeviceId: 'PO-SCN-01' });

//   const loadData = async () => {
//     try {
//       const [h, r, i, w, po] = await Promise.all([
//         smartErpApi.health(),
//         smartErpApi.robotFleet(),
//         smartErpApi.stockItems(),
//         smartErpApi.warehouses(),
//         smartErpApi.getPurchaseOrders()
//       ]);
//       setHealth(h.data);
//       setRobots(r.data || []);
//       setItems(i.data || []);
//       setWarehouses(w.data || []);
//       setPurchaseOrders(po.data || []);
//     } catch (err) {
//       setResult(err?.response?.data || 'Failed to load automation data');
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   const registerRobot = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await smartErpApi.registerRobot({
//         robotCode: registerRobotForm.robotCode,
//         currentLocation: registerRobotForm.currentLocation,
//         batteryLevel: Number(registerRobotForm.batteryLevel)
//       });
//       setResult(`Robot registered: ${res.data.robotCode}`);
//       setRegisterRobotForm({ robotCode: '', currentLocation: 'A01', batteryLevel: 100 });
//       loadData();
//     } catch (err) {
//       setResult(err?.response?.data || 'Robot registration failed');
//     }
//   };

//   const updateRobot = async (e) => {
//     e.preventDefault();
//     try {
//       await smartErpApi.updateRobotStatus(Number(updateRobotForm.robotId), {
//         status: updateRobotForm.status,
//         currentLocation: updateRobotForm.currentLocation,
//         batteryLevel: Number(updateRobotForm.batteryLevel)
//       });
//       setResult('Robot status updated');
//       loadData();
//     } catch (err) {
//       setResult(err?.response?.data || 'Robot update failed');
//     }
//   };

//   const sendDeviceEvent = async (e) => {
//     e.preventDefault();
//     try {
//       await smartErpApi.deviceEvent({
//         deviceType: deviceForm.deviceType,
//         deviceId: deviceForm.deviceId,
//         eventType: deviceForm.eventType,
//         itemId: deviceForm.itemId ? Number(deviceForm.itemId) : null,
//         warehouseId: deviceForm.warehouseId ? Number(deviceForm.warehouseId) : null,
//         payload: deviceForm.payload
//       });
//       setResult('Device event processed');
//     } catch (err) {
//       setResult(err?.response?.data || 'Device event failed');
//     }
//   };

//   const createPurchaseOrder = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await smartErpApi.createPurchaseOrder({
//         itemId: Number(poForm.itemId),
//         warehouseId: Number(poForm.warehouseId),
//         quantity: Number(poForm.quantity),
//         reason: poForm.reason
//       });
//       setResult(`Purchase order created: ${res.data.poNumber}`);
//       setPoForm({ itemId: '', warehouseId: '', quantity: 100, reason: 'Manual replenishment request' });
//       loadData();
//     } catch (err) {
//       setResult(err?.response?.data || 'PO creation failed');
//     }
//   };

//   const receivePurchaseOrder = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await smartErpApi.receivePurchaseOrder(Number(receivePoForm.poId), {
//         quantity: Number(receivePoForm.quantity),
//         scannerDeviceId: receivePoForm.scannerDeviceId
//       });
//       setResult(`${res.data.message} (${res.data.poNumber})`);
//       setReceivePoForm({ poId: '', quantity: 0, scannerDeviceId: 'PO-SCN-01' });
//       loadData();
//     } catch (err) {
//       setResult(err?.response?.data || 'PO receiving failed');
//     }
//   };

//   const runAi = async () => {
//     try {
//       const res = await smartErpApi.runAiAutomation();
//       setResult(`AI automation done. Auto POs: ${res.data.autoPurchaseOrdersCreated}`);
//       loadData();
//     } catch (err) {
//       setResult(err?.response?.data || 'AI automation failed');
//     }
//   };

//   return (
//     <div className="container-fluid py-4 app-page-bg">
//       <div className="d-flex justify-content-between align-items-center mb-3">
//         <div>
//           <h3 className="fw-bold m-0">Automation and Integration Control</h3>
//           <small className="text-muted">Robots, devices, procurement, AI automation, startup health</small>
//         </div>
//         <button className="btn btn-outline-primary" onClick={loadData}>Refresh</button>
//       </div>

//       {result && <div className="alert alert-info py-2">{result}</div>}

//       <div className="row g-4 mb-4">
//         <div className="col-md-4">
//           <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
//             <h6 className="fw-bold">Startup Health</h6>
//             <p className="mb-1">SQL: <b>{health?.sqlDatabase || '-'}</b></p>
//             <p className="mb-1">Redis: <b>{health?.redis || '-'}</b></p>
//             <p className="mb-1">Elastic: <b>{health?.elasticsearch || '-'}</b></p>
//             <p className="mb-0">Device Layer: <b>{health?.deviceIntegration || '-'}</b></p>
//           </div>
//         </div>

//         <div className="col-md-8">
//           <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
//             <h6 className="fw-bold mb-2">Robot Fleet</h6>
//             <div className="table-responsive">
//               <table className="table table-sm mb-0">
//                 <thead><tr><th>Robot</th><th>Battery</th><th>Location</th><th>Task</th><th>Status</th></tr></thead>
//                 <tbody>
//                   {robots.map((r, idx) => (
//                     <tr key={idx}><td>{r.robot}</td><td>{r.batteryLevel}</td><td>{r.location}</td><td>{r.currentTask}</td><td>{r.status}</td></tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="row g-4">
//         <div className="col-lg-6">
//           <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
//             <h6 className="fw-bold">Register Robot</h6>
//             <form className="row g-2" onSubmit={registerRobot}>
//               <div className="col-md-4"><input className="form-control" placeholder="Robot Code" value={registerRobotForm.robotCode} onChange={(e) => setRegisterRobotForm({ ...registerRobotForm, robotCode: e.target.value })} required /></div>
//               <div className="col-md-4"><input className="form-control" placeholder="Location" value={registerRobotForm.currentLocation} onChange={(e) => setRegisterRobotForm({ ...registerRobotForm, currentLocation: e.target.value })} required /></div>
//               <div className="col-md-2"><input type="number" className="form-control" value={registerRobotForm.batteryLevel} onChange={(e) => setRegisterRobotForm({ ...registerRobotForm, batteryLevel: e.target.value })} required /></div>
//               <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div>
//             </form>
//           </div>

//           <div className="card border-0 shadow-sm rounded-4 p-3">
//             <h6 className="fw-bold">Update Robot Status</h6>
//             <form className="row g-2" onSubmit={updateRobot}>
//               <div className="col-md-3"><input className="form-control" placeholder="Robot ID" value={updateRobotForm.robotId} onChange={(e) => setUpdateRobotForm({ ...updateRobotForm, robotId: e.target.value })} required /></div>
//               <div className="col-md-3">
//                 <select className="form-select" value={updateRobotForm.status} onChange={(e) => setUpdateRobotForm({ ...updateRobotForm, status: e.target.value })}>
//                   <option>Idle</option><option>Busy</option><option>Charging</option><option>Maintenance</option>
//                 </select>
//               </div>
//               <div className="col-md-3"><input className="form-control" placeholder="Location" value={updateRobotForm.currentLocation} onChange={(e) => setUpdateRobotForm({ ...updateRobotForm, currentLocation: e.target.value })} required /></div>
//               <div className="col-md-2"><input type="number" className="form-control" value={updateRobotForm.batteryLevel} onChange={(e) => setUpdateRobotForm({ ...updateRobotForm, batteryLevel: e.target.value })} required /></div>
//               <div className="col-md-1"><button className="btn btn-outline-primary w-100">Go</button></div>
//             </form>
//           </div>
//         </div>

//         <div className="col-lg-6">
//           <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
//             <h6 className="fw-bold">Device Event</h6>
//             <form className="row g-2" onSubmit={sendDeviceEvent}>
//               <div className="col-md-4">
//                 <select className="form-select" value={deviceForm.deviceType} onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}>
//                   <option>RFID</option><option>Scanner</option><option>Robot</option><option>IoT</option>
//                 </select>
//               </div>
//               <div className="col-md-4"><input className="form-control" placeholder="Device ID" value={deviceForm.deviceId} onChange={(e) => setDeviceForm({ ...deviceForm, deviceId: e.target.value })} required /></div>
//               <div className="col-md-4"><input className="form-control" placeholder="Event Type" value={deviceForm.eventType} onChange={(e) => setDeviceForm({ ...deviceForm, eventType: e.target.value })} required /></div>
//               <div className="col-md-6">
//                 <select className="form-select" value={deviceForm.itemId} onChange={(e) => setDeviceForm({ ...deviceForm, itemId: e.target.value })}>
//                   <option value="">Item (optional)</option>
//                   {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
//                 </select>
//               </div>
//               <div className="col-md-6">
//                 <select className="form-select" value={deviceForm.warehouseId} onChange={(e) => setDeviceForm({ ...deviceForm, warehouseId: e.target.value })}>
//                   <option value="">Warehouse (optional)</option>
//                   {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
//                 </select>
//               </div>
//               <div className="col-md-9"><input className="form-control" placeholder="Payload" value={deviceForm.payload} onChange={(e) => setDeviceForm({ ...deviceForm, payload: e.target.value })} required /></div>
//               <div className="col-md-3"><button className="btn btn-primary w-100">Send Event</button></div>
//             </form>
//           </div>

//           <div className="card border-0 shadow-sm rounded-4 p-3 mb-4">
//             <h6 className="fw-bold">Create Purchase Order</h6>
//             <form className="row g-2" onSubmit={createPurchaseOrder}>
//               <div className="col-md-4">
//                 <select className="form-select" value={poForm.itemId} onChange={(e) => setPoForm({ ...poForm, itemId: e.target.value })} required>
//                   <option value="">Item</option>
//                   {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
//                 </select>
//               </div>
//               <div className="col-md-4">
//                 <select className="form-select" value={poForm.warehouseId} onChange={(e) => setPoForm({ ...poForm, warehouseId: e.target.value })} required>
//                   <option value="">Warehouse</option>
//                   {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
//                 </select>
//               </div>
//               <div className="col-md-4"><input type="number" className="form-control" placeholder="Quantity" value={poForm.quantity} onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })} required /></div>
//               <div className="col-md-9"><input className="form-control" placeholder="Reason" value={poForm.reason} onChange={(e) => setPoForm({ ...poForm, reason: e.target.value })} required /></div>
//               <div className="col-md-3"><button className="btn btn-outline-primary w-100">Create PO</button></div>
//             </form>

//             <hr />
//             <h6 className="fw-bold">Receive Purchase Order</h6>
//             <form className="row g-2" onSubmit={receivePurchaseOrder}>
//               <div className="col-md-4">
//                 <select className="form-select" value={receivePoForm.poId} onChange={(e) => setReceivePoForm({ ...receivePoForm, poId: e.target.value })} required>
//                   <option value="">Select PO</option>
//                   {purchaseOrders.filter((p) => p.pendingQuantity > 0).map((po) => (
//                     <option key={po.id} value={po.id}>{po.poNumber} ({po.itemCode}) - Pending {po.pendingQuantity}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="col-md-3"><input type="number" className="form-control" placeholder="Receive Qty (0 = full pending)" value={receivePoForm.quantity} onChange={(e) => setReceivePoForm({ ...receivePoForm, quantity: e.target.value })} /></div>
//               <div className="col-md-3"><input className="form-control" placeholder="Scanner ID" value={receivePoForm.scannerDeviceId} onChange={(e) => setReceivePoForm({ ...receivePoForm, scannerDeviceId: e.target.value })} /></div>
//               <div className="col-md-2"><button className="btn btn-success w-100">Receive</button></div>
//             </form>
//           </div>

//           <div className="card border-0 shadow-sm rounded-4 p-3">
//             <h6 className="fw-bold">AI Automation</h6>
//             <p className="text-muted mb-3">Run demand forecast and auto purchase-order generation.</p>
//             <button className="btn btn-success" onClick={runAi}>Run AI Automation</button>
//           </div>
//         </div>
//       </div>

//       <div className="card border-0 shadow-sm rounded-4 p-3 mt-4">
//         <h6 className="fw-bold">Purchase Order Ledger</h6>
//         <div className="table-responsive">
//           <table className="table table-sm mb-0">
//             <thead>
//               <tr>
//                 <th>PO</th>
//                 <th>Item</th>
//                 <th>Warehouse</th>
//                 <th>Qty</th>
//                 <th>Received</th>
//                 <th>Pending</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {purchaseOrders.map((po) => (
//                 <tr key={po.id}>
//                   <td>{po.poNumber}</td>
//                   <td>{po.itemCode || po.itemId}</td>
//                   <td>{po.warehouseName || po.warehouseId}</td>
//                   <td>{po.quantity}</td>
//                   <td>{po.receivedQuantity}</td>
//                   <td>{po.pendingQuantity}</td>
//                   <td>{po.status}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState } from 'react';
import { smartErpApi } from '../services/smartErpApi';

export default function Automation() {
  // --- Data State ---
  const [health, setHealth] = useState(null);
  const [robots, setRobots] = useState([]);
  const [robotTasks, setRobotTasks] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [result, setResult] = useState('');
  const [warning, setWarning] = useState('');

  // --- Form States ---
  const [registerRobotForm, setRegisterRobotForm] = useState({ robotCode: '', currentLocation: 'A01', batteryLevel: 100 });
  const [updateRobotForm, setUpdateRobotForm] = useState({ robotId: '', status: 'Idle', currentLocation: 'A01', batteryLevel: 100 });
  const [deviceForm, setDeviceForm] = useState({ deviceType: 'RFID', deviceId: 'RFID-GATE-01', eventType: 'Move', itemId: '', warehouseId: '', payload: 'A12-R03-B05' });
  const [poForm, setPoForm] = useState({
    vendorId: '',
    reason: 'Manual replenishment request',
    lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
  });
  const [vendorForm, setVendorForm] = useState({ vendorCode: '', name: '', contactPerson: '', phone: '', email: '' });
  const [receivePoForm, setReceivePoForm] = useState({ poId: '', purchaseOrderLineId: '', quantity: 0, scannerDeviceId: 'PO-SCN-01' });
  const [assignTaskForm, setAssignTaskForm] = useState({ orderId: '' });

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [h, r, t, i, w, po, v] = await Promise.allSettled([
        smartErpApi.health(),
        smartErpApi.robotFleet(),
        smartErpApi.robotTasks(),
        smartErpApi.stockItems(),
        smartErpApi.warehouses(),
        smartErpApi.getPurchaseOrders(),
        smartErpApi.getVendors()
      ]);
      if (h.status === 'fulfilled') setHealth(h.value.data);
      if (r.status === 'fulfilled') setRobots(r.value.data || []);
      if (t.status === 'fulfilled') setRobotTasks(t.value.data || []);
      if (i.status === 'fulfilled') setItems(i.value.data || []);
      if (w.status === 'fulfilled') setWarehouses(w.value.data || []);
      if (v.status === 'fulfilled') setVendors(v.value.data || []);

      const normalizedPo = (((po.status === 'fulfilled' ? po.value.data : []) || [])).map((x) => {
        const lines = Array.isArray(x.lines) && x.lines.length > 0
          ? x.lines
          : [{
              lineId: x.id,
              itemId: x.itemId,
              itemCode: x.itemCode,
              warehouseId: x.warehouseId,
              warehouseName: x.warehouseName,
              quantity: x.quantity,
              receivedQuantity: x.receivedQuantity,
              pendingQuantity: x.pendingQuantity,
              status: x.status
            }];

        const totalQuantity = x.totalQuantity ?? lines.reduce((s, l) => s + Number(l.quantity || 0), 0);
        const receivedQuantity = x.receivedQuantity ?? lines.reduce((s, l) => s + Number(l.receivedQuantity || 0), 0);

        return {
          ...x,
          totalQuantity,
          receivedQuantity,
          pendingQuantity: x.pendingQuantity ?? (totalQuantity - receivedQuantity),
          lines
        };
      });

      setPurchaseOrders(normalizedPo);
      const hasFailure = [h, r, t, i, w, po, v].some((x) => x.status === 'rejected');
      setWarning(hasFailure ? 'Some automation data failed to load. Showing available data.' : '');
    } catch (err) {
      setResult(err?.response?.data || 'Failed to load automation data');
      setWarning('Unable to refresh automation data.');
    }
  };

  // --- Logic Handlers ---
  const handleAction = async (apiCall, successMsg, resetForm = null) => {
    try {
      const res = await apiCall();
      setResult(`${successMsg}${res?.data?.poNumber || res?.data?.robotCode || ''}`);
      if (resetForm) resetForm();
      loadData();
    } catch (err) {
      setResult(err?.response?.data || 'Action failed');
    }
  };

  const registerRobot = (e) => {
    e.preventDefault();
    handleAction(
      () => smartErpApi.registerRobot({ ...registerRobotForm, batteryLevel: Number(registerRobotForm.batteryLevel) }),
      'Robot registered: ',
      () => setRegisterRobotForm({ robotCode: '', currentLocation: 'A01', batteryLevel: 100 })
    );
  };

  const updateRobot = (e) => {
    e.preventDefault();
    handleAction(
      () => smartErpApi.updateRobotStatus(Number(updateRobotForm.robotId), { ...updateRobotForm, batteryLevel: Number(updateRobotForm.batteryLevel) }),
      'Robot status updated'
    );
  };

  const sendDeviceEvent = (e) => {
    e.preventDefault();
    handleAction(
      () => smartErpApi.deviceEvent({
        ...deviceForm,
        itemId: deviceForm.itemId ? Number(deviceForm.itemId) : null,
        warehouseId: deviceForm.warehouseId ? Number(deviceForm.warehouseId) : null,
      }),
      'Device event processed'
    );
  };

  const addPoLine = () => {
    setPoForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { itemId: '', warehouseId: '', quantity: 1 }]
    }));
  };

  const removePoLine = (idx) => {
    setPoForm((prev) => ({
      ...prev,
      lines: prev.lines.length === 1 ? prev.lines : prev.lines.filter((_, lineIdx) => lineIdx !== idx)
    }));
  };

  const updatePoLine = (idx, patch) => {
    setPoForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, lineIdx) => (lineIdx === idx ? { ...line, ...patch } : line))
    }));
  };

  const selectedPo = purchaseOrders.find((p) => Number(p.id) === Number(receivePoForm.poId));
  const selectedPoLines = (selectedPo?.lines || []).filter((l) => Number(l.pendingQuantity) > 0);

  const createPurchaseOrder = (e) => {
    e.preventDefault();
    if (!poForm.vendorId) {
      setResult('Create/select vendor first.');
      return;
    }

    const normalizedLines = poForm.lines
      .map((line) => ({
        itemId: Number(line.itemId),
        warehouseId: Number(line.warehouseId),
        quantity: Number(line.quantity)
      }))
      .filter((line) => line.itemId > 0 && line.warehouseId > 0 && line.quantity > 0);

    if (normalizedLines.length === 0) {
      setResult('Add at least one valid purchase-order line.');
      return;
    }

    handleAction(
      () => smartErpApi.createPurchaseOrder({
        vendorId: Number(poForm.vendorId),
        reason: poForm.reason,
        lines: normalizedLines
      }),
      'Purchase order created: ',
      () => setPoForm({
        vendorId: '',
        reason: 'Manual replenishment request',
        lines: [{ itemId: '', warehouseId: '', quantity: 100 }]
      })
    );
  };

  const createVendor = (e) => {
    e.preventDefault();
    handleAction(
      () => smartErpApi.createVendor({
        vendorCode: vendorForm.vendorCode,
        name: vendorForm.name,
        contactPerson: vendorForm.contactPerson || null,
        phone: vendorForm.phone || null,
        email: vendorForm.email || null
      }),
      'Vendor created: ',
      () => setVendorForm({ vendorCode: '', name: '', contactPerson: '', phone: '', email: '' })
    );
  };

  const receivePurchaseOrder = (e) => {
    e.preventDefault();
    if (!receivePoForm.purchaseOrderLineId) {
      setResult('Select a PO line to receive.');
      return;
    }

    handleAction(
      () => smartErpApi.receivePurchaseOrder(Number(receivePoForm.poId), {
        purchaseOrderLineId: Number(receivePoForm.purchaseOrderLineId),
        quantity: Number(receivePoForm.quantity),
        scannerDeviceId: receivePoForm.scannerDeviceId
      }),
      'PO received successfully: ',
      () => setReceivePoForm({ poId: '', purchaseOrderLineId: '', quantity: 0, scannerDeviceId: 'PO-SCN-01' })
    );
  };

  const runAi = () => handleAction(() => smartErpApi.runAiAutomation(), 'AI automation complete. Auto POs: ');

  const assignTaskToRobot = (e) => {
    e.preventDefault();
    if (!assignTaskForm.orderId) {
      setResult('Enter an Order ID to assign task.');
      return;
    }

    handleAction(
      () => smartErpApi.assignPicking(Number(assignTaskForm.orderId)),
      'Task assigned: ',
      () => setAssignTaskForm({ orderId: '' })
    );
  };

  const sendRobotTaskEvent = (taskId, eventName) => {
    handleAction(
      () => smartErpApi.robotTaskEvent(taskId, { eventName }),
      `Task ${taskId} updated: `
    );
  };

  const completeRobotTask = (taskId) => {
    handleAction(
      () => smartErpApi.completeRobotTask(taskId),
      `Task ${taskId} completed: `
    );
  };

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-primary m-0">Automation & IoT Control</h3>
          <small className="text-secondary">Fleet management, Real-time Device Events, and AI Procurement</small>
        </div>
        <button className="btn btn-primary px-4 shadow-sm" onClick={loadData}>Refresh Systems</button>
      </div>

      {result && <div className="alert alert-info border-0 shadow-sm mb-4">{result}</div>}
      {warning && <div className="alert alert-warning border-0 shadow-sm mb-4">{warning}</div>}

      <div className="row g-4 mb-4">
        {/* Health Panel */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <h6 className="fw-bold mb-3 text-uppercase small text-muted">System Health</h6>
            <div className="d-flex flex-column gap-2">
              {['sqlDatabase', 'redis', 'elasticsearch', 'deviceIntegration'].map((key) => (
                <div key={key} className="d-flex justify-content-between border-bottom pb-1">
                  <span className="text-capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={`badge ${['Connected', 'Healthy', 'Configured', 'Ready'].includes(health?.[key]) ? 'bg-success' : 'bg-danger'}`}>
                    {health?.[key] || 'Checking...'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Robot Fleet Table */}
        <div className="col-md-8">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4">
            <h6 className="fw-bold mb-3 text-uppercase small text-muted">Robot Fleet Status</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr><th>Robot</th><th>Battery</th><th>Location</th><th>Task</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {robots.map((r, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{r.robot}</td>
                      <td>
                        <div className="progress" style={{ height: '8px', width: '60px' }}>
                          <div className={`progress-bar ${r.batteryLevel < 20 ? 'bg-danger' : 'bg-success'}`} style={{ width: `${r.batteryLevel}%` }}></div>
                        </div>
                        <small>{r.batteryLevel}%</small>
                      </td>
                      <td>{r.location}</td>
                      <td className="small text-muted">{r.currentTask}</td>
                      <td><span className={`badge rounded-pill ${r.status === 'Idle' ? 'bg-info' : 'bg-warning'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold m-0">Active Robot Task Queue</h6>
          <small className="text-muted">Auto refresh every 5s</small>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Task ID</th>
                <th>Order</th>
                <th>Robot</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {robotTasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.orderNumber || `SO-${t.salesOrderId}`}</td>
                  <td>{t.robotCode || '-'}</td>
                  <td>{t.taskType}</td>
                  <td><span className="badge bg-secondary">{t.status}</span></td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => sendRobotTaskEvent(t.id, 'REACHED_SOURCE')}>Reached</button>
                      <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => sendRobotTaskEvent(t.id, 'PICKED')}>Picked</button>
                      <button type="button" className="btn btn-sm btn-outline-info" onClick={() => sendRobotTaskEvent(t.id, 'DELIVERED')}>Delivered</button>
                      <button type="button" className="btn btn-sm btn-success" onClick={() => completeRobotTask(t.id)}>Complete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {robotTasks.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-muted">No robot tasks found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Robot Management */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
            <h6 className="fw-bold mb-3">Fleet Actions</h6>
            <form className="row g-2 mb-4" onSubmit={registerRobot}>
              <div className="col-md-4"><input className="form-control" placeholder="Robot Code" value={registerRobotForm.robotCode} onChange={(e) => setRegisterRobotForm({ ...registerRobotForm, robotCode: e.target.value })} required /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Location" value={registerRobotForm.currentLocation} onChange={(e) => setRegisterRobotForm({ ...registerRobotForm, currentLocation: e.target.value })} required /></div>
              <div className="col-md-2"><input type="number" className="form-control" value={registerRobotForm.batteryLevel} onChange={(e) => setRegisterRobotForm({ ...registerRobotForm, batteryLevel: e.target.value })} required /></div>
              <div className="col-md-2"><button className="btn btn-dark w-100">Register</button></div>
            </form>
            <form className="row g-2" onSubmit={updateRobot}>
              <div className="col-md-3"><input className="form-control" placeholder="Robot ID" value={updateRobotForm.robotId} onChange={(e) => setUpdateRobotForm({ ...updateRobotForm, robotId: e.target.value })} required /></div>
              <div className="col-md-3">
                <select className="form-select" value={updateRobotForm.status} onChange={(e) => setUpdateRobotForm({ ...updateRobotForm, status: e.target.value })}>
                  <option>Idle</option><option>Busy</option><option>Charging</option><option>Maintenance</option>
                </select>
              </div>
              <div className="col-md-3"><input className="form-control" placeholder="Loc" value={updateRobotForm.currentLocation} onChange={(e) => setUpdateRobotForm({ ...updateRobotForm, currentLocation: e.target.value })} required /></div>
              <div className="col-md-3"><button className="btn btn-outline-dark w-100">Update</button></div>
            </form>

            <hr />
            <h6 className="fw-bold mb-3">Assign Task To Robot</h6>
            <form className="row g-2" onSubmit={assignTaskToRobot}>
              <div className="col-md-8">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Sales Order ID"
                  value={assignTaskForm.orderId}
                  onChange={(e) => setAssignTaskForm({ orderId: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-4">
                <button className="btn btn-warning w-100">Assign Picking</button>
              </div>
            </form>
          </div>

          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3">IoT Device Event Emulator</h6>
            <form className="row g-3" onSubmit={sendDeviceEvent}>
              <div className="col-md-4">
                <select className="form-select" value={deviceForm.deviceType} onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value })}>
                  <option>RFID</option><option>Scanner</option><option>Robot</option><option>IoT</option>
                </select>
              </div>
              <div className="col-md-4"><input className="form-control" placeholder="Device ID" value={deviceForm.deviceId} onChange={(e) => setDeviceForm({ ...deviceForm, deviceId: e.target.value })} required /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Event (e.g. Move)" value={deviceForm.eventType} onChange={(e) => setDeviceForm({ ...deviceForm, eventType: e.target.value })} required /></div>
              <div className="col-md-6">
                <select className="form-select" value={deviceForm.itemId} onChange={(e) => setDeviceForm({ ...deviceForm, itemId: e.target.value })}>
                  <option value="">Select Item (Optional)</option>
                  {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <select className="form-select" value={deviceForm.warehouseId} onChange={(e) => setDeviceForm({ ...deviceForm, warehouseId: e.target.value })}>
                  <option value="">Select Warehouse (Optional)</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div className="col-12"><input className="form-control" placeholder="Payload Data" value={deviceForm.payload} onChange={(e) => setDeviceForm({ ...deviceForm, payload: e.target.value })} required /></div>
              <div className="col-12"><button className="btn btn-primary w-100 py-2">Trigger Event</button></div>
            </form>
          </div>
        </div>

        {/* Right Column: Procurement & AI */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold m-0">Procurement Management</h6>
              <button className="btn btn-success btn-sm" onClick={runAi}>Run AI Forecasting</button>
            </div>

            <form className="row g-2 mb-4" onSubmit={createVendor}>
              <div className="col-md-3"><input className="form-control" placeholder="Vendor Code" value={vendorForm.vendorCode} onChange={(e) => setVendorForm({ ...vendorForm, vendorCode: e.target.value })} required /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Vendor Name" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} required /></div>
              <div className="col-md-3"><input type="email" className="form-control" placeholder="Vendor Email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} required /></div>
              <div className="col-md-2"><button className="btn btn-outline-primary w-100">Create Vendor</button></div>
            </form>

            <form className="row g-2 mb-4" onSubmit={createPurchaseOrder}>
              <div className="col-md-4">
                <select className="form-select" value={poForm.vendorId} onChange={(e) => setPoForm({ ...poForm, vendorId: e.target.value })} required>
                  <option value="">Select Vendor</option>
                  {vendors.map((vnd) => <option key={vnd.id} value={vnd.id}>{vnd.vendorCode} - {vnd.name}</option>)}
                </select>
              </div>
              <div className="col-md-8">
                <input className="form-control" placeholder="Reason" value={poForm.reason} onChange={(e) => setPoForm({ ...poForm, reason: e.target.value })} required />
              </div>

              {poForm.lines.map((line, idx) => (
                <React.Fragment key={idx}>
                  <div className="col-md-4">
                    <select className="form-select" value={line.itemId} onChange={(e) => updatePoLine(idx, { itemId: e.target.value })} required>
                      <option value="">Item</option>
                      {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <select className="form-select" value={line.warehouseId} onChange={(e) => updatePoLine(idx, { warehouseId: e.target.value })} required>
                      <option value="">Warehouse</option>
                      {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input type="number" className="form-control" placeholder="Qty" value={line.quantity} onChange={(e) => updatePoLine(idx, { quantity: e.target.value })} required />
                  </div>
                  <div className="col-md-1 d-grid">
                    <button type="button" className="btn btn-outline-danger" onClick={() => removePoLine(idx)}>x</button>
                  </div>
                </React.Fragment>
              ))}

              <div className="col-12 d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={addPoLine}>Add Line</button>
                <button className="btn btn-outline-primary">Create PO</button>
              </div>
            </form>

            <h6 className="small fw-bold text-muted text-uppercase mb-2">PO Receiving Scan</h6>
            <form className="row g-2" onSubmit={receivePurchaseOrder}>
              <div className="col-md-6">
                <select className="form-select" value={receivePoForm.poId} onChange={(e) => setReceivePoForm({ ...receivePoForm, poId: e.target.value, purchaseOrderLineId: '' })} required>
                  <option value="">Select Pending PO</option>
                  {purchaseOrders.filter((p) => p.pendingQuantity > 0).map((po) => (
                    <option key={po.id} value={po.id}>{po.poNumber} (Rem: {po.pendingQuantity})</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <select className="form-select" value={receivePoForm.purchaseOrderLineId} onChange={(e) => setReceivePoForm({ ...receivePoForm, purchaseOrderLineId: e.target.value })} required>
                  <option value="">Select PO Line</option>
                  {selectedPoLines.map((line) => (
                    <option key={line.lineId} value={line.lineId}>Line {line.lineId} - {line.itemCode} - {line.warehouseName} - Pending {line.pendingQuantity}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3"><input type="number" className="form-control" placeholder="Qty" value={receivePoForm.quantity} onChange={(e) => setReceivePoForm({ ...receivePoForm, quantity: e.target.value })} /></div>
              <div className="col-md-5"><input className="form-control" placeholder="Scanner ID" value={receivePoForm.scannerDeviceId} onChange={(e) => setReceivePoForm({ ...receivePoForm, scannerDeviceId: e.target.value })} /></div>
              <div className="col-md-4"><button className="btn btn-success w-100">Receive</button></div>
            </form>
          </div>

          {/* Ledger Table */}
          <div className="card border-0 shadow-sm rounded-4 p-4">
            <h6 className="fw-bold mb-3">Purchase Order Ledger</h6>
            <div className="table-responsive" style={{ maxHeight: '300px' }}>
              <table className="table table-sm table-borderless small">
                <thead className="text-muted border-bottom">
                  <tr><th>PO #</th><th>Total Qty</th><th>Received</th><th>Pending</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-bottom">
                      <td>{po.poNumber}</td>
                      <td>{po.totalQuantity}</td>
                      <td>{po.receivedQuantity}</td>
                      <td>{po.pendingQuantity}</td>
                      <td><span className={`badge ${po.status === 'Closed' ? 'bg-success' : 'bg-secondary'}`}>{po.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
