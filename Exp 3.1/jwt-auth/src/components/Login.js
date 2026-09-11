import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "Taseen" && password === "24BAI70036") {
      const payload = {
        username,
        role: "Admin",
      };

      const token = btoa(JSON.stringify(payload));

      localStorage.setItem("token", token);

      navigate("/dashboard");
    } else {
      alert("Invalid Username or Password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="logo">🔒</div>

        <h1>JWT Authentication</h1>

        <p className="subtitle">Sign in to continue</p>

        <form onSubmit={handleLogin}>

          <input
            type="text"
            placeholder="👤 Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="🔑 Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">
            Sign In
          </button>

        </form>

        <div className="demo">
          <h4>Demo Credentials</h4>
          <p><b>Username:</b> Taseen</p>
          <p><b>Password:</b> 24BAI70036</p>
        </div>

        <p className="signup">
          Don't have an account? <span>Sign Up</span>
        </p>

      </div>
    </div>
  );
}

export default Login;