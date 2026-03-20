import React, { useEffect, useState } from "react";
import api from "../services/apiClient";

const resolvedOptions = Intl.DateTimeFormat().resolvedOptions();
const defaultLocale = resolvedOptions.locale || "en-IN";
const userTimeZone = resolvedOptions.timeZone || "UTC";

const timeZonePattern = /([zZ]|[+-]\d{2}:?\d{2})$/;

const normalizeTimestamp = (value) => {
  if (!value) return value;
  if (timeZonePattern.test(value)) return value;
  if (value.endsWith("Z")) return value;
  return `${value}Z`;
};

const formatNotificationDate = (
  value,
  { locale = defaultLocale, timeZone = userTimeZone } = {}
) => {
  if (!value) return "";
  const normalized = normalizeTimestamp(value);
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h12",
    timeZone
  });
};

const formatLocalNotificationDate = (value) => formatNotificationDate(value);
const formatUtcNotificationDate = (value) =>
  formatNotificationDate(value, { locale: "en-GB", timeZone: "UTC" });

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/smart-erp/notifications");
      setNotes(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAll = async () => {
    try {
      await api.post("/smart-erp/notifications/mark-all-read");
      fetchNotifications();
    } catch (err) {
      setMessage(err?.response?.data || "Could not mark notifications");
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.post("/smart-erp/notifications/mark-read", { notificationId: id });
      fetchNotifications();
    } catch (err) {
      setMessage(err?.response?.data || "Failed to mark as read");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      // Standard REST delete. Adjust if your backend uses a POST for soft deletes.
      await api.delete(`/smart-erp/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      setMessage(err?.response?.data || "Failed to delete notification");
    }
  };

  useEffect(() => { 
    fetchNotifications(); 
  }, []);

  const unreadCount = notes.filter(n => !n.isRead).length;

  return (
    <div className="erp-app-wrapper min-vh-100 pb-5 pt-3">
      <div className="container-fluid px-4" style={{ maxWidth: '1000px' }}>
        
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-end border-bottom mb-4 pb-3">
          <div>
            <h4 className="fw-bold m-0 text-dark" style={{ letterSpacing: '-0.5px' }}>System Inbox</h4>
            <span className="erp-text-muted small text-uppercase">Alerts & Notifications</span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-light border erp-btn d-flex align-items-center gap-2 text-muted fw-bold" onClick={fetchNotifications} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm" /> : '↻'}
              Refresh
            </button>
            <button className="btn btn-outline-primary bg-white erp-btn fw-bold" onClick={markAll} disabled={notes.length === 0 || unreadCount === 0}>
              ✓ Mark all as read
            </button>
          </div>
        </div>

        {message && (
          <div className={`alert erp-alert d-flex justify-content-between align-items-center py-2 mb-4`} style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
            <span className="fw-semibold">{message}</span>
            <button className="btn-close btn-sm" onClick={() => setMessage("")}></button>
          </div>
        )}

        <div className="erp-panel shadow-sm">
          <div className="erp-panel-header d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold">Recent Activity</span>
            {unreadCount > 0 && <span className="badge bg-primary rounded-pill">{unreadCount} Unread</span>}
          </div>

          <div className="bg-white">
            {loading && notes.length === 0 ? (
              <div className="d-flex flex-column align-items-center justify-content-center py-5">
                <div className="spinner-border text-primary mb-2" style={{ width: '2rem', height: '2rem' }}></div>
                <span className="small text-muted text-uppercase fw-bold">Syncing Inbox...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <div style={{ fontSize: '2.5rem', opacity: 0.5 }}>📭</div>
                <div className="mt-2 fw-bold">Inbox is empty</div>
                <div className="small">You have no new notifications.</div>
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {notes.map((n) => {
                  const localTime = formatLocalNotificationDate(n.createdAt);
                  const utcTime = formatUtcNotificationDate(n.createdAt);
                  const isUnread = !n.isRead;

                  return (
                    <li 
                      key={n.id} 
                      className={`list-group-item d-flex justify-content-between align-items-center py-3 border-bottom erp-notification-item ${isUnread ? 'unread' : ''}`}
                    >
                      <div className="d-flex flex-column pe-3">
                        <span className={`fs-6 ${isUnread ? 'fw-bold text-dark' : 'text-muted'}`}>
                          {n.title}
                        </span>
                        <small className="text-muted mt-1" title={utcTime ? `UTC: ${utcTime}` : undefined} style={{ fontSize: '0.75rem' }}>
                          <span className="text-primary me-1">🕒</span>{localTime || "Unknown date"}
                        </small>
                      </div>
                      
                      <div className="d-flex gap-2 align-items-center erp-notification-actions">
                        {isUnread && (
                          <button
                            className="btn btn-sm btn-light border erp-btn text-success fw-bold"
                            onClick={() => handleMarkRead(n.id)}
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-light border erp-btn text-danger fw-bold"
                          onClick={() => handleDelete(n.id)}
                          title="Delete notification"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
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

        /* Buttons */
        .erp-btn {
          border-radius: 3px;
          font-weight: 600;
          letter-spacing: 0.2px;
          font-size: 0.8rem;
          padding: 6px 14px;
        }

        /* Notification List Styling */
        .erp-notification-item {
          transition: background-color 0.2s ease;
          border-left: 4px solid transparent;
        }
        .erp-notification-item:hover {
          background-color: #f8fafc;
        }
        .erp-notification-item.unread {
          background-color: #f0f4f8;
          border-left-color: var(--erp-primary);
        }
        
        .erp-notification-actions button {
          opacity: 0.6;
          transition: opacity 0.2s ease, background-color 0.2s ease;
          padding: 4px 10px;
        }
        .erp-notification-item:hover .erp-notification-actions button {
          opacity: 1;
        }
        .erp-notification-actions button:hover {
          background-color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}