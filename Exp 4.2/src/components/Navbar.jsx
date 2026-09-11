import React from "react";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";

function Navbar({ openModal }) {

  return (

    <header className="navbar">

      <div className="headerLeft">

        <h1>

          <FaCalendarAlt className="icon" />

          Optimized Social Media Post Scheduler

        </h1>

        <p>

          A performance-optimized calendar developed using React
          memoization, reusable components, and efficient state updates.

        </p>
        
         <div className="studentInfo">

        <p><strong>Name:</strong> Taseen Yasir Pritam</p>

        <p><strong>UID:</strong> 24BAI70036</p>

    </div>

      </div>

      <button
        className="scheduleBtn"
        onClick={openModal}
      >

        <FaPlus />

        Schedule Post

      </button>

    </header>

  );

}

export default React.memo(Navbar);