import { test } from "node:test";
import assert from "node:assert/strict";
import {
  selectGa4CookieNamesToClear,
  selectMetaCookieNamesToClear,
} from "./third-party-cookies";

test("selectGa4CookieNamesToClear: siempre incluye _ga aunque no esté presente", () => {
  assert.deepEqual(selectGa4CookieNamesToClear([]), ["_ga"]);
  assert.deepEqual(selectGa4CookieNamesToClear(["radaelli_consent", "lago-cart-id"]), ["_ga"]);
});

test("selectGa4CookieNamesToClear: detecta cualquier _ga_* presente, por prefijo (el sufijo varía por Measurement ID)", () => {
  const result = selectGa4CookieNamesToClear([
    "radaelli_consent",
    "_ga",
    "_ga_ABC123DEF",
    "_ga_OTHERCONTAINER",
    "lago-cart-id",
  ]);
  assert.deepEqual(result, ["_ga", "_ga_ABC123DEF", "_ga_OTHERCONTAINER"]);
});

test("selectGa4CookieNamesToClear: no confunde una cookie que solo contiene '_ga' como substring", () => {
  const result = selectGa4CookieNamesToClear(["mega_gadget_id", "_gads"]);
  // "_gads" no empieza con "_ga_" (falta el guion bajo después de "ga") --
  // no debe tratarse como cookie de sesión de GA4.
  assert.deepEqual(result, ["_ga"]);
});

test("selectMetaCookieNamesToClear: nombres fijos _fbp/_fbc, sin depender de lo presente", () => {
  assert.deepEqual(selectMetaCookieNamesToClear(), ["_fbp", "_fbc"]);
});
