import { configureStore } from "@reduxjs/toolkit";
import postsReducer from "./posts/postsSlice";
import platformReducer from "./platforms/platformSlice";

export const store = configureStore({
  reducer: {
    posts: postsReducer,
    platforms: platformReducer,
  },
});