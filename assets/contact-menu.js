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

  const placePopover = () => {
    const rect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const edge = 16;
    const gap = 10;
    const width = popoverRect.width;
    const height = popoverRect.height;
    const left = Math.max(edge, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - edge));
    const isFloating = getComputedStyle(trigger).position === "fixed";
    const dock = document.body.classList.contains("dev-editor-dock-actions-visible")
      ? document.querySelector(".dev-editor-action-dock")
      : null;
    const dockTop = dock && !dock.hidden ? dock.getBoundingClientRect().top - gap : Infinity;

    let top;
    if (isFloating) {
      const availableBottom = Math.min(rect.top - gap, dockTop);
      top = availableBottom - height;
      if (top < edge) top = Math.max(edge, Math.min(rect.bottom + gap, window.innerHeight - height - edge));
    } else {
      const below = rect.bottom + gap;
      top = below + height <= window.innerHeight - edge
        ? below
        : Math.max(edge, rect.top - height - gap);
    }

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  };

  trigger.addEventListener("click", (event) => {
    if (document.body.classList.contains("dev-editor-on")) return;
    event.preventDefault();
    const opening = popover.hidden;
    if (opening) {
      popover.hidden = false;
      placePopover();
    }
    if (!opening) popover.hidden = true;
    trigger.setAttribute("aria-expanded", String(opening));
    if (opening) popover.querySelector("a")?.focus();
  });

  window.addEventListener("resize", () => {
    if (!popover.hidden) placePopover();
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
