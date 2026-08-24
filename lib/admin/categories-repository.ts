import {
  listCategoriesWithCountsAction,
  removeCategoryImageAction,
  toggleCategoryActiveAction,
  updateCategoryImageAction,
  updateCategoryImageFramingAction,
  updateCategoryNameAction,
} from "./categories-actions";

export const adminCategoriesRepository = {
  listAll: listCategoriesWithCountsAction,
  updateName: updateCategoryNameAction,
  toggleActive: toggleCategoryActiveAction,
  updateImage: updateCategoryImageAction,
  removeImage: removeCategoryImageAction,
  updateImageFraming: updateCategoryImageFramingAction,
};
