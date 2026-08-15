(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const header = document.querySelector(".site-header");

  function setNavOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  }

  function closeNav() {
    setNavOpen(false);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      setNavOpen(!nav.classList.contains("open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("open")) return;
      const target = e.target;
      if (target instanceof Node && header && !header.contains(target)) {
        closeNav();
      }
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 901px)").matches) closeNav();
    });
  }

  document.querySelectorAll("[data-tabs]").forEach((root) => {
    const buttons = root.querySelectorAll(".tab-btn");
    const panels = root.querySelectorAll(".tab-panel");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-tab");
        buttons.forEach((b) => b.classList.remove("active"));
        panels.forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const panel = root.querySelector(`#${id}`);
        if (panel) panel.classList.add("active");
      });
    });
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector("[name=name]")?.value?.trim() || "";
      const email = form.querySelector("[name=email]")?.value?.trim() || "";
      const message = form.querySelector("[name=message]")?.value?.trim() || "";
      const subject = encodeURIComponent(`[전남권투협회 문의] ${name}`);
      const body = encodeURIComponent(`이름: ${name}\n이메일: ${email}\n\n${message}`);
      window.location.href = `mailto:info@jnba.example?subject=${subject}&body=${body}`;
    });
  }
})();
