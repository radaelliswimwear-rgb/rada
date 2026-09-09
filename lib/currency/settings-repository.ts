import {
  getSettingsAction,
  removeSizeGuideImageAction,
  syncTrmRateAction,
  updateSizeGuideImageAction,
  updateUsdRateAction,
} from "./settings-actions";

export const settingsRepository = {
  get: getSettingsAction,
  updateUsdRate: updateUsdRateAction,
  syncTrm: syncTrmRateAction,
  updateSizeGuideImage: updateSizeGuideImageAction,
  removeSizeGuideImage: removeSizeGuideImageAction,
};
