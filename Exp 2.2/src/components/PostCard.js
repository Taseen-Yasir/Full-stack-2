import React from "react";

function PostCard({ post, onDelete }) {
  console.log("Rendering:", post.title);

  return (
    <div className="post-card">
      <h3>{post.title}</h3>

      <p>
        <b>Platform:</b> {post.platform}
      </p>

      <button
        className="delete-btn"
        onClick={() => onDelete(post.id)}
      >
        Delete
      </button>
    </div>
  );
}

export default React.memo(PostCard);