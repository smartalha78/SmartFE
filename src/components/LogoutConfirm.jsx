import React from "react";
import "./LogoutConfirm.css";

function LogoutConfirm({ onConfirm, onCancel }) {
  return (
    <div className="logout-confirm-overlay">
      <div className="logout-confirm-box">
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to logout?</p>
        <div className="confirm-buttons">
          <button onClick={onConfirm} className="confirm-btn">
            Yes, Logout
          </button>
          <button onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirm;