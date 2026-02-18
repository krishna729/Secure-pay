import React from "react";
import { useNavigate } from "react-router-dom";

import "../styles/Home.css";

// ✅ Correct Path (because Home.jsx is inside pages folder)
import hero from "../assets/hero.png";
import card1 from "../assets/card1.png";
import card2 from "../assets/card2.png";
import card3 from "../assets/card3.jpeg";
import card4 from "../assets/card4.png";
import shield from "../assets/shield.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { faUserLock } from "@fortawesome/free-solid-svg-icons";
import { faStore } from "@fortawesome/free-solid-svg-icons";
import { faBolt } from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  
  const navigate = useNavigate(); 
  return (
    <>
      {/* ================= HERO SECTION ================= */}
      <section className="hero">
        <div className="hero-content">
          <h1>Secure Your UPI Transactions</h1>
          <p>
            Our AI-powered fraud detection system protects your digital
            payments in real-time and ensures safe financial transactions.
          </p>
          <button className="primary-btn" onClick={() => navigate("/pay")}>Get Started</button>
        </div>

        <div className="hero-image">
          <img src={hero} alt="UPI Security" />
        </div>
      </section>

      {/* ================= INSIGHTS SECTION ================= */}
      <section className="insights">
        <h2>Key Insights</h2>

        <div className="card-container">
          <div className="card">
            <img src={card1} alt="Real-Time Monitoring" />
            <h3>Real-Time Monitoring</h3>
            <p>Instant fraud detection with AI-powered monitoring system.</p>
          </div>

          <div className="card">
            <img src={card2} alt="Secure Payments" />
            <h3>Secure Payments</h3>
            <p>Advanced encryption ensures secure financial transactions.</p>
          </div>

          <div className="card">
            <img src={card3} alt="Data Analytics" />
            <h3>Data Analytics</h3>
            <p>Smart analytics to identify suspicious transaction patterns.</p>
          </div>

          <div className="card">
            <img src={card4} alt="User Protection" />
            <h3>User Protection</h3>
            <p>Protecting users from phishing and UPI-based fraud attacks.</p>
          </div>
        </div>
      </section>

      {/* ================= TURNING DATA INTO FINANCIAL SHIELD ================= */}
      <section className="shield-section">
        <div className="shield-image">
          <img src={shield} alt="Financial Shield" />
        </div>

        <div className="shield-content">
          <h2>Turning Data Into Financial Shield</h2>
          <p>
            We transform transaction data into actionable security insights.
            Our fraud detection engine analyzes patterns and prevents threats
            before they impact users.
          </p>
          <button className="secondary-btn"
           onClick={() =>
          window.open(
            "https://www.retailbankerinternational.com/comment/why-and-how-banks-must-fight-ai-powered-fraud-management/",
            "_blank"
          )
        }>Learn More</button>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      {/* ================= SERVICES SECTION ================= */}
      <section className="section">
        <h2 className="section-title">What We Can Do For You</h2>

        <div className="card-container">
          <div className="card highlight">
            <FontAwesomeIcon icon={faShieldHalved} size="2x"/>
               <h3>Real-time Fraud Detection</h3>
            <p>
              Instant fraud alerts before money leaves your account.
            </p>
          </div>

          <div className="card highlight">
            <FontAwesomeIcon icon={faUserLock} size="2x"/>
            <h3>Secure User Accounts</h3>
            <p>
              Advanced authentication and transaction monitoring.
            </p>
          </div>

          <div className="card highlight">
            <FontAwesomeIcon icon={faStore} size="2x"/>
            <h3>Reliable Merchant Tools</h3>
            <p>
              QR code based secure merchant transactions.
            </p>
          </div>

          <div className="card highlight">
            <FontAwesomeIcon icon={faBolt} size="2x"/>
            <h3>Instant & Safe Payments</h3>
            <p>
              Experience lightning fast UPI payments securely.
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;

