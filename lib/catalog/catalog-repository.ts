import {
  getProductBySlugAction,
  listCatalogProductsAction,
  listFeaturedProductsAction,
  listProductSlugsAction,
  listRecommendedProductsAction,
  listRelatedProductsAction,
  searchProductsAction,
  searchSuggestionsAction,
} from "./catalog-actions";

// Adaptador Prisma/Postgres (Sprint 13) para catálogo, categorías y
// búsqueda. Repository Pattern: la UI (páginas de catálogo, ficha de
// producto, búsqueda, destacados de Home) solo conoce este objeto, nunca
// Prisma directamente — mismo criterio que addressesRepository/
// ordersRepository/paymentsRepository.
export const catalogRepository = {
  listByCategory: listCatalogProductsAction,
  listFeatured: listFeaturedProductsAction,
  getBySlug: getProductBySlugAction,
  listRelated: listRelatedProductsAction,
  listRecommended: listRecommendedProductsAction,
  search: searchProductsAction,
  searchSuggestions: searchSuggestionsAction,
  listSlugs: listProductSlugsAction,
};
