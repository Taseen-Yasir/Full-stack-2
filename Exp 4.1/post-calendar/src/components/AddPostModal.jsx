import React from "react";

function AddPostModal({ close }) {

  return (

    <div className="modalOverlay">

      <div className="modal">

        <h2>New Post</h2>

        <p>This is a demo popup for the experiment.</p>

        <button
          className="save"
          onClick={close}
        >
          Close
        </button>

      </div>

    </div>

  );

}

export default AddPostModal;