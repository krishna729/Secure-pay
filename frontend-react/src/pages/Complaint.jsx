import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullhorn,
  faGlobe,
  faBuildingColumns,
  faKey,
  faLink,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons";

function Complaint() {
  return (
    <div className="complaint-page">
      {/* Hero */}
      <div className="complaint-hero">
        <div className="complaint-hero-badge">
          <FontAwesomeIcon icon={faBullhorn} style={{ color: "rgb(192, 42, 42)" }} /> Fraud Reporting Center
        </div>
        <h1 className="complaint-hero-title">Report UPI Fraud</h1>
        <p className="complaint-hero-sub">
          If you are a victim of UPI fraud, take immediate action. Early reporting increases the chances of money recovery.
        </p>
      </div>

      {/* Contact Cards */}
      <div className="complaint-section">
        <h2 className="complaint-section-title">Immediate Contacts</h2>
        <div className="complaint-cards">
          <div className="complaint-card">
            <div className="complaint-card-icon">
              <FontAwesomeIcon icon={faBullhorn} style={{ color: "rgb(192, 42, 42)" }} />
            </div>
            <h3>Cyber Crime Helpline</h3>
            <div className="complaint-card-highlight">Dial 1930</div>
            <p>Available 24x7 for immediate fraud reporting.</p>
          </div>

          <div className="complaint-card">
            <div className="complaint-card-icon">
              <FontAwesomeIcon icon={faGlobe} style={{ color: "rgb(0, 134, 239)" }} />
            </div>
            <h3>National Cyber Crime Portal</h3>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="complaint-card-link">
              cybercrime.gov.in ↗
            </a>
            <p>File online complaint with full transaction details.</p>
          </div>

          <div className="complaint-card">
            <div className="complaint-card-icon">
              <FontAwesomeIcon icon={faBuildingColumns} style={{ color: "rgb(122, 86, 231)" }} />
            </div>
            <h3>Contact Your Bank</h3>
            <div className="complaint-card-highlight">Call Customer Care</div>
            <p>Request transaction freeze or dispute immediately.</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="complaint-section complaint-steps-section">
        <h2 className="complaint-section-title">Immediate Steps to Take</h2>
        <div className="complaint-steps">
          {[
            { num: "01", text: "Block your UPI account temporarily." },
            { num: "02", text: "Save screenshots of the fraudulent transaction." },
            { num: "03", text: "Do not share OTP or personal details with anyone." },
            { num: "04", text: "Change your banking passwords immediately." },
          ].map((step) => (
            <div key={step.num} className="complaint-step">
              <div className="complaint-step-num">{step.num}</div>
              <p className="complaint-step-text">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prevention Tips */}
      <div className="complaint-section">
        <h2 className="complaint-section-title">How to Prevent UPI Fraud</h2>
        <div className="tips-grid">
          {[
            { icon: <FontAwesomeIcon icon={faKey}         style={{ color: "rgb(237, 195, 47)" }} />, tip: "Never share OTP or PIN with anyone." },
            { icon: <FontAwesomeIcon icon={faSquareCheck} style={{ color: "rgb(50, 224, 96)"  }} />, tip: "Always verify UPI ID before payment." },
            { icon: <FontAwesomeIcon icon={faLink}        style={{ color: "rgb(45, 44, 44)"   }} />, tip: "Avoid clicking suspicious payment links." },
            { icon: <FontAwesomeIcon icon={faBell}        style={{ color: "rgb(196, 36, 36)" }} />, tip: "Enable transaction alerts for your account." },
          ].map((item, i) => (
            <div key={i} className="tip-card">
              <div className="tip-card-icon">{item.icon}</div>
              <p>{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Complaint;