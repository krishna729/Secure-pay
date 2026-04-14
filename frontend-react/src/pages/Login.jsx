import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock, faUserLock, faEnvelope, faShield,
  faBolt, faChartBar, faEye, faEyeSlash,
  faTriangleExclamation, faArrowRightToBracket,
} from "@fortawesome/free-solid-svg-icons";
import '../styles/auth.css';
import { addNotification } from "../utils/notificationUtils";

const API = import.meta.env.VITE_API_URL;

function Login({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";
    return () => { if (footer) footer.style.display = ""; };
  }, []);

  const loginUser = async (userObj) => {
    localStorage.removeItem("currentUser");
    localStorage.setItem("currentUser", JSON.stringify(userObj));
    setIsLoggedIn(true);

    // ── Add login notification ──
    await addNotification({
      type:       "login",
      title:      "Logged In Successfully 👋",
      message:    `${userObj.name} logged in to SecurePay.`,
      subMessage: `Account: ${userObj.email}`,
    });

    navigate("/");
  };

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);

    try {
      const res  = await fetch(`${API}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        const localUsers = JSON.parse(localStorage.getItem("users")) || [];
        const localUser  = localUsers.find(u => u.email === email);
        const mergedUser = { ...data.user, ...(localUser || {}) };
        await loginUser(mergedUser);
        return;
      } else {
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const found = users.find(u => u.email === email && u.password === password);
        if (found) { await loginUser(found); return; }
        setError("Invalid email or password.");
      }
    } catch {
      const users = JSON.parse(localStorage.getItem("users")) || [];
      const found = users.find(u => u.email === email && u.password === password);
      if (found) { await loginUser(found); return; }
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user   = result.user;
      const users  = JSON.parse(localStorage.getItem("users")) || [];
      let existingUser = users.find((u) => u.email === user.email);

      if (!existingUser) {
        const newUser = {
          name: user.displayName, email: user.email,
          phone: user.phoneNumber || "", password: "",
          upiId: "", avatar: user.photoURL, provider: "google",
        };
        try {
          await fetch(`${API}/register`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newUser.name, email: newUser.email, password: "", provider: "google" })
          });
        } catch { /* backend not running */ }
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        existingUser = newUser;
      }
      await loginUser(existingUser);
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="auth-wrapper">
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <FontAwesomeIcon icon={faUserLock} style={{ color: "rgb(10,192,252)" }} />
          </div>
          <h1>SecurePay</h1>
          <p>India's most trusted fraud-detection payment platform</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature-item"><span className="feature-icon"><FontAwesomeIcon icon={faShield} /></span><span>AI-Powered Fraud Detection</span></div>
          <div className="auth-feature-item"><span className="feature-icon"><FontAwesomeIcon icon={faBolt} /></span><span>Instant UPI Transfers</span></div>
          <div className="auth-feature-item"><span className="feature-icon"><FontAwesomeIcon icon={faChartBar} /></span><span>Real-time Analytics</span></div>
        </div>
      </div>
      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome back</h2>
            <p>Sign in to your SecurePay account</p>
          </div>
          {error && <div className="auth-error"><FontAwesomeIcon icon={faTriangleExclamation} /> {error}</div>}
          <div className="auth-form">
            <button className="btn-google" onClick={handleGoogleLogin} disabled={loading}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>
            <div className="auth-divider"><span>or sign in with email</span></div>
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
              </div>
            </div>
            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faLock} className="input-icon" />
                <input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
                <button className="toggle-password" onClick={() => setShowPassword(!showPassword)} type="button">
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            <div className="forgot-link"><Link to="/forgot-password">Forgot Password?</Link></div>
            <button className="btn-primary-auth" onClick={handleLogin} disabled={loading}>
              {loading ? <span className="spinner" /> : <><FontAwesomeIcon icon={faArrowRightToBracket} /> &nbsp;Sign In</>}
            </button>
          </div>
          <p className="auth-switch">Don't have an account? <Link to="/signup">Create one free</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;