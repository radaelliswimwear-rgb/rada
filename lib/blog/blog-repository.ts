import {
  getPostBySlugAction,
  listPostSlugsAction,
  listPublishedPostsAction,
  listRecentPostsAction,
} from "./blog-actions";

export const blogRepository = {
  listAll: listPublishedPostsAction,
  listRecent: listRecentPostsAction,
  getBySlug: getPostBySlugAction,
  listSlugs: listPostSlugsAction,
};
