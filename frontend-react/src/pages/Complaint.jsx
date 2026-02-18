function Complaint() {
  return (
    <div className="complaint-container">

      <h2>Report UPI Fraud</h2>

      <p className="complaint-subtext">
        If you are a victim of UPI fraud, take immediate action.
        Early reporting increases the chances of money recovery.
      </p>

      {/* ================= CONTACT CARDS ================= */}
      <div className="complaint-cards">

        <div className="complaint-card">
          <h3>🚨 Cyber Crime Helpline</h3>
          <p><b>Dial:</b> 1930</p>
          <p>Available 24x7 for immediate fraud reporting.</p>
        </div>

        <div className="complaint-card">
          <h3>🌐 National Cyber Crime Portal</h3>
          <p>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
            >
              https://cybercrime.gov.in
            </a>
          </p>
          <p>File online complaint with full transaction details.</p>
        </div>

        <div className="complaint-card">
          <h3>🏦 Contact Your Bank</h3>
          <p>
            Immediately inform your bank’s customer care and request
            transaction freeze or dispute.
          </p>
        </div>

      </div>

      {/* ================= STEPS SECTION ================= */}
      <div className="steps-section">
        <h3>Immediate Steps to Take</h3>
        <br></br>

        <ul>
          <li>Block your UPI account temporarily.</li>
          <li>Save screenshots of the fraudulent transaction.</li>
          <li>Do not share OTP or personal details with anyone.</li>
          <li>Change your banking passwords immediately.</li>
        </ul>
      </div>

      {/* ================= PREVENTION TIPS ================= */}
      <div className="prevention-section">
        <h3>How to Prevent UPI Fraud</h3>
        <br></br>

        <div className="tips-grid">
          <div className="tip-card">
            Never share OTP or PIN with anyone.
          </div>

          <div className="tip-card">
            Always verify UPI ID before payment.
          </div>

          <div className="tip-card">
            Avoid clicking suspicious payment links.
          </div>

          <div className="tip-card">
            Enable transaction alerts for your account.
          </div>
        </div>
      </div>

    </div>
  );
}

export default Complaint;
