(() => {
  const trigger = document.querySelector('header a[data-profile-link="contact"]');
  const popover = document.querySelector("[data-contact-popover]");
  if (!trigger || !popover) return;
  popover.dir = document.documentElement.lang === "fa" ? "rtl" : "ltr";
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");

  const close = (focus = false) => {
    popover.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (focus) trigger.focus();
  };

  trigger.addEventListener("click", (event) => {
    if (document.body.classList.contains("dev-editor-on")) return;
    event.preventDefault();
    const opening = popover.hidden;
    if (opening) {
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(304, window.innerWidth - 32);
      popover.style.left = `${Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 16), window.innerWidth - width - 16)}px`;
      popover.style.top = `${Math.min(rect.bottom + 10, window.innerHeight - 280)}px`;
    }
    popover.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
    if (opening) popover.querySelector("a")?.focus();
  });

  document.addEventListener("click", (event) => {
    if (!popover.hidden && !popover.contains(event.target) && !trigger.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popover.hidden) close(true);
  });
  popover.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
})();
