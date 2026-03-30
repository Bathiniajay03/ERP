// import React, { useCallback, useEffect, useRef, useState } from "react";
// import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
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

//   const scannerRef = useRef(null);
//   const currentScanRef = useRef("");
//   const videoElementId = "serial-scan-camera-region";

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

//   const stopScanner = useCallback(async () => {
//     if (scannerRef.current) {
//       try {
//         scannerRef.current.reset();
//       } catch (ignore) {
//         console.warn("Scanner reset failed", ignore);
//       }
//       scannerRef.current = null;
//     }
//     currentScanRef.current = "";
//     setCameraActive(false);
//   }, []);

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
//   }, [dispatchReason, serialInfo, showStatus, stopScanner]);

//   const handleScanResult = useCallback(
//     (result, error) => {
//       if (result && result.getText) {
//         const decoded = result.getText();
//         if (decoded && currentScanRef.current !== decoded) {
//           currentScanRef.current = decoded;
//           setSerialInput(decoded);
//           resolveSerial(decoded);
//           stopScanner();
//         }
//       } else if (error && !(error instanceof NotFoundException)) {
//         setCameraError(error?.message || "Scanning error");
//       }
//     },
//     [resolveSerial, stopScanner]
//   );

//   const startCameraScan = useCallback(async () => {
//     setCameraError("");
//     if (cameraActive) {
//       await stopScanner();
//       return;
//     }

//     if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       setCameraError("Camera scanner library is not available in this browser.");
//       return;
//     }

//     try {
//       const codeReader = new BrowserMultiFormatReader();
//       scannerRef.current = codeReader;
//       currentScanRef.current = "";
//       setCameraActive(true);

//       codeReader.decodeFromVideoDevice(undefined, videoElementId, handleScanResult).catch((decodeError) => {
//         setCameraError(decodeError?.message || "Unable to access the camera. Check permissions.");
//         stopScanner();
//       });
//     } catch (error) {
//       setCameraError(error?.message || "Unable to access the camera. Check permissions.");
//       await stopScanner();
//     }
//   }, [cameraActive, handleScanResult, stopScanner]);

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

//   const resetForm = useCallback(() => {
//     setSerialInput("");
//     setSerialInfo(null);
//     setStatus({ type: "", text: "" });
//     setDispatchReason("");
//     setCameraError("");
//     currentScanRef.current = "";
//     stopScanner();
//   }, [stopScanner]);

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
//             <div
//               className="mb-3 rounded overflow-hidden"
//               style={{ minHeight: "280px", background: "#000" }}
//             >
//               <video
//                 id={videoElementId}
//                 className="w-100 h-100"
//                 playsInline
//                 muted
//                 style={{ width: "100%", height: "100%", objectFit: "cover" }}
//               />
//             </div>
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
//               disabled={!serialInfo || dispatching || (serialInfo?.status && serialInfo.status !== "AVAILABLE")}
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
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
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

  const scannerRef = useRef(null);
  const currentScanRef = useRef("");
  const videoElementId = "serial-scan-camera-region";

  const showStatus = useCallback((type, text) => {
    setStatus({ type, text });
    if (text) {
      setTimeout(() => setStatus({ type: "", text: "" }), 3500);
    }
  }, []);

  const resolveSerial = useCallback(
    async (value) => {
      const trimmed = ((value ?? serialInput) || "").trim();
      if (!trimmed) {
        showStatus("error", "Scan or type a serial number first.");
        return;
      }

      setSerialInput(trimmed);
      setLoading(true);
      try {
        const response = await api.get(`/stock/serial/${encodeURIComponent(trimmed)}`);
        setSerialInfo(response.data);
        if (response.data.status !== "AVAILABLE") {
          showStatus("error", `Serial ${response.data.serialNumber} is not available (${response.data.status})`);
        } else {
          showStatus("success", `Serial ${response.data.serialNumber} ready for dispatch`);
        }
      } catch (error) {
        setSerialInfo(null);
        showStatus("error", error?.response?.data || "Unable to resolve serial");
      } finally {
        setLoading(false);
      }
    },
    [serialInput, showStatus]
  );

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.reset();
      } catch (ignore) {
        console.warn("Scanner reset failed", ignore);
      }
      scannerRef.current = null;
    }
    currentScanRef.current = "";
    setCameraActive(false);
  }, []);

  const dispatchSerial = useCallback(async () => {
    if (!serialInfo) return;
    if (serialInfo.status && serialInfo.status !== "AVAILABLE") {
      showStatus("error", "Serial is already processed and cannot be dispatched.");
      return;
    }
    if (!serialInfo.warehouseId || !serialInfo.lotId) {
      showStatus("error", "Serial is not tied to a warehouse or lot.");
      return;
    }
    setDispatching(true);
    try {
      await api.post("/stock/out", {
        itemId: serialInfo.itemId,
        warehouseId: serialInfo.warehouseId,
        quantity: 1,
        lotNumber: serialInfo.lotNumber,
        serialNumbers: [serialInfo.serialNumber],
        reason: dispatchReason.trim() || undefined
      });
      showStatus("success", "Serial Dispatched Successfully");
      setSerialInfo(null);
      setSerialInput("");
      setDispatchReason("");
      stopScanner();
    } catch (error) {
      showStatus("error", error?.response?.data || "Failed to dispatch serial");
    } finally {
      setDispatching(false);
    }
  }, [dispatchReason, serialInfo, showStatus, stopScanner]);

  const handleScanResult = useCallback(
    (result, error) => {
      if (result && result.getText) {
        const decoded = result.getText();
        if (decoded && currentScanRef.current !== decoded) {
          currentScanRef.current = decoded;
          setSerialInput(decoded);
          resolveSerial(decoded);
          stopScanner();
        }
      } else if (error && !(error instanceof NotFoundException)) {
        setCameraError(error?.message || "Scanning error");
      }
    },
    [resolveSerial, stopScanner]
  );

  const startCameraScan = useCallback(async () => {
    setCameraError("");
    if (cameraActive) {
      await stopScanner();
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera scanner library is not available in this browser.");
      return;
    }

    try {
      const codeReader = new BrowserMultiFormatReader();
      scannerRef.current = codeReader;
      currentScanRef.current = "";
      setCameraActive(true);

      codeReader.decodeFromVideoDevice(undefined, videoElementId, handleScanResult).catch((decodeError) => {
        setCameraError(decodeError?.message || "Unable to access the camera. Check permissions.");
        stopScanner();
      });
    } catch (error) {
      setCameraError(error?.message || "Unable to access the camera. Check permissions.");
      await stopScanner();
    }
  }, [cameraActive, handleScanResult, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleKey = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      resolveSerial();
    }
  };

  const resetForm = useCallback(() => {
    setSerialInput("");
    setSerialInfo(null);
    setStatus({ type: "", text: "" });
    setDispatchReason("");
    setCameraError("");
    currentScanRef.current = "";
    stopScanner();
  }, [stopScanner]);

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-4">
      <div className="container-fluid px-4" style={{ maxWidth: "900px" }}>
        <div className="erp-panel shadow-sm p-4 p-md-5 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
            <div>
              <h4 className="m-0 fw-bold text-dark">Serial Scan Dispatch</h4>
              <p className="text-muted small mb-0 mt-1">
                Scan a serial number, confirm the linked lot/warehouse, and complete the stock out in one flow.
              </p>
            </div>
            <span className="badge erp-badge bg-info-subtle text-info border border-info-subtle">
              <i className="bi bi-upc-scan me-1"></i> Tracking
            </span>
          </div>

          {status.text && (
            <div className={`alert erp-alert ${status.type === "error" ? "alert-danger" : "alert-success"} small py-3 d-flex align-items-center`}>
              {status.type === "error" ? "⚠️" : "✅"}&nbsp;&nbsp;{status.text}
            </div>
          )}

          <div className="mb-4">
            <label className="form-label fw-semibold text-secondary small text-uppercase tracking-wide">Serial Number</label>
            <div className="input-group erp-input-group shadow-sm rounded">
              <input
                type="text"
                className="form-control erp-input font-monospace border-end-0"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Use barcode scanner or type manually..."
                autoFocus
              />
              <button 
                type="button" 
                className="btn btn-primary px-4 fw-semibold erp-btn-resolve" 
                onClick={() => resolveSerial()} 
                disabled={loading}
              >
                {loading ? "Resolving..." : "Resolve"}
              </button>
            </div>
            
            <div className="d-flex flex-wrap gap-3 align-items-center mt-3">
              <button 
                type="button" 
                className={`btn btn-sm fw-semibold d-flex align-items-center gap-2 ${cameraActive ? 'btn-danger' : 'btn-outline-primary erp-btn-outline'}`} 
                onClick={startCameraScan}
              >
                {cameraActive ? (
                  <><span>⏹</span> Stop Camera Scan</>
                ) : (
                  <><span>📷</span> Start Camera Scan</>
                )}
              </button>
              <span className="text-muted small">Use your device camera to scan serial barcodes.</span>
            </div>
            {cameraError && (
              <div className="text-danger small mt-2 fw-medium bg-danger-subtle p-2 rounded">
                {cameraError}
              </div>
            )}
          </div>

          {cameraActive && (
            <div className="scanner-container mb-4 shadow-sm">
              <video
                id={videoElementId}
                className="w-100 h-100 scanner-video"
                playsInline
                muted
              />
              <div className="scanner-overlay">
                <div className="scanner-line"></div>
                <div className="scanner-target"></div>
              </div>
            </div>
          )}

          {serialInfo && (
            <div className="serial-info-card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3">
                <div>
                  <div className="text-uppercase small fw-bold text-muted mb-1">Serial Discovered</div>
                  <div className="h4 mb-0 fw-bold font-monospace text-primary">{serialInfo.serialNumber}</div>
                </div>
                <span className={`badge erp-status-badge ${serialInfo.status === "AVAILABLE" ? "bg-success-subtle text-success border-success-subtle" : "bg-warning-subtle text-warning border-warning-subtle"} border`}>
                  {serialInfo.status}
                </span>
              </div>
              <div className="row g-4 mt-1">
                <div className="col-sm-6">
                  <div className="text-muted small text-uppercase fw-semibold mb-1">Item</div>
                  <div className="fw-medium text-dark">{serialInfo.itemCode || `Item ${serialInfo.itemId}`}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small text-uppercase fw-semibold mb-1">Warehouse</div>
                  <div className="fw-medium text-dark">{serialInfo.warehouseName || `WH-${serialInfo.warehouseId}`}</div>
                </div>
                <div className="col-sm-6">
                  <div className="text-muted small text-uppercase fw-semibold mb-1">Lot Number</div>
                  <div className="fw-medium text-dark">{serialInfo.lotNumber || "General"}</div>
                </div>
                {serialInfo.purchaseOrderNumber && (
                  <div className="col-sm-6">
                    <div className="text-muted small text-uppercase fw-semibold mb-1">PO Reference</div>
                    <div className="fw-medium text-dark">{serialInfo.purchaseOrderNumber}</div>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-top">
                <label className="form-label small fw-semibold text-secondary text-uppercase tracking-wide mb-2">Dispatch Reason <span className="text-muted fw-normal text-lowercase">(optional)</span></label>
                <input
                  type="text"
                  className="form-control erp-input"
                  value={dispatchReason}
                  onChange={(e) => setDispatchReason(e.target.value)}
                  placeholder="e.g., Client pickup, Quality release..."
                />
              </div>
            </div>
          )}

          <div className="d-flex gap-3 mt-4 pt-2">
            <button
              className="btn btn-success flex-grow-1 py-2 fw-bold shadow-sm erp-btn-dispatch"
              onClick={dispatchSerial}
              disabled={!serialInfo || dispatching || (serialInfo?.status && serialInfo.status !== "AVAILABLE")}
            >
              {dispatching ? "Dispatching in progress..." : "Confirm & Dispatch Serial"}
            </button>
            <button className="btn btn-light border px-4 fw-semibold text-secondary hover-bg-gray" onClick={resetForm} disabled={dispatching}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* Typography & Backgrounds */
        .erp-app-wrapper {
          background: #f4f7fb;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #2b3543;
        }

        /* Main Panel Styling */
        .erp-panel {
          background: #ffffff;
          border-radius: 12px;
          border: none;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02) !important;
          position: relative;
        }
        .erp-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #0d6efd, #0dcaf0);
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        /* Form Inputs */
        .erp-input-group {
          border-radius: 8px;
          overflow: hidden;
        }
        .erp-input {
          border-radius: 8px !important;
          border: 1px solid #ced4da;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          box-shadow: none !important;
        }
        .erp-input:focus {
          border-color: #86b7fe;
          background-color: #fff;
          outline: 0;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15) !important;
          z-index: 2;
        }
        
        /* Buttons */
        .btn {
          border-radius: 8px;
          transition: all 0.2s ease-in-out;
        }
        .erp-btn-resolve {
          background-color: #0d6efd;
          border: none;
        }
        .erp-btn-resolve:hover:not(:disabled) {
          background-color: #0b5ed7;
          transform: translateY(-1px);
        }
        .erp-btn-outline {
          border: 1px solid #cfe2ff;
          color: #0d6efd;
          background-color: #f8faff;
        }
        .erp-btn-outline:hover:not(:disabled) {
          background-color: #e7f1ff;
          border-color: #cfe2ff;
        }
        .erp-btn-dispatch {
          background-color: #198754;
          border: none;
          font-size: 1.05rem;
          letter-spacing: 0.3px;
        }
        .erp-btn-dispatch:hover:not(:disabled) {
          background-color: #157347;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(25, 135, 84, 0.2) !important;
        }
        .hover-bg-gray:hover {
          background-color: #e9ecef !important;
        }

        /* Info Card */
        .serial-info-card {
          background-color: #fafbfc;
          border: 1px solid #e9ecef;
          border-radius: 10px;
          transition: border-color 0.2s ease;
        }
        .serial-info-card:hover {
          border-color: #dee2e6;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        /* Badges */
        .erp-badge {
          padding: 0.5em 0.85em;
          font-weight: 600;
          border-radius: 6px;
          font-size: 0.75rem;
        }
        .erp-status-badge {
          padding: 0.6em 1em;
          font-size: 0.8rem;
          border-radius: 8px;
        }

        /* Scanner Component */
        .scanner-container {
          position: relative;
          min-height: 280px;
          background: #111;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid #343a40;
        }
        .scanner-video {
          object-fit: cover;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .scanner-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
        }
        .scanner-target {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70%;
          height: 50%;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 12px;
          box-shadow: 0 0 0 4000px rgba(0, 0, 0, 0.4); /* Darkens everything outside */
        }
        .scanner-line {
          position: absolute;
          left: 15%;
          right: 15%;
          height: 2px;
          background: #0dcaf0;
          box-shadow: 0 0 12px 2px rgba(13, 202, 240, 0.7);
          animation: scan-animation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite alternate;
          z-index: 11;
        }
        @keyframes scan-animation {
          0% { top: 25%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 75%; opacity: 0; }
        }

        /* Alerts */
        .erp-alert {
          border-radius: 8px;
          border: none;
          font-weight: 500;
        }
        .tracking-wide {
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}