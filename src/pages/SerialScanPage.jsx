// import React, { useCallback, useEffect, useRef, useState } from "react";
// import api from "../services/apiClient";

// export default function SerialScanPage() {
//   const [serialInput, setSerialInput] = useState("");
//   const [serialInfo, setSerialInfo] = useState(null);
//   const [status, setStatus] = useState({ type: "", text: "" });
//   const [loading, setLoading] = useState(false);
//   const [dispatching, setDispatching] = useState(false);
//   const [cameraActive, setCameraActive] = useState(false);
//   const [cameraError, setCameraError] = useState("");
//   const [dispatchReason, setDispatchReason] = useState("");
//   const html5QrCodeRef = useRef(null);
//   const currentScanRef = useRef("");

//   const showStatus = useCallback((type, text) => {
//     setStatus({ type, text });
//     if (text) {
//       setTimeout(() => setStatus({ type: "", text: "" }), 3500);
//     }
//   }, []);

//   const resolveSerial = useCallback(
//     async (value) => {
//       const trimmed = ((value ?? serialInput) || "").trim();
//       if (!trimmed) {
//         showStatus("error", "Scan or type a serial number first.");
//         return;
//       }

//       setSerialInput(trimmed);
//       setLoading(true);
//       try {
//         const response = await api.get(`/stock/serial/${encodeURIComponent(trimmed)}`);
//         setSerialInfo(response.data);
//         if (response.data.status !== "AVAILABLE") {
//           showStatus("error", `Serial ${response.data.serialNumber} is not available (${response.data.status})`);
//         } else {
//           showStatus("success", `Serial ${response.data.serialNumber} ready for dispatch`);
//         }
//       } catch (error) {
//         setSerialInfo(null);
//         showStatus("error", error?.response?.data || "Unable to resolve serial");
//       } finally {
//         setLoading(false);
//       }
//     },
//     [serialInput, showStatus]
//   );

//   const dispatchSerial = useCallback(async () => {
//     if (!serialInfo) return;
//     if (serialInfo.status && serialInfo.status !== "AVAILABLE") {
//       showStatus("error", "Serial is already processed and cannot be dispatched.");
//       return;
//     }
//     if (!serialInfo.warehouseId || !serialInfo.lotId) {
//       showStatus("error", "Serial is not tied to a warehouse or lot.");
//       return;
//     }
//     setDispatching(true);
//     try {
//       await api.post("/stock/out", {
//         itemId: serialInfo.itemId,
//         warehouseId: serialInfo.warehouseId,
//         quantity: 1,
//         lotNumber: serialInfo.lotNumber,
//         serialNumbers: [serialInfo.serialNumber],
//         reason: dispatchReason.trim() || undefined
//       });
//       showStatus("success", "Serial Dispatched Successfully");
//       setSerialInfo(null);
//       setSerialInput("");
//       setDispatchReason("");
//       stopScanner();
//     } catch (error) {
//       showStatus("error", error?.response?.data || "Failed to dispatch serial");
//     } finally {
//       setDispatching(false);
//     }
//   }, [serialInfo, showStatus]);

//   const stopScanner = useCallback(async () => {
//     if (html5QrCodeRef.current) {
//       try {
//         await html5QrCodeRef.current.stop();
//       } catch (ignore) {
//         // ignore stop errors
//       }
//       try {
//         html5QrCodeRef.current.clear();
//       } catch {
//         // ignore clear errors
//       }
//       html5QrCodeRef.current = null;
//     }
//     setCameraActive(false);
//   }, []);

//   const startCameraScan = useCallback(
//     async () => {
//       setCameraError("");
//       if (cameraActive) {
//         await stopScanner();
//         return;
//       }

//       if (typeof window === "undefined" || !window.Html5Qrcode) {
//         setCameraError("Camera scanner library is not available in this browser.");
//         return;
//       }

//       try {
//         const cameras = await window.Html5Qrcode.getCameras();
//         if (!cameras || cameras.length === 0) {
//           throw new Error("No camera device detected.");
//         }

//         const preferred = cameras.find((cam) => /back|environment|rear/i.test(cam.label)) || cameras[0];
//         const html5QrCode = new window.Html5Qrcode("serial-scan-camera-region");
//         html5QrCodeRef.current = html5QrCode;
//         currentScanRef.current = "";

//         await html5QrCode.start(
//           preferred.id,
//           {
//             fps: 10,
//             qrbox: { width: 280, height: 200 },
//             videoConstraints: { facingMode: { ideal: "environment" } }
//           },
//           (decodedText) => {
//             if (decodedText && currentScanRef.current !== decodedText) {
//               currentScanRef.current = decodedText;
//               setSerialInput(decodedText);
//               resolveSerial(decodedText);
//               stopScanner();
//             }
//           },
//           (errorMessage) => {
//             if (errorMessage) {
//               setCameraError(typeof errorMessage === "string" ? errorMessage : errorMessage?.message || "Scanning error");
//             }
//           }
//         );
//         setCameraActive(true);
//       } catch (err) {
//         setCameraError(err?.message || "Unable to access the camera. Check permissions.");
//       }
//     },
//     [cameraActive, resolveSerial, stopScanner]
//   );

//   useEffect(() => {
//     return () => {
//       stopScanner();
//     };
//   }, [stopScanner]);

//   const handleKey = (event) => {
//     if (event.key === "Enter") {
//       event.preventDefault();
//       resolveSerial();
//     }
//   };

//   const resetForm = () => {
//     setSerialInput("");
//     setSerialInfo(null);
//     setStatus({ type: "", text: "" });
//     setDispatchReason("");
//     setCameraError("");
//     currentScanRef.current = "";
//     stopScanner();
//   };

//   return (
//     <div className="erp-app-wrapper min-vh-100 pb-5 pt-4">
//       <div className="container-fluid px-4" style={{ maxWidth: "900px" }}>
//         <div className="erp-panel shadow-sm p-4 mb-4">
//           <div className="d-flex justify-content-between align-items-center mb-3">
//             <div>
//               <h4 className="m-0">Serial Scan Dispatch</h4>
//               <p className="text-muted small mb-0">
//                 Scan a serial number, confirm the linked lot/warehouse, and complete the stock out in one flow.
//               </p>
//             </div>
//             <span className="badge bg-info text-dark">Serial Tracking</span>
//           </div>

//           {status.text && (
//             <div className={`alert ${status.type === "error" ? "alert-danger" : "alert-success"} small py-2`}>
//               {status.text}
//             </div>
//           )}

//           <div className="mb-3">
//             <label className="form-label fw-semibold">Serial Number</label>
//             <div className="input-group">
//               <input
//                 type="text"
//                 className="form-control erp-input font-monospace"
//                 value={serialInput}
//                 onChange={(e) => setSerialInput(e.target.value)}
//                 onKeyDown={handleKey}
//                 placeholder="Use barcode scanner or type manually..."
//                 autoFocus
//               />
//               <button type="button" className="btn btn-primary" onClick={() => resolveSerial()} disabled={loading}>
//                 {loading ? "Resolving..." : "Resolve"}
//               </button>
//             </div>
//             <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
//               <button type="button" className="btn btn-outline-info btn-sm" onClick={startCameraScan}>
//                 {cameraActive ? "Stop Camera Scan" : "Start Camera Scan"}
//               </button>
//               <span className="text-muted small">Use your device camera to scan serial barcodes.</span>
//             </div>
//             {cameraError && (
//               <div className="text-danger small mt-1">
//                 {cameraError}
//               </div>
//             )}
//           </div>
//           {cameraActive && (
//             <div id="serial-scan-camera-region" className="mb-3 rounded" style={{ minHeight: "280px", background: "#000" }} />
//           )}

