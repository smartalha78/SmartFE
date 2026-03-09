// components/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import "./Login.css";
import Logo from '../Assets/logo.png';
import API_BASE1 from "../config"
function Login() {
  const [username, setUsername] = useState("talha");
  const [password, setPassword] = useState("abc123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const API_BASE = API_BASE1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Sending login request...");
      
      const res = await fetch(`${API_BASE}/GetMenu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          userpassword: password.trim(),
          Menuid: "01",
          nooftables: "3"
        })
      });
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password");
        }
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText || res.statusText}`);
      }

      const result = await res.json();
      console.log("API Response:", result);
      
      if (result.status !== "success") {
        throw new Error(result.message || "Login failed");
      }

      if (!result.data || !result.data.tbl3) {
        throw new Error("No menu data received");
      }

      // Extract and transform data
      const { tbl1, tbl2, tbl3 } = result.data;
      
      // Get offcode from tbl1 (this is crucial!)
      const offcode = tbl1 && tbl1.length > 0 ? tbl1[0].offcode : "1010";
      
      const company = tbl1 && tbl1.length > 0 ? {
        name: tbl1[0].offdesc || "SMART SOLUTIONS ORG.",
        offcode: offcode,
        FBRToken: tbl1[0].FBRToken
      } : { name: "SMART SOLUTIONS ORG.", offcode: "1010" };

      const branches = tbl2 ? tbl2.map(branch => ({
        branch: branch.bname,
        bcode: branch.bcode,
        offcode: branch.offcode || offcode
      })) : [];

      const menu = tbl3.map(item => ({
        id: item.Menuid,
        title: item.MenuTitle,
        parentId: item.ParentId,
        level: item.mLevel,
        menuNarration: item.menuNarration,
        MenuURL: item.MenuURL,
        MenuType: item.MenuType,
        ImageURL: item.ImageURL,
        isAdd: item.isAdd,
        isEdit: item.isEdit,
        isDelete: item.isDelete,
        isPrint: item.isPrint,
        isPost: item.isPost,
        IsBackDate: item.IsBackDate,
        IsSearch: item.IsSearch,
        IsUpload: item.IsUpload,
        MenuCaption: item.MenuCaption,
        MenuCaption1: item.MenuCaption1,
        vType: item.vType
      }));

      // Map username to user ID (you need to define this mapping)
      const userIdMap = {
        'talha': '2',
        'usman': '3',
        'admin': '1',
      };

      const userId = userIdMap[username.trim()] || '10';

      // Save credentials in AuthContext with offcode and Uid
      const userCredentials = { 
        username: username.trim(), 
        password: password.trim(),
        Uid: userId,
        offcode: offcode,  // This is the important part!
        companyName: company.name,
        branches: branches
      };

      console.log("Saving credentials with offcode:", userCredentials);
      login(userCredentials);

      // Store app data
      localStorage.setItem(
        "appData",
        JSON.stringify({
          company,
          branches,
          menu,
          rawData: result.data,
          lastUpdated: new Date().toISOString()
        })
      );

      console.log("Login successful! User ID:", userId, "Offcode:", offcode);
      
      navigate("/dashboard");

    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Login failed. Please try again.");
      
      localStorage.removeItem("authCredentials");
      localStorage.removeItem("appData");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-left">
          <h2>Login</h2>

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>

        <div className="login-right">
          <img src={Logo} alt="Company Logo" className="logo-img" />
          <h1 className="logo-text">SMART SOLUTIONS ORG.</h1>
        </div>
      </div>
    </div>
  );
}

export default Login;