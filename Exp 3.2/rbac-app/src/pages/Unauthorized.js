import { Link } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";

function Unauthorized() {

  return (

    <div className="unauthorized">

      <FaExclamationTriangle className="warning-icon"/>

      <h1>Access Denied</h1>

      <p>

        You do not have permission to access this page.

      </p>

      <Link to="/" className="back-btn">

        Go Back Home

      </Link>

    </div>

  );

}

export default Unauthorized;