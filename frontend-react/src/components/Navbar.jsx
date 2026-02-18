import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";

function Navbar({ isLoggedIn }) {
  return (
    <nav className="navbar">
      <h3 className="logo">SecurePay</h3>

      <div className="nav-links">
        {!isLoggedIn ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        ) : (
          <>
            <Link to="/" className="nav-link" data-text="Home">Home</Link>
            <Link to="/pay" className="nav-link" data-text="Pay & Detect Fraud" >Pay & Detect Fraud</Link>
            <Link to="/dashboard" className="nav-link" data-text="Dashboard">Dashboard</Link>
            <Link to="/complaint" className="nav-link" data-text="File a Fraud">File a Fraud</Link>

            {/* ✅ SAFE PROFILE ICON */}
            <Link to="/profile" className="profile-icon">
              <FontAwesomeIcon icon={faUserCircle} />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

