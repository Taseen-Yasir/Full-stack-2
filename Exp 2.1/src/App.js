import "./App.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addPost, deletePost } from "./redux/posts/postsSlice";

function App() {

  const dispatch = useDispatch();

  const posts = useSelector((state) => state.posts.posts);
  const platforms = useSelector((state) => state.platforms.platforms);

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);

  const handleAddPost = () => {

    if (title.trim() === "") {
      alert("Please enter post title");
      return;
    }

    dispatch(
      addPost({
        id: Date.now(),
        title,
        platform,
      })
    );

    setTitle("");
    setPlatform(platforms[0]);
  };

  return (

    <div className="container">

      <h1>Redux Post Manager</h1>

      <div className="form-group">

        <label>Post Title</label>

        <input
          type="text"
          placeholder="Enter post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

      </div>

      <div className="form-group">

        <label>Platform</label>

        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >

          {platforms.map((item, index) => (

            <option key={index}>
              {item}
            </option>

          ))}

        </select>

      </div>

      <button
        className="add-btn"
        onClick={handleAddPost}
      >
        Add Post
      </button>

      <h2>
        Posts ({posts.length})
      </h2>

      {

      posts.length === 0 ?

      (

      <p className="empty">
      No posts available.
      </p>

      )

      :

      (

      posts.map((post)=>(

      <div
      key={post.id}
      className="post-card"
      >

      <h3>{post.title}</h3>

      <p>

      <b>Platform:</b> {post.platform}

      </p>

      <button
      className="delete-btn"
      onClick={()=>dispatch(deletePost(post.id))}
      >
      Delete
      </button>

      </div>

      ))

      )

      }

    </div>

  );

}

export default App;