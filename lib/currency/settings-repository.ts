import {
  getSettingsAction,
  removeHeroPosterAction,
  removeHeroVideoAction,
  removeSizeGuideImageAction,
  syncTrmRateAction,
  updateHeroPosterAction,
  updateHeroTextAction,
  updateHeroVideoAction,
  updateSizeGuideImageAction,
  updateUsdRateAction,
} from "./settings-actions";

export const settingsRepository = {
  get: getSettingsAction,
  updateUsdRate: updateUsdRateAction,
  syncTrm: syncTrmRateAction,
  updateSizeGuideImage: updateSizeGuideImageAction,
  removeSizeGuideImage: removeSizeGuideImageAction,
  updateHeroVideo: updateHeroVideoAction,
  removeHeroVideo: removeHeroVideoAction,
  updateHeroPoster: updateHeroPosterAction,
  removeHeroPoster: removeHeroPosterAction,
  updateHeroText: updateHeroTextAction,
};
