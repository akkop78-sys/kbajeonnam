(function () {
  if (location.protocol === "file:") {
    const banner = document.createElement("div");
    banner.className = "notice-banner";
    banner.style.position = "sticky";
    banner.style.top = "0";
    banner.style.zIndex = "9999";
    banner.innerHTML =
      '사진·조직도·발대식 갤러리는 <strong>http://127.0.0.1:8765</strong> 로 미리보기 해 주세요. HTML 파일을 직접 열면 표시되지 않습니다. <code>website/미리보기.bat</code> 또는 <code>preview.bat</code> 을 실행하세요.';
    document.body.prepend(banner);
  }

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
  const showReveal = (el) => el.classList.add("visible");

  function revealHashTarget(el) {
    if (!el) return;
    if (el.classList.contains("reveal")) showReveal(el);
    el.querySelectorAll(".reveal").forEach(showReveal);
    el.closest(".reveal")?.classList.add("visible");
  }

  // 갤러리 등 비동기 콘텐츠가 늘어난 뒤에도 #해시 위치가 맞도록 재스크롤
  function scrollToHash() {
    const hash = location.hash;
    if (!hash || hash.length < 2) return;
    let el = null;
    try {
      el = document.querySelector(hash);
    } catch (_) {
      return;
    }
    if (!el) return;
    revealHashTarget(el);
    el.scrollIntoView({ block: "start", behavior: "auto" });
  }

  window.__scrollToHash = scrollToHash;

  if (location.hash) {
    revealHashTarget(document.querySelector(location.hash));
    scrollToHash();
  }

  window.addEventListener("hashchange", scrollToHash);
  window.addEventListener("load", () => {
    scrollToHash();
    [150, 500, 1200].forEach((ms) => setTimeout(scrollToHash, ms));
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            showReveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      // 긴 블록은 8% 노출이 어려워 화면에서 안 보이는 경우가 있어 완화
      { threshold: 0, rootMargin: "0px 0px -32px 0px" }
    );
    reveals.forEach((el) => {
      if (el.classList.contains("visible")) return;
      io.observe(el);
    });
  } else {
    reveals.forEach(showReveal);
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
