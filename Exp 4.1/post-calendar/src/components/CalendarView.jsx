import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import AddPostModal from "./AddPostModal";

export default function CalendarView({ events, setEvents }) {

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [editEvent, setEditEvent] = useState(null);

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setEditEvent(null);
    setOpen(true);
  };

  const handleEventClick = (info) => {
    const event = events.find(e => e.id === info.event.id);
    setEditEvent(event);
    setOpen(true);
  };

  const handleDrop = (info) => {

    setEvents(events.map(event =>
      event.id === info.event.id
        ? {
            ...event,
            date: info.event.startStr.substring(0, 10)
          }
        : event
    ));

  };

  return (
    <>
      <FullCalendar
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin
        ]}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        height="auto"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleDrop}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay"
        }}
      />

      {
        open &&
        <AddPostModal
          close={() => setOpen(false)}
          events={events}
          setEvents={setEvents}
          selectedDate={selectedDate}
          editEvent={editEvent}
        />
      }

    </>
  );

}