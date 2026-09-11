import {
  FaBookOpen,
  FaSearch,
  FaBookmark,
  FaHistory
} from "react-icons/fa";

function Viewer() {

  return (

    <div className="dashboard">

      <h1>👁 Viewer Dashboard</h1>

      <p>Welcome, Viewer</p>

      <div className="card-container">

        <div className="dashboard-card">

          <FaBookOpen className="dashboard-icon"/>

          <h3>Read Articles</h3>

          <p>Browse available content.</p>

        </div>

        <div className="dashboard-card">

          <FaSearch className="dashboard-icon"/>

          <h3>Search</h3>

          <p>Find articles quickly.</p>

        </div>

        <div className="dashboard-card">

          <FaBookmark className="dashboard-icon"/>

          <h3>Bookmarks</h3>

          <p>Save your favorite articles.</p>

        </div>

        <div className="dashboard-card">

          <FaHistory className="dashboard-icon"/>

          <h3>History</h3>

          <p>View recently opened content.</p>

        </div>

      </div>

    </div>

  );

}

export default Viewer;