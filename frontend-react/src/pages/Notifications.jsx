// ─────────────────────────────────────────────
// Notifications.jsx
// src/pages/Notifications.jsx
// ─────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell, faCircleCheck, faEnvelopeOpen, faEnvelope,
  faArrowRightToBracket, faArrowRightFromBracket,
  faMoneyBillTransfer, faUserPlus, faTrash, faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import {
  getNotifications, markAsRead, markAsUnread, getUnreadCount
} from "../utils/notificationUtils";

// Icon & color per type
const typeConfig = {
  payment: { icon: faMoneyBillTransfer, color: "#3b82f6", bg: "#eff6ff", label: "Payment"  },
  login:   { icon: faArrowRightToBracket,color: "#10b981", bg: "#f0fdf4", label: "Login"    },
  logout:  { icon: faArrowRightFromBracket,color:"#f59e0b", bg: "#fffbeb", label: "Logout"  },
  signup:  { icon: faUserPlus,           color: "#8b5cf6", bg: "#f5f3ff", label: "Welcome"  },
};

function Notifications() {
  const navigate   = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState("all"); // all | unread | read

  const load = () => setNotifs(getNotifications());

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user) { navigate("/login"); return; }
    load();
    window.addEventListener("notif-update", load);
    return () => window.removeEventListener("notif-update", load);
  }, [navigate]);

  const handleMarkRead   = (id) => { markAsRead(id);   load(); };
  const handleMarkUnread = (id) => { markAsUnread(id); load(); };

  const handleMarkAllRead = () => {
    notifs.forEach(n => { if (!n.read) markAsRead(n.id); });
    load();
  };

  const filtered = notifs.filter(n =>
    filter === "all"    ? true :
    filter === "unread" ? !n.read :
    n.read
  );

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 16px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: "12px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FontAwesomeIcon icon={faBell} style={{ color: "#fff", fontSize: "18px" }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#1e293b" }}>Notifications</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{ background: "#eff6ff", border: "none", color: "#3b82f6", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontWeight: 600, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <FontAwesomeIcon icon={faCheckDouble} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {["all", "unread", "read"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: "8px 18px", borderRadius: "999px", border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: "13px", textTransform: "capitalize",
                background: filter === f ? "#3b82f6" : "#e2e8f0",
                color:      filter === f ? "#fff"    : "#64748b",
                transition: "all 0.2s"
              }}>
              {f}
              {f === "unread" && unreadCount > 0 && (
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: "999px", padding: "1px 7px", fontSize: "11px", marginLeft: "6px" }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <FontAwesomeIcon icon={faBell} style={{ fontSize: "40px", marginBottom: "12px", display: "block" }} />
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>No notifications here</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map(n => {
              const cfg = typeConfig[n.type] || typeConfig.login;
              return (
                <div key={n.id} style={{
                  background: n.read ? "#fff" : cfg.bg,
                  border: `1.5px solid ${n.read ? "#e2e8f0" : cfg.color + "33"}`,
                  borderRadius: "14px", padding: "18px 20px",
                  display: "flex", alignItems: "flex-start", gap: "16px",
                  boxShadow: n.read ? "none" : "0 2px 12px rgba(0,0,0,0.06)",
                  transition: "all 0.2s",
                }}>

                  {/* Icon */}
                  <div style={{ background: cfg.color + "22", borderRadius: "10px", width: "42px", height: "42px", minWidth: "42px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FontAwesomeIcon icon={cfg.icon} style={{ color: cfg.color, fontSize: "16px" }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}>{n.title}</span>
                      {!n.read && (
                        <span style={{ background: cfg.color, borderRadius: "999px", width: "8px", height: "8px", display: "inline-block" }} />
                      )}
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>{n.message}</p>
                    {n.subMessage && (
                      <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#94a3b8" }}>{n.subMessage}</p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>{n.time}</span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {!n.read ? (
                          <button onClick={() => handleMarkRead(n.id)}
                            style={{ background: cfg.color, color: "#fff", border: "none", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                            <FontAwesomeIcon icon={faCircleCheck} /> Mark as Read
                          </button>
                        ) : (
                          <button onClick={() => handleMarkUnread(n.id)}
                            style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                            <FontAwesomeIcon icon={faEnvelope} /> Mark as Unread
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;