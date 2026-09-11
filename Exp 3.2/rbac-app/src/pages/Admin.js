import {
  FaUsers,
  FaUserShield,
  FaChartBar,
  FaCog
} from "react-icons/fa";

function Admin() {

  return (

    <div className="dashboard">

      <h1>👑 Admin Dashboard</h1>

      <p>Welcome, Administrator</p>

      <div className="card-container">

        <div className="dashboard-card">

          <FaUsers className="dashboard-icon"/>

          <h3>Manage Users</h3>

          <p>Create, update and remove users.</p>

        </div>

        <div className="dashboard-card">

          <FaUserShield className="dashboard-icon"/>

          <h3>Manage Roles</h3>

          <p>Assign permissions to every role.</p>

        </div>

        <div className="dashboard-card">

          <FaChartBar className="dashboard-icon"/>

          <h3>Reports</h3>

          <p>View analytics and activity reports.</p>

        </div>

        <div className="dashboard-card">

          <FaCog className="dashboard-icon"/>

          <h3>Settings</h3>

          <p>Configure system settings.</p>

        </div>

      </div>

    </div>

  );

}

export default Admin;