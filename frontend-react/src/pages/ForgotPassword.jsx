import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import emailjs from '@emailjs/browser';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faLock,
  faEnvelope,
  faCircleCheck,
  faTriangleExclamation,
  faArrowRight,
  faArrowLeft,
  faEye,
  faEyeSlash,
  faMagnifyingGlass,
  faShield,
  faUserLock,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import '../styles/auth.css';

const EMAILJS_SERVICE_ID  = "service_skencnd";
const EMAILJS_TEMPLATE_ID = "template_kn4pzk5";
const EMAILJS_PUBLIC_KEY  = "wW_dujj0haQVVlJDi";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]                       = useState(1);
  const [identifier, setIdentifier]           = useState("");
  const [enteredOtp, setEnteredOtp]           = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [resendTimer, setResendTimer]         = useState(0);
  const [foundUser, setFoundUser]             = useState(null);

  const sendOtpEmail = async (otp, userEmail) => {
    const now        = new Date();
    const expiryTime = new Date(now.getTime() + 10 * 60 * 1000);
    const timeStr    = expiryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { email: userEmail, passcode: otp, time: timeStr },
      EMAILJS_PUBLIC_KEY
    );
  };

  // ── Step 1 — Find user by email ──
  const handleCheckIdentifier = async () => {
    setError("");
    if (!identifier.trim()) { setError("Please enter your registered email address."); return; }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user  = users.find((u) => u.email === identifier.trim());

    if (!user)                        { setError("No account found with this email."); return; }
    if (user.provider === "google")   { setError("This account uses Google Sign-In. Please sign in with Google."); return; }

    setFoundUser(user);
    setLoading(true);

    const otp = generateOTP();
    localStorage.setItem("forgotOtp", JSON.stringify({ otp, expires: Date.now() + 10 * 60 * 1000 }));

    try {
      await sendOtpEmail(otp, user.email);
      setStep(2);
      startResendTimer();
    } catch (err) {
      console.error("EmailJS error:", err);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || !foundUser) return;
    setLoading(true);
    const otp = generateOTP();
    localStorage.setItem("forgotOtp", JSON.stringify({ otp, expires: Date.now() + 10 * 60 * 1000 }));
    try   { await sendOtpEmail(otp, foundUser.email); startResendTimer(); }
    catch { setError("Failed to resend OTP."); }
    finally { setLoading(false); }
  };

  // ── Step 2 — Verify OTP ──
  const handleVerifyOtp = () => {
    setError("");
    const stored = JSON.parse(localStorage.getItem("forgotOtp"));
    if (!stored)                     { setError("OTP expired. Please request again."); return; }
    if (Date.now() > stored.expires) { setError("OTP expired. Please resend."); return; }
    if (stored.otp !== enteredOtp)   { setError("Incorrect OTP. Try again."); return; }
    localStorage.removeItem("forgotOtp");
    setStep(3);
  };

  // ── Step 3 — Reset Password ──
  const handleResetPassword = () => {
    setError("");
    if (newPassword.length < 8)        { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword){ setError("Passwords don't match."); return; }

    setLoading(true);
    setTimeout(() => {
      const users   = JSON.parse(localStorage.getItem("users")) || [];
      const updated = users.map((u) =>
        u.email === foundUser.email ? { ...u, password: newPassword } : u
      );
      localStorage.setItem("users", JSON.stringify(updated));
      setLoading(false);
      setStep(4);
      setTimeout(() => navigate("/login"), 2500);
    }, 800);
  };

  const steps = ["Verify Identity", "Enter OTP", "New Password"];

  return (
    <div className="auth-wrapper">

      {/* Left Panel */}
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <FontAwesomeIcon icon={faUserLock} style={{ color: "rgb(10,192,252)" }} />
          </div>
          <h1>SecurePay</h1>
          <p>Reset your password securely with OTP verification</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature-item">
            <span className="feature-icon"><FontAwesomeIcon icon={faShield} /></span>
            <span>Secure OTP-based reset</span>
          </div>
          <div className="auth-feature-item">
            <span className="feature-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
            <span>OTP sent to your email</span>
          </div>
          <div className="auth-feature-item">
            <span className="feature-icon"><FontAwesomeIcon icon={faCircleCheck} /></span>
            <span>Instant access restored</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-panel-right">
        <div className="auth-card">

          {/* Step 4 — Success */}
          {step === 4 && (
            <div className="auth-success">
              <div className="success-anim">
                <FontAwesomeIcon icon={faCircleCheck} />
              </div>
              <h2>Password Reset!</h2>
              <p>Your password has been changed successfully.</p>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>Redirecting to login...</p>
            </div>
          )}

          {step < 4 && (
            <>
              <div className="auth-header">
                <h2>Forgot Password?</h2>
                <p>Step {step} of 3 — {steps[step - 1]}</p>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar">
                {steps.map((s, i) => (
                  <div key={i} className={`progress-step ${i + 1 <= step ? "active" : ""}`}>
                    <div className="progress-dot">
                      {i + 1 < step ? <FontAwesomeIcon icon={faCircleCheck} /> : i + 1}
                    </div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="auth-error">
                  <FontAwesomeIcon icon={faTriangleExclamation} /> {error}
                </div>
              )}

              {/* ── Step 1 — Enter Email ── */}
              {step === 1 && (
                <div className="auth-form">
                  <div className="otp-info">
                    <p>Enter your registered email address to receive a password reset OTP.</p>
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="input-icon" />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCheckIdentifier()}
                      />
                    </div>
                  </div>
                  <button className="btn-primary-auth" onClick={handleCheckIdentifier} disabled={loading}>
                    {loading
                      ? <span className="spinner" />
                      : <><FontAwesomeIcon icon={faEnvelope} /> &nbsp;Send Reset OTP &nbsp;<FontAwesomeIcon icon={faArrowRight} /></>
                    }
                  </button>
                  <p className="auth-switch">Remember password? <Link to="/login">Sign In</Link></p>
                </div>
              )}

              {/* ── Step 2 — Verify OTP ── */}
              {step === 2 && (
                <div className="auth-form">
                  <div className="otp-info">
                    <p><FontAwesomeIcon icon={faEnvelope} /> &nbsp;OTP sent to</p>
                    <strong>{foundUser?.email}</strong>
                    <p style={{ fontSize: "12px", marginTop: "6px", color: "#64748b" }}>
                      Check spam folder if not received
                    </p>
                  </div>
                  <div className="input-group">
                    <label>Enter 6-digit OTP</label>
                    <div className="input-wrapper">
                      <FontAwesomeIcon icon={faKey} className="input-icon" />
                      <input
                        type="text"
                        placeholder="123456"
                        maxLength="6"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/, ""))}
                        className="otp-input"
                      />
                    </div>
                  </div>
                  <button className="btn-primary-auth" onClick={handleVerifyOtp}>
                    <FontAwesomeIcon icon={faCircleCheck} /> &nbsp;Verify OTP &nbsp;<FontAwesomeIcon icon={faArrowRight} />
                  </button>
                  <div className="resend-row">
                    {resendTimer > 0
                      ? <span className="resend-timer">Resend in {resendTimer}s</span>
                      : <button className="resend-btn" onClick={handleResendOtp} disabled={loading} type="button">
                          {loading ? "Sending..." : <><FontAwesomeIcon icon={faRotateRight} /> &nbsp;Resend OTP</>}
                        </button>
                    }
                    <button className="back-btn" onClick={() => setStep(1)} type="button">
                      <FontAwesomeIcon icon={faArrowLeft} /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3 — New Password ── */}
              {step === 3 && (
                <div className="auth-form">
                  <div className="otp-info">
                    <p><FontAwesomeIcon icon={faCircleCheck} /> &nbsp;Verified! Create new password for</p>
                    <strong>{foundUser?.email}</strong>
                  </div>

                  <div className="input-group">
                    <label>New Password</label>
                    <div className="input-wrapper">
                      <FontAwesomeIcon icon={faLock} className="input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button className="toggle-password" onClick={() => setShowPassword(!showPassword)} type="button">
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    {newPassword && (
                      <div className="password-strength">
                        <div className={`strength-bar ${
                          newPassword.length >= 12 ? "strong" : newPassword.length >= 8 ? "medium" : "weak"
                        }`} />
                        <span>{newPassword.length >= 12 ? "Strong" : newPassword.length >= 8 ? "Medium" : "Weak"}</span>
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Confirm New Password</label>
                    <div className="input-wrapper">
                      <FontAwesomeIcon icon={faLock} className="input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="field-error">Passwords don't match</p>
                    )}
                  </div>

                  <button className="btn-primary-auth" onClick={handleResetPassword} disabled={loading}>
                    {loading
                      ? <span className="spinner" />
                      : <><FontAwesomeIcon icon={faLock} /> &nbsp;Reset Password</>
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;