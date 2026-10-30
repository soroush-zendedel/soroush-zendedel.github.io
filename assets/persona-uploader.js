(() => {
  "use strict";

  const DB_NAME = "soroush-personas";
  const STORE_NAME = "uploads";
  const MAX_ARCHIVE_SIZE = 10 * 1024 * 1024;
  const MAX_UNPACKED_SIZE = 24 * 1024 * 1024;
  const MAX_STYLESHEET_SIZE = 300 * 1024;
  const MAX_FILES = 100;
  const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
  const currentScript = document.currentScript;
  const assetBase = new URL("./", currentScript.src);
  const isEnglish = document.documentElement.lang === "en";
  const copy = isEnglish
    ? { title: "Persona", narrator: "Narrator (default)", upload: "Upload persona ZIP", choose: "Choose a persona", close: "Close", localNote: "Uploaded personas stay in this browser.", badZip: "This ZIP is invalid or does not match the persona package format.", saved: "Persona saved in this browser.", replace: "A persona with this ID is already stored in this browser. Replace it? The current version will be overwritten.", unsupportedZip: "This browser cannot unpack this ZIP format. Try a standard ZIP using Deflate compression.", remove: "Remove this uploaded persona" }
    : { title: "پرسونا", narrator: "راوی (پیش‌فرض)", upload: "بارگذاری فایل ZIP پرسونا", choose: "یک پرسونا انتخاب کنید", close: "بستن", localNote: "پرسوناهای بارگذاری‌شده در همین مرورگر می‌مانند.", badZip: "ساختار فایل ZIP معتبر نیست یا با قالب بستهٔ پرسونا سازگار نیست.", saved: "پرسونا در همین مرورگر ذخیره شد.", replace: "پرسونایی با این شناسه در این مرورگر ذخیره شده است. جایگزین شود؟ نسخهٔ فعلی بازنویسی می‌شود.", unsupportedZip: "مرورگر نتوانست این نوع ZIP را باز کند. از ZIP معمولی با فشرده‌سازی Deflate استفاده کنید.", remove: "حذف این پرسونا از مرورگر" };

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function dbRequest(mode, action, value) {
    const db = await openDatabase();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = action === "getAll" ? store.getAll() : action === "delete" ? store.delete(value) : store.put(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }

  function findEndOfDirectory(view) {
    const start = Math.max(0, view.byteLength - 65557);
    for (let offset = view.byteLength - 22; offset >= start; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) return offset;
    }
    throw new Error("ZIP directory not found");
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  async function inflateRaw(bytes, expectedSize) {
    if (typeof DecompressionStream !== "function") throw new Error("ZIP decompression unavailable");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader = stream.getReader();
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > expectedSize || length > MAX_UNPACKED_SIZE) throw new Error("Expanded file exceeds its declared size");
        chunks.push(value);
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    }
    const output = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
    return output;
  }

  async function unzip(buffer) {
    if (buffer.byteLength > MAX_ARCHIVE_SIZE) throw new Error("Archive too large");
    const view = new DataView(buffer);
    const end = findEndOfDirectory(view);
    const disk = view.getUint16(end + 4, true);
    const directoryDisk = view.getUint16(end + 6, true);
    const diskEntries = view.getUint16(end + 8, true);
    const entryCount = view.getUint16(end + 10, true);
    const directorySize = view.getUint32(end + 12, true);
    const directoryOffset = view.getUint32(end + 16, true);
    if (disk || directoryDisk || diskEntries !== entryCount || entryCount > MAX_FILES || directoryOffset + directorySize > end) throw new Error("Unsupported ZIP layout");

    const decoder = new TextDecoder("utf-8", { fatal: true });
    const files = new Map();
    let total = 0;
    let cursor = directoryOffset;
    for (let index = 0; index < entryCount; index += 1) {
      if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error("Invalid ZIP entry");
      const platform = view.getUint16(cursor + 4, true) >>> 8;
      const flags = view.getUint16(cursor + 8, true);
      const method = view.getUint16(cursor + 10, true);
      const checksum = view.getUint32(cursor + 16, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const size = view.getUint32(cursor + 24, true);
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const externalAttributes = view.getUint32(cursor + 38, true);
      const localOffset = view.getUint32(cursor + 42, true);
      if (flags & 1 || [0xffffffff, 0xffff].includes(size) || [0xffffffff, 0xffffffff].includes(compressedSize)) throw new Error("Unsupported ZIP feature");
      if (platform === 3 && (((externalAttributes >>> 16) & 0xf000) === 0xa000)) throw new Error("Links are not allowed");
      const nameStart = cursor + 46;
      const rawName = new Uint8Array(buffer, nameStart, nameLength);
      const name = decoder.decode(rawName).replace(/\\/g, "/");
      cursor = nameStart + nameLength + extraLength + commentLength;
      if (name.endsWith("/")) continue;
      if (!name || name.startsWith("/") || /^[a-z]:/i.test(name) || name.split("/").some((part) => !part || part === "." || part === "..") || files.has(name)) throw new Error("Unsafe or duplicate path");
      if (size > MAX_UNPACKED_SIZE || total + size > MAX_UNPACKED_SIZE) throw new Error("Unpacked archive too large");
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error("Invalid local ZIP entry");
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = new Uint8Array(buffer, dataOffset, compressedSize);
      let bytes;
      if (method === 0) bytes = compressed.slice();
      else if (method === 8) bytes = await inflateRaw(compressed, size);
      else throw new Error("Unsupported compression method");
      if (bytes.byteLength !== size || crc32(bytes) !== checksum) throw new Error("ZIP integrity check failed");
      total += size;
      files.set(name, bytes);
    }
    return files;
  }

  function assertText(value, maxLength = 12000) {
    if (typeof value !== "string" || value.length > maxLength) throw new Error("Invalid persona text");
  }

  function validatePackage(files) {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    for (const path of files.keys()) {
      if (/\.(?:html?|js|mjs|cjs|wasm|svg)$/i.test(path)) throw new Error("Executable or active-content files are not allowed");
    }
    const manifestBytes = files.get("manifest.json");
    if (!manifestBytes) throw new Error("manifest missing");
    const manifest = JSON.parse(decoder.decode(manifestBytes));
    const legacyDataPackage = manifest?.kind === "data" && manifest.schemaVersion === 1;
    const styledPackage = manifest?.kind === "styled" && manifest.schemaVersion === 2;
    if ((!legacyDataPackage && !styledPackage) || !ID_PATTERN.test(manifest.id) || manifest.id === "narrator") throw new Error("invalid manifest");
    if (styledPackage) {
      if (manifest.styleMode !== undefined && !["overlay", "isolated"].includes(manifest.styleMode)) throw new Error("invalid stylesheet mode");
      // Keep older v2 packages working as before; new packages can opt into a clean slate.
      if (manifest.styleMode === undefined) manifest.styleMode = "overlay";
    }
    const profilePath = manifest.profileFile || "profile.json";
    if (profilePath !== "profile.json" || !files.has(profilePath)) throw new Error("profile missing");
    const profile = JSON.parse(decoder.decode(files.get(profilePath)));
    if (!profile || !profile.avatar || !profile.fields || typeof profile.fields !== "object") throw new Error("profile shape invalid");
    if (!manifest.label || typeof manifest.label !== "object") throw new Error("label missing");
    assertText(manifest.label.fa, 80);
    assertText(manifest.label.en, 80);
    for (const [key, translations] of Object.entries(profile.fields)) {
      if (!/^[a-zA-Z0-9]+$/.test(key) || !translations || typeof translations !== "object") throw new Error("invalid field");
      for (const lang of ["fa", "en"]) if (translations[lang] !== undefined) assertText(translations[lang]);
    }
    if (profile.avatar.image !== undefined) {
      assertText(profile.avatar.image, 160);
      if (!files.has(profile.avatar.image) || !/\.(?:png|jpe?g|webp|gif|avif)$/i.test(profile.avatar.image)) throw new Error("avatar image missing or unsupported");
      if (profile.avatar.alt !== undefined) assertText(profile.avatar.alt, 300);
    }
    if (profile.links !== undefined) {
      for (const [key, href] of Object.entries(profile.links)) {
        if (!/^[a-zA-Z0-9]+$/.test(key)) throw new Error("invalid link key");
        assertText(href, 2000);
        if (!/^(?:https?:|mailto:|tel:|\.\.?\/|\/)/i.test(href)) throw new Error("invalid link URL");
      }
    }
    if (styledPackage) {
      if (typeof manifest.stylesheet !== "string" || !/^styles\/[a-zA-Z0-9._/-]+\.css$/.test(manifest.stylesheet) || manifest.stylesheet.split("/").some((part) => part === ".." || part === ".")) throw new Error("stylesheet path invalid");
      const stylesheet = files.get(manifest.stylesheet);
      if (!stylesheet || stylesheet.byteLength > MAX_STYLESHEET_SIZE) throw new Error("stylesheet missing or too large");
      validateStylesheet(new TextDecoder("utf-8", { fatal: true }).decode(stylesheet), files, false);
    }
    return { manifest, profile };
  }

  function showNotice(message, isError = false) {
    let notice = document.querySelector("#persona-notice");
    if (!notice) {
      notice = document.createElement("p");
      notice.id = "persona-notice";
      notice.setAttribute("role", "status");
      document.body.append(notice);
    }
    notice.textContent = message;
    notice.classList.toggle("persona-notice-error", isError);
    window.setTimeout(() => notice.remove(), 6000);
  }

  function imageMime(path) {
    const extension = path.split(".").pop().toLowerCase();
    return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif" })[extension];
  }

  function assetMime(path) {
    const extension = path.split(".").pop().toLowerCase();
    return ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif", woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf", otf: "font/otf" })[extension];
  }

  function validateStylesheet(cssText, files, rewrite) {
    const inspectableCss = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
    if (/@import\b|expression\s*\(|-moz-binding|(?:^|[;{}])\s*behavior\s*:|javascript\s*:/i.test(inspectableCss)) throw new Error("Unsafe CSS feature");
    return cssText.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi, (_match, doubleQuoted, singleQuoted, bare) => {
      const reference = (doubleQuoted ?? singleQuoted ?? bare ?? "").trim();
      if (reference.startsWith("#")) return `url("${reference}")`;
      let path;
      try { path = decodeURIComponent(reference); } catch { throw new Error("Invalid CSS asset path"); }
      path = path.replace(/^\.\//, "");
      if (!path.startsWith("assets/") || path.includes("\\") || path.includes("?") || path.includes("#") || path.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("CSS assets must use local assets/ paths");
      const bytes = files.get(path);
      const mime = assetMime(path);
      if (!bytes || !mime) throw new Error("CSS asset missing or unsupported");
      const url = rewrite ? URL.createObjectURL(new Blob([bytes], { type: mime })) : path;
      return `url("${url}")`;
    });
  }

  function applyPersonaStyles(manifest, files) {
    if (manifest.kind !== "styled") return;
    const stylesheet = files.get(manifest.stylesheet);
    const cssText = new TextDecoder("utf-8", { fatal: true }).decode(stylesheet);
    const rewritten = validateStylesheet(cssText, files, true);
    document.querySelector('style[data-uploaded-persona]')?.remove();
    const style = document.createElement("style");
    style.dataset.uploadedPersona = manifest.id;
    style.textContent = rewritten;
    document.documentElement.dataset.persona = manifest.id;
    document.body.dataset.persona = manifest.id;
    document.head.append(style);
  }

  function applyProfile(profile, files) {
    for (const [key, translations] of Object.entries(profile.fields || {})) {
      for (const lang of ["fa", "en"]) {
        const value = translations?.[lang];
        if (typeof value !== "string") continue;
        const marker = `profile.${key}.${lang}`;
        for (const node of document.querySelectorAll("[data-edit-field]")) {
          if (node.dataset.editField === marker) node.textContent = value;
        }
      }
    }
    if (profile.avatar?.image && files.has(profile.avatar.image)) {
      const image = files.get(profile.avatar.image);
      const url = URL.createObjectURL(new Blob([image], { type: imageMime(profile.avatar.image) }));
      document.querySelectorAll("img.art-avatar").forEach((node) => {
        node.src = url;
        if (profile.avatar.alt) node.alt = profile.avatar.alt;
      });
    }
    for (const [key, href] of Object.entries(profile.links || {})) {
      document.querySelectorAll(`[data-profile-link="${CSS.escape(key)}"]`).forEach((node) => node.setAttribute("href", href));
    }
  }

  function removeNarratorStyles() {
    document.querySelectorAll('link[rel~="stylesheet"]:not([data-persona-ui])').forEach((node) => node.remove());
    document.querySelectorAll("style").forEach((node) => node.remove());
    document.querySelectorAll("[style]:not(html)").forEach((node) => node.removeAttribute("style"));
    document.documentElement.dataset.personaActive = "true";
    const hiddenLanguage = isEnglish ? ".lang-fa" : ".lang-en";
    document.querySelectorAll(".lang-fa,.lang-en").forEach((node) => {
      node.hidden = node.matches(hiddenLanguage);
    });
  }

  function revealPage() {
    document.documentElement.removeAttribute("style");
    delete document.documentElement.dataset.personaRequested;
    delete document.documentElement.dataset.personaPending;
  }

  async function loadPersona(id) {
    if (!id || id === "narrator") return null;
    if (!ID_PATTERN.test(id)) return null;
    const record = await dbRequest("readonly", "getAll");
    const item = record.find((entry) => entry.id === id);
    if (!item) return null;
    const files = await unzip(item.archive);
    const validated = validatePackage(files);
    if (validated.manifest.id !== id) return null;
    if (validated.manifest.kind === "styled" && validated.manifest.styleMode === "isolated") removeNarratorStyles();
    applyProfile(validated.profile, files);
    applyPersonaStyles(validated.manifest, files);
    return validated.manifest;
  }

  function setPersonaInUrl(id) {
    const url = new URL(location.href);
    if (!id || id === "narrator") url.searchParams.delete("persona");
    else url.searchParams.set("persona", id);
    location.assign(url.href);
  }

  async function renderPicker(activeId) {
    const uploads = await dbRequest("readonly", "getAll");
    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "persona-fab";
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.setAttribute("aria-controls", "persona-dialog");
    launcher.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-2.8L12 2Z"/><path d="m19 2 .7 2.3L22 5l-2.3.7L19 8l-.7-2.3L16 5l2.3-.7L19 2Z"/></svg>';
    const launcherText = document.createElement("span");
    launcherText.textContent = copy.title;
    launcher.append(launcherText);

    const dialog = document.createElement("dialog");
    dialog.id = "persona-dialog";
    dialog.className = "persona-dialog";
    const panel = document.createElement("section");
    panel.className = "persona-dialog-panel";
    const header = document.createElement("header");
    header.className = "persona-dialog-header";
    const heading = document.createElement("h2");
    heading.id = "persona-dialog-title";
    heading.textContent = copy.title;
    dialog.setAttribute("aria-labelledby", heading.id);
    const close = document.createElement("button");
    close.type = "button";
    close.className = "persona-dialog-close";
    close.setAttribute("aria-label", copy.close);
    close.textContent = "×";
    close.addEventListener("click", () => dialog.close());
    header.append(heading, close);
    panel.append(header);

    const select = document.createElement("select");
    select.className = "persona-select";
    select.setAttribute("aria-label", copy.choose);
    const defaults = document.createElement("option");
    defaults.value = "narrator";
    defaults.textContent = copy.narrator;
    select.append(defaults);
    for (const upload of uploads) {
      const option = document.createElement("option");
      option.value = upload.id;
      option.textContent = upload.label?.[isEnglish ? "en" : "fa"] || upload.id;
      select.append(option);
    }
    select.value = uploads.some((item) => item.id === activeId) ? activeId : "narrator";
    select.addEventListener("change", () => setPersonaInUrl(select.value));
    panel.append(select);

    const label = document.createElement("label");
    label.className = "persona-upload-label";
    const uploadText = document.createElement("span");
    uploadText.textContent = copy.upload;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".zip,application/zip,application/x-zip-compressed";
    input.className = "persona-file-input";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        if (file.size > MAX_ARCHIVE_SIZE) throw new Error("Archive too large");
        const archive = await file.arrayBuffer();
        const files = await unzip(archive);
        const { manifest } = validatePackage(files);
        const alreadyStored = (await dbRequest("readonly", "getAll")).some((entry) => entry.id === manifest.id);
        if (alreadyStored && !window.confirm(copy.replace)) {
          input.value = "";
          return;
        }
        await dbRequest("readwrite", "put", { id: manifest.id, label: manifest.label, archive });
        sessionStorage.setItem("persona-notice", copy.saved);
        setPersonaInUrl(manifest.id);
      } catch (error) {
        const message = error?.message === "ZIP decompression unavailable" ? copy.unsupportedZip : copy.badZip;
        showNotice(message, true);
        input.value = "";
      }
    });
    label.append(input);
    label.append(uploadText);
    panel.append(label);

    if (uploads.some((item) => item.id === activeId)) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "persona-remove-button";
      remove.textContent = copy.remove;
      remove.addEventListener("click", async () => {
        await dbRequest("readwrite", "delete", activeId);
        setPersonaInUrl("narrator");
      });
      panel.append(remove);
    }
    const note = document.createElement("p");
    note.className = "persona-dialog-note";
    note.textContent = copy.localNote;
    panel.append(note);
    dialog.append(panel);
    launcher.addEventListener("click", () => dialog.showModal());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    document.body.append(launcher, dialog);
  }

  function preservePersonaOnLinks(id) {
    if (!id || id === "narrator") return;
    document.querySelectorAll("a[href]").forEach((anchor) => {
      try {
        const target = new URL(anchor.href, location.href);
        if (target.origin !== location.origin || !["http:", "https:"].includes(target.protocol)) return;
        if (!/^\/(?:|en\/|about\.html|projects\.html|en\/about\.html|en\/projects\.html)$/.test(target.pathname)) return;
        target.searchParams.set("persona", id);
        anchor.href = target.href;
      } catch {}
    });
  }

  async function init() {
    const pendingNotice = sessionStorage.getItem("persona-notice");
    if (pendingNotice) {
      sessionStorage.removeItem("persona-notice");
      showNotice(pendingNotice);
    }
    const params = new URLSearchParams(location.search);
    let activeId = params.get("persona") || "narrator";
    try {
      const manifest = await loadPersona(activeId);
      if (!manifest && activeId !== "narrator") {
        activeId = "narrator";
        const url = new URL(location.href);
        url.searchParams.delete("persona");
        history.replaceState(null, "", url.href);
      }
    } catch {
      showNotice(copy.badZip, true);
      activeId = "narrator";
    }
    preservePersonaOnLinks(activeId);
    await renderPicker(activeId);
    revealPage();
  }

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL("persona-uploader.css", assetBase).href;
  style.dataset.personaUi = "true";
  document.head.append(style);
  init().catch(() => {
    revealPage();
    showNotice(copy.badZip, true);
  });
})();
