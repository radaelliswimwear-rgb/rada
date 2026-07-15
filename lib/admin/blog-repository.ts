import {
  createBlogPostAction,
  deleteBlogPostAction,
  getAdminBlogPostByIdAction,
  listAllBlogPostsAction,
  updateBlogPostAction,
} from "./blog-actions";

export const adminBlogRepository = {
  listAll: listAllBlogPostsAction,
  getById: getAdminBlogPostByIdAction,
  create: createBlogPostAction,
  update: updateBlogPostAction,
  remove: deleteBlogPostAction,
};
