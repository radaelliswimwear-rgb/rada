import {
  listCategoriesWithCountsAction,
  removeCategoryImageAction,
  removeCategoryVideoAction,
  toggleCategoryActiveAction,
  updateCategoryImageAction,
  updateCategoryImageFramingAction,
  updateCategoryNameAction,
  updateCategoryVideoAction,
} from "./categories-actions";

export const adminCategoriesRepository = {
  listAll: listCategoriesWithCountsAction,
  updateName: updateCategoryNameAction,
  toggleActive: toggleCategoryActiveAction,
  updateImage: updateCategoryImageAction,
  removeImage: removeCategoryImageAction,
  updateImageFraming: updateCategoryImageFramingAction,
  updateVideo: updateCategoryVideoAction,
  removeVideo: removeCategoryVideoAction,
};