//           {serialInfo && (
//             <div className="border rounded p-3 mb-3 bg-white">
//               <div className="d-flex justify-content-between align-items-center mb-2">
//                 <div>
//                   <div className="text-muted small">Serial</div>
//                   <div className="fw-bold font-monospace">{serialInfo.serialNumber}</div>
//                 </div>
//                 <span className={`badge ${serialInfo.status === "AVAILABLE" ? "bg-success" : "bg-warning"}`}>
//                   Status: {serialInfo.status}
//                 </span>
//               </div>
//               <div className="row g-2">
//                 <div className="col-md-6">
//                   <div className="text-muted small">Item</div>
//                   <div>{serialInfo.itemCode || `Item ${serialInfo.itemId}`}</div>
//                 </div>
//                 <div className="col-md-6">
//                   <div className="text-muted small">Warehouse</div>
//                   <div>{serialInfo.warehouseName || `WH-${serialInfo.warehouseId}`}</div>
//                 </div>
//                 <div className="col-md-6">
//                   <div className="text-muted small">Lot</div>
//                   <div>{serialInfo.lotNumber || "General"}</div>
//                 </div>
//                 {serialInfo.purchaseOrderNumber && (
//                   <div className="col-md-6">
//                     <div className="text-muted small">PO Reference</div>
//                     <div>{serialInfo.purchaseOrderNumber}</div>
//                   </div>
//                 )}
//               </div>
//               <div className="mt-3">
//                 <label className="form-label small mb-1">Dispatch Reason (optional)</label>
//                 <input
//                   type="text"
//                   className="form-control form-control-sm erp-input"
//                   value={dispatchReason}
//                   onChange={(e) => setDispatchReason(e.target.value)}
//                   placeholder="e.g., Client pickup, Quality release..."
//                 />
//               </div>
//             </div>
//           )}

//           <div className="d-flex gap-2">
//             <button
//               className="btn btn-success flex-grow-1"
//               onClick={dispatchSerial}
//               disabled={!serialInfo || dispatching || (serialInfo.status && serialInfo.status !== "AVAILABLE")}
//             >
//               {dispatching ? "Dispatching..." : "Dispatch Serial"}
//             </button>
//             <button className="btn btn-outline-secondary" onClick={resetForm} disabled={dispatching}>
//               Clear
//             </button>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         .erp-app-wrapper {
//           background: #eef2f5;
//         }
//         .erp-panel {
//           background: #fff;
//           border-radius: 8px;
//           border: 1px solid #e2e8f0;
//         }
//         .erp-input {
//           border-radius: 0;
//         }
//       `}</style>
//     </div>
//   );
// }


import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/apiClient";

