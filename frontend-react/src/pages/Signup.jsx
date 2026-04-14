import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faEnvelope, faPhone, faLock, faUserLock, faKey,
  faShield, faCircleCheck, faTriangleExclamation, faEye, faEyeSlash, faCheck, faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import '../styles/auth.css';
import { addSignupNotification } from "../utils/notificationUtils";

const EMAILJS_SERVICE_ID  = "service_skencnd";
const EMAILJS_TEMPLATE_ID = "template_kn4pzk5";
const EMAILJS_PUBLIC_KEY  = "wW_dujj0haQVVlJDi";
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const API = import.meta.env.VITE_API_URL;

function Signup({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const [step, setStep]                       = useState(1);
  const [name, setName]                       = useState("");
  const [email, setEmail]                     = useState("");
  const [phone, setPhone]                     = useState("");
  const [enteredOtp, setEnteredOtp]           = useState("");
  const [otpError, setOtpError]               = useState("");
  const [resendTimer, setResendTimer]         = useState(0);
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";
    return () => { if (footer) footer.style.display = ""; };
  }, []);

  const sendOtpEmail = async (otp, toEmail) => {
    const now = new Date();
    const timeStr = new Date(now.getTime() + 10*60*1000).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID, template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY, accessToken: EMAILJS_PUBLIC_KEY,
        template_params: { email: toEmail, passcode: otp, time: timeStr },
      }),
    });
    if (!res.ok) { const text = await res.text(); throw new Error(text); }
  };

  const handleSendOtp = async () => {
    setError("");
    if (!name.trim())  { setError("Please enter your full name."); return; }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email."); return; }
    if (!phone.trim() || phone.length < 10) { setError("Enter a valid 10-digit phone number."); return; }
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find((u) => u.email === email)) { setError("Email already registered. Please login."); return; }
    setLoading(true);
    const otp = generateOTP();
    localStorage.setItem("pendingOtp", JSON.stringify({ otp, expires: Date.now() + 10*60*1000, email }));
    try { await sendOtpEmail(otp, email); setStep(2); startResendTimer(); }
    catch (err) { setError("Failed to send OTP: " + err.message); }
    finally { setLoading(false); }
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    const otp = generateOTP();
    localStorage.setItem("pendingOtp", JSON.stringify({ otp, expires: Date.now() + 10*60*1000, email }));
    try { await sendOtpEmail(otp, email); startResendTimer(); }
    catch (err) { setOtpError("Failed to resend: " + err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = () => {
    setOtpError("");
    const stored = JSON.parse(localStorage.getItem("pendingOtp"));
    if (!stored)                     { setOtpError("OTP expired. Request new one."); return; }
    if (Date.now() > stored.expires) { setOtpError("OTP expired. Please resend."); return; }
    if (stored.otp !== enteredOtp)   { setOtpError("Incorrect OTP. Try again."); return; }
    localStorage.removeItem("pendingOtp");
    setStep(3);
  };

  const handleSetPassword = async () => {
    setError("");
    if (password.length < 8)         { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, provider: "email" })
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Registration failed."); setLoading(false); return; }
    } catch { /* fallback */ }

    const users = JSON.parse(localStorage.getItem("users")) || [];
    users.push({ name, email, phone, password, upiId: "", provider: "email" });
    localStorage.setItem("users", JSON.stringify(users));

    // ── Add welcome notification ──
    await addSignupNotification(email, name);

    setLoading(false);
    setStep(4);
    setTimeout(() => navigate("/login"), 2000);
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user   = result.user;
      const users  = JSON.parse(localStorage.getItem("users")) || [];
      let existingUser = users.find((u) => u.email === user.email);
      if (existingUser) {
        localStorage.setItem("currentUser", JSON.stringify(existingUser));
      } else {
        const newUser = {
          name: user.displayName, email: user.email,
          phone: "", password: "", upiId: "", avatar: user.photoURL, provider: "google"
        };
        try {
          await fetch(`${API}/register`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newUser.name, email: newUser.email, password: "", provider: "google" })
          });
        } catch { /* backend not running */ }
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("currentUser", JSON.stringify(newUser));
        await addSignupNotification(newUser.email, newUser.name);
      }
      setIsLoggedIn(true);
      navigate("/");
    } catch { setError("Google sign-up failed."); }
    finally  { setLoading(false); }
  };

  const steps = ["Details", "Verify OTP", "Set Password"];

  return (
    <div className="auth-wrapper">
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon"><FontAwesomeIcon icon={faUserLock} style={{color:"rgb(10,192,252)"}} /></div>
          <h1>SecurePay</h1>
          <p>Join thousands of users who trust SecurePay for safe payments</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature-item"><span className="feature-icon"><FontAwesomeIcon icon={faShield} /></span><span>AI-Powered Fraud Detection</span></div>
          <div className="auth-feature-item"><span className="feature-icon"><FontAwesomeIcon icon={faCircleCheck} /></span><span>Instant UPI Transfers</span></div>
          <div className="auth-feature-item"><span className="feature-icon"><FontAwesomeIcon icon={faEnvelope} /></span><span>Email OTP Verification</span></div>
        </div>
      </div>
      <div className="auth-panel-right">
        <div className="auth-card">
          {step === 4 && (
            <div className="auth-success">
              <div className="success-anim"><FontAwesomeIcon icon={faCircleCheck} /></div>
              <h2>Account Created!</h2>
              <p>Redirecting to login...</p>
            </div>
          )}
          {step < 4 && (
            <>
              <div className="auth-header"><h2>Create Account</h2><p>Step {step} of 3 — {steps[step-1]}</p></div>
              <div className="progress-bar">
                {steps.map((s, i) => (
                  <div key={i} className={`progress-step ${i+1<=step?"active":""}`}>
                    <div className="progress-dot">{i+1<step?<FontAwesomeIcon icon={faCheck}/>:i+1}</div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              {error && <div className="auth-error"><FontAwesomeIcon icon={faTriangleExclamation}/> {error}</div>}
              {step === 1 && (
                <div className="auth-form">
                  <button className="btn-google" onClick={handleGoogleSignup} disabled={loading}>
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Sign up with Google
                  </button>
                  <div className="auth-divider"><span>or fill in your details</span></div>
                  <div className="input-group"><label>Full Name</label><div className="input-wrapper"><FontAwesomeIcon icon={faUser} className="input-icon"/><input type="text" placeholder="Rahul Sharma" value={name} onChange={(e)=>setName(e.target.value)}/></div></div>
                  <div className="input-group"><label>Email Address</label><div className="input-wrapper"><FontAwesomeIcon icon={faEnvelope} className="input-icon"/><input type="email" placeholder="you@example.com" value={email} onChange={(e)=>setEmail(e.target.value)}/></div></div>
                  <div className="input-group"><label>Phone Number</label><div className="input-wrapper"><FontAwesomeIcon icon={faPhone} className="input-icon"/><input type="tel" placeholder="9876543210" maxLength="10" value={phone} onChange={(e)=>setPhone(e.target.value.replace(/\D/,""))}/></div></div>
                  <button className="btn-primary-auth" onClick={handleSendOtp} disabled={loading}>
                    {loading?<span className="spinner"/>:<><FontAwesomeIcon icon={faEnvelope}/> &nbsp;Send OTP to Email</>}
                  </button>
                  <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
                </div>
              )}
              {step === 2 && (
                <div className="auth-form">
                  <div className="otp-info"><p><FontAwesomeIcon icon={faEnvelope}/> &nbsp;OTP sent to</p><strong>{email}</strong><p style={{fontSize:"12px",marginTop:"6px",color:"#64748b"}}>Check spam folder if not received</p></div>
                  {otpError && <div className="auth-error"><FontAwesomeIcon icon={faTriangleExclamation}/> {otpError}</div>}
                  <div className="input-group"><label>Enter 6-digit OTP</label><div className="input-wrapper"><FontAwesomeIcon icon={faKey} className="input-icon"/><input type="text" placeholder="123456" maxLength="6" value={enteredOtp} onChange={(e)=>setEnteredOtp(e.target.value.replace(/\D/,""))} className="otp-input"/></div></div>
                  <button className="btn-primary-auth" onClick={handleVerifyOtp}><FontAwesomeIcon icon={faCircleCheck}/> &nbsp;Verify OTP</button>
                  <div className="resend-row">
                    {resendTimer>0?<span className="resend-timer">Resend in {resendTimer}s</span>:<button className="resend-btn" onClick={handleResendOtp} disabled={loading} type="button">{loading?"Sending...":"Resend OTP"}</button>}
                    <button className="back-btn" onClick={()=>{setStep(1);setEnteredOtp("");setOtpError("");}} type="button"><FontAwesomeIcon icon={faArrowLeft}/> Back</button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="auth-form">
                  <div className="otp-info"><p><FontAwesomeIcon icon={faCircleCheck}/> &nbsp;Email Verified! Create password for</p><strong>{email}</strong></div>
                  <div className="input-group">
                    <label>Create Password</label>
                    <div className="input-wrapper">
                      <FontAwesomeIcon icon={faLock} className="input-icon"/>
                      <input type={showPassword?"text":"password"} placeholder="Minimum 8 characters" value={password} onChange={(e)=>setPassword(e.target.value)}/>
                      <button className="toggle-password" onClick={()=>setShowPassword(!showPassword)} type="button"><FontAwesomeIcon icon={showPassword?faEyeSlash:faEye}/></button>
                    </div>
                    {password&&(<div className="password-strength"><div className={`strength-bar ${password.length>=12?"strong":password.length>=8?"medium":"weak"}`}/><span>{password.length>=12?"Strong":password.length>=8?"Medium":"Weak"}</span></div>)}
                  </div>
                  <div className="input-group">
                    <label>Confirm Password</label>
                    <div className="input-wrapper"><FontAwesomeIcon icon={faLock} className="input-icon"/><input type={showPassword?"text":"password"} placeholder="Re-enter your password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)}/></div>
                    {confirmPassword&&password!==confirmPassword&&<p className="field-error">Passwords don't match</p>}
                  </div>
                  <button className="btn-primary-auth" onClick={handleSetPassword} disabled={loading}>
                    {loading?<span className="spinner"/>:<><FontAwesomeIcon icon={faCircleCheck}/> &nbsp;Create Account</>}
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

export default Signup;