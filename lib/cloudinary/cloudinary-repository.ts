import {
  deleteCloudinaryAssetAction,
  uploadProductImageAction,
} from "./upload-actions";

// Adaptador (Sprint 15), mismo patrón que el resto de lib/admin/*: la UI solo
// conoce este objeto, nunca importa upload-actions.ts directamente.
export const cloudinaryRepository = {
  upload: uploadProductImageAction,
  remove: deleteCloudinaryAssetAction,
};
