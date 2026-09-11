import PostCard from "./PostCard";

function PostList({ posts, onDelete }) {
  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

export default PostList;