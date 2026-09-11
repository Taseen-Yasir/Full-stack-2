import { useNavigate } from "react-router-dom";

function Dashboard() {

  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const user = JSON.parse(atob(token));

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-page">

      <div className="dashboard-card">

        <h1>Dashboard</h1>

        <div className="profile">

          <div className="avatar">
            👤
          </div>

          <h2>{user.username}</h2>

          <p><b>Role:</b> {user.role}</p>

          <p className="status">
            🟢 Authentication Successful
          </p>

        </div>

        <div className="token-box">
          <h3>JWT Token</h3>

          <textarea
            value={token}
            readOnly
          />
        </div>

        <button onClick={logout}>
          Logout
        </button>

      </div>

    </div>
  );
}

export default Dashboard;