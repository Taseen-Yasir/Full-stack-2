import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserShield,
  FaUserEdit,
  FaUser
} from "react-icons/fa";

function Login() {

  const { login } = useContext(AuthContext);

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {

    const success = login(username, password);

    if (!success) {
      setError("Invalid username or password");
      return;
    }

    if (username === "admin") {

      navigate("/admin");

    } else if (username === "Taseen") {

      navigate("/editor");

    } else {

      navigate("/viewer");

    }

  };

  return (

    <div className="login-page">

      <div className="login-card">

        <FaLock className="lock-icon" />

        <h2>Role Based Access Control</h2>

        <p>Secure Authentication System</p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
        />

        <div className="password-box">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>

        </div>

        {error && <p className="error">{error}</p>}

        <button
          className="login-btn"
          onClick={handleLogin}
        >
          Login
        </button>

        <div className="roles">

          <div className="role-card">

            <FaUserShield className="role-icon" />

            <h4>Admin</h4>

          </div>

          <div className="role-card">

            <FaUserEdit className="role-icon" />

            <h4>Editor</h4>

          </div>

          <div className="role-card">

            <FaUser className="role-icon" />

            <h4>Viewer</h4>

          </div>

        </div>

        <div className="demo">

          <h4>Demo Credentials</h4>

          <p>
            👑 <strong>Admin:</strong> admin / password123
          </p>

          <p>
            ✏️ <strong>Editor:</strong> Taseen / 24BAI70036
          </p>

          <p>
            👁 <strong>Viewer:</strong> viewer / viewer123
          </p>

        </div>

      </div>

    </div>

  );

}

export default Login;