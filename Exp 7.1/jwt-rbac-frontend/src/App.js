import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8080";

const STUDENT_NAME = "Taseen Yasir Pritam";
const STUDENT_UID = "24BAI70036";

// Decode JWT payload
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
}

function App() {
  // =========================================================
  // THEME
  // =========================================================

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  }

  // =========================================================
  // AUTHENTICATION STATE
  // =========================================================

  const [token, setToken] = useState(
    localStorage.getItem("jwtToken") || ""
  );

  const [loggedUser, setLoggedUser] = useState(
    localStorage.getItem("username") || ""
  );

  const [role, setRole] = useState(
    localStorage.getItem("role") || ""
  );

  // =========================================================
  // LOGIN FORM
  // =========================================================

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loginMessage, setLoginMessage] = useState("");
  const [loginMessageType, setLoginMessageType] = useState("");

  // =========================================================
  // API RESULTS
  // =========================================================

  const [userApiStatus, setUserApiStatus] = useState(null);
  const [adminApiStatus, setAdminApiStatus] = useState(null);

  // =========================================================
  // LOGIN
  // =========================================================

  async function handleLogin(event) {
    event.preventDefault();

    setLoginMessage("AUTHENTICATING...");
    setLoginMessageType("loading");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        setLoginMessage("ACCESS DENIED — INVALID CREDENTIALS");
        setLoginMessageType("error");
        return;
      }

      const data = await response.json();

      const decoded = decodeJwt(data.token);

      if (!decoded) {
        setLoginMessage("TOKEN VALIDATION FAILED");
        setLoginMessageType("error");
        return;
      }

      const jwtUsername = decoded.sub || username;
      const jwtRole = decoded.role || "";

      localStorage.setItem("jwtToken", data.token);
      localStorage.setItem("username", jwtUsername);
      localStorage.setItem("role", jwtRole);

      setToken(data.token);
      setLoggedUser(jwtUsername);
      setRole(jwtRole);

      setUsername("");
      setPassword("");

      setUserApiStatus(null);
      setAdminApiStatus(null);

      setLoginMessage("ACCESS GRANTED");
      setLoginMessageType("success");
    } catch (error) {
      setLoginMessage(
        "CONNECTION ERROR — SPRING BOOT SERVER UNAVAILABLE"
      );
      setLoginMessageType("error");
    }
  }

  // =========================================================
  // TEST PROTECTED API
  // =========================================================

  async function testApi(type) {
    const endpoint =
      type === "user"
        ? `${API_BASE}/api/user`
        : `${API_BASE}/api/admin`;

    const connectingStatus = {
      code: null,
      text: "CONNECTING...",
      success: false,
    };

    if (type === "user") {
      setUserApiStatus(connectingStatus);
    } else {
      setAdminApiStatus(connectingStatus);
    }

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseText = await response.text();

      const result = {
        code: response.status,
        text: responseText,
        success: response.ok,
      };

      if (type === "user") {
        setUserApiStatus(result);
      } else {
        setAdminApiStatus(result);
      }
    } catch (error) {
      const result = {
        code: "ERR",
        text: "Unable to connect to Spring Boot backend",
        success: false,
      };

      if (type === "user") {
        setUserApiStatus(result);
      } else {
        setAdminApiStatus(result);
      }
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  function logout() {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    setToken("");
    setLoggedUser("");
    setRole("");

    setUserApiStatus(null);
    setAdminApiStatus(null);

    setUsername("");
    setPassword("");

    setLoginMessage("");
    setLoginMessageType("");
  }

  // =========================================================
  // JWT INFORMATION
  // =========================================================

  const decodedToken = token ? decodeJwt(token) : null;

  const tokenRole = decodedToken?.role || role;
  const tokenUsername = decodedToken?.sub || loggedUser;

  const roleIsAdmin = tokenRole === "ADMIN";

  // =========================================================
  // LOGIN PAGE
  // =========================================================

  if (!token) {
    return (
      <div
        className={`app login-page ${
          theme === "light" ? "light-mode" : "dark-mode"
        }`}
      >
        <div className="bg-grid"></div>

        <div className="glow glow-one"></div>
        <div className="glow glow-two"></div>

        <div className="login-wrapper">

          {/* Theme Toggle */}
          <button
            className="theme-toggle login-theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          {/* Student Identity */}
          <div className="student-banner">
            <div className="student-avatar">
              TP
            </div>

            <div>
              <span className="student-label">
                STUDENT IDENTITY
              </span>

              <strong>{STUDENT_NAME}</strong>

              <small>UID: {STUDENT_UID}</small>
            </div>
          </div>

          {/* Login Card */}
          <div className="login-card">

            <div className="security-icon">
              🔐
            </div>

            <div className="system-label">
              SECURE ACCESS TERMINAL
            </div>

            <h1>
              Secure<span>Portal</span>
            </h1>

            <p className="login-subtitle">
              JWT AUTHENTICATION
              <span> × </span>
              ROLE-BASED ACCESS CONTROL
            </p>

            <div className="terminal-line">
              <span></span>
              SYSTEM ONLINE
            </div>

            <form onSubmit={handleLogin}>

              <div className="input-group">
                <label>USERNAME</label>

                <input
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="input-group">
                <label>PASSWORD</label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
              >
                <span>AUTHENTICATE</span>
                <span>→</span>
              </button>
            </form>

            {loginMessage && (
              <div
                className={`login-message ${loginMessageType}`}
              >
                {loginMessage}
              </div>
            )}

            {/* Demo Accounts */}
            <div className="demo-accounts">

              <div className="demo-title">
                DEMO CREDENTIALS
              </div>

              <div className="demo-row">
                <div>
                  <span className="role-dot admin-dot"></span>
                  <strong>ADMIN</strong>
                </div>

                <span>
                  admin / admin123
                </span>
              </div>

              <div className="demo-row">
                <div>
                  <span className="role-dot user-dot"></span>
                  <strong>USER</strong>
                </div>

                <span>
                  user / user123
                </span>
              </div>

            </div>
          </div>

          {/* Login Footer */}
          <div className="login-footer">
            <span>SPRING SECURITY</span>
            <span>JWT</span>
            <span>RBAC</span>
            <span>STATELESS AUTH</span>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div
      className={`app dashboard-page ${
        theme === "light" ? "light-mode" : "dark-mode"
      }`}
    >
      <div className="bg-grid"></div>

      <div className="dashboard-glow"></div>

      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <header className="topbar">

        {/* Brand */}
        <div className="brand-area">

          <div className="brand-logo">
            🔐
          </div>

          <div>
            <h2>
              Secure<span>Portal</span>
            </h2>

            <small>
              JWT SECURITY OPERATIONS
            </small>
          </div>

        </div>

        {/* Student Details */}
        <div className="student-info">

          <span className="student-info-label">
            PROJECT OWNER
          </span>

          <strong>
            {STUDENT_NAME}
          </strong>

          <small>
            UID: {STUDENT_UID}
          </small>

        </div>

        {/* Profile */}
        <div className="profile-area">

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            type="button"
            title="Change theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <div className="profile-avatar">
            {tokenUsername
              ? tokenUsername.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="profile-details">

            <strong>
              {tokenUsername}
            </strong>

            <span
              className={
                roleIsAdmin
                  ? "role-badge admin-role"
                  : "role-badge user-role"
              }
            >
              {tokenRole}
            </span>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            <span>↪</span>
            LOGOUT
          </button>

        </div>
      </header>

      {/* =====================================================
          MAIN DASHBOARD
      ====================================================== */}

      <main className="dashboard-content">

        {/* Hero Section */}
        <section className="hero-section">

          <div className="hero-left">

            <div className="online-indicator">
              <span className="pulse"></span>
              SECURE SESSION ACTIVE
            </div>

            <h1>
              Welcome back,
              <br />
              <span>{tokenUsername}</span>
            </h1>

            <p>
              Your identity has been authenticated using
              <strong> JSON Web Token</strong> and your
              permissions are enforced through
              <strong> Role-Based Access Control.</strong>
            </p>

          </div>

          <div className="hero-security">

            <div className="shield-ring">

              <div className="shield">
                🛡️
              </div>

            </div>

            <span>
              SYSTEM
            </span>

            <strong>
              PROTECTED
            </strong>

          </div>

        </section>

        {/* ===================================================
            SECURITY OVERVIEW
        ==================================================== */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">
              👤
            </div>

            <div>
              <span>IDENTITY</span>
              <strong>{tokenUsername}</strong>
            </div>

            <div className="stat-status">
              VERIFIED
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              🛡️
            </div>

            <div>
              <span>ROLE</span>
              <strong>{tokenRole}</strong>
            </div>

            <div className="stat-status">
              AUTHORIZED
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              🔑
            </div>

            <div>
              <span>AUTH METHOD</span>
              <strong>JWT</strong>
            </div>

            <div className="stat-status">
              VALID
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ⚡
            </div>

            <div>
              <span>SESSION MODE</span>
              <strong>STATELESS</strong>
            </div>

            <div className="stat-status">
              ACTIVE
            </div>

          </div>

        </section>

        {/* ===================================================
            PROTECTED APIs
        ==================================================== */}

        <section className="api-section">

          <div className="section-heading">

            <div>
              <span>
                PROTECTED RESOURCES
              </span>

              <h2>
                API Access Control
              </h2>
            </div>

            <div className="security-tag">
              SPRING SECURITY
            </div>

          </div>

          <div className="api-grid">

            {/* USER API */}
            <div className="api-card">

              <div className="api-card-top">

                <div className="api-icon user-api-icon">
                  👤
                </div>

                <div className="api-status allowed">
                  ● ACCESSIBLE
                </div>

              </div>

              <div className="api-card-header">

                <div>
                  <h3>User API</h3>

                  <code>
                    GET /api/user
                  </code>
                </div>

              </div>

              <p>
                Available to both USER and ADMIN roles.
                Demonstrates authenticated API access.
              </p>

              <div className="access-line">
                <span>USER</span>
                <span>ADMIN</span>
              </div>

              <div className="access-bars">
                <div className="access-bar active"></div>
                <div className="access-bar active"></div>
              </div>

              <button
                className="api-button"
                onClick={() => testApi("user")}
              >
                <span>TEST USER API</span>
                <span>→</span>
              </button>

              {userApiStatus && (
                <div
                  className={`api-result ${
                    userApiStatus.success
                      ? "api-success"
                      : "api-error"
                  }`}
                >
                  <div>

                    <strong>
                      {userApiStatus.code !== null
                        ? `HTTP ${userApiStatus.code}`
                        : "..."}
                    </strong>

                    <span>
                      {userApiStatus.success
                        ? "ACCESS GRANTED"
                        : "REQUEST FAILED"}
                    </span>

                  </div>

                  <p>
                    {userApiStatus.text}
                  </p>

                </div>
              )}

            </div>

            {/* ADMIN API */}
            <div
              className={`api-card ${
                roleIsAdmin
                  ? "admin-api-card"
                  : "restricted-api-card"
              }`}
            >

              <div className="api-card-top">

                <div className="api-icon admin-api-icon">
                  {roleIsAdmin ? "🛡️" : "🔒"}
                </div>

                <div
                  className={
                    roleIsAdmin
                      ? "api-status allowed"
                      : "api-status restricted"
                  }
                >
                  {roleIsAdmin
                    ? "● ACCESSIBLE"
                    : "● RESTRICTED"}
                </div>

              </div>

              <div className="api-card-header">

                <div>
                  <h3>
                    Admin API
                  </h3>

                  <code>
                    GET /api/admin
                  </code>
                </div>

              </div>

              <p>
                Restricted resource protected by
                method-level role authorization.
              </p>

              <div className="access-line">

                <span
                  className={
                    roleIsAdmin
                      ? "access-allowed"
                      : "access-denied"
                  }
                >
                  USER
                </span>

                <span className="access-allowed">
                  ADMIN
                </span>

              </div>

              <div className="access-bars">

                <div className="access-bar denied"></div>

                <div className="access-bar active"></div>

              </div>

              <button
                className="api-button"
                onClick={() => testApi("admin")}
              >
                <span>TEST ADMIN API</span>
                <span>→</span>
              </button>

              {adminApiStatus && (
                <div
                  className={`api-result ${
                    adminApiStatus.success
                      ? "api-success"
                      : "api-error"
                  }`}
                >
                  <div>

                    <strong>
                      {adminApiStatus.code !== null
                        ? `HTTP ${adminApiStatus.code}`
                        : "..."}
                    </strong>

                    <span>
                      {adminApiStatus.success
                        ? "ACCESS GRANTED"
                        : adminApiStatus.code === 403
                        ? "FORBIDDEN"
                        : "REQUEST FAILED"}
                    </span>

                  </div>

                  <p>
                    {adminApiStatus.code === 403
                      ? "Authenticated successfully, but ADMIN permission is required."
                      : adminApiStatus.text}
                  </p>

                </div>
              )}

            </div>

          </div>
        </section>

        {/* ===================================================
            JWT INSPECTOR
        ==================================================== */}

        <section className="jwt-section">

          <div className="section-heading">

            <div>
              <span>
                TOKEN INSPECTOR
              </span>

              <h2>
                JWT Session Information
              </h2>
            </div>

            <div className="jwt-valid-badge">
              ● TOKEN VALID
            </div>

          </div>

          <div className="jwt-panel">

            <div className="jwt-panel-header">

              <div className="token-title">
                <span className="mini-dot"></span>
                ACCESS TOKEN
              </div>

              <span className="token-type">
                Bearer
              </span>

            </div>

            <div className="token-preview">

              {token.substring(0, 45)}
              ...
              {token.substring(
                Math.max(0, token.length - 20)
              )}

            </div>

            <div className="token-parts">

              <div className="token-part header-part">
                <span>01</span>
                <strong>HEADER</strong>
                <small>JWT</small>
              </div>

              <div className="token-part payload-part">
                <span>02</span>
                <strong>PAYLOAD</strong>
                <small>
                  Role: {tokenRole}
                </small>
              </div>

              <div className="token-part signature-part">
                <span>03</span>
                <strong>SIGNATURE</strong>
                <small>VERIFIED</small>
              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            RBAC MATRIX
        ==================================================== */}

        <section className="rbac-section">

          <div className="section-heading">

            <div>
              <span>
                AUTHORIZATION MATRIX
              </span>

              <h2>
                Role-Based Access Control
              </h2>
            </div>

          </div>

          <div className="rbac-table">

            <div className="rbac-row rbac-header">

              <span>ROLE</span>

              <span>/api/user</span>

              <span>/api/admin</span>

            </div>

            <div className="rbac-row">

              <span className="matrix-role user-matrix">
                USER
              </span>

              <span className="matrix-allow">
                ✓ ALLOW
              </span>

              <span className="matrix-deny">
                ✕ DENY
              </span>

            </div>

            <div className="rbac-row">

              <span className="matrix-role admin-matrix">
                ADMIN
              </span>

              <span className="matrix-allow">
                ✓ ALLOW
              </span>

              <span className="matrix-allow">
                ✓ ALLOW
              </span>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="dashboard-footer">

        <div>
          <strong>
            SecurePortal
          </strong>

          <span>
            JWT Authentication + Spring Security + RBAC
          </span>
        </div>

        <div>
          <span>
            {STUDENT_NAME}
          </span>

          <span>
            UID: {STUDENT_UID}
          </span>
        </div>

        <div>
          <span className="footer-online">
            ● SYSTEM ONLINE
          </span>
        </div>

      </footer>
    </div>
  );
}

export default App;