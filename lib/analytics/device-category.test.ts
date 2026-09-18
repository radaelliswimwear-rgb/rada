import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveDeviceCategory } from "./device-category";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const ANDROID_PHONE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile";
const IPAD_UA = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const ANDROID_TABLET_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0";

test("sin user-agent -> UNKNOWN", () => {
  assert.equal(deriveDeviceCategory(null), "UNKNOWN");
  assert.equal(deriveDeviceCategory(undefined), "UNKNOWN");
  assert.equal(deriveDeviceCategory(""), "UNKNOWN");
});

test("iPhone/Android con Mobile -> MOBILE", () => {
  assert.equal(deriveDeviceCategory(IPHONE_UA), "MOBILE");
  assert.equal(deriveDeviceCategory(ANDROID_PHONE_UA), "MOBILE");
});

test("iPad/Android sin Mobile -> TABLET", () => {
  assert.equal(deriveDeviceCategory(IPAD_UA), "TABLET");
  assert.equal(deriveDeviceCategory(ANDROID_TABLET_UA), "TABLET");
});

test("Windows/Mac de escritorio -> DESKTOP", () => {
  assert.equal(deriveDeviceCategory(DESKTOP_UA), "DESKTOP");
});
