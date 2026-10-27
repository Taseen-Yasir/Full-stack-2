import React, { useState } from "react";

import "./App.css";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import SearchBar from "./components/SearchBar";
import CalendarView from "./components/CalendarView";
import AddPostModal from "./components/AddPostModal";

function App() {

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const [events, setEvents] = useState([
    {
      id: "1",
      title: "Instagram Reel",
      date: "2026-08-10",
      platform: "Instagram",
      backgroundColor: "#E1306C"
    },
    {
      id: "2",
      title: "Facebook Campaign",
      date: "2026-08-14",
      platform: "Facebook",
      backgroundColor: "#1877F2"
    },
    {
      id: "3",
      title: "LinkedIn Article",
      date: "2026-08-18",
      platform: "LinkedIn",
      backgroundColor: "#0077B5"
    },
    {
      id: "4",
      title: "Twitter Post",
      date: "2026-08-22",
      platform: "Twitter",
      backgroundColor: "#000"
    }
  ]);

  const filteredEvents = events.filter((event) => {

    const titleMatch = event.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const platformMatch =
      platform === "All" ||
      event.platform === platform;

    return titleMatch && platformMatch;

  });

  return (

    <div className="app">

      <Navbar
        openModal={() => setShowModal(true)}
      />

      <div className="studentInfo">

        <div className="studentCard">

          <h3>Name</h3>

          <p>Taseen Yasir Pritam</p>

        </div>

        <div className="studentCard">

          <h3>UID</h3>

          <p>24BAI70036</p>

        </div>

      </div>

      <div className="container">

        <Dashboard events={events} />

        <SearchBar
          search={search}
          setSearch={setSearch}
          platform={platform}
          setPlatform={setPlatform}
        />

        <CalendarView
          events={filteredEvents}
          setEvents={setEvents}
        />

      </div>

      {showModal && (

        <AddPostModal
          close={() => setShowModal(false)}
          events={events}
          setEvents={setEvents}
          selectedDate={new Date().toISOString().slice(0, 10)}
        />

      )}

      <button
        className="fab"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          })
        }
      >
        ↑
      </button>

    </div>

  );

}

export default App;