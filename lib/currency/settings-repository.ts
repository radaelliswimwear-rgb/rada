import {
  getSettingsAction,
  syncTrmRateAction,
  updateUsdRateAction,
} from "./settings-actions";

export const settingsRepository = {
  get: getSettingsAction,
  updateUsdRate: updateUsdRateAction,
  syncTrm: syncTrmRateAction,
};
