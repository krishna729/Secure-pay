import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCircle, faIdBadge, faEnvelope, faWallet,
  faTrash, faRightFromBracket, faCheck, faBuilding, faBuildingColumns
} from "@fortawesome/free-solid-svg-icons";
import hdfcLogo   from "../assets/banks/hdfc.png";
import iciciLogo  from "../assets/banks/icici.png";
import sbiLogo    from "../assets/banks/sbi.png";
import kotakLogo  from "../assets/banks/kotak.png";
import axisLogo   from "../assets/banks/axis.png";
import pnbLogo    from "../assets/banks/pnb.png";
import bobLogo    from "../assets/banks/bob.png";
import ubiLogo    from "../assets/banks/ubi.png";
import iobLogo    from "../assets/banks/iob.png";
import canaraLogo from "../assets/banks/canara.png";
import { addNotification } from "../utils/notificationUtils";

const API = import.meta.env.VITE_API_URL;

const BANKS = [
  { name: "HDFC Bank",            code: "hdfc",     logo: hdfcLogo   },
  { name: "ICICI Bank",           code: "icici",    logo: iciciLogo  },
  { name: "State Bank of India",  code: "sbi",      logo: sbiLogo    },
  { name: "Kotak Mahindra Bank",  code: "kotak",    logo: kotakLogo  },
  { name: "Axis Bank",            code: "axisbank", logo: axisLogo   },
  { name: "Punjab National Bank", code: "pnb",      logo: pnbLogo    },
  { name: "Bank of Baroda",       code: "bob",      logo: bobLogo    },
  { name: "Union Bank of India",  code: "ubi",      logo: ubiLogo    },
  { name: "Indian Overseas Bank", code: "iob",      logo: iobLogo    },
  { name: "Canara Bank",          code: "canara",   logo: canaraLogo },
  { name: "Others",               code: null,       logo: null       },
];

const toUpiUsername = (name = "") => name.toLowerCase().replace(/\s+/g, "");
const abbreviate    = (bankName = "") => bankName.trim().split(/\s+/).map((w) => w[0]).join("").toLowerCase();

function Profile({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [user, setUser]                     = useState(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [selectedBank, setSelectedBank]     = useState(null);
  const [otherBankName, setOtherBankName]   = useState("");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) { navigate("/login"); return; }
    setUser(currentUser);
  }, [navigate]);

  if (!user) return null;

  const getPreviewUpi = () => {
    const uname = toUpiUsername(user.name);
    if (!selectedBank) return "";
    if (selectedBank.code) return `${uname}@${selectedBank.code}`;
    if (otherBankName.trim()) return `${uname}@${abbreviate(otherBankName)}`;
    return "";
  };

  const saveUpi = async () => {
    const upi      = getPreviewUpi();
    const bankName = selectedBank?.name === "Others" ? otherBankName : selectedBank?.name;
    if (!upi) { alert("Please select a bank or enter bank name"); return; }
    try {
      await fetch(`${API}/save-upi`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, upi_id: upi, bank_name: bankName })
      });
    } catch { /* backend not running */ }
    const updatedUser = { ...user, upiId: upi, bankName };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem("users")) || [];
    localStorage.setItem("users", JSON.stringify(users.map((u) => u.email === user.email ? updatedUser : u)));
    setUser(updatedUser);
    setShowBankPicker(false);
    setSelectedBank(null);
    setOtherBankName("");
    alert("Bank Account saved successfully!");
  };

  const deleteUpi = () => {
    if (!window.confirm("Delete your UPI ID?")) return;
    const updatedUser = { ...user };
    delete updatedUser.upiId;
    delete updatedUser.bankName;
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    const users = JSON.parse(localStorage.getItem("users")) || [];
    localStorage.setItem("users", JSON.stringify(users.map((u) => u.email === user.email ? updatedUser : u)));
    setUser(updatedUser);
    setShowBankPicker(true);
  };

  // ── Logout with notification ──
  const logoutUser = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    // Add logout notification BEFORE clearing user
    await addNotification({
      type:       "logout",
      title:      "Logged Out 🚪",
      message:    `${user.name} logged out from SecurePay.`,
      subMessage: `Account: ${user.email}`,
    });

    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    navigate("/");
  };

  const previewUpi = getPreviewUpi();

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.avatar
              ? <img src={user.avatar} alt="avatar" className="profile-avatar-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
                />
              : null}
            <FontAwesomeIcon icon={faUserCircle} className="profile-avatar-icon"
              style={{ display: user.avatar ? "none" : "block" }} />
          </div>
          <div className="profile-header-info">
            <h2 className="profile-name">{user.name}</h2>
            <span className="profile-badge">{user.provider === "google" ? "Google Account" : "Email Account"}</span>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-info-card">
            <FontAwesomeIcon icon={faIdBadge} className="info-card-icon" />
            <div><p className="info-card-label">Full Name</p><p className="info-card-value">{user.name}</p></div>
          </div>
          <div className="profile-info-card">
            <FontAwesomeIcon icon={faEnvelope} className="info-card-icon" />
            <div><p className="info-card-label">Email Address</p><p className="info-card-value">{user.email}</p></div>
          </div>
        </div>

        <div className="profile-upi-section">
          <div className="profile-upi-header">
            <FontAwesomeIcon icon={faWallet} className="upi-icon" />
            <h3>UPI Identity</h3>
          </div>
          {(!user.upiId || showBankPicker) && <p className="bank-picker-hint">Select your bank account</p>}

          {user.upiId && !showBankPicker ? (
            <div className="upi-display">
              <div className="upi-id-badge"><span className="upi-id-text">{user.upiId}</span></div>
              {user.bankName && (
                <p className="upi-bank-name">
                  <FontAwesomeIcon icon={faBuildingColumns} style={{ color: "rgb(116, 192, 252)" }} /> {user.bankName}
                </p>
              )}
              <div className="upi-actions">
                <button className="btn-upi-edit" onClick={() => setShowBankPicker(true)}>Change Bank</button>
                <button className="btn-upi-delete" onClick={deleteUpi}><FontAwesomeIcon icon={faTrash} /> Delete</button>
              </div>
            </div>
          ) : (
            <div className="bank-picker-section">
              <div className="bank-grid">
                {BANKS.map((bank) => (
                  <div key={bank.name}
                    className={`bank-card ${selectedBank?.name === bank.name ? "bank-card-selected" : ""}`}
                    onClick={() => { setSelectedBank(bank); setOtherBankName(""); }}>
                    {bank.logo
                      ? <img src={bank.logo} alt={bank.name} className="bank-logo" />
                      : <div className="bank-logo-placeholder"><FontAwesomeIcon icon={faBuilding} /></div>}
                    <span className="bank-name">{bank.name}</span>
                  </div>
                ))}
              </div>
              {selectedBank?.code === null && (
                <div className="other-bank-input-wrap">
                  <input type="text" placeholder="Enter your bank name (e.g. Karur Vysya Bank)"
                    value={otherBankName} onChange={(e) => setOtherBankName(e.target.value)} className="upi-input" />
                </div>
              )}
              <div className="bank-picker-actions">
                <button className="btn-upi-save" onClick={saveUpi} disabled={!previewUpi}>
                  <FontAwesomeIcon icon={faCheck} /> Confirm & Save Bank Account
                </button>
                {user.upiId && (
                  <button className="btn-upi-cancel" onClick={() => { setShowBankPicker(false); setSelectedBank(null); }}>Cancel</button>
                )}
              </div>
            </div>
          )}
        </div>

        <button className="btn-logout" onClick={logoutUser}>
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
      </div>
    </div>
  );
}

export default Profile;