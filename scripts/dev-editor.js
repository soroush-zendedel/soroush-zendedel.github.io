(() => {
  const token = "__EDITOR_TOKEN__";
  const isEnglish = document.documentElement.lang === "en";
  const style = document.createElement("style");
  style.textContent = `
    .dev-editor-toggle,.dev-editor-undo,.dev-editor-add,.dev-editor-tools,.dev-editor-handle,.dev-editor-settings-button,.dev-editor-settings,.dev-editor-toast{font:inherit;z-index:2147483000}
    .dev-editor-toggle{position:fixed;inset-inline-start:18px;bottom:18px;border:0;border-radius:999px;padding:10px 16px;background:#b91c1c;color:#fff;box-shadow:0 6px 24px #0003;cursor:pointer;font-size:14px;font-weight:700}
    .dev-editor-toggle[aria-pressed="true"]{background:#292524}
    .dev-editor-undo{position:fixed;inset-inline-start:150px;bottom:18px;max-width:calc(100vw - 176px);border:1px solid #7f1d1d55;border-radius:999px;padding:10px 13px;background:#fdfcfb;color:#7f1d1d;box-shadow:0 6px 24px #0002;cursor:pointer;font-size:13px;font-weight:700}
    .dev-editor-add{position:fixed;inset-inline-start:18px;bottom:70px;border:1px solid #b91c1c55;border-radius:999px;padding:10px 15px;background:#fdfcfb;color:#7f1d1d;box-shadow:0 6px 24px #0002;cursor:pointer;font-size:13px;font-weight:700}
    body.dev-editor-on .dev-editor-undo{pointer-events:auto}
    body.dev-editor-on .dev-editor-add{pointer-events:auto}
    .dev-editor-toggle:disabled,.dev-editor-undo:disabled,.dev-editor-add:disabled{opacity:.55;cursor:wait}
    .dev-editor-add[hidden],.dev-editor-undo[hidden],.dev-editor-modal-layer[hidden]{display:none!important}
    body.dev-editor-on a,body.dev-editor-on button,body.dev-editor-on [role="button"],body.dev-editor-on input,body.dev-editor-on select,body.dev-editor-on summary{pointer-events:none}
    body.dev-editor-on [data-edit-field],body.dev-editor-on .dev-editor-toggle,body.dev-editor-on .dev-editor-handle,body.dev-editor-on .dev-editor-settings-button,body.dev-editor-on .dev-editor-settings,body.dev-editor-on .dev-editor-settings *,body.dev-editor-on .dev-editor-tools button{pointer-events:auto}
    body.dev-editor-on [data-edit-field]{outline:1px dashed #b91c1c;outline-offset:3px;cursor:text;border-radius:3px}
    body.dev-editor-on [data-edit-field]:hover{background:#b91c1c12}
    [data-edit-field][contenteditable="true"]{outline:2px solid #b91c1c;background:#fffdf8;cursor:text}
    .dev-project-wrap{position:relative;min-width:0}
    .dev-editor-handle{position:absolute;top:7px;inset-inline-start:7px;width:32px;height:32px;border:1px solid #b91c1c55;border-radius:8px;background:#fdfcfb;color:#7f1d1d;box-shadow:0 2px 8px #0002;cursor:grab;font-size:18px;line-height:1}
    .dev-editor-handle:active{cursor:grabbing}
    .dev-editor-settings-button{position:absolute;top:7px;inset-inline-start:46px;width:32px;height:32px;border:1px solid #b91c1c55;border-radius:8px;background:#fdfcfb;color:#7f1d1d;box-shadow:0 2px 8px #0002;cursor:pointer;font-size:16px}
    .dev-editor-settings{position:fixed;z-index:2147483000;box-sizing:border-box;width:min(300px,calc(100vw - 32px));max-height:calc(100vh - 16px);overflow-y:auto;padding:12px;border:1px solid #1a1a1a18;border-radius:10px;background:#fdfcfb;color:#292524;box-shadow:0 8px 28px #0003;text-align:start;font-size:13px}
    .dev-editor-settings-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;font-weight:700}
    .dev-editor-settings-close{width:30px;height:30px;border:0;border-radius:7px;background:#eee9e3;color:#292524;cursor:pointer;font-size:20px;line-height:1}
    .dev-editor-settings label{display:block;margin:0 0 5px;font-size:12px;font-weight:700}
    .dev-editor-settings input[type="url"]{box-sizing:border-box;width:100%;padding:8px;border:1px solid #29252433;border-radius:6px;background:white;color:#292524;direction:ltr}
    .dev-editor-settings input[type="file"]{display:block;width:100%;margin:7px 0}
    .dev-editor-settings button{margin-top:7px;padding:7px 10px;border:0;border-radius:6px;background:#b91c1c;color:#fff;cursor:pointer}
    .dev-editor-settings hr{margin:12px 0;border:0;border-top:1px solid #29252422}
    .dev-editor-modal-layer{position:fixed;inset:0;z-index:2147483100;display:grid;place-items:center;padding:16px;background:#17141199}
    body.dev-editor-on .dev-editor-modal-layer,body.dev-editor-on .dev-editor-modal-layer *{pointer-events:auto}
    .dev-editor-modal{box-sizing:border-box;width:min(640px,100%);max-height:min(92vh,850px);overflow:auto;border:1px solid #1a1a1a20;border-radius:16px;background:#fdfcfb;color:#292524;box-shadow:0 20px 60px #0005;text-align:start}
    .dev-editor-modal-header{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid #1a1a1a18;background:#fdfcfb}
    .dev-editor-modal-header h2{margin:0;font-size:18px;font-weight:800}
    .dev-editor-modal-close{width:34px;height:34px;border:0;border-radius:8px;background:#eee9e3;color:#292524;cursor:pointer;font-size:22px;line-height:1}
    .dev-editor-project-form{padding:18px 20px 20px}
    .dev-editor-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .dev-editor-form-field{min-width:0}.dev-editor-form-field[data-wide]{grid-column:1/-1}
    .dev-editor-form-field label{display:block;margin:0 0 5px;font-size:12px;font-weight:700}
    .dev-editor-form-field input,.dev-editor-form-field textarea{box-sizing:border-box;width:100%;padding:9px 10px;border:1px solid #29252433;border-radius:7px;background:white;color:#292524;font:inherit;font-size:14px}
    .dev-editor-form-field textarea{min-height:82px;resize:vertical;line-height:1.6}
    .dev-editor-form-note{margin:6px 0 0;color:#29252499;font-size:12px;line-height:1.6}
    .dev-editor-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
    .dev-editor-modal-actions button{padding:9px 14px;border:0;border-radius:8px;background:#eee9e3;color:#292524;cursor:pointer;font:inherit;font-size:13px;font-weight:700}
    .dev-editor-modal-actions button[data-submit]{background:#b91c1c;color:white}
    @media(max-width:520px){.dev-editor-form-grid{grid-template-columns:1fr}.dev-editor-form-field[data-wide]{grid-column:auto}.dev-editor-modal-layer{padding:10px}.dev-editor-project-form{padding:14px}}
    .dev-project-wrap.dev-dragging{opacity:.45}
    .dev-project-wrap.dev-drop-target{outline:2px solid #b91c1c;outline-offset:3px;border-radius:10px}
    .dev-editor-tools{position:fixed;display:flex;gap:6px;padding:5px;border:1px solid #1a1a1a18;border-radius:10px;background:#fdfcfb;box-shadow:0 5px 20px #0002}
    .dev-editor-tools button{width:34px;height:32px;border:0;border-radius:7px;background:#eee9e3;color:#292524;cursor:pointer;font-size:20px}
    .dev-editor-tools button[data-save]{background:#b91c1c;color:white}
    .dev-editor-toast{position:fixed;inset-inline-start:18px;bottom:70px;max-width:min(360px,calc(100vw - 36px));padding:10px 14px;border-radius:10px;background:#292524;color:#fff;box-shadow:0 5px 20px #0003;font-size:13px}
  `;
  document.head.append(style);

  const toggle = document.createElement("button");
  toggle.className = "dev-editor-toggle";
  toggle.type = "button";
  toggle.textContent = isEnglish ? "✎ Edit" : "✎ ویرایش";
  toggle.setAttribute("aria-pressed", "false");
  document.body.append(toggle);

  const undoButton = document.createElement("button");
  undoButton.className = "dev-editor-undo";
  undoButton.type = "button";
  undoButton.hidden = true;
  undoButton.textContent = isEnglish ? "↶ Undo this session" : "↶ لغو این نوبت";
  undoButton.title = isEnglish ? "Undo all edits in this editing session" : "بازگرداندن همهٔ تغییرهای این نوبت ویرایش";
  document.body.append(undoButton);

  const addButton = document.createElement("button");
  addButton.className = "dev-editor-add";
  addButton.type = "button";
  addButton.hidden = true;
  addButton.textContent = isEnglish ? "＋ Add project" : "＋ افزودن پروژه";
  addButton.addEventListener("click", openAddProjectModal);
  document.body.append(addButton);

  const modalLayer = document.createElement("div");
  modalLayer.className = "dev-editor-modal-layer";
  modalLayer.hidden = true;
  modalLayer.addEventListener("click", (event) => {
    if (event.target === modalLayer) closeAddProjectModal();
  });
  document.body.append(modalLayer);
  const modal = document.createElement("section");
  modal.className = "dev-editor-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "dev-project-modal-title");
  modalLayer.append(modal);

  let enabled = false;
  let editing = null;
  let toastTimer;
  let sessionBase = sessionStorage.getItem("dev-editor-session-base") || "";
  let sessionCommitCount = 0;

  function toast(message, error = false) {
    document.querySelector(".dev-editor-toast")?.remove();
    const item = document.createElement("div");
    item.className = "dev-editor-toast";
    item.setAttribute("role", error ? "alert" : "status");
    item.textContent = message;
    if (error) item.style.background = "#7f1d1d";
    document.body.append(item);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => item.remove(), 4200);
  }

  function unwrapCards() {
    document.querySelectorAll(".dev-project-wrap").forEach((wrapper) => {
      const link = wrapper.querySelector(":scope > a[data-project-id]");
      if (link) wrapper.parentNode.insertBefore(link, wrapper);
      wrapper.remove();
    });
  }

  function clearTextSelection() {
    window.getSelection()?.removeAllRanges();
  }

  function wrapCards() {
    const grid = document.querySelector("[data-project-grid]");
    if (!grid) return;
    [...grid.querySelectorAll(":scope > a[data-project-id]")].forEach((link) => {
      const wrapper = document.createElement("div");
      wrapper.className = "dev-project-wrap";
      wrapper.dataset.projectId = link.dataset.projectId;
      grid.insertBefore(wrapper, link);
      wrapper.append(link);

      const handle = document.createElement("button");
      handle.className = "dev-editor-handle";
      handle.type = "button";
      handle.draggable = true;
      handle.title = isEnglish ? "Drag to reorder" : "برای جابه‌جایی پروژه بکشید";
      handle.setAttribute("aria-label", isEnglish ? `Move ${link.dataset.projectId}` : `جابه‌جایی ${link.dataset.projectId}`);
      handle.textContent = "⠿";
      wrapper.append(handle);

      const settingsButton = document.createElement("button");
      settingsButton.className = "dev-editor-settings-button";
      settingsButton.type = "button";
      settingsButton.title = isEnglish ? "Project link and image" : "لینک و تصویر پروژه";
      settingsButton.setAttribute("aria-label", settingsButton.title);
      settingsButton.textContent = "⚙";
      settingsButton.addEventListener("click", () => openProjectSettings(wrapper, link, settingsButton));
      wrapper.append(settingsButton);
    });
  }

  function makeSettingsButton(label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", handler);
    return button;
  }

  function placeSettings(panel, button) {
    const rect = button.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - panelRect.width - 8, rect.left));
    const below = rect.bottom + 8;
    const top = below + panelRect.height <= window.innerHeight - 8
      ? below
      : Math.max(8, rect.top - panelRect.height - 8);
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function closeProjectSettings() {
    document.querySelector(".dev-editor-settings")?.remove();
  }

  function openProjectSettings(wrapper, link, trigger) {
    const existing = document.querySelector(".dev-editor-settings");
    if (existing?.dataset.projectId === wrapper.dataset.projectId) {
      existing.remove();
      return;
    }
    closeProjectSettings();
    const projectId = wrapper.dataset.projectId;
    const panel = document.createElement("div");
    panel.className = "dev-editor-settings";
    panel.dataset.projectId = projectId;
    panel._trigger = trigger;
    panel.addEventListener("click", (event) => event.stopPropagation());

    const header = document.createElement("div");
    header.className = "dev-editor-settings-header";
    const heading = document.createElement("span");
    heading.textContent = isEnglish ? "Project settings" : "تنظیمات پروژه";
    const close = document.createElement("button");
    close.className = "dev-editor-settings-close";
    close.type = "button";
    close.textContent = "×";
    close.title = isEnglish ? "Close" : "بستن";
    close.setAttribute("aria-label", close.title);
    close.addEventListener("click", closeProjectSettings);
    header.append(heading, close);

    const linkLabel = document.createElement("label");
    linkLabel.textContent = isEnglish ? "Project URL" : "نشانی پروژه";
    const linkInput = document.createElement("input");
    linkInput.type = "url";
    linkInput.value = link.href;
    linkInput.required = true;
    linkInput.setAttribute("aria-label", linkLabel.textContent);
    const saveLink = makeSettingsButton(isEnglish ? "Save link" : "ذخیرهٔ لینک", async () => {
      await saveProjectSetting({ type: "updateHref", projectId, value: linkInput.value }, saveLink);
    });
    panel.append(header, linkLabel, linkInput, saveLink);

    const divider = document.createElement("hr");
    const imageLabel = document.createElement("label");
    imageLabel.textContent = isEnglish ? "Replace project image" : "جایگزینی تصویر پروژه";
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/webp,image/jpeg,image/png,.webp,.jpg,.jpeg,.png";
    fileInput.setAttribute("aria-label", imageLabel.textContent);
    const replaceImage = makeSettingsButton(isEnglish ? "Upload and activate" : "بارگذاری و فعال‌سازی", async () => {
      const file = fileInput.files?.[0];
      if (!file) return toast(isEnglish ? "Choose an image first." : "ابتدا یک تصویر انتخاب کنید.", true);
      if (file.size > 5 * 1024 * 1024) return toast(isEnglish ? "Image must be 5 MB or smaller." : "حجم تصویر باید حداکثر ۵ مگابایت باشد.", true);
      const accepted = ["image/webp", "image/jpeg", "image/png"];
      if (!accepted.includes(file.type)) return toast(isEnglish ? "Use a WebP, JPEG, or PNG image." : "تصویر باید WebP، JPEG یا PNG باشد.", true);
      replaceImage.disabled = true;
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error(isEnglish ? "Could not read this image." : "خواندن تصویر ممکن نشد."));
          reader.readAsDataURL(file);
        });
        const data = String(dataUrl).split(",")[1];
        await saveProjectSetting({ type: "uploadImage", projectId, mime: file.type, data }, replaceImage);
      } catch (error) {
        replaceImage.disabled = false;
        toast(error.message, true);
      }
    });
    panel.append(divider, imageLabel, fileInput, replaceImage);
    document.body.append(panel);
    placeSettings(panel, trigger);
    linkInput.focus();
  }

  async function saveProjectSetting(payload, button) {
    button.disabled = true;
    try {
      const response = await fetch("/__dev/save", {
        method: "POST",
        headers: { "content-type": "application/json", "x-editor-token": token },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || (isEnglish ? "Could not save." : "ذخیره انجام نشد."));
      document.querySelectorAll(".dev-editor-settings").forEach((panel) => panel.remove());
      if (result.unchanged) return toast(isEnglish ? "No change to save." : "تغییری برای ذخیره وجود نداشت.");
      toast(isEnglish ? `Saved · commit ${result.commit}` : `ذخیره شد · کامیت ${result.commit}`);
      setTimeout(() => location.reload(), 700);
    } catch (error) {
      button.disabled = false;
      toast(error.message, true);
    }
  }

  function setEnabled(value) {
    enabled = value;
    if (enabled) sessionStorage.setItem("dev-editor-session-active", "1");
    else sessionStorage.removeItem("dev-editor-session-active");
    document.body.classList.toggle("dev-editor-on", enabled);
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.textContent = enabled
      ? (isEnglish ? "✓ Done editing" : "✓ پایان ویرایش")
      : (isEnglish ? "✎ Edit" : "✎ ویرایش");
    undoButton.hidden = !enabled || sessionCommitCount === 0;
    addButton.hidden = !enabled || !document.querySelector("[data-project-grid]");
    if (enabled) wrapCards();
    else {
      if (editing) cancelEdit();
      closeProjectSettings();
      closeAddProjectModal();
      unwrapCards();
    }
  }

  function closeAddProjectModal() {
    modalLayer.hidden = true;
  }

  function makeFormField({ id, label, type = "text", required = false, maxLength, placeholder = "", wide = false, rows = 3, note = "" }) {
    const wrapper = document.createElement("div");
    wrapper.className = "dev-editor-form-field";
    if (wide) wrapper.dataset.wide = "";
    const title = document.createElement("label");
    title.htmlFor = id;
    title.textContent = label;
    const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
    input.id = id;
    input.name = id;
    if (type !== "textarea") input.type = type;
    else input.rows = rows;
    input.required = required;
    if (maxLength) input.maxLength = maxLength;
    input.placeholder = placeholder;
    wrapper.append(title, input);
    if (note) {
      const helper = document.createElement("p");
      helper.className = "dev-editor-form-note";
      helper.textContent = note;
      wrapper.append(helper);
    }
    return { wrapper, input };
  }

  function slugFromName(value) {
    return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function openAddProjectModal() {
    if (!enabled) return;
    modal.replaceChildren();
    const header = document.createElement("header");
    header.className = "dev-editor-modal-header";
    const title = document.createElement("h2");
    title.id = "dev-project-modal-title";
    title.textContent = isEnglish ? "Add a project" : "افزودن پروژه";
    const close = document.createElement("button");
    close.className = "dev-editor-modal-close";
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", isEnglish ? "Close" : "بستن");
    close.addEventListener("click", closeAddProjectModal);
    header.append(title, close);

    const form = document.createElement("form");
    form.className = "dev-editor-project-form";
    const grid = document.createElement("div");
    grid.className = "dev-editor-form-grid";
    const fields = {};
    const fieldSpecs = [
      ["id", { label: isEnglish ? "Project ID (English slug)" : "شناسهٔ پروژه (نامک انگلیسی)", required: true, maxLength: 80, placeholder: "my-project", note: isEnglish ? "Used in the stable image filename." : "برای نام ثابت فایل تصویر هم استفاده می‌شود." }],
      ["faName", { label: "عنوان فارسی", required: true, maxLength: 200 }],
      ["enName", { label: "English title", required: true, maxLength: 200 }],
      ["faDescription", { label: "توضیح فارسی", type: "textarea", required: true, maxLength: 300 }],
      ["enDescription", { label: "English description", type: "textarea", required: true, maxLength: 300 }],
      ["href", { label: isEnglish ? "Project link" : "لینک پروژه", type: "url", required: true, maxLength: 2000, wide: true, placeholder: "https://example.com" }],
      ["image", { label: isEnglish ? "Project image" : "تصویر پروژه", type: "file", required: true, wide: true, note: isEnglish ? "WebP, JPEG, or PNG · up to 5 MB" : "WebP، JPEG یا PNG · حداکثر ۵ مگابایت" }],
      ["alt", { label: isEnglish ? "Image alt text (SEO/accessibility)" : "متن جایگزین تصویر (سئو و دسترس‌پذیری)", maxLength: 300, wide: true, note: isEnglish ? "Optional. Leave blank for a decorative image." : "اختیاری؛ اگر تصویر تزئینی است خالی بگذارید." }],
    ];
    for (const [key, spec] of fieldSpecs) {
      const field = makeFormField({ id: `new-project-${key}`, ...spec });
      fields[key] = field.input;
      grid.append(field.wrapper);
    }
    fields.id.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
    fields.id.title = isEnglish ? "Use lowercase English letters, numbers, and hyphens." : "از حروف کوچک انگلیسی، عدد و خط تیره استفاده کنید.";
    fields.image.accept = "image/webp,image/jpeg,image/png,.webp,.jpg,.jpeg,.png";
    const nameHint = document.createElement("p");
    nameHint.className = "dev-editor-form-note";
    nameHint.textContent = isEnglish
      ? "The About page initially uses the same names and descriptions; you can refine them afterward. New projects are added at the end of the full directory."
      : "عنوان و توضیحات صفحهٔ درباره ابتدا از همین مقادیر استفاده می‌کنند و بعداً جداگانه قابل ویرایش‌اند. پروژهٔ تازه در انتهای فهرست کامل قرار می‌گیرد.";
    grid.append(nameHint);

    let customId = false;
    fields.id.addEventListener("input", () => { customId = true; });
    fields.enName.addEventListener("input", () => { if (!customId) fields.id.value = slugFromName(fields.enName.value); });

    const actions = document.createElement("div");
    actions.className = "dev-editor-modal-actions";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = isEnglish ? "Cancel" : "لغو";
    cancel.addEventListener("click", closeAddProjectModal);
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.dataset.submit = "";
    submit.textContent = isEnglish ? "Add project" : "افزودن پروژه";
    actions.append(cancel, submit);
    form.append(grid, actions);
    form.addEventListener("submit", (event) => saveNewProject(event, form, fields, submit));
    modal.append(header, form);
    modalLayer.hidden = false;
    fields.faName.focus();
  }

  async function saveNewProject(event, form, fields, submit) {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const file = fields.image.files?.[0];
    if (!file) return toast(isEnglish ? "Choose a project image." : "تصویر پروژه را انتخاب کنید.", true);
    if (file.size > 5 * 1024 * 1024) return toast(isEnglish ? "Image must be 5 MB or smaller." : "حجم تصویر باید حداکثر ۵ مگابایت باشد.", true);
    if (!["image/webp", "image/jpeg", "image/png"].includes(file.type)) return toast(isEnglish ? "Use a WebP, JPEG, or PNG image." : "تصویر باید WebP، JPEG یا PNG باشد.", true);
    submit.disabled = true;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(isEnglish ? "Could not read this image." : "خواندن تصویر ممکن نشد."));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/__dev/save", {
        method: "POST",
        headers: { "content-type": "application/json", "x-editor-token": token },
        body: JSON.stringify({
          type: "addProject",
          id: fields.id.value.trim(),
          faName: fields.faName.value,
          enName: fields.enName.value,
          faDescription: fields.faDescription.value,
          enDescription: fields.enDescription.value,
          href: fields.href.value,
          alt: fields.alt.value,
          mime: file.type,
          data: String(dataUrl).split(",")[1],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || (isEnglish ? "Project could not be added." : "افزودن پروژه انجام نشد."));
      closeAddProjectModal();
      toast(isEnglish ? `Project added · commit ${result.commit}` : `پروژه اضافه شد · کامیت ${result.commit}`);
      setTimeout(() => location.reload(), 700);
    } catch (error) {
      submit.disabled = false;
      toast(error.message, true);
    }
  }

  async function requestEditSession(action, base = "") {
    const response = await fetch("/__dev/session", {
      method: "POST",
      headers: { "content-type": "application/json", "x-editor-token": token },
      body: JSON.stringify({ action, base }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || (isEnglish ? "Could not manage the edit session." : "مدیریت نوبت ویرایش ممکن نشد."));
    return result;
  }

  async function enterEditMode() {
    toggle.disabled = true;
    try {
      let result;
      if (sessionBase) {
        try {
          result = await requestEditSession("status", sessionBase);
        } catch (error) {
          sessionStorage.removeItem("dev-editor-session-base");
          sessionBase = "";
          toast(isEnglish
            ? "The previous edit session cannot be undone. A new session has started."
            : "نوبت قبلی را نمی‌توان یک‌جا برگرداند؛ نوبت تازه‌ای آغاز شد.", true);
        }
      }
      if (!result) {
        result = await requestEditSession("start");
        sessionBase = result.base;
        sessionStorage.setItem("dev-editor-session-base", sessionBase);
      }
      sessionCommitCount = result.count || 0;
      setEnabled(true);
    } catch (error) {
      toast(error.message, true);
    } finally {
      toggle.disabled = false;
    }
  }

  async function undoEditSession() {
    if (!sessionBase || !sessionCommitCount) return;
    const message = isEnglish
      ? `Undo all ${sessionCommitCount} project edit commit(s) made in this session? This restores the files to their state before editing began.`
      : `همهٔ ${sessionCommitCount} کامیت این نوبت ویرایش برگردد؟ فایل‌ها به وضعیت پیش از شروع ویرایش بازمی‌گردند.`;
    if (!window.confirm(message)) return;
    undoButton.disabled = true;
    toggle.disabled = true;
    try {
      const result = await requestEditSession("undo", sessionBase);
      sessionStorage.removeItem("dev-editor-session-base");
      sessionStorage.removeItem("dev-editor-session-active");
      sessionBase = "";
      sessionCommitCount = 0;
      setEnabled(false);
      toast(isEnglish ? `Undid ${result.undone || 0} edit commit(s).` : `${result.undone || 0} کامیت برگردانده شد.`);
      setTimeout(() => location.reload(), 700);
    } catch (error) {
      undoButton.disabled = false;
      toggle.disabled = false;
      toast(error.message, true);
    }
  }

  function placeTools(target, tools) {
    const rect = target.getBoundingClientRect();
    tools.style.top = `${Math.max(8, Math.min(window.innerHeight - 50, rect.bottom + 8))}px`;
    tools.style.left = `${Math.max(8, Math.min(window.innerWidth - 90, rect.left))}px`;
  }

  function cancelEdit() {
    if (!editing) return;
    editing.target.innerHTML = editing.originalHtml;
    editing.target.contentEditable = "false";
    editing.tools.remove();
    editing = null;
    clearTextSelection();
  }

  async function saveEdit() {
    if (!editing) return;
    const target = editing.target;
    const payload = {
      type: "update",
      projectId: editing.projectId,
      field: target.dataset.editField,
      value: target.innerText.replace(/\s+/g, " ").trim(),
    };
    const saveButton = editing.tools.querySelector("[data-save]");
    saveButton.disabled = true;
    try {
      const response = await fetch("/__dev/save", {
        method: "POST",
        headers: { "content-type": "application/json", "x-editor-token": token },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ذخیره انجام نشد.");
      target.contentEditable = "false";
      editing.tools.remove();
      editing = null;
      if (result.unchanged) {
        clearTextSelection();
        toast(isEnglish ? "No change to save." : "تغییری برای ذخیره وجود نداشت.");
        return;
      }
      clearTextSelection();
      toast(isEnglish ? `Saved · commit ${result.commit}` : `ذخیره شد · کامیت ${result.commit}`);
      setTimeout(() => location.reload(), 700);
    } catch (error) {
      saveButton.disabled = false;
      toast(error.message, true);
    }
  }

  function beginEdit(target, projectId) {
    if (editing) cancelEdit();
    editing = { target, projectId, originalHtml: target.innerHTML, tools: document.createElement("div") };
    target.contentEditable = "true";
    target.spellcheck = true;
    editing.tools.className = "dev-editor-tools";

    const save = document.createElement("button");
    save.type = "button";
    save.dataset.save = "";
    save.title = isEnglish ? "Save and commit" : "ذخیره و ثبت در Git";
    save.setAttribute("aria-label", isEnglish ? "Confirm and save" : "تأیید و ذخیره");
    save.textContent = "✓";
    save.addEventListener("click", saveEdit);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.title = isEnglish ? "Cancel edit" : "لغو تغییر";
    cancel.setAttribute("aria-label", isEnglish ? "Cancel edit" : "لغو تغییر");
    cancel.textContent = "×";
    cancel.addEventListener("click", cancelEdit);

    editing.tools.append(save, cancel);
    document.body.append(editing.tools);
    placeTools(target, editing.tools);
    target.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function saveOrder(ids) {
    try {
      const response = await fetch("/__dev/save", {
        method: "POST",
        headers: { "content-type": "application/json", "x-editor-token": token },
        body: JSON.stringify({ type: "reorder", projectIds: ids }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ترتیب ذخیره نشد.");
      if (result.unchanged) return;
      toast(isEnglish ? `Order saved · commit ${result.commit}` : `ترتیب ذخیره شد · کامیت ${result.commit}`);
      setTimeout(() => location.reload(), 700);
    } catch (error) {
      toast(error.message, true);
      setTimeout(() => location.reload(), 1200);
    }
  }

  toggle.addEventListener("click", () => {
    if (enabled) {
      sessionStorage.removeItem("dev-editor-session-base");
      sessionBase = "";
      sessionCommitCount = 0;
      setEnabled(false);
    } else {
      enterEditMode();
    }
  });
  undoButton.addEventListener("click", undoEditSession);
  document.addEventListener("pointerdown", (event) => {
    const panel = document.querySelector(".dev-editor-settings");
    if (panel && !event.target.closest(".dev-editor-settings,.dev-editor-settings-button")) closeProjectSettings();
    if (!enabled || event.target.closest(".dev-editor-toggle,.dev-editor-undo,.dev-editor-add,.dev-editor-modal-layer,.dev-editor-tools,.dev-editor-handle,.dev-editor-settings-button,.dev-editor-settings")) return;
    const field = event.target.closest("[data-edit-field]");
    if (!field) return;
    const project = field.closest("[data-project-id]");
    if (!project) return;
    event.preventDefault();
    event.stopPropagation();
    beginEdit(field, project.dataset.projectId);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (enabled && event.key === "Escape" && !modalLayer.hidden) {
      closeAddProjectModal();
      return;
    }
    if (enabled && event.key === "Escape" && document.querySelector(".dev-editor-settings")) {
      closeProjectSettings();
      return;
    }
    if (enabled && !event.target.closest(".dev-editor-toggle,.dev-editor-undo,.dev-editor-add,.dev-editor-modal-layer,.dev-editor-tools,.dev-editor-handle,.dev-editor-settings-button,.dev-editor-settings,[contenteditable=\"true\"]")) {
      const control = event.target.closest("a,button,[role=\"button\"],input,select,summary");
      if (control && (event.key === "Enter" || event.key === " " || event.key === "Spacebar")) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
    if (!editing) return;
    if (event.key === "Escape") cancelEdit();
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) saveEdit();
  }, true);

  document.addEventListener("click", (event) => {
    if (!enabled || event.target.closest(".dev-editor-toggle,.dev-editor-undo,.dev-editor-add,.dev-editor-modal-layer,.dev-editor-tools,.dev-editor-handle,.dev-editor-settings-button,.dev-editor-settings")) return;
    const control = event.target.closest("a,button,[role=\"button\"],input,select,summary");
    if (!control) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  function repositionSettings() {
    const panel = document.querySelector(".dev-editor-settings");
    if (panel?._trigger?.isConnected) placeSettings(panel, panel._trigger);
  }
  window.addEventListener("resize", () => {
    if (editing) placeTools(editing.target, editing.tools);
    repositionSettings();
  });
  window.addEventListener("scroll", () => {
    if (editing) placeTools(editing.target, editing.tools);
    repositionSettings();
  }, true);

  document.addEventListener("dragstart", (event) => {
    const handle = event.target.closest(".dev-editor-handle");
    if (!enabled || !handle) return;
    const wrapper = handle.closest(".dev-project-wrap");
    event.dataTransfer.setData("text/plain", wrapper.dataset.projectId);
    event.dataTransfer.effectAllowed = "move";
    wrapper.classList.add("dev-dragging");
  });
  document.addEventListener("dragend", (event) => {
    event.target.closest(".dev-editor-handle")?.closest(".dev-project-wrap")?.classList.remove("dev-dragging");
    document.querySelectorAll(".dev-drop-target").forEach((item) => item.classList.remove("dev-drop-target"));
  });
  document.addEventListener("dragover", (event) => {
    const wrapper = event.target.closest(".dev-project-wrap");
    if (!enabled || !wrapper || !document.querySelector(".dev-dragging")) return;
    event.preventDefault();
    wrapper.classList.add("dev-drop-target");
  });
  document.addEventListener("dragleave", (event) => event.target.closest(".dev-project-wrap")?.classList.remove("dev-drop-target"));
  document.addEventListener("drop", (event) => {
    const target = event.target.closest(".dev-project-wrap");
    const moving = document.querySelector(".dev-project-wrap.dev-dragging");
    if (!enabled || !target || !moving || target === moving) return;
    event.preventDefault();
    const rect = target.getBoundingClientRect();
    const sameRow = Math.abs(event.clientY - (rect.top + rect.height / 2)) < rect.height / 2;
    const rtl = getComputedStyle(target.parentNode).direction === "rtl";
    const after = sameRow
      ? (rtl ? event.clientX < rect.left + rect.width / 2 : event.clientX > rect.left + rect.width / 2)
      : event.clientY > rect.top + rect.height / 2;
    target.parentNode.insertBefore(moving, after ? target.nextSibling : target);
    target.classList.remove("dev-drop-target");
    const ids = [...target.parentNode.querySelectorAll(":scope > .dev-project-wrap")].map((item) => item.dataset.projectId);
    saveOrder(ids);
  });

  if (sessionBase && sessionStorage.getItem("dev-editor-session-active") === "1") {
    requestEditSession("status", sessionBase).then((result) => {
      sessionCommitCount = result.count || 0;
      setEnabled(true);
    }).catch((error) => {
      sessionStorage.removeItem("dev-editor-session-active");
      setEnabled(false);
      toast(error.message, true);
    });
  }
})();
