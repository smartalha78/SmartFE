// components/login.js
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import API_BASE1 from "../config";

export function useLogin() {
  const [username, setUsername] = useState("talha");
  const [password, setPassword] = useState("abc123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const API_BASE = API_BASE1;

  const fetchUserData = async (username, authToken) => {
    try {
      console.log("Fetching COMUSERS data...");
      const usersRes = await fetch(`${API_BASE}/get-table-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          tableName: "COMUSERS"
        })
      });

      let userId = "0";
      let userFullName = "";
      let userEmail = "";
      let userMobile = "";
      let userLogin = "";
      let userPassword = "";

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        console.log("Users data from COMUSERS:", usersData);

        if (usersData.rows && usersData.rows.length > 0) {
          console.log(`Found ${usersData.rows.length} users in COMUSERS table`);

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
      }

      return {
        userId,
        userFullName,
        userEmail,
        userMobile,
        userLogin,
        userPassword
      };
    } catch (error) {
      console.error("Error fetching user data:", error);
      return {
        userId: "0",
        userFullName: "",
        userEmail: "",
        userMobile: "",
        userLogin: "",
        userPassword: ""
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending login request for user:", trimmedUsername);

      const res = await fetch(`${API_BASE}/GetMenu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          userpassword: trimmedPassword,
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

      // Extract token from response
      const authToken = result.token;

      if (!authToken) {
        throw new Error("No authentication token received");
      }

      // Save token to localStorage
      localStorage.setItem('authToken', authToken);

      // Extract and transform data
      const { tbl1, tbl2, tbl3 } = result.data;

      // Get offcode from tbl1
      const offcode = tbl1 && tbl1.length > 0 ? tbl1[0].offcode : "0101";

      const company = tbl1 && tbl1.length > 0 ? {
        name: tbl1[0].offdesc || "SMART SOLUTIONS ORG.",
        offcode: offcode,
        FBRToken: tbl1[0].FBRToken
      } : { name: "SMART SOLUTIONS ORG.", offcode: "0101" };

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

      // Fetch user data from COMUSERS with token
      const userData = await fetchUserData(trimmedUsername, authToken);

      // Save credentials in AuthContext
      // In useLogin.js, update the credentials object
      const userCredentials = {
        username: trimmedUsername,
        password: trimmedPassword,
        uid: userData.userId,        // Use 'uid' as the key
        user_id: userData.userId,    // Also add 'user_id' for compatibility
        offcode: offcode,
        companyName: company.name,
        branches: branches,
        userFullName: userData.userFullName,
        userEmail: userData.userEmail,
        userMobile: userData.userMobile,
        userLogin: userData.userLogin
      };

      console.log('📝 Saving credentials with UID:', {
        username: userCredentials.username,
        uid: userCredentials.uid,
        user_id: userCredentials.user_id,
        offcode: userCredentials.offcode
      });

      console.log("📝 Saving credentials with UID from COMUSERS:", {
        username: userCredentials.username,
        uid: userCredentials.uid,
        offcode: userCredentials.offcode
      });

      // Pass token to AuthContext
      login(userCredentials, authToken);

      // Store app data with complete user details
      const appData = {
        company,
        branches,
        menu,
        rawData: result.data,
        userDetails: {
          uid: userData.userId,
          fullName: userData.userFullName,
          email: userData.userEmail,
          mobile: userData.userMobile,
          login: userData.userLogin,
          offcode: offcode
        },
        token: authToken,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem("appData", JSON.stringify(appData));

      console.log("✅ Login successful! Token saved");
      console.log("✅ User ID from COMUSERS:", userData.userId, "Offcode:", offcode);
      console.log("App data saved to localStorage");

      navigate("/dashboard");

    } catch (err) {
      console.error("❌ Login Error:", err);
      setError(err.message || "Login failed. Please try again.");

      localStorage.removeItem("authCredentials");
      localStorage.removeItem("authToken");
      localStorage.removeItem("appData");
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    error,
    loading,
    handleSubmit
  };
}