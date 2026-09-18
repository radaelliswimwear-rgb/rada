import {
  getPostBySlugAction,
  listPostSlugsAction,
  listPublishedPostsAction,
  listRecentPostsAction,
  listSitemapPostsAction,
} from "./blog-actions";

export const blogRepository = {
  listAll: listPublishedPostsAction,
  listRecent: listRecentPostsAction,
  getBySlug: getPostBySlugAction,
  listSlugs: listPostSlugsAction,
  listSitemapPosts: listSitemapPostsAction,
};
