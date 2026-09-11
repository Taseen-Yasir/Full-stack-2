import { FaCalendarAlt, FaMoon, FaPlus } from "react-icons/fa";

export default function Navbar({ openModal }) {

  function toggleTheme() {
    document.body.classList.toggle("dark");
  }

  return (
    <div className="navbar">

      <div className="logo">
        <FaCalendarAlt size={24} />
        <h2>Post Scheduler</h2>
      </div>

      <div className="navButtons">

        <button
          className="addBtn"
          onClick={openModal}
        >
          <FaPlus />
          New Post
        </button>

        <button
          className="themeBtn"
          onClick={toggleTheme}
        >
          <FaMoon />
        </button>

      </div>

    </div>
  );
}