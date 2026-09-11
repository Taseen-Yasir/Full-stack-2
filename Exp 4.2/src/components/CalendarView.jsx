import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

function CalendarView({

    events,
    setEvents

}){

    const handleEventDrop = (info)=>{

        const updatedEvents = events.map(event=>{

            if(event.id===info.event.id){

                return{

                    ...event,

                    date:info.event.startStr.substring(0,10)

                };

            }

            return event;

        });

        setEvents(updatedEvents);

    };

    const handleDateClick=(info)=>{

        alert("Selected Date : "+info.dateStr);

    };

    const handleEventClick=(info)=>{

        alert(

            "Post : "+info.event.title+

            "\nDate : "+info.event.startStr

        );

    };

    return(

        <div className="calendarContainer">

            <FullCalendar

                plugins={[

                    dayGridPlugin,

                    timeGridPlugin,

                    interactionPlugin

                ]}

                initialView="dayGridMonth"

                headerToolbar={{

                    left:"prev,next today",

                    center:"title",

                    right:"dayGridMonth,timeGridWeek,timeGridDay"

                }}

                editable={true}

                selectable={true}

                events={events}

                dateClick={handleDateClick}

                eventClick={handleEventClick}

                eventDrop={handleEventDrop}

                height="auto"

            />

        </div>

    );

}

export default React.memo(CalendarView);