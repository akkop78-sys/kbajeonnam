(function () {
  const DATA_URL = new URL("../data/leadership.json", document.currentScript.src).href;

  function formatSince(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${y}. ${Number(m)}. ${Number(d)}.`;
  }

  function renderHero(president) {
    const root = document.querySelector("[data-leadership='hero']");
    if (!root || !president) return;

    const photo = president.photo || "";
    const name = president.name || "";
    const title = president.title || "회장";
    const greetingUrl = president.greetingUrl || "pages/about.html";
    const alt = `${name} ${title}`.trim();

    root.innerHTML = `
      <figure class="hero-president-card">
        <img src="${photo}" alt="${alt}" width="320" height="320" fetchpriority="high" decoding="async" />
        <figcaption>
          <span class="hero-president-name">${name}</span>
          <span class="hero-president-role">${title}</span>
        </figcaption>
        <a class="hero-president-link" href="${greetingUrl}">취임사 보기 →</a>
      </figure>`;

    document.querySelectorAll("[data-leadership='since']").forEach((node) => {
      node.textContent =
        president.sinceLabel ||
        (president.since ? `INAUGURATION ${formatSince(president.since)}` : node.textContent);
    });

    document.querySelectorAll("[data-leadership='greeting-url']").forEach((node) => {
      node.setAttribute("href", greetingUrl);
    });
  }

  async function load() {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("leadership.json 로드 실패");
    return res.json();
  }

  load()
    .then((data) => renderHero(data.president))
    .catch(() => {
      /* HTML 기본값 유지 */
    });
})();
