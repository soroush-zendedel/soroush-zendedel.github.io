(() => {
  const token = "__EDITOR_TOKEN__";
  const isEnglish = document.documentElement.lang === "en";
  const style = document.createElement("style");
  style.textContent = `
    .dev-editor-toggle,.dev-editor-tools,.dev-editor-handle,.dev-editor-toast{font:inherit;z-index:2147483000}
    .dev-editor-toggle{position:fixed;inset-inline-start:18px;bottom:18px;border:0;border-radius:999px;padding:10px 16px;background:#b91c1c;color:#fff;box-shadow:0 6px 24px #0003;cursor:pointer;font-size:14px;font-weight:700}
    .dev-editor-toggle[aria-pressed="true"]{background:#292524}
    body.dev-editor-on [data-edit-field]{outline:1px dashed #b91c1c;outline-offset:3px;cursor:text;border-radius:3px}
    body.dev-editor-on [data-edit-field]:hover{background:#b91c1c12}
    [data-edit-field][contenteditable="true"]{outline:2px solid #b91c1c;background:#fffdf8;cursor:text}
    .dev-project-wrap{position:relative;min-width:0}
    .dev-editor-handle{position:absolute;top:7px;inset-inline-start:7px;width:32px;height:32px;border:1px solid #b91c1c55;border-radius:8px;background:#fdfcfb;color:#7f1d1d;box-shadow:0 2px 8px #0002;cursor:grab;font-size:18px;line-height:1}
    .dev-editor-handle:active{cursor:grabbing}
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

  let enabled = false;
  let editing = null;
  let toastTimer;

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
    });
  }

  function setEnabled(value) {
    enabled = value;
    document.body.classList.toggle("dev-editor-on", enabled);
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.textContent = enabled
      ? (isEnglish ? "✓ Done editing" : "✓ پایان ویرایش")
      : (isEnglish ? "✎ Edit" : "✎ ویرایش");
    if (enabled) wrapCards();
    else {
      if (editing) cancelEdit();
      unwrapCards();
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

  toggle.addEventListener("click", () => setEnabled(!enabled));
  document.addEventListener("click", (event) => {
    if (!enabled || event.target.closest(".dev-editor-toggle,.dev-editor-tools,.dev-editor-handle")) return;
    const field = event.target.closest("[data-edit-field]");
    if (!field) return;
    const project = field.closest("[data-project-id]");
    if (!project) return;
    event.preventDefault();
    event.stopPropagation();
    beginEdit(field, project.dataset.projectId);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (!editing) return;
    if (event.key === "Escape") cancelEdit();
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) saveEdit();
  });
  window.addEventListener("resize", () => { if (editing) placeTools(editing.target, editing.tools); });
  window.addEventListener("scroll", () => { if (editing) placeTools(editing.target, editing.tools); }, true);

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
})();
