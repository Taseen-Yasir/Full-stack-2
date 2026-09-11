import "./App.css";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { addPost, deletePost } from "./redux/posts/postsSlice";

import {
  selectAllPosts,
  selectTotalPosts,
  selectFacebookPosts,
  selectInstagramPosts,
  selectLinkedInPosts,
  selectTwitterPosts,
} from "./selectors/postSelectors";

import PostList from "./components/PostList";

function App() {
  const dispatch = useDispatch();

  // Memoized selectors
  const posts = useSelector(selectAllPosts);
  const totalPosts = useSelector(selectTotalPosts);
  const facebookPosts = useSelector(selectFacebookPosts);
  const instagramPosts = useSelector(selectInstagramPosts);
  const linkedInPosts = useSelector(selectLinkedInPosts);
  const twitterPosts = useSelector(selectTwitterPosts);

  // Platforms from Redux
  const platforms = useSelector((state) => state.platforms.platforms);

  // Local form state
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState(platforms[0]);

  const handleAddPost = () => {
    if (title.trim() === "") {
      alert("Please enter a post title.");
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

  const handleDelete = (id) => {
    dispatch(deletePost(id));
  };

  return (
    <div className="container">
      <h1>Redux Selector Demo</h1>

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
            <option key={index}>{item}</option>
          ))}
        </select>
      </div>

      <button
        className="add-btn"
        onClick={handleAddPost}
      >
        Add Post
      </button>

      <hr />

      <h2>Derived State (Memoized Selectors)</h2>

      <p><b>Total Posts:</b> {totalPosts}</p>
      <p><b>Facebook Posts:</b> {facebookPosts.length}</p>
      <p><b>Instagram Posts:</b> {instagramPosts.length}</p>
      <p><b>LinkedIn Posts:</b> {linkedInPosts.length}</p>
      <p><b>Twitter Posts:</b> {twitterPosts.length}</p>

      <hr />

      <h2>All Posts</h2>

      {posts.length === 0 ? (
        <p className="empty">No posts available.</p>
      ) : (
        <PostList
          posts={posts}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default App;