// components/Login.jsx
import React from "react";
import "./Login.css";
import Logo from '../Assets/logo.png';
import { useLogin } from "./Login";

function Login() {
  const {
    username,
    setUsername,
    password,
    setPassword,
    error,
    loading,
    handleSubmit
  } = useLogin();

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