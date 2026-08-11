import {
  listCategoriesWithCountsAction,
  toggleCategoryActiveAction,
  updateCategoryNameAction,
} from "./categories-actions";

export const adminCategoriesRepository = {
  listAll: listCategoriesWithCountsAction,
  updateName: updateCategoryNameAction,
  toggleActive: toggleCategoryActiveAction,
};