export default function SerialScanPage() {
  const [serialInput, setSerialInput] = useState("");
  const [serialInfo, setSerialInfo] = useState(null);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [dispatchReason, setDispatchReason] = useState("");
  
  const html5QrCodeRef = useRef(null);
  const scannerId = "mobile-barcode-viewport";

  const showStatus = useCallback((type, text) => {
    setStatus({ type, text });
    if (text) {
      setTimeout(() => setStatus({ type: "", text: "" }), 4000);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Scanner shutdown cleanup:", e);
      }
      html5QrCodeRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // --- 1. Find Serial in Database ---
  const resolveSerial = useCallback(
    async (providedValue) => {
      const trimmed = (providedValue || serialInput || "").trim();
      if (!trimmed) return;

      setLoading(true);
      try {
        const response = await api.get(`/stock/serial/${encodeURIComponent(trimmed)}`);
        setSerialInfo(response.data);
        showStatus("success", "Serial Found: Ready to Dispatch");
        // Vibrate phone on success if supported
        if (navigator.vibrate) navigator.vibrate(100);
      } catch (error) {
        showStatus("error", "Serial not recognized in inventory.");
        setSerialInfo(null);
      } finally {
        setLoading(false);
      }
    },
    [serialInput, showStatus]
  );

  // --- 2. Start Mobile Camera (Optimized for Barcodes) ---
  const startCameraScan = useCallback(async () => {
    setCameraError("");

    if (cameraActive) {
      await stopScanner();
      return;
    }

    try {
      const html5QrCode = new window.Html5Qrcode(scannerId);
      html5QrCodeRef.current = html5QrCode;

      const config = { 
        fps: 20, // Higher FPS for faster barcode capture
        qrbox: { width: 300, height: 150 }, // Rectangular box is better for 1D Barcodes
        aspectRatio: 1.0 
      };

      await html5QrCode.start(
        { facingMode: "environment" }, // Forces rear camera
        config,
        (decodedText) => {
          setSerialInput(decodedText);
          resolveSerial(decodedText);
          stopScanner(); // Close camera immediately after a successful scan
        },
        (errorMessage) => { /* ignore constant scan attempts */ }
      );
      setCameraActive(true);
    } catch (err) {
      setCameraError("Camera initialization failed. Check browser permissions.");
      setCameraActive(false);
    }
  }, [cameraActive, stopScanner, resolveSerial]);

  // --- 3. Execute Stock Out ---
  const dispatchSerial = async () => {
    if (!serialInfo) return;
    setDispatching(true);
    try {
      await api.post("/stock/out", {
        itemId: serialInfo.itemId,
        warehouseId: serialInfo.warehouseId,
        quantity: 1,
        lotId: serialInfo.lotId,
        serialNumbers: [serialInfo.serialNumber],
        reason: dispatchReason.trim() || "Mobile Web Dispatch"
      });
      
      showStatus("success", "Item successfully removed from stock.");
      setSerialInfo(null);
      setSerialInput("");
      setDispatchReason("");
    } catch (error) {
      showStatus("error", "Failed to dispatch. Check network connection.");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="erp-mobile-container min-vh-100 bg-light p-3">
      
      {/* Status Toasts */}
      {status.text && (
        <div className={`fixed-top m-3 alert text-center shadow ${status.type === "error" ? "alert-danger" : "alert-success"}`} style={{ zIndex: 2000 }}>
          {status.text}
        </div>
      )}

      <div className="mx-auto" style={{ maxWidth: "500px" }}>
        <h5 className="fw-bold text-dark mb-3">Serial Dispatch Terminal</h5>

        {/* Action Card */}
        <div className="card border-0 shadow-sm rounded-4 mb-3">
          <div className="card-body p-4">
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control form-control-lg font-monospace border-end-0"
                placeholder="Serial Number..."
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
              />
              <button className="btn btn-primary px-4" onClick={() => resolveSerial()}>LOAD</button>
            </div>
            
            <button 
              className={`btn btn-lg w-100 fw-bold d-flex align-items-center justify-content-center gap-2 ${cameraActive ? 'btn-danger' : 'btn-dark'}`}
              onClick={startCameraScan}
            >
              {cameraActive ? "STOP CAMERA" : <><span>📷</span> SCAN BARCODE</>}
            </button>
          </div>
        </div>

        {/* Scanner Viewport */}
        <div 
          id={scannerId} 
          className={`rounded-4 overflow-hidden mb-3 border ${cameraActive ? 'd-block' : 'd-none'}`} 
          style={{ background: "#000", minHeight: "300px", position: 'relative' }}
        />

        {/* Result & Dispatch Form */}
        {serialInfo && (
          <div className="card border-0 shadow rounded-4 animate-slide-up">
            <div className="card-header bg-white border-0 pt-4 px-4">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle mb-2">
                {serialInfo.itemCode}
              </span>
              <h5 className="fw-bold">{serialInfo.itemName}</h5>
            </div>
            <div className="card-body px-4 pb-4">
              <div className="d-flex justify-content-between mb-4 p-2 bg-light rounded border">
                <div className="small"><strong>WH:</strong> {serialInfo.warehouseName}</div>
                <div className="small"><strong>Lot:</strong> {serialInfo.lotNumber || 'N/A'}</div>
              </div>

              <div className="mb-4">
                <label className="small fw-bold text-muted text-uppercase mb-1">Dispatch Reason / Ref</label>
                <input 
                  type="text" 
                  className="form-control border-0 bg-light"
                  placeholder="e.g. Sales Order #88..."
                  value={dispatchReason}
                  onChange={(e) => setDispatchReason(e.target.value)}
                />
              </div>

              <button 
                className="btn btn-success btn-lg w-100 fw-bold py-3 shadow"
                onClick={dispatchSerial}
                disabled={dispatching}
              >
                {dispatching ? "SYNCING..." : "EXECUTE DISPATCH"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .erp-mobile-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        #mobile-barcode-viewport video { object-fit: cover !important; }
        .btn { border-radius: 12px; }
        .form-control { border-radius: 12px; }
      `}</style>
    </div>
  );
}