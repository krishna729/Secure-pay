import logo from "../assets/logo.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src={logo} alt="SecurePay Logo" className="footer-logo-img" />
        </div>

        <div className="footer-links">
          <span>Privacy Policy</span>
          <span className="footer-divider">·</span>
          <span>Terms of Service</span>
          <span className="footer-divider">·</span>
          <span>Support</span>
        </div>

        <p className="footer-copy">
          © {new Date().getFullYear()} SecurePay. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;