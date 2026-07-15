import {
  listCategoriesWithCountsAction,
  updateCategoryNameAction,
} from "./categories-actions";

export const adminCategoriesRepository = {
  listAll: listCategoriesWithCountsAction,
  updateName: updateCategoryNameAction,
};
