import {
  getSettingsAction,
  removeHeroPosterAction,
  removeHeroVideoAction,
  removeSizeGuideImageAction,
  syncTrmRateAction,
  updateFreeShippingThresholdAction,
  updateHeroPosterAction,
  updateHeroTextAction,
  updateHeroVideoAction,
  updateSitewideDiscountAction,
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
  updateSitewideDiscount: updateSitewideDiscountAction,
  updateFreeShippingThreshold: updateFreeShippingThresholdAction,
};
