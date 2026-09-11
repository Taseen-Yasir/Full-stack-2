import React, { useState } from "react";

function AddPostModal({

    close,
    events,
    setEvents

}){

    const [title,setTitle]=useState("");

    const [date,setDate]=useState("");

    const [status,setStatus]=useState("Scheduled");

    const [platform,setPlatform]=useState("Instagram");

    const savePost=()=>{

        if(title==="" || date===""){

            alert("Please fill all fields");

            return;

        }

        let color="#2563EB";

        if(status==="Draft"){

            color="#F59E0B";

        }

        if(status==="Published"){

            color="#16A34A";

        }

        const newPost={

            id:Date.now().toString(),

            title,

            date,

            status,

            platform,

            backgroundColor:color

        };

        setEvents([...events,newPost]);

        close();

    };

    return(

        <div className="modalOverlay">

            <div className="modal">

                <h2>Schedule New Post</h2>

                <input

                    type="text"

                    placeholder="Post Title"

                    value={title}

                    onChange={(e)=>setTitle(e.target.value)}

                />

                <input

                    type="date"

                    value={date}

                    onChange={(e)=>setDate(e.target.value)}

                />

                <select

                    value={platform}

                    onChange={(e)=>setPlatform(e.target.value)}

                >

                    <option>Instagram</option>

                    <option>Facebook</option>

                    <option>LinkedIn</option>

                    <option>Twitter</option>

                    <option>Other</option>

                </select>

                <select

                    value={status}

                    onChange={(e)=>setStatus(e.target.value)}

                >

                    <option>Scheduled</option>

                    <option>Draft</option>

                    <option>Published</option>

                </select>

                <div className="modalButtons">

                    <button

                        className="saveBtn"

                        onClick={savePost}

                    >

                        Save

                    </button>

                    <button

                        className="cancelBtn"

                        onClick={close}

                    >

                        Cancel

                    </button>

                </div>

            </div>

        </div>

    );

}

export default React.memo(AddPostModal);