import {
  FaEdit,
  FaFileAlt,
  FaFolderOpen,
  FaClipboardList
} from "react-icons/fa";

function Editor() {

  return (

    <div className="dashboard">

      <h1>✏️ Editor Dashboard</h1>

      <p>Welcome, Editor</p>

      <div className="card-container">

        <div className="dashboard-card">

          <FaEdit className="dashboard-icon"/>

          <h3>Edit Articles</h3>

          <p>Modify existing content.</p>

        </div>

        <div className="dashboard-card">

          <FaFileAlt className="dashboard-icon"/>

          <h3>Create Posts</h3>

          <p>Publish new articles.</p>

        </div>

        <div className="dashboard-card">

          <FaFolderOpen className="dashboard-icon"/>

          <h3>Categories</h3>

          <p>Organize content.</p>

        </div>

        <div className="dashboard-card">

          <FaClipboardList className="dashboard-icon"/>

          <h3>Review Content</h3>

          <p>Review submitted posts.</p>

        </div>

      </div>

    </div>

  );

}

export default Editor;