/**
 * Transporte de favoritos de la cuenta (app embed de la app Radaelli, E4 del
 * diseño). Implementa el contrato que espera theme-src/assets/wishlist.js:
 *
 *   transport.apply({ add: [{ id, handle }], remove: [id] })
 *     -> Promise<{ items, rejected, notFound }>
 *     rechaza con error.status: 401 | 409 | 0 | 5xx
 *   transport.accountPageUrl   URL de "Mis favoritos" (setting del embed o
 *                              routes.account_url)
 *
 * - Mismo origen y sin prefijo de idioma: POST /apps/radaelli/wishlist. El
 *   app proxy agrega la identidad firmada; este script NUNCA manda ids de
 *   clienta.
 * - Timeout de 10 s (R5): wishlist.js mantiene el Web Lock mientras espera.
 *   Timeout o error de red -> status 0 (transitorio, se reintenta).
 * - Respuesta que no es JSON (p. ej. página HTML de error) -> status 502.
 * - No pisa window.Radaelli (igual que theme.js): si wishlist.js ya cargó,
 *   conecta; si no, deja el transporte en espera (W:913 lo toma).
 * Script clásico (el embed lo carga con async): sin módulos ni dependencias.
 */
(function () {
  "use strict";

  var ENDPOINT = "/apps/radaelli/wishlist";
  var TIMEOUT_MS = 10000;
  var CONFIG_ELEMENT_ID = "radaelli-wishlist-transport-config";

  function transportError(message, status) {
    var error = new Error(message);
    error.status = status;
    return error;
  }

  function readAccountPageUrl() {
    var element = document.getElementById(CONFIG_ELEMENT_ID);
    if (!element) return "";
    try {
      var data = JSON.parse(element.textContent || "null");
      var url = data && typeof data.accountPageUrl === "string" ? data.accountPageUrl : "";
      // Solo rutas del mismo sitio o https (nada de javascript:, data:, etc.).
      // 03E (SEC-05): tampoco "/\host", que el parser URL de WHATWG trata
      // como "//host" (protocol-relative) y sacaría a la clienta del sitio.
      return /^(https:\/\/|\/(?![\/\\]))/.test(url) ? url : "";
    } catch (error) {
      return "";
    }
  }

  function cleanAdd(list) {
    var result = [];
    for (var i = 0; i < list.length; i += 1) {
      var item = list[i];
      if (!item) continue;
      result.push({ id: String(item.id), handle: typeof item.handle === "string" ? item.handle.slice(0, 255) : "" });
    }
    return result;
  }

  function cleanRemove(list) {
    var result = [];
    for (var i = 0; i < list.length; i += 1) result.push(String(list[i]));
    return result;
  }

  var transport = {
    accountPageUrl: readAccountPageUrl(),
    apply: function (ops) {
      var add = ops && Array.isArray(ops.add) ? cleanAdd(ops.add) : [];
      var remove = ops && Array.isArray(ops.remove) ? cleanRemove(ops.remove) : [];
      var controller = new AbortController();
      var timer = setTimeout(function () {
        controller.abort();
      }, TIMEOUT_MS);
      return fetch(ENDPOINT, {
        method: "POST",
        credentials: "same-origin",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Radaelli-Wishlist": "1",
        },
        body: JSON.stringify({ v: 1, add: add, remove: remove }),
      }).then(
        function (response) {
          clearTimeout(timer);
          if (!response.ok) throw transportError("http", response.status);
          var type = (response.headers.get("content-type") || "").toLowerCase();
          if (type.indexOf("application/json") === -1) throw transportError("not_json", 502);
          return response.json().catch(function () {
            throw transportError("invalid_json", 502);
          });
        },
        function () {
          clearTimeout(timer);
          throw transportError("network", 0);
        },
      );
    },
  };

  window.Radaelli = window.Radaelli || {};
  if (window.Radaelli.wishlist && typeof window.Radaelli.wishlist.connectAccount === "function") {
    window.Radaelli.wishlist.connectAccount(transport);
  } else {
    window.Radaelli.wishlistAccountTransport = transport;
  }
})();
