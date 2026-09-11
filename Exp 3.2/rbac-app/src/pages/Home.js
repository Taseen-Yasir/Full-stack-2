import { FaShieldAlt, FaLock, FaUserCheck } from "react-icons/fa";

function Home() {
  return (
    <div className="dashboard">

      <div className="hero">

        <h1>Role-Based Access Control System</h1>

        <p>
          Secure Authentication & Authorization using React Router
          and Context API
        </p>

      </div>

      <div className="card-container">

        <div className="dashboard-card">

          <FaShieldAlt className="dashboard-icon" />

          <h3>Authentication</h3>

          <p>
            Verify user identity before allowing access.
          </p>

        </div>

        <div className="dashboard-card">

          <FaLock className="dashboard-icon" />

          <h3>Authorization</h3>

          <p>
            Restrict routes according to user roles.
          </p>

        </div>

        <div className="dashboard-card">

          <FaUserCheck className="dashboard-icon" />

          <h3>Protected Routes</h3>

          <p>
            Only authorized users can access dashboards.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Home;