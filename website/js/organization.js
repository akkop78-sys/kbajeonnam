(function () {
  const DATA_URL = new URL("../data/leadership.json", document.currentScript.src).href;
  const IMG_PREFIX = /\/pages\//.test(location.pathname) ? "../" : "";

  function resolvePhoto(name, data) {
    const key = data.photoAliases?.[name] || name;
    return data.photos?.[key] || "";
  }

  function personCard(name, photo, extra) {
    const subtitle = extra ? `<span class="person-sub">${extra}</span>` : "";
    if (photo) {
      return `
        <article class="person-card">
          <img src="${IMG_PREFIX}${photo}" alt="${name}" width="160" height="200" loading="lazy" decoding="async" />
          <div class="person-meta">
            <strong class="person-name">${name}</strong>
            ${subtitle}
          </div>
        </article>`;
    }
    return `
      <article class="person-card is-text">
        <div class="person-placeholder" aria-hidden="true">${name.charAt(0)}</div>
        <div class="person-meta">
          <strong class="person-name">${name}</strong>
          ${subtitle}
        </div>
      </article>`;
  }

  function orgBox(role, members, data, variant, presidentPhoto) {
    const cls = variant ? `org-box ${variant}` : "org-box";
    const cards = members
      .map((m) => {
        const name = typeof m === "string" ? m : m.name;
        const photo = presidentPhoto || resolvePhoto(name, data);
        const sub = typeof m === "object" ? m.subtitle : "";
        if (!photo) {
          return `<span class="who-line">${sub ? `${sub} ` : ""}${name}</span>`;
        }
        const imgCls = presidentPhoto ? " org-president-photo" : "";
        return `
          <div class="org-person">
            <img class="${imgCls.trim()}" src="${IMG_PREFIX}${photo}" alt="${name}" width="88" height="110" loading="lazy" decoding="async" />
            <span class="who">${name}</span>
            ${sub ? `<span class="who-sub">${sub}</span>` : ""}
          </div>`;
      })
      .join("");
    return `
      <div class="${cls}">
        <span class="role">${role}</span>
        <div class="org-people">${cards}</div>
      </div>`;
  }

  function renderChart(data) {
    const root = document.querySelector("[data-org='chart']");
    if (!root || !data.organization) return;

    const org = data.organization;
    const president = data.president;
    const presPhoto = president.photo || resolvePhoto(president.name, data);

    root.innerHTML = `
      <div class="org-level">
        ${orgBox(
          president.title || "회장",
          [{ name: president.name }],
          data,
          "is-top",
          presPhoto
        )}
      </div>
      <div class="org-level">
        ${org.executive
          .slice(0, 3)
          .map((item, i) =>
            orgBox(item.role, item.members, data, i === 0 ? "accent" : "")
          )
          .join("")}
      </div>
      <div class="org-level">
        ${org.executive
          .slice(3)
          .map((item, i) =>
            orgBox(item.role, item.members, data, i === 0 ? "accent" : "")
          )
          .join("")}
      </div>`;
  }

  function renderGrid(selector, names, data) {
    const root = document.querySelector(selector);
    if (!root) return;
    root.innerHTML = names
      .map((name) => personCard(name, resolvePhoto(name, data)))
      .join("");
  }

  function renderDirectors(data) {
    const root = document.querySelector("[data-org='directors']");
    if (!root || !data.organization) return;

    root.innerHTML = data.organization.directors
      .map(
        (dept) => `
      <div class="dept-card">
        <h4>${dept.dept}</h4>
        <ul class="dept-members">
          ${dept.members
            .map((name) => {
              const photo = resolvePhoto(name, data);
              if (!photo) return `<li>${name}</li>`;
              return `
              <li class="has-photo">
                <img src="${IMG_PREFIX}${photo}" alt="${name}" width="48" height="60" loading="lazy" decoding="async" />
                <span>${name}</span>
              </li>`;
            })
            .join("")}
        </ul>
      </div>`
      )
      .join("");
  }

  function renderHonorary(data) {
    const org = data.organization?.honorary;
    if (!org) return;
    renderGrid("[data-org='honorary-gomun']", org["고문위원"], data);
    renderGrid("[data-org='honorary-jamun']", org["자문위원"], data);
  }

  function renderPreview(data) {
    const root = document.querySelector("[data-org='preview']");
    if (!root || !data.organization) return;

    const picks = [
      { name: data.president.name, role: data.president.title, photo: data.president.photo },
      { name: "정행자", role: "여성회장" },
      { name: "최정원", role: "전무이사" },
      { name: "곽현만", role: "감사" },
      { name: "왕석호", role: "명예회장" },
      { name: "신경식", role: "명예회장" },
      { name: "김경석", role: "사무국장" },
      { name: "이근호", role: "부회장" },
    ].map((item) => ({
      ...item,
      photo: item.photo || resolvePhoto(item.name, data),
    }));

    root.innerHTML = picks
      .map(
        (item) => `
      <figure class="staff-preview-card">
        ${
          item.photo
            ? `<img src="${IMG_PREFIX}${item.photo}" alt="${item.name}" width="200" height="250" loading="lazy" decoding="async" />`
            : `<div class="person-placeholder" aria-hidden="true">${item.name.charAt(0)}</div>`
        }
        <figcaption>
          <strong>${item.name}</strong>
          <span>${item.role}</span>
        </figcaption>
      </figure>`
      )
      .join("");
  }

  async function load() {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("leadership.json 로드 실패");
    return res.json();
  }

  load()
    .then((data) => {
      renderChart(data);
      renderGrid("[data-org='vice-presidents']", data.organization.vicePresidents, data);
      renderDirectors(data);
      renderHonorary(data);
      renderPreview(data);
    })
    .catch(() => {
      /* HTML 기본값 유지 */
    });
})();
