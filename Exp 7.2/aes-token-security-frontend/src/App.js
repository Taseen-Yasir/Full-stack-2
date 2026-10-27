import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8081";

const STUDENT_NAME = "Taseen Yasir Pritam";
const STUDENT_UID = "24BAI70036";

/*
  Separate localStorage keys for Exp 7.2.
  This prevents Exp 7.1 tokens from interfering with Exp 7.2.
*/
const ACCESS_KEY = "exp72_accessToken";
const REFRESH_KEY = "exp72_refreshToken";
const USER_KEY = "exp72_username";
const ROLE_KEY = "exp72_role";
const THEME_KEY = "exp72_theme";

// =========================================================
// JWT DECODER
// =========================================================

function decodeJwt(token) {
  try {
    if (!token) return null;

    const payload = token.split(".")[1];

    if (!payload) return null;

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded =
      base64 +
      "=".repeat(
        (4 - (base64.length % 4)) % 4
      );

    return JSON.parse(atob(padded));
  } catch (error) {
    return null;
  }
}

// =========================================================
// APP
// =========================================================

function App() {
  // =======================================================
  // THEME
  // =======================================================

  const [theme, setTheme] = useState(
    localStorage.getItem(THEME_KEY) || "dark"
  );

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark"
        ? "light"
        : "dark"
    );
  }

  // =======================================================
  // AUTH STATE
  // =======================================================

  const [token, setToken] = useState(
    localStorage.getItem(ACCESS_KEY) || ""
  );

  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem(REFRESH_KEY) || ""
  );

  const [loggedUser, setLoggedUser] = useState(
    localStorage.getItem(USER_KEY) || ""
  );

  const [role, setRole] = useState(
    localStorage.getItem(ROLE_KEY) || ""
  );

  // =======================================================
  // LOGIN
  // =======================================================

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loginMessage, setLoginMessage] = useState("");
  const [loginMessageType, setLoginMessageType] =
    useState("");

  // =======================================================
  // API STATES
  // =======================================================

  const [userApiStatus, setUserApiStatus] =
    useState(null);

  const [adminApiStatus, setAdminApiStatus] =
    useState(null);

  const [aesApiStatus, setAesApiStatus] =
    useState(null);

  // =======================================================
  // TOKEN STATES
  // =======================================================

  const [refreshMessage, setRefreshMessage] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [logoutMessage, setLogoutMessage] =
    useState("");

  // =======================================================
  // DECODE CURRENT TOKEN
  // =======================================================

  const decodedToken = token
    ? decodeJwt(token)
    : null;

  const tokenUsername =
    decodedToken?.sub || loggedUser;

  const tokenRole =
    decodedToken?.role || role;

  const roleIsAdmin =
    tokenRole === "ADMIN";

  const tokenExpiry =
    decodedToken?.exp
      ? decodedToken.exp * 1000
      : null;

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  // =======================================================
  // TOKEN COUNTDOWN
  // =======================================================

  useEffect(() => {
    function updateCountdown() {
      if (!tokenExpiry) {
        setSecondsLeft(0);
        return;
      }

      const remaining = Math.max(
        0,
        Math.floor(
          (tokenExpiry - Date.now()) / 1000
        )
      );

      setSecondsLeft(remaining);
    }

    updateCountdown();

    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => clearInterval(interval);
  }, [tokenExpiry]);

  function formatTime(seconds) {
    if (seconds <= 0) {
      return "EXPIRED";
    }

    const minutes =
      Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${minutes}m ${secs
      .toString()
      .padStart(2, "0")}s`;
  }

  // =======================================================
  // LOGIN
  // =======================================================

  async function handleLogin(event) {
    event.preventDefault();

    setLoginMessage("AUTHENTICATING...");
    setLoginMessageType("loading");

    try {
      const response = await fetch(
        `${API_BASE}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage(
          typeof data === "string"
            ? data
            : "ACCESS DENIED — INVALID CREDENTIALS"
        );

        setLoginMessageType("error");
        return;
      }

      if (
        !data.accessToken ||
        !data.refreshToken
      ) {
        setLoginMessage(
          "INVALID TOKEN RESPONSE FROM SERVER"
        );

        setLoginMessageType("error");
        return;
      }

      const decoded =
        decodeJwt(data.accessToken);

      if (!decoded) {
        setLoginMessage(
          "TOKEN VALIDATION FAILED"
        );

        setLoginMessageType("error");
        return;
      }

      const jwtUsername =
        decoded.sub || username;

      const jwtRole =
        decoded.role || "";

      // Store Exp 7.2 tokens separately
      localStorage.setItem(
        ACCESS_KEY,
        data.accessToken
      );

      localStorage.setItem(
        REFRESH_KEY,
        data.refreshToken
      );

      localStorage.setItem(
        USER_KEY,
        jwtUsername
      );

      localStorage.setItem(
        ROLE_KEY,
        jwtRole
      );

      // React state
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setLoggedUser(jwtUsername);
      setRole(jwtRole);

      // Reset
      setUsername("");
      setPassword("");

      setUserApiStatus(null);
      setAdminApiStatus(null);
      setAesApiStatus(null);

      setRefreshMessage("");
      setLogoutMessage("");

      setLoginMessage(
        "ACCESS GRANTED"
      );

      setLoginMessageType("success");

    } catch (error) {
      setLoginMessage(
        "CONNECTION ERROR — SERVER UNAVAILABLE"
      );

      setLoginMessageType("error");
    }
  }

  // =======================================================
  // REFRESH ACCESS TOKEN
  // =======================================================

  async function refreshAccessToken() {
    const storedRefreshToken =
      localStorage.getItem(REFRESH_KEY) ||
      refreshToken;

    if (!storedRefreshToken) {
      setRefreshMessage(
        "NO REFRESH TOKEN AVAILABLE"
      );

      return false;
    }

    setRefreshing(true);
    setRefreshMessage(
      "ROTATING REFRESH TOKEN..."
    );

    try {
      const response = await fetch(
        `${API_BASE}/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            refreshToken:
              storedRefreshToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRefreshMessage(
          typeof data === "string"
            ? data
            : "REFRESH TOKEN INVALID"
        );

        setRefreshing(false);

        return false;
      }

      if (
        !data.accessToken ||
        !data.refreshToken
      ) {
        setRefreshMessage(
          "INVALID REFRESH RESPONSE"
        );

        setRefreshing(false);

        return false;
      }

      const decoded =
        decodeJwt(data.accessToken);

      if (!decoded) {
        setRefreshMessage(
          "NEW ACCESS TOKEN INVALID"
        );

        setRefreshing(false);

        return false;
      }

      const newUsername =
        decoded.sub || tokenUsername;

      const newRole =
        decoded.role || tokenRole;

      // Save new rotated tokens
      localStorage.setItem(
        ACCESS_KEY,
        data.accessToken
      );

      localStorage.setItem(
        REFRESH_KEY,
        data.refreshToken
      );

      localStorage.setItem(
        USER_KEY,
        newUsername
      );

      localStorage.setItem(
        ROLE_KEY,
        newRole
      );

      // Update state
      setToken(data.accessToken);

      setRefreshToken(
        data.refreshToken
      );

      setLoggedUser(newUsername);
      setRole(newRole);

      setRefreshMessage(
        "ACCESS TOKEN REFRESHED • REFRESH TOKEN ROTATED"
      );

      setRefreshing(false);

      return true;

    } catch (error) {
      setRefreshMessage(
        "REFRESH ERROR — SERVER UNAVAILABLE"
      );

      setRefreshing(false);

      return false;
    }
  }

  // =======================================================
  // AUTHORIZED API REQUEST
  // Automatically refreshes on 401
  // =======================================================

  async function makeAuthorizedRequest(
    endpoint,
    options = {}
  ) {
    let currentToken =
      localStorage.getItem(
        ACCESS_KEY
      );

    let response = await fetch(
      endpoint,
      {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization:
            `Bearer ${currentToken}`,
        },
      }
    );

    if (response.status === 401) {
      const refreshed =
        await refreshAccessToken();

      if (!refreshed) {
        return response;
      }

      currentToken =
        localStorage.getItem(
          ACCESS_KEY
        );

      response = await fetch(
        endpoint,
        {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization:
              `Bearer ${currentToken}`,
          },
        }
      );
    }

    return response;
  }

  // =======================================================
  // USER / ADMIN API
  // =======================================================

  async function testApi(type) {
    const endpoint =
      type === "user"
        ? `${API_BASE}/api/user`
        : `${API_BASE}/api/admin`;

    const loadingState = {
      code: null,
      text: "CONNECTING...",
      success: false,
    };

    if (type === "user") {
      setUserApiStatus(loadingState);
    } else {
      setAdminApiStatus(loadingState);
    }

    try {
      const response =
        await makeAuthorizedRequest(
          endpoint,
          {
            method: "GET",
          }
        );

      const responseText =
        await response.text();

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
        text:
          "Unable to connect to Spring Boot backend",
        success: false,
      };

      if (type === "user") {
        setUserApiStatus(result);
      } else {
        setAdminApiStatus(result);
      }
    }
  }

  // =======================================================
  // AES ENCRYPTION TEST
  // =======================================================

  async function testAes() {
    setAesApiStatus({
      code: null,
      text: "ENCRYPTING...",
      success: false,
    });

    try {
      const response =
        await makeAuthorizedRequest(
          `${API_BASE}/api/aes/encrypt`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              text:
                "my-secret-oauth-token",
            }),
          }
        );

      const data =
        await response.json();

      setAesApiStatus({
        code: response.status,
        text:
          data.cipherText ||
          "Encryption failed",
        success: response.ok,
      });

    } catch (error) {
      setAesApiStatus({
        code: "ERR",
        text:
          "AES service unavailable",
        success: false,
      });
    }
  }

  // =======================================================
  // LOGOUT / REVOCATION
  // =======================================================

  async function logout() {
    const storedRefreshToken =
      localStorage.getItem(
        REFRESH_KEY
      ) || refreshToken;

    setLogoutMessage(
      "REVOKING SESSION..."
    );

    try {
      if (storedRefreshToken) {
        await fetch(
          `${API_BASE}/auth/logout`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              refreshToken:
                storedRefreshToken,
            }),
          }
        );
      }
    } catch (error) {
      // Continue local logout
    }

    localStorage.removeItem(
      ACCESS_KEY
    );

    localStorage.removeItem(
      REFRESH_KEY
    );

    localStorage.removeItem(
      USER_KEY
    );

    localStorage.removeItem(
      ROLE_KEY
    );

    setToken("");
    setRefreshToken("");
    setLoggedUser("");
    setRole("");

    setUsername("");
    setPassword("");

    setUserApiStatus(null);
    setAdminApiStatus(null);
    setAesApiStatus(null);

    setRefreshMessage("");

    setLogoutMessage("");

    setLoginMessage("");
    setLoginMessageType("");
  }

  // =======================================================
  // LOGIN PAGE
  // =======================================================

  if (!token) {
    return (
      <div
        className={`app login-page ${
          theme === "light"
            ? "light-mode"
            : "dark-mode"
        }`}
      >
        <div className="bg-grid"></div>

        <div className="glow glow-one"></div>
        <div className="glow glow-two"></div>

        <div className="login-wrapper">

          {/* Theme */}
          <button
            className="theme-toggle login-theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            {theme === "dark"
              ? "☀️ Light Mode"
              : "🌙 Dark Mode"}
          </button>

          {/* Student */}
          <div className="student-banner">

            <div className="student-avatar">
              TP
            </div>

            <div>

              <span className="student-label">
                SECURITY PROJECT
              </span>

              <strong>
                {STUDENT_NAME}
              </strong>

              <small>
                UID: {STUDENT_UID}
              </small>

            </div>

          </div>

          {/* Login */}
          <div className="login-card">

            <div className="security-icon">
              🔐
            </div>

            <div className="system-label">
              SECURE TOKEN VAULT
            </div>

            <h1>
              Secure<span>Vault</span>
            </h1>

            <p className="login-subtitle">
              AES-GCM
              <span> × </span>
              TOKEN LIFECYCLE
              <span> × </span>
              SECURE STORAGE
            </p>

            <div className="terminal-line">
              <span></span>
              SECURITY SYSTEM ONLINE
            </div>

            <form
              onSubmit={handleLogin}
            >

              <div className="input-group">

                <label>
                  USERNAME
                </label>

                <input
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />

              </div>

              <div className="input-group">

                <label>
                  PASSWORD
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
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
                <span>
                  START SECURE SESSION
                </span>

                <span>
                  →
                </span>

              </button>

            </form>

            {loginMessage && (
              <div
                className={`login-message ${loginMessageType}`}
              >
                {loginMessage}
              </div>
            )}

            {/* Demo accounts */}
            <div className="demo-accounts">

              <div className="demo-title">
                DEMO CREDENTIALS
              </div>

              <div className="demo-row">

                <div>

                  <span className="role-dot admin-dot"></span>

                  <strong>
                    ADMIN
                  </strong>

                </div>

                <span>
                  admin / admin123
                </span>

              </div>

              <div className="demo-row">

                <div>

                  <span className="role-dot user-dot"></span>

                  <strong>
                    USER
                  </strong>

                </div>

                <span>
                  user / user123
                </span>

              </div>

            </div>

          </div>

          <div className="login-footer">

            <span>
              AES-256-GCM
            </span>

            <span>
              ACCESS TOKEN
            </span>

            <span>
              REFRESH TOKEN
            </span>

            <span>
              ROTATION
            </span>

          </div>

        </div>
      </div>
    );
  }

  // =======================================================
  // DASHBOARD
  // =======================================================

  return (
    <div
      className={`app dashboard-page ${
        theme === "light"
          ? "light-mode"
          : "dark-mode"
      }`}
    >

      <div className="bg-grid"></div>

      <div className="dashboard-glow"></div>

      {/* TOP BAR */}
      <header className="topbar">

        <div className="brand-area">

          <div className="brand-logo">
            🔐
          </div>

          <div>

            <h2>
              Secure<span>Vault</span>
            </h2>

            <small>
              AES + TOKEN SECURITY
            </small>

          </div>

        </div>

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

        <div className="profile-area">

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            type="button"
          >
            {theme === "dark"
              ? "☀️"
              : "🌙"}
          </button>

          <div className="profile-avatar">
            {tokenUsername
              ? tokenUsername
                  .charAt(0)
                  .toUpperCase()
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

      <main className="dashboard-content">

        {/* HERO */}
        <section className="hero-section">

          <div className="hero-left">

            <div className="online-indicator">
              <span className="pulse"></span>
              SECURE SESSION ACTIVE
            </div>

            <h1>
              Secure session,
              <br />
              <span>
                {tokenUsername}
              </span>
            </h1>

            <p>
              This security layer protects
              sensitive data with
              <strong> AES-GCM </strong>
              and manages short-lived
              <strong> access tokens </strong>
              through
              <strong> refresh-token rotation.</strong>
            </p>

          </div>

          <div className="hero-security">

            <div className="shield-ring">

              <div className="shield">
                🛡️
              </div>

            </div>

            <span>
              SECURITY
            </span>

            <strong>
              VAULT ACTIVE
            </strong>

          </div>

        </section>

        {/* STATS */}
        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">
              🔐
            </div>

            <div>

              <span>
                DATA PROTECTION
              </span>

              <strong>
                AES-256-GCM
              </strong>

            </div>

            <div className="stat-status">
              SECURE
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              🔑
            </div>

            <div>

              <span>
                ACCESS TOKEN
              </span>

              <strong>
                {secondsLeft > 0
                  ? formatTime(secondsLeft)
                  : "EXPIRED"}
              </strong>

            </div>

            <div className="stat-status">
              {secondsLeft > 0
                ? "VALID"
                : "EXPIRED"}
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              🔄
            </div>

            <div>

              <span>
                REFRESH TOKEN
              </span>

              <strong>
                ACTIVE
              </strong>

            </div>

            <div className="stat-status">
              ROTATABLE
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              🗄️
            </div>

            <div>

              <span>
                STORAGE
              </span>

              <strong>
                H2 + JPA
              </strong>

            </div>

            <div className="stat-status">
              ENCRYPTED
            </div>

          </div>

        </section>

        {/* TOKEN LIFECYCLE */}
        <section className="api-section">

          <div className="section-heading">

            <div>

              <span>
                TOKEN LIFECYCLE
              </span>

              <h2>
                Access & Refresh Control
              </h2>

            </div>

            <div className="security-tag">
              SECURE SESSION
            </div>

          </div>

          <div className="api-grid">

            {/* ACCESS TOKEN */}
            <div className="api-card">

              <div className="api-card-top">

                <div className="api-icon user-api-icon">
                  🔑
                </div>

                <div className="api-status allowed">
                  ● ACTIVE
                </div>

              </div>

              <div className="api-card-header">

                <div>

                  <h3>
                    Access Token
                  </h3>

                  <code>
                    Short-Lived JWT
                  </code>

                </div>

              </div>

              <p>
                Short-lived token used to
                access protected resources.
              </p>

              <div className="access-line">

                <span>
                  STATUS
                </span>

                <span>
                  {secondsLeft > 0
                    ? formatTime(secondsLeft)
                    : "EXPIRED"}
                </span>

              </div>

              <div className="access-bars">

                <div
                  className={
                    secondsLeft > 0
                      ? "access-bar active"
                      : "access-bar denied"
                  }
                ></div>

                <div className="access-bar active"></div>

              </div>

              <button
                className="api-button"
                onClick={() =>
                  testApi("user")
                }
              >
                <span>
                  TEST PROTECTED API
                </span>

                <span>
                  →
                </span>
              </button>

            </div>

            {/* REFRESH TOKEN */}
            <div className="api-card admin-api-card">

              <div className="api-card-top">

                <div className="api-icon admin-api-icon">
                  🔄
                </div>

                <div className="api-status allowed">
                  ● ACTIVE
                </div>

              </div>

              <div className="api-card-header">

                <div>

                  <h3>
                    Refresh Token
                  </h3>

                  <code>
                    POST /auth/refresh
                  </code>

                </div>

              </div>

              <p>
                Generates a new access token
                and rotates the previous
                refresh token.
              </p>

              <div className="access-line">

                <span>
                  ROTATION
                </span>

                <span>
                  ENABLED
                </span>

              </div>

              <div className="access-bars">

                <div className="access-bar active"></div>

                <div className="access-bar active"></div>

              </div>

              <button
                className="api-button"
                onClick={refreshAccessToken}
                disabled={refreshing}
              >
                <span>
                  {refreshing
                    ? "ROTATING..."
                    : "ROTATE ACCESS TOKEN"}
                </span>

                <span>
                  ↻
                </span>

              </button>

              {refreshMessage && (
                <div className="api-result api-success">

                  <div>

                    <strong>
                      TOKEN EVENT
                    </strong>

                    <span>
                      UPDATED
                    </span>

                  </div>

                  <p>
                    {refreshMessage}
                  </p>

                </div>
              )}

            </div>

          </div>

        </section>

        {/* AES */}
        <section className="api-section">

          <div className="section-heading">

            <div>

              <span>
                DATA PROTECTION
              </span>

              <h2>
                AES-GCM Encryption
              </h2>

            </div>

            <div className="security-tag">
              AES-256-GCM
            </div>

          </div>

          <div className="api-grid">

            {/* ENCRYPTION */}
            <div className="api-card">

              <div className="api-card-top">

                <div className="api-icon user-api-icon">
                  🔐
                </div>

                <div className="api-status allowed">
                  ● PROTECTED
                </div>

              </div>

              <div className="api-card-header">

                <div>

                  <h3>
                    Credential Encryption
                  </h3>

                  <code>
                    POST /api/aes/encrypt
                  </code>

                </div>

              </div>

              <p>
                Protects recoverable sensitive
                credentials with AES-GCM.
              </p>

              <div className="access-line">

                <span>
                  ALGORITHM
                </span>

                <span>
                  AES/GCM
                </span>

              </div>

              <div className="access-bars">

                <div className="access-bar active"></div>

                <div className="access-bar active"></div>

              </div>

              <button
                className="api-button"
                onClick={testAes}
              >
                <span>
                  TEST AES ENCRYPTION
                </span>

                <span>
                  →
                </span>

              </button>

              {aesApiStatus && (
                <div
                  className={`api-result ${
                    aesApiStatus.success
                      ? "api-success"
                      : "api-error"
                  }`}
                >

                  <div>

                    <strong>
                      {aesApiStatus.code !== null
                        ? `HTTP ${aesApiStatus.code}`
                        : "..."}
                    </strong>

                    <span>
                      {aesApiStatus.success
                        ? "ENCRYPTED"
                        : "FAILED"}
                    </span>

                  </div>

                  <p>
                    {aesApiStatus.text}
                  </p>

                </div>
              )}

            </div>

            {/* SECURE STORAGE */}
            <div className="api-card admin-api-card">

              <div className="api-card-top">

                <div className="api-icon admin-api-icon">
                  🗄️
                </div>

                <div className="api-status allowed">
                  ● SECURE
                </div>

              </div>

              <div className="api-card-header">

                <div>

                  <h3>
                    Secure Storage
                  </h3>

                  <code>
                    H2 + JPA
                  </code>

                </div>

              </div>

              <p>
                OAuth credentials and refresh
                token records are persisted
                through the database layer.
              </p>

              <div className="access-line">

                <span>
                  STORAGE
                </span>

                <span>
                  PROTECTED
                </span>

              </div>

              <div className="access-bars">

                <div className="access-bar active"></div>

                <div className="access-bar active"></div>

              </div>

              <button
                className="api-button"
                onClick={testAes}
              >
                <span>
                  VERIFY ENCRYPTION
                </span>

                <span>
                  →
                </span>
              </button>

            </div>

          </div>

        </section>

        {/* PROTECTED APIs */}
        <section className="api-section">

          <div className="section-heading">

            <div>

              <span>
                PROTECTED RESOURCES
              </span>

              <h2>
                RBAC API Access
              </h2>

            </div>

            <div className="security-tag">
              ROLE CONTROL
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
                  ● AVAILABLE
                </div>

              </div>

              <div className="api-card-header">

                <div>

                  <h3>
                    User API
                  </h3>

                  <code>
                    GET /api/user
                  </code>

                </div>

              </div>

              <p>
                Authenticated users can access
                this protected resource.
              </p>

              <div className="access-line">

                <span>
                  USER
                </span>

                <span>
                  ADMIN
                </span>

              </div>

              <div className="access-bars">

                <div className="access-bar active"></div>

                <div className="access-bar active"></div>

              </div>

              <button
                className="api-button"
                onClick={() =>
                  testApi("user")
                }
              >
                <span>
                  TEST USER API
                </span>

                <span>
                  →
                </span>
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
                  {roleIsAdmin
                    ? "🛡️"
                    : "🔒"}
                </div>

                <div
                  className={
                    roleIsAdmin
                      ? "api-status allowed"
                      : "api-status restricted"
                  }
                >
                  {roleIsAdmin
                    ? "● AVAILABLE"
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
                Available only when the
                authenticated user has ADMIN role.
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
                onClick={() =>
                  testApi("admin")
                }
              >
                <span>
                  TEST ADMIN API
                </span>

                <span>
                  →
                </span>
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

        {/* TOKEN INSPECTOR */}
        <section className="jwt-section">

          <div className="section-heading">

            <div>

              <span>
                TOKEN INSPECTOR
              </span>

              <h2>
                Active Security Session
              </h2>

            </div>

            <div className="jwt-valid-badge">
              {secondsLeft > 0
                ? "● TOKEN VALID"
                : "● TOKEN EXPIRED"}
            </div>

          </div>

          <div className="jwt-panel">

            <div className="jwt-panel-header">

              <div className="token-title">

                <span className="mini-dot"></span>

                ACCESS TOKEN

              </div>

              <span className="token-type">
                Bearer JWT
              </span>

            </div>

            <div className="token-preview">

              {token.substring(0, 45)}
              ...
              {token.substring(
                Math.max(
                  0,
                  token.length - 20
                )
              )}

            </div>

            <div className="token-parts">

              <div className="token-part header-part">

                <span>
                  01
                </span>

                <strong>
                  HEADER
                </strong>

                <small>
                  JWT
                </small>

              </div>

              <div className="token-part payload-part">

                <span>
                  02
                </span>

                <strong>
                  PAYLOAD
                </strong>

                <small>
                  Role: {tokenRole}
                </small>

              </div>

              <div className="token-part signature-part">

                <span>
                  03
                </span>

                <strong>
                  EXPIRATION
                </strong>

                <small>
                  {secondsLeft > 0
                    ? formatTime(secondsLeft)
                    : "EXPIRED"}
                </small>

              </div>

            </div>

          </div>

        </section>

        {/* RBAC */}
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

              <span>
                ROLE
              </span>

              <span>
                /api/user
              </span>

              <span>
                /api/admin
              </span>

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

      {/* FOOTER */}
      <footer className="dashboard-footer">

        <div>

          <strong>
            SecureVault
          </strong>

          <span>
            AES + Access/Refresh Token Security
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