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

      // Fetch user data from COMUSERS table to get the correct UID
      console.log("Fetching COMUSERS data...");
      const usersRes = await fetch(`${API_BASE}/get-table-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName: "COMUSERS"
        })
      });

      let userId = "0"; // Default value
      let userFullName = "";
      let userEmail = "";
      let userMobile = "";
      let userLogin = "";
      let userPassword = "";

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        console.log("Users data from COMUSERS:", usersData);
        
        // Check if we have rows in the response
        if (usersData.rows && usersData.rows.length > 0) {
          console.log(`Found ${usersData.rows.length} users in COMUSERS table`);
          
          // Find the user with matching username (case-insensitive comparison)
          const matchedUser = usersData.rows.find(
            user => user.Userlogin && user.Userlogin.toLowerCase() === username.trim().toLowerCase()
          );
          
          if (matchedUser) {
            userId = matchedUser.Uid;
            userFullName = matchedUser.Userfullname || "";
            userEmail = matchedUser.Useremail || "";
            userMobile = matchedUser.userMobile || "";
            userLogin = matchedUser.Userlogin || "";
            userPassword = matchedUser.Userpassword || "";
            
            console.log(`✅ Found user ${username} in COMUSERS table with UID: ${userId}`);
            console.log("User details:", {
              Uid: userId,
              fullName: userFullName,
              email: userEmail,
              mobile: userMobile
            });
          } else {
            console.warn(`❌ User ${username} not found in COMUSERS table`);
            console.log("Available usernames in COMUSERS:", 
              usersData.rows.map(u => u.Userlogin).filter(Boolean));
          }
        } else {
          console.warn("No users data received from COMUSERS - rows array is empty");
        }
      } else {
        console.warn(`Failed to fetch COMUSERS data. Status: ${usersRes.status}`);
        const errorText = await usersRes.text();
        console.warn("Error response:", errorText);
      }

      // Save credentials in AuthContext with Uid from COMUSERS
      const userCredentials = { 
        username: username.trim(), 
        password: password.trim(),
        Uid: userId, // This now comes from COMUSERS table dynamically
        offcode: offcode,
        companyName: company.name,
        branches: branches,
        userFullName: userFullName,
        userEmail: userEmail,
        userMobile: userMobile,
        userLogin: userLogin
      };

      console.log("📝 Saving credentials with UID from COMUSERS:", {
        username: userCredentials.username,
        Uid: userCredentials.Uid,
        offcode: userCredentials.offcode,
        companyName: userCredentials.companyName,
        userFullName: userCredentials.userFullName
      });
      
      login(userCredentials);

      // Store app data with complete user details
      const appData = {
        company,
        branches,
        menu,
        rawData: result.data,
        userDetails: {
          Uid: userId,
          fullName: userFullName,
          email: userEmail,
          mobile: userMobile,
          login: userLogin,
          offcode: offcode
        },
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem("appData", JSON.stringify(appData));

      console.log("✅ Login successful! User ID from COMUSERS:", userId, "Offcode:", offcode);
      console.log("App data saved to localStorage");
      
      navigate("/dashboard");

    } catch (err) {
      console.error("❌ Login Error:", err);
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