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

  useEffect(() => { fetchNotifications(); }, []);

  return (
    <div className="container-fluid py-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">Inbox</h2>
          <p className="text-muted mb-0">Recent system notifications</p>
        </div>
        <button className="btn btn-sm btn-outline-secondary" onClick={markAll}>Mark all read</button>
      </div>

      {message && <div className={`alert alert-danger py-2`}>{message}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <ul className="list-group">
            {notes.map((n) => {
              const localTime = formatLocalNotificationDate(n.createdAt);
              const utcTime = formatUtcNotificationDate(n.createdAt);
              return (
                <li key={n.id} className={`list-group-item d-flex justify-content-between align-items-start ${n.isRead ? '' : 'fw-bold'}`}>
                  <div>
                    <div>{n.title}</div>
                    <small className="text-muted" title={utcTime ? `UTC: ${utcTime}` : undefined}>
                      {localTime || "Unknown date"}
                    </small>
                  </div>
                  {!n.isRead && (
                    <button
                      className="btn btn-sm btn-link"
                      onClick={async () => {
                        await api.post("/smart-erp/notifications/mark-read", { notificationId: n.id });
                        fetchNotifications();
                      }}
                    >Mark read</button>
                  )}
                </li>
              );
            })}
            {notes.length === 0 && (
              <li className="list-group-item text-center text-muted">No notifications</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
