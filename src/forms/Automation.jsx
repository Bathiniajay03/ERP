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
  const [salesOrders, setSalesOrders] = useState([]);
  const [packers, setPackers] = useState([]);
  const [riders, setRiders] = useState([]);
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
  const [assignOrderForm, setAssignOrderForm] = useState({ orderId: '', packerId: '' });
  const [assignRiderForm, setAssignRiderForm] = useState({ orderId: '', riderId: '' });
  const [updatePackerStatusForm, setUpdatePackerStatusForm] = useState({ orderId: '', status: 'Received' });

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [h, r, t, i, w, po, v, so, u] = await Promise.allSettled([
        smartErpApi.health(),
        smartErpApi.robotFleet(),
        smartErpApi.robotTasks(),
        smartErpApi.stockItems(),
        smartErpApi.warehouses(),
        smartErpApi.getPurchaseOrders(),
        smartErpApi.getVendors(),
        smartErpApi.getSalesOrders(),
        smartErpApi.getUsers()
      ]);
      if (h.status === 'fulfilled') setHealth(h.value.data);
      if (r.status === 'fulfilled') setRobots(r.value.data || []);
      if (t.status === 'fulfilled') setRobotTasks(t.value.data || []);
      if (t.status === 'rejected') {
        const err = t.reason;
        if (err?.response?.status === 401) {
          setResult('Robot tasks auth failed. Please login and try again.');
        } else {
          const message = err?.customMessage || err?.response?.data?.message || err?.message || 'Robot tasks failed';
          setResult(`Robot tasks load error: ${message}`);
        }
      }
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
      if (so.status === 'fulfilled') setSalesOrders(so.value.data || []);
      if (u.status === 'fulfilled') {
        const users = u.value.data || [];
        setPackers(users.filter(user => user.role === 'Packer' || user.role === 'Operator'));
        setRiders(users.filter(user => user.role === 'Rider' || user.role === 'Robot Supervisor'));
      }
      const hasFailure = [h, r, t, i, w, po, v, so, u].some((x) => x.status === 'rejected');
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

  const assignOrderToPacker = (e) => {
    e.preventDefault();
    if (!assignOrderForm.orderId || !assignOrderForm.packerId) {
      setResult('Select order and packer.');
      return;
    }

    handleAction(
      () => smartErpApi.updateSalesOrderStatus(Number(assignOrderForm.orderId), { status: 'Picking', assignedPackerId: Number(assignOrderForm.packerId) }),
      'Order assigned to packer: ',
      () => setAssignOrderForm({ orderId: '', packerId: '' })
    );
  };

  const updatePackerStatus = (e) => {
    e.preventDefault();
    if (!updatePackerStatusForm.orderId) {
      setResult('Select order to update.');
      return;
    }

    const statusMap = {
      'Received': 'Picking',
      'Packed': 'Packed',
      'Bin Placed': 'Packed'
    };

    handleAction(
      () => smartErpApi.updateSalesOrderStatus(Number(updatePackerStatusForm.orderId), { status: statusMap[updatePackerStatusForm.status] || 'Picking' }),
      `Order status updated to ${updatePackerStatusForm.status}: `,
      () => setUpdatePackerStatusForm({ orderId: '', status: 'Received' })
    );
  };

  const assignOrderToRider = (e) => {
    e.preventDefault();
    if (!assignRiderForm.orderId || !assignRiderForm.riderId) {
      setResult('Select order and rider.');
      return;
    }

    handleAction(
      () => smartErpApi.updateSalesOrderStatus(Number(assignRiderForm.orderId), { status: 'Shipped', assignedRiderId: Number(assignRiderForm.riderId) }),
      'Order assigned to rider: ',
      () => setAssignRiderForm({ orderId: '', riderId: '' })
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

  const getHealthTag = (status) => {
    return ['Connected', 'Healthy', 'Configured', 'Ready'].includes(status) ? 'tag-success' : 'tag-danger';
  };

  const getRobotStatusTag = (status) => {
    if (status === 'Idle') return 'tag-info';
    if (status === 'Charging') return 'tag-warning';
    if (status === 'Maintenance') return 'tag-danger';
    return 'tag-success';
  };

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>Automation & IoT Control</h4>
            <span className="erp-text-muted small text-uppercase">Fleet management, Event Streams & AI Agents</span>
          </div>
          <button className="btn btn-primary erp-btn d-flex align-items-center gap-2" onClick={loadData}>
            ↻ Refresh Systems
          </button>
        </div>

        {/* ALERTS */}
        {result && (
          <div className="alert erp-alert d-flex justify-content-between align-items-center py-2 mb-3" style={{ backgroundColor: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd' }}>
            <span className="fw-semibold">{result}</span>
            <button className="btn-close btn-sm" onClick={() => setResult('')}></button>
          </div>
        )}
        {warning && (
          <div className="alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4" style={{ backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
            <span className="fw-semibold">{warning}</span>
            <button className="btn-close btn-sm" onClick={() => setWarning('')}></button>
          </div>
        )}

        <div className="row g-4 mb-4">
          {/* Health Panel */}
          <div className="col-md-4 col-xl-3">
            <div className="erp-panel h-100">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">System Health</span>
              </div>
              <div className="p-3 bg-white d-flex flex-column gap-2 h-100">
                {['sqlDatabase', 'redis', 'elasticsearch', 'deviceIntegration'].map((key) => (
                  <div key={key} className="d-flex justify-content-between align-items-center border-bottom pb-2 pt-1">
                    <span className="text-capitalize text-muted small fw-bold">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={`erp-status-tag ${getHealthTag(health?.[key])}`}>
                      {health?.[key] || 'Checking...'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>


        {/* Lower Grid: Robot Mgmt / IoT / Procurement */}
        <div className="row g-4">
          
          {/* Right Column: Procurement & AI */}
          <div className="col-12">
            <div className="erp-panel shadow-sm mb-4">
              <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
                <span className="fw-bold">AI Agent & Manual Procurement</span>
                <button className="btn btn-success btn-sm erp-btn fw-bold px-3 py-1" onClick={runAi}>
                  ✧ Trigger AI Procurement
                </button>
              </div>
              <div className="p-4 bg-white">
                <h6 className="erp-section-title mb-3">Quick Vendor Setup</h6>
                <form className="row g-2 mb-4 align-items-end" onSubmit={createVendor}>
                  <div className="col-md-3">
                    <label className="erp-label">Code</label>
                    <input className="form-control erp-input font-monospace" placeholder="V-001" value={vendorForm.vendorCode} onChange={(e) => setVendorForm({ ...vendorForm, vendorCode: e.target.value })} required />
                  </div>
                  <div className="col-md-4">
                    <label className="erp-label">Company Name</label>
                    <input className="form-control erp-input" placeholder="Name" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} required />
                  </div>
                  <div className="col-md-3">
                    <label className="erp-label">Email</label>
                    <input type="email" className="form-control erp-input" placeholder="email@dom.com" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })} required />
                  </div>
                  <div className="col-md-2">
                    <button className="btn btn-outline-primary erp-btn w-100">Add</button>
                  </div>
                </form>

                <h6 className="erp-section-title mb-3">Draft Purchase Order</h6>
                <form onSubmit={createPurchaseOrder} className="mb-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="erp-label">Vendor Select</label>
                      <select className="form-select erp-input" value={poForm.vendorId} onChange={(e) => setPoForm({ ...poForm, vendorId: e.target.value })} required>
                        <option value="">-- Choose --</option>
                        {vendors.map((vnd) => <option key={vnd.id} value={vnd.id}>{vnd.vendorCode} - {vnd.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-8">
                      <label className="erp-label">Procurement Rationale</label>
                      <input className="form-control erp-input" placeholder="Reason for request" value={poForm.reason} onChange={(e) => setPoForm({ ...poForm, reason: e.target.value })} required />
                    </div>
                  </div>

                  <div className="bg-light p-2 border rounded mb-3">
                    <label className="erp-label ms-1">Line Items</label>
                    {poForm.lines.map((line, idx) => (
                      <div key={idx} className="row g-2 align-items-end mb-2 pb-2 border-bottom erp-line-item mx-0">
                        <div className="col-md-4">
                          <select className="form-select erp-input" value={line.itemId} onChange={(e) => updatePoLine(idx, { itemId: e.target.value })} required>
                            <option value="">Item...</option>
                            {items.map((i) => <option key={i.id} value={i.id}>{i.itemCode}</option>)}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <select className="form-select erp-input" value={line.warehouseId} onChange={(e) => updatePoLine(idx, { warehouseId: e.target.value })} required>
                            <option value="">Warehouse...</option>
                            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                        </div>
                        <div className="col-md-3">
                          <input type="number" className="form-control erp-input font-monospace text-end" placeholder="Qty" value={line.quantity} onChange={(e) => updatePoLine(idx, { quantity: e.target.value })} min="1" required />
                        </div>
                        <div className="col-md-1 d-flex">
                          <button type="button" className="btn btn-outline-danger erp-btn w-100 fw-bold px-1" onClick={() => removePoLine(idx)} disabled={poForm.lines.length === 1}>✕</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="btn btn-sm btn-light border erp-btn fw-bold text-primary ms-1 mt-1" onClick={addPoLine}>+ Add Line</button>
                  </div>
                  
                  <div className="text-end">
                    <button className="btn btn-primary erp-btn px-4">Generate Purchase Order</button>
                  </div>
                </form>

                <h6 className="erp-section-title mb-3">GRN Terminal (Receiving)</h6>
                <form className="row g-2 p-3 bg-light border rounded" onSubmit={receivePurchaseOrder}>
                  <div className="col-md-6">
                    <label className="erp-label">Target PO</label>
                    <select className="form-select erp-input font-monospace" value={receivePoForm.poId} onChange={(e) => setReceivePoForm({ ...receivePoForm, poId: e.target.value, purchaseOrderLineId: '' })} required>
                      <option value="">-- Pending POs --</option>
                      {purchaseOrders.filter((p) => p.pendingQuantity > 0).map((po) => (
                        <option key={po.id} value={po.id}>{po.poNumber} (Rem: {po.pendingQuantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="erp-label">Line Detail</label>
                    <select className="form-select erp-input font-monospace" value={receivePoForm.purchaseOrderLineId} onChange={(e) => setReceivePoForm({ ...receivePoForm, purchaseOrderLineId: e.target.value })} required disabled={!receivePoForm.poId}>
                      <option value="">-- Line Selection --</option>
                      {selectedPoLines.map((line) => (
                        <option key={line.lineId} value={line.lineId}>Ln {line.lineId} | {line.itemCode} | {line.warehouseName} | Rem: {line.pendingQuantity}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3 mt-2">
                    <label className="erp-label">Qty</label>
                    <input type="number" className="form-control erp-input font-monospace text-end" placeholder="Full" value={receivePoForm.quantity} onChange={(e) => setReceivePoForm({ ...receivePoForm, quantity: e.target.value })} min="0" step="0.01" />
                  </div>
                  <div className="col-md-5 mt-2">
                    <label className="erp-label">Scanner ID</label>
                    <input className="form-control erp-input font-monospace" placeholder="ID" value={receivePoForm.scannerDeviceId} onChange={(e) => setReceivePoForm({ ...receivePoForm, scannerDeviceId: e.target.value })} />
                  </div>
                  <div className="col-md-4 mt-2 d-flex align-items-end">
                    <button className="btn btn-success erp-btn w-100 fw-bold">Process GRN</button>
                  </div>
                </form>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="erp-panel shadow-sm">
              <div className="erp-panel-header bg-light">
                <span className="fw-bold">Procurement Ledger Overview</span>
              </div>
              <div className="erp-table-container overflow-auto bg-white" style={{ maxHeight: '250px' }}>
                <table className="table erp-table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>PO #</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Received</th>
                      <th className="text-end">Pending</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-muted py-3">No Purchase Orders in ledger.</td></tr>
                    ) : (
                      purchaseOrders.map((po) => (
                        <tr key={po.id}>
                          <td className="fw-bold text-dark font-monospace">{po.poNumber}</td>
                          <td className="text-end font-monospace">{po.totalQuantity}</td>
                          <td className="text-end font-monospace text-success">{po.receivedQuantity}</td>
                          <td className={`text-end font-monospace fw-bold ${po.pendingQuantity > 0 ? 'text-danger' : ''}`}>{po.pendingQuantity}</td>
                          <td className="text-center">
                            <span className={`erp-status-tag ${po.status === 'Closed' ? 'tag-success' : 'tag-secondary'}`}>{po.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
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
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--erp-text-muted);
          text-transform: uppercase;
          margin-bottom: 4px;
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

        /* Line Items */
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
          padding: 8px 12px;
          vertical-align: middle;
          border-color: #e2e8f0;
        }

        /* Status Tags */
        .erp-status-tag {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 3px 6px;
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