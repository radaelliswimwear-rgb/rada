// 03K — verificación dirigida por DOM/layout: superficies × anchos, en vivo, sin barrido exploratorio.
//
// USO (una pestaña de la Dev Store con sesión de vista previa del theme; ver theme-harness/README.md para el arnés offline):
//   1. Pegar este archivo en la consola de una pestaña del origen de la tienda (o ejecutarlo con la herramienta de JS de Chrome).
//   2. Opcional, ANTES de pegarlo: window.__k03cfg = { widths: [...], surfaces: [{ name, path }], preview: "<id del theme>" };
//   3. Correrlo lanza el trabajo en segundo plano DE LA PÁGINA y termina al instante. Leer el avance con:
//        window.__k03  ->  { done, progress, rows[], defects[], summary }
//
// Método (igual que 03G): fetch del HTML de cada superficie -> iframe srcdoc del ancho objetivo (hereda el origen y ejecuta el JS
// del theme) -> espera -> imágenes lazy a eager -> medición dentro del iframe. Un solo fetch por superficie (la tienda responde 429 a
// ráfagas grandes: no repetir más de 2 corridas seguidas sin esperar 10-15 min).
//
// Criterios por combinación (ver cada `d.push` abajo):
//   OV desborde horizontal | BI imagen rota | TK clave de traducción sin resolver | H1 != 1 h1 | HJ salto de nivel de encabezado
//   EH encabezado vacío | IA <img> sin atributo alt | NM control (a/button) sin nombre accesible | DI id duplicado
//   UC copy de EE. UU./USD | JS error de JS en la página | LG lang != es | HC encabezado con contraste < 3:1 (fondo sólido)
// Informativo (no es defecto del theme, es decisión C4 de la dueña): CB botones con contraste < 4,5:1 (texto blanco sobre arena).
//
// Nada de lo que lee o imprime son cookies, tokens ni datos personales: solo conteos y selectores.
(() => {
  const CFG = window.__k03cfg || {};
  const WIDTHS = CFG.widths || [320, 390, 768, 1440];
  const PREVIEW = CFG.preview || "189072474431";
  const SURFACES = CFG.surfaces || [
    { name: "Home", path: "/" },
    { name: "Oasis Natural", path: "/collections/oasis-natural" },
    { name: "Aurora Viva", path: "/collections/aurora-viva" },
    { name: "Espuma de Ola", path: "/collections/espuma-de-ola" },
    { name: "Salidas de Baño", path: "/collections/salidas-de-bano" },
    { name: "Destacados", path: "/collections/destacados" },
    { name: "PDP marea-natural", path: "/products/marea-natural" },
    { name: "PDP alba-dorada-lila", path: "/products/alba-dorada-lila" },
    { name: "PDP bikini-foam", path: "/products/bikini-foam" },
    { name: "PDP camiseta-solar-waves-negro", path: "/products/camiseta-solar-waves-negro" },
    { name: "Búsqueda", path: "/search?q=bikini" },
    { name: "Carrito", path: "/cart" },
    { name: "Favoritos", path: "/pages/favoritos?view=wishlist" },
    { name: "Garantía", path: "/pages/garantia" },
    { name: "Reembolso", path: "/policies/refund-policy" },
    { name: "Password", path: "/password" },
    { name: "404", path: "/pages/no-existe-03k" },
  ];
  const state = (window.__k03 = { done: false, progress: "0/" + SURFACES.length * WIDTHS.length, rows: [], defects: [], info: [], summary: null, startedAt: new Date().toISOString() });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ERR_HOOK = "<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(String(e.message||e))});window.addEventListener('unhandledrejection',function(e){window.__errs.push('rechazo: '+String(e.reason&&e.reason.message||e.reason))});<\/script>";

  const lum = (rgb) => {
    const c = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const parse = (s) => { const m = (s || "").match(/[\d.]+/g); return m ? m.map(Number) : null; };
  const over = (fg, bg) => { const a = fg.length > 3 ? fg[3] : 1; return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  // Fondo sólido efectivo; null si hay imagen/degradado en algún ancestro (no medible por DOM).
  const solidBg = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = n.ownerDocument.defaultView.getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      const c = parse(cs.backgroundColor);
      if (c && (c.length === 3 || c[3] > 0.05) && !(c.length > 3 && c[3] < 1)) return c.slice(0, 3);
    }
    return [255, 255, 255];
  };
  const shown = (el) => {
    const w = el.ownerDocument.defaultView;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = w.getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden") return false;
      if (n.tagName === "DIALOG" && !n.open) return false;
      if (n.hasAttribute("hidden")) return false;
    }
    return true;
  };
  const accName = (el) => {
    const doc = el.ownerDocument;
    const lb = el.getAttribute("aria-label");
    if (lb && lb.trim()) return lb.trim();
    const by = el.getAttribute("aria-labelledby");
    if (by) { const t = by.split(/\s+/).map((id) => doc.getElementById(id)?.textContent || "").join(" ").trim(); if (t) return t; }
    const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (txt) return txt;
    const im = el.querySelector("img[alt]");
    if (im && im.getAttribute("alt").trim()) return im.getAttribute("alt").trim();
    const svgT = el.querySelector("svg title");
    if (svgT && svgT.textContent.trim()) return svgT.textContent.trim();
    return (el.getAttribute("title") || "").trim();
  };
  const sel = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");

  const measure = (win) => {
    const doc = win.document;
    const d = [];
    const info = {};
    const W = win.innerWidth;
    const ov = doc.documentElement.scrollWidth - doc.documentElement.clientWidth;
    if (ov > 0) {
      const culprits = [...doc.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > W + 1 && shown(e)).slice(0, 3).map(sel);
      d.push(`OV ${ov}px (${culprits.join(", ")})`);
    }
    const imgs = [...doc.querySelectorAll("img")];
    const broken = imgs.filter((i) => i.getAttribute("src") && i.complete && i.naturalWidth === 0);
    if (broken.length) d.push(`BI ${broken.length} (${broken.slice(0, 2).map((i) => (i.getAttribute("src") || "").split("?")[0].slice(-40)).join(", ")})`);
    const noAlt = imgs.filter((i) => !i.hasAttribute("alt") && shown(i));
    if (noAlt.length) d.push(`IA ${noAlt.length} (${noAlt.slice(0, 2).map(sel).join(", ")})`);
    info.imgs = imgs.length;
    info.imgsSinDim = imgs.filter((i) => shown(i) && !(i.getAttribute("width") && i.getAttribute("height")) && !win.getComputedStyle(i).aspectRatio.match(/\d/)).length;
    const text = doc.body.innerText || "";
    const keyRe = /\b(?:general|products|cart|accessibility|customer|search|sections|templates|layout|blogs|gift_cards|localization)\.[a-z0-9_]+(?:\.[a-z0-9_]+)+\b/g;
    const keys = (text.match(keyRe) || []).filter((k) => !/\.(com|co|net|org|jpg|png|webp)$/.test(k));
    if (keys.length || /translation missing/i.test(doc.documentElement.outerHTML)) d.push(`TK ${keys.slice(0, 3).join(", ") || "translation missing"}`);
    const us = text.match(/\bUSD\b|US\$|United States|Estados Unidos|EE\. ?UU\.|EEUU/g);
    if (us) d.push(`UC ${[...new Set(us)].join(", ")}`);
    const hs = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(shown);
    const h1 = hs.filter((h) => h.tagName === "H1").length;
    if (h1 !== 1) d.push(`H1 ${h1}`);
    let prev = 0;
    const jumps = [];
    for (const h of hs) {
      const lvl = Number(h.tagName[1]);
      if (prev && lvl > prev + 1) jumps.push(`h${prev}->h${lvl}`);
      prev = lvl;
    }
    if (jumps.length) d.push(`HJ ${[...new Set(jumps)].join(", ")}`);
    const emptyH = hs.filter((h) => !(h.textContent || "").trim() && !h.querySelector("img[alt]"));
    if (emptyH.length) d.push(`EH ${emptyH.length}`);
    // Encabezados sobre media (foto/video de fondo en un hermano posicionado): no medibles por DOM -> informativo (hcMedia), no defecto.
    // Contenedores del theme cuyo texto va SOBRE una foto o un video (hero, tarjetas de categoría, banner de colección, promo).
    const onMedia = (el) => !!el.closest(".section-categories__card, .collection-banner, .section-promo, .section-hero:has(video, img)");
    info.hcMedia = hs.filter(onMedia).length;
    const lowH = hs.filter((h) => {
      if (onMedia(h)) return false;
      if (win.getComputedStyle(h).opacity < 0.1) return true;
      const bg = solidBg(h);
      const fg = parse(win.getComputedStyle(h).color);
      return bg && fg && ratio(over(fg, bg), bg) < 3;
    });
    if (lowH.length) d.push(`HC ${lowH.length} (${lowH.slice(0, 2).map(sel).join(", ")})`);
    const ctrls = [...doc.querySelectorAll("a[href], button, [role=button]")].filter(shown);
    const noName = ctrls.filter((c) => !accName(c));
    if (noName.length) d.push(`NM ${noName.length} (${noName.slice(0, 3).map(sel).join(", ")})`);
    const ids = {};
    doc.querySelectorAll("[id]").forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; });
    const dup = Object.keys(ids).filter((k) => ids[k] > 1);
    if (dup.length) d.push(`DI ${dup.slice(0, 3).join(", ")}`);
    if (!/^es(-|$)/i.test(doc.documentElement.lang || "")) d.push(`LG ${doc.documentElement.lang || "(vacío)"}`);
    // "Script error." sin archivo = error opaco de un script de otro origen (cdn.shopify.com: analítica/barra de vista previa), no del theme
    // (los scripts del theme son del mismo origen y traen mensaje y archivo). Se cuenta aparte (jsOpaque), no como defecto.
    const errsAll = (win.__errs || []).filter((m) => !/ResizeObserver/.test(m));
    info.jsOpaque = errsAll.filter((m) => /^Script error\.?$/.test(m)).length;
    const errs = errsAll.filter((m) => !/^Script error\.?$/.test(m));
    if (errs.length) d.push(`JS ${errs.length} (${errs[0].slice(0, 80)})`);
    // Informativo C4: botones con contraste < 4,5:1 (texto blanco sobre arena de la marca).
    const btns = ctrls.filter((c) => /button/.test(c.className) || c.tagName === "BUTTON").filter((b) => (b.textContent || "").trim());
    const lowB = btns.filter((b) => {
      const cs = win.getComputedStyle(b);
      const bg = parse(cs.backgroundColor);
      const fg = parse(cs.color);
      if (!bg || !fg || (bg.length > 3 && bg[3] < 0.95)) return false;
      return ratio(over(fg, bg.slice(0, 3)), bg.slice(0, 3)) < 4.5;
    });
    info.cb = lowB.length;
    return { d, info };
  };

  (async () => {
    let done = 0;
    try {
      for (const s of SURFACES) {
        const url = s.path + (s.path.includes("?") ? "&" : "?") + "preview_theme_id=" + PREVIEW;
        const res = await fetch(url, { credentials: "include" });
        if (res.status === 429) { state.defects.push({ s: s.name, w: 0, d: ["HTTP 429: esperar 10-15 min y repetir desde esta superficie"] }); state.aborted = s.name; break; }
        const status = res.status;
        const html = (await res.text()).replace("<head>", "<head>" + ERR_HOOK);
        for (const w of WIDTHS) {
          const fr = document.createElement("iframe");
          fr.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:900px;border:0;opacity:0;pointer-events:none`;
          document.body.append(fr);
          fr.srcdoc = html;
          await new Promise((r) => { fr.onload = r; setTimeout(r, 8000); });
          await sleep(2600);
          const win = fr.contentWindow;
          win.document.querySelectorAll("img[loading=lazy]").forEach((i) => { i.loading = "eager"; });
          // Las animaciones de entrada (fade-in-up) no avanzan en una pestaña oculta (03G F-01): se terminan a la fuerza antes de medir.
          try { win.document.getAnimations().forEach((a) => { try { a.finish(); } catch (e) { /* infinita: se deja */ } }); } catch (e) { /* sin API */ }
          await sleep(1400);
          const { d, info } = measure(win);
          const row = { s: s.name, w, status, ok: d.length === 0, d, info };
          state.rows.push(row);
          if (d.length) state.defects.push({ s: s.name, w, d });
          if (info.cb) state.info.push({ s: s.name, w, cb: info.cb });
          fr.remove();
          done++;
          state.progress = `${done}/${SURFACES.length * WIDTHS.length}`;
        }
      }
      state.summary = { combos: state.rows.length, defectiveCombos: state.defects.length, imgsMax: Math.max(0, ...state.rows.map((r) => r.info.imgs)), cbCombos: state.info.length, aborted: state.aborted || null };
    } catch (e) {
      state.error = String(e && e.message || e);
    }
    state.done = true;
  })();
  return "03K surface check lanzado en segundo plano: leer window.__k03";
})();
