import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle,
  faBell,
  faMoneyBillTransfer,
  faRightToBracket,
  faRightFromBracket,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/logo.png";
import { getNotifications, getUnreadCount, markAsRead } from "../utils/notificationUtils";

const typeColors = {
  payment: "#3b82f6",
  login:   "#10b981",
  logout:  "#f59e0b",
  signup:  "#8b5cf6",
};

// Map each notification type to its FontAwesome icon
const typeIcons = {
  payment: faMoneyBillTransfer,  // money with transfer arrows
  login:   faRightToBracket,     // arrow pointing INTO bracket (login)
  logout:  faRightFromBracket,   // arrow pointing OUT of bracket (logout)
  signup:  faUserPlus,           // user with plus (new user)
};

function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [unread, setUnread]     = useState(0);
  const [notifs, setNotifs]     = useState([]);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const refresh = () => {
    setUnread(getUnreadCount());
    setNotifs(getNotifications().slice(0, 5)); // show latest 5 in dropdown
  };

  useEffect(() => {
    refresh();
    window.addEventListener("notif-update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("notif-update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [isLoggedIn]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = () => {
    setDropOpen(prev => !prev);
    refresh();
  };

  const handleNotifClick = (n) => {
    markAsRead(n.id);
    refresh();
    setDropOpen(false);
    navigate("/notifications");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        <img src={logo} alt="SecurePay Logo" style={{ height: "100px", width: "280px", objectFit: "contain" }} />
      </Link>

      <div className="nav-links">
        {!isLoggedIn ? (
          <>
            <Link to="/login"  className={`nav-btn nav-btn-ghost ${location.pathname === "/login"  ? "active" : ""}`}>Login</Link>
            <Link to="/signup" className="nav-btn nav-btn-solid">Get Started</Link>
          </>
        ) : (
          <>
            <Link to="/"          className={`nav-link ${location.pathname === "/"          ? "nav-link-active" : ""}`}>Home</Link>
            <Link to="/pay"       className={`nav-link ${location.pathname === "/pay"       ? "nav-link-active" : ""}`}>Pay & Detect</Link>
            <Link to="/dashboard" className={`nav-link ${location.pathname === "/dashboard" ? "nav-link-active" : ""}`}>Dashboard</Link>
            <Link to="/complaint" className={`nav-link ${location.pathname === "/complaint" ? "nav-link-active" : ""}`}>File Fraud</Link>

            {/* ── Bell Icon with Dropdown ── */}
            <div ref={dropRef} style={{ position: "relative", display: "inline-block" }}>
              <button onClick={handleBellClick}
                style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: "6px 8px", borderRadius: "8px", color: "#475569", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faBell} />
                {unread > 0 && (
                  <span style={{
                    position: "absolute", top: "0px", right: "0px",
                    background: "#ef4444", color: "#fff",
                    borderRadius: "999px", fontSize: "10px", fontWeight: 700,
                    minWidth: "18px", height: "18px", display: "flex",
                    alignItems: "center", justifyContent: "center", padding: "0 4px",
                    lineHeight: 1, border: "2px solid #fff"
                  }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {/* ── Dropdown ── */}
              {dropOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  width: "340px", background: "#fff", borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid #e2e8f0",
                  zIndex: 9999, overflow: "hidden"
                }}>
                  {/* Dropdown Header */}
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>
                      <FontAwesomeIcon icon={faBell} style={{ marginRight: "8px", color: "#3b82f6" }} />
                      Notifications
                    </span>
                    {unread > 0 && (
                      <span style={{ background: "#ef4444", color: "#fff", borderRadius: "999px", fontSize: "11px", padding: "2px 8px", fontWeight: 700 }}>
                        {unread} new
                      </span>
                    )}
                  </div>

                  {/* Notification Items */}
                  {notifs.length === 0 ? (
                    <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                      <FontAwesomeIcon icon={faBell} style={{ fontSize: "28px", marginBottom: "8px", display: "block" }} />
                      <p style={{ margin: 0, fontSize: "13px" }}>No notifications yet</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                      {notifs.map(n => (
                        <div key={n.id} onClick={() => handleNotifClick(n)}
                          style={{
                            padding: "12px 18px", cursor: "pointer",
                            borderBottom: "1px solid #f8fafc",
                            background: n.read ? "#fff" : "#f8faff",
                            display: "flex", gap: "12px", alignItems: "flex-start",
                            transition: "background 0.15s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                          onMouseLeave={e => e.currentTarget.style.background = n.read ? "#fff" : "#f8faff"}>

                          {/* ── Icon Box (replaces emojis) ── */}
                          <div style={{
                            background: (typeColors[n.type] || "#3b82f6") + "22",
                            borderRadius: "8px", width: "36px", height: "36px", minWidth: "36px",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px"
                          }}>
                            <FontAwesomeIcon
                              icon={typeIcons[n.type] || faBell}
                              style={{ color: typeColors[n.type] || "#3b82f6" }}
                            />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {n.title}
                              {!n.read && <span style={{ background: "#ef4444", borderRadius: "999px", width: "7px", height: "7px", display: "inline-block", marginLeft: "6px", verticalAlign: "middle" }} />}
                            </p>
                            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.message}</p>
                            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* View All */}
                  <div style={{ padding: "12px 18px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                    <Link to="/notifications" onClick={() => setDropOpen(false)}
                      style={{ color: "#3b82f6", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" className="nav-profile-btn">
              <FontAwesomeIcon icon={faUserCircle} />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;