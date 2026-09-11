import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaUserCircle, FaSignOutAlt, FaShieldAlt } from "react-icons/fa";

function Navbar() {

  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">

      <div className="logo">
        <FaShieldAlt className="logo-icon" />
        <span>RBAC Portal</span>
      </div>

      <div className="nav-links">

        <Link to="/">Home</Link>

        {user && (
          <>
            <Link to="/viewer">Viewer</Link>

            {(user.role === "editor" || user.role === "admin") && (
              <Link to="/editor">Editor</Link>
            )}

            {user.role === "admin" && (
              <Link to="/admin">Admin</Link>
            )}
          </>
        )}

      </div>

      <div className="user-section">

        {user ? (
          <>
            <div className="user-details">

              <FaUserCircle size={24} />

              <span>
                {user.username} ({user.role})
              </span>

            </div>

            <button
              className="logout-btn"
              onClick={logout}
            >
              <FaSignOutAlt />
              Logout
            </button>
          </>
        ) : (
          <Link className="login-link" to="/login">
            Login
          </Link>
        )}

      </div>

    </nav>
  );
}

export default Navbar;