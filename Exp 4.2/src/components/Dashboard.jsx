import React from "react";
import {
  FaClipboardList,
  FaCalendarCheck,
  FaFileAlt,
  FaCheckCircle
} from "react-icons/fa";

function Dashboard({ events }) {

  const total = events.length;

  const scheduled = events.filter(
    event => event.status === "Scheduled"
  ).length;

  const drafts = events.filter(
    event => event.status === "Draft"
  ).length;

  const published = events.filter(
    event => event.status === "Published"
  ).length;

  return (

    <div className="dashboard">

      <div className="dashboardCard">

        <div className="cardIcon purple">
          <FaClipboardList />
        </div>

        <div>

          <h4>Total Posts</h4>

          <h2>{total}</h2>

        </div>

      </div>

      <div className="dashboardCard">

        <div className="cardIcon blue">
          <FaCalendarCheck />
        </div>

        <div>

          <h4>Scheduled</h4>

          <h2>{scheduled}</h2>

        </div>

      </div>

      <div className="dashboardCard">

        <div className="cardIcon orange">
          <FaFileAlt />
        </div>

        <div>

          <h4>Drafts</h4>

          <h2>{drafts}</h2>

        </div>

      </div>

      <div className="dashboardCard">

        <div className="cardIcon green">
          <FaCheckCircle />
        </div>

        <div>

          <h4>Published</h4>

          <h2>{published}</h2>

        </div>

      </div>

    </div>

  );

}

export default React.memo(Dashboard);