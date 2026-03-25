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
        <div className="erp-panel shadow-sm p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="m-0">Serial Scan Dispatch</h4>
              <p className="text-muted small mb-0">
                Scan a serial number, confirm the linked lot/warehouse, and complete the stock out in one flow.
              </p>
            </div>
            <span className="badge bg-info text-dark">Serial Tracking</span>
          </div>

          {status.text && (
            <div className={`alert ${status.type === "error" ? "alert-danger" : "alert-success"} small py-2`}>
              {status.text}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">Serial Number</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control erp-input font-monospace"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Use barcode scanner or type manually..."
                autoFocus
              />
              <button type="button" className="btn btn-primary" onClick={() => resolveSerial()} disabled={loading}>
                {loading ? "Resolving..." : "Resolve"}
              </button>
            </div>
            <div className="d-flex flex-wrap gap-2 align-items-center mt-2">
              <button type="button" className="btn btn-outline-info btn-sm" onClick={startCameraScan}>
                {cameraActive ? "Stop Camera Scan" : "Start Camera Scan"}
              </button>
              <span className="text-muted small">Use your device camera to scan serial barcodes.</span>
            </div>
            {cameraError && (
              <div className="text-danger small mt-1">
                {cameraError}
              </div>
            )}
          </div>
          {cameraActive && (
            <div
              className="mb-3 rounded overflow-hidden"
              style={{ minHeight: "280px", background: "#000" }}
            >
              <video
                id={videoElementId}
                className="w-100 h-100"
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {serialInfo && (
            <div className="border rounded p-3 mb-3 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <div className="text-muted small">Serial</div>
                  <div className="fw-bold font-monospace">{serialInfo.serialNumber}</div>
                </div>
                <span className={`badge ${serialInfo.status === "AVAILABLE" ? "bg-success" : "bg-warning"}`}>
                  Status: {serialInfo.status}
                </span>
              </div>
              <div className="row g-2">
                <div className="col-md-6">
                  <div className="text-muted small">Item</div>
                  <div>{serialInfo.itemCode || `Item ${serialInfo.itemId}`}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted small">Warehouse</div>
                  <div>{serialInfo.warehouseName || `WH-${serialInfo.warehouseId}`}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-muted small">Lot</div>
                  <div>{serialInfo.lotNumber || "General"}</div>
                </div>
                {serialInfo.purchaseOrderNumber && (
                  <div className="col-md-6">
                    <div className="text-muted small">PO Reference</div>
                    <div>{serialInfo.purchaseOrderNumber}</div>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <label className="form-label small mb-1">Dispatch Reason (optional)</label>
                <input
                  type="text"
                  className="form-control form-control-sm erp-input"
                  value={dispatchReason}
                  onChange={(e) => setDispatchReason(e.target.value)}
                  placeholder="e.g., Client pickup, Quality release..."
                />
              </div>
            </div>
          )}

          <div className="d-flex gap-2">
            <button
              className="btn btn-success flex-grow-1"
              onClick={dispatchSerial}
              disabled={!serialInfo || dispatching || (serialInfo?.status && serialInfo.status !== "AVAILABLE")}
            >
              {dispatching ? "Dispatching..." : "Dispatch Serial"}
            </button>
            <button className="btn btn-outline-secondary" onClick={resetForm} disabled={dispatching}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .erp-app-wrapper {
          background: #eef2f5;
        }
        .erp-panel {
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .erp-input {
          border-radius: 0;
        }
      `}</style>
    </div>
  );
}
