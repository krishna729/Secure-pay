
import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Pay from "./pages/Pay";
import Result from "./pages/Result";
import PaymentSuccess from "./pages/PaymentSuccess";
import Profile from "./pages/Profile";
import Complaint from "./pages/Complaint";

function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    setIsLoggedIn(!!user);
  }, []);

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/result" element={<Result />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/profile" element={<Profile setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/complaint" element={<Complaint />} />
      </Routes>
    </>
  );
}

export default App;
