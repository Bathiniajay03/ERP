import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { smartErpApi } from "../services/smartErpApi";

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  return `${(bytes / Math.pow(k, index)).toFixed(1)} ${units[index]}`;
};

export default function DocumentAttachments({ entityType, entityId, entityLabel }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const parsedId = Number(entityId);
  const ready = Number.isFinite(parsedId) && parsedId > 0;

  const fetchDocuments = useCallback(async () => {
    if (!ready) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await smartErpApi.listDocuments(entityType, parsedId);
      setDocuments(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load documents.");
      setSeverity("warning");
    } finally {
      setLoading(false);
    }
  }, [entityType, parsedId, ready]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async () => {
    if (!ready || !file) return;
    setUploading(true);
    setMessage("");
    try {
      await smartErpApi.uploadDocument(entityType, parsedId, file);
      setMessage("Document uploaded.");
      setSeverity("success");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchDocuments();
    } catch (err) {
      setMessage(err?.response?.data || "Upload failed.");
      setSeverity("danger");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!ready) return;
    try {
      await smartErpApi.deleteDocument(docId);
      setMessage("Document removed.");
      setSeverity("info");
      await fetchDocuments();
    } catch (err) {
      setMessage(err?.response?.data || "Failed to remove document.");
      setSeverity("danger");
    }
  };

  const renderedDocuments = useMemo(() => documents || [], [documents]);

  return (
    <div className="card border-0 shadow-sm rounded-4 mt-4">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h6 className="fw-bold mb-1">Documents</h6>
            <p className="text-muted mb-0">
              {entityLabel || "Select a record"} · {entityType || "Entity"}
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.xlsx,.xls"
              className="form-control form-control-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={!ready || uploading}
            />
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleUpload}
              disabled={!ready || uploading || !file}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
        {!ready && (
          <div className="alert alert-info py-2 mt-3 mb-0">
            Select a record to manage attachments. PDF, Excel, and images are supported.
          </div>
        )}
        {message && ready && (
          <div className={`alert alert-${severity} mt-3 mb-2 py-2`}>
            {message}
          </div>
        )}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          ready && (
            <div className="table-responsive mt-3">
              {renderedDocuments.length === 0 ? (
                <p className="text-muted mb-0">No attachments yet.</p>
              ) : (
                <table className="table table-striped table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Filename</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Uploaded</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderedDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td>{doc.fileName}</td>
                        <td>{doc.mimeType}</td>
                        <td>{formatBytes(doc.size)}</td>
                        <td>{new Date(doc.uploadedAt).toLocaleString()}</td>
                        <td>
                          <a
                            className="btn btn-sm btn-outline-primary me-1"
                            href={smartErpApi.documentDownloadUrl(doc.id)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download
                          </a>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(doc.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
