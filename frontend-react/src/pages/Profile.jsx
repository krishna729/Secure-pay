import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Profile({ setIsLoggedIn }) {

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [upiInput, setUpiInput] = useState("");
  const [editing, setEditing] = useState(false);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
      navigate("/login");
      return;
    }

    setUser(currentUser);
    setUpiInput(currentUser.upiId || "");
  }, [navigate]);

  if (!user) return null;

  /* ================= UPI VALIDATION ================= */
  const isValidUPI = (upi) => {
    const regex = /^[a-zA-Z0-9]+@[a-zA-Z]+$/;
    return regex.test(upi);
  };

  /* ================= SAVE UPI ================= */
  const saveUpi = () => {

    if (!upiInput.trim()) {
      alert("Please enter UPI ID");
      return;
    }

    if (!isValidUPI(upiInput)) {
      alert(
        "Invalid UPI ID!\n\nRules:\n• Before @ → letters & numbers\n• After @ → only alphabets\nExample: rahul123@oksbi"
      );
      return;
    }

    const updatedUser = { ...user, upiId: upiInput };

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    // Update users array also
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const updatedUsers = users.map((u) =>
      u.email === user.email ? updatedUser : u
    );

    localStorage.setItem("users", JSON.stringify(updatedUsers));

    setUser(updatedUser);
    setEditing(false);

    alert("UPI ID saved successfully");
  };

  /* ================= DELETE UPI ================= */
  const deleteUpi = () => {

    if (!window.confirm("Delete UPI ID?")) return;

    const updatedUser = { ...user };
    delete updatedUser.upiId;

    localStorage.setItem("currentUser", JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const updatedUsers = users.map((u) =>
      u.email === user.email ? updatedUser : u
    );

    localStorage.setItem("users", JSON.stringify(updatedUsers));

    setUser(updatedUser);
    setUpiInput("");
    setEditing(true);

    alert("UPI ID deleted");
  };

  /* ================= LOGOUT ================= */
  const logoutUser = () => {

    if (!window.confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="box">

      <h2>My Profile</h2>

      <p><b>Name:</b> {user.name}</p>
      <p><b>Email:</b> {user.email}</p>
    <br>
    </br>


      <h3>
  {user.upiId && !editing
    ? " "
    : "Create UPI ID"}
</h3>

      {/* SHOW SAVED UPI */}
      {user.upiId && !editing && (
        <>
          <p><b>My UPI ID:</b> {user.upiId}</p>
          <button onClick={() => setEditing(true)}>Edit</button>
          <button
            style={{ background: "#dc3545", marginLeft: "10px" }}
            onClick={deleteUpi}
          >
            Delete
          </button>
        </>
      )}

      {/* CREATE / EDIT UPI */}
      {(editing || !user.upiId) && (
        <>
          <input
            type="text"
            placeholder="Enter UPI ID (rahul@oksbi)"
            value={upiInput}
            onChange={(e) => setUpiInput(e.target.value)}
          />
          <button onClick={saveUpi}>Save UPI ID</button>

          {user.upiId && (
            <button
              style={{ background: "#6c757d", marginLeft: "10px" }}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          )}
        </>
      )}



      <button
        style={{ background: "#dc3545" }}
        onClick={logoutUser}
      >
        Logout
      </button>

    </div>
  );
}

export default Profile;
