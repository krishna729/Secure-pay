// ─────────────────────────────────────────────
// notificationUtils.js
// src/utils/notificationUtils.js
// ─────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL;

// ── Get storage key per user ──
const getKey = (email) => `notifications_${email}`;

// ── Get all notifications for current user ──
export const getNotifications = () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user?.email) return [];
  const data = JSON.parse(localStorage.getItem(getKey(user.email))) || [];
  return data;
};

// ── Add notification ──
export const addNotification = async (notif) => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user?.email) return;

  const key      = getKey(user.email);
  const existing = JSON.parse(localStorage.getItem(key)) || [];

  const newNotif = {
    id:         Date.now(),
    type:       notif.type,       // 'payment' | 'login' | 'logout' | 'signup'
    title:      notif.title,
    message:    notif.message,
    subMessage: notif.subMessage || "",
    time:       new Date().toLocaleString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                }),
    read:       false,
  };

  existing.unshift(newNotif);
  localStorage.setItem(key, JSON.stringify(existing));

  // ── Also save to DB ──
  try {
    await fetch(`${API}/save-notification`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: user.email, ...newNotif })
    });
  } catch { /* backend not running */ }

  // Trigger navbar re-render
  window.dispatchEvent(new Event("notif-update"));
};

// ── Mark single notification as read ──
export const markAsRead = (id) => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user?.email) return;
  const key  = getKey(user.email);
  const data = JSON.parse(localStorage.getItem(key)) || [];
  const updated = data.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(key, JSON.stringify(updated));
  window.dispatchEvent(new Event("notif-update"));
};

// ── Mark single notification as unread ──
export const markAsUnread = (id) => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user?.email) return;
  const key  = getKey(user.email);
  const data = JSON.parse(localStorage.getItem(key)) || [];
  const updated = data.map(n => n.id === id ? { ...n, read: false } : n);
  localStorage.setItem(key, JSON.stringify(updated));
  window.dispatchEvent(new Event("notif-update"));
};

// ── Get unread count ──
export const getUnreadCount = () => {
  return getNotifications().filter(n => !n.read).length;
};

// ── Add notification for signup (called before currentUser set) ──
export const addSignupNotification = async (email, name) => {
  const key      = getKey(email);
  const existing = JSON.parse(localStorage.getItem(key)) || [];

  const newNotif = {
    id:         Date.now(),
    type:       "signup",
    title:      "Welcome to SecurePay! 🎉",
    message:    `Welcome ${name}! Your account has been created successfully.`,
    subMessage: "Start by creating your UPI ID in Profile.",
    time:       new Date().toLocaleString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                }),
    read:       false,
  };

  existing.unshift(newNotif);
  localStorage.setItem(key, JSON.stringify(existing));

  try {
    await fetch(`${import.meta.env.VITE_API_URL}/save-notification`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, ...newNotif })
    });
  } catch { /* backend not running */ }
};