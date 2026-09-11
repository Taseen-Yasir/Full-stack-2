import React, { useState, useMemo, useCallback } from "react";
import "./App.css";

import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import SearchBar from "./components/SearchBar";
import CalendarView from "./components/CalendarView";
import AddPostModal from "./components/AddPostModal";

function App() {

  const sampleEvents = [
    {
      id: "1",
      title: "Launch of New Product",
      date: "2026-08-08",
      status: "Scheduled",
      platform: "Instagram",
      backgroundColor: "#2563EB"
    },
    {
      id: "2",
      title: "React Project Update",
      date: "2026-08-10",
      status: "Draft",
      platform: "LinkedIn",
      backgroundColor: "#F59E0B"
    },
    {
      id: "3",
      title: "Project Successfully Completed",
      date: "2026-08-06",
      status: "Published",
      platform: "LinkedIn",
      backgroundColor: "#16A34A"
    },
    {
      id: "4",
      title: "AI Project Announcement",
      date: "2026-08-20",
      status: "Scheduled",
      platform: "LinkedIn",
      backgroundColor: "#2563EB"
    },
    {
      id: "5",
      title: "Healthcare in AI and ML",
      date: "2026-08-26",
      status: "Scheduled",
      platform: "Other",
      backgroundColor: "#2563EB"
    }
  ];

  const [events, setEvents] = useState(sampleEvents);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const filteredEvents = useMemo(() => {

    console.log("Filtering Events");

    return events.filter(event =>
      event.title.toLowerCase().includes(search.toLowerCase())
    );

  }, [events, search]);

  const restoreEvents = useCallback(() => {

    setEvents(sampleEvents);

  }, []);

  const clearEvents = useCallback(() => {

    setEvents([]);

  }, []);

  return (

    <div className="app">

      <Navbar
        openModal={() => setShowModal(true)}
      />

      <Dashboard events={events} />

      <SearchBar
        search={search}

    setSearch={setSearch}

    restoreEvents={restoreEvents}

    clearEvents={clearEvents}
      />

      <CalendarView
        events={filteredEvents}
        setEvents={setEvents}
        restoreEvents={restoreEvents}
        clearEvents={clearEvents}
      />

      {showModal &&

        <AddPostModal
          close={() => setShowModal(false)}
          events={events}
          setEvents={setEvents}
        />

      }

    </div>

  );

}

export default App;