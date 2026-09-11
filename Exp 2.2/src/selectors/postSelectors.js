import { createSelector } from "reselect";

const selectPosts = (state) => state.posts.posts;

export const selectAllPosts = createSelector(
  [selectPosts],
  (posts) => posts
);

export const selectTotalPosts = createSelector(
  [selectPosts],
  (posts) => posts.length
);

export const selectFacebookPosts = createSelector(
  [selectPosts],
  (posts) =>
    posts.filter((post) => post.platform === "Facebook")
);

export const selectInstagramPosts = createSelector(
  [selectPosts],
  (posts) =>
    posts.filter((post) => post.platform === "Instagram")
);

export const selectLinkedInPosts = createSelector(
  [selectPosts],
  (posts) =>
    posts.filter((post) => post.platform === "LinkedIn")
);

export const selectTwitterPosts = createSelector(
  [selectPosts],
  (posts) =>
    posts.filter((post) => post.platform === "Twitter")
);