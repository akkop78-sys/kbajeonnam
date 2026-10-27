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

  function orgBox(role, members, data, variant, presidentPhoto, note) {
    const cls = variant ? `org-box ${variant}` : "org-box";
    const cards = members
      .map((m) => {
        const name = typeof m === "string" ? m : m.name;
        const photo = presidentPhoto || resolvePhoto(name, data);
        const sub = typeof m === "object" ? m.subtitle : "";
        if (!photo) {
          return `
            <div class="org-person is-text">
              <div class="person-placeholder org-person-placeholder" aria-hidden="true">${name.charAt(0)}</div>
              <span class="who">${name}</span>
              ${sub ? `<span class="who-sub">${sub}</span>` : ""}
            </div>`;
        }
        const imgCls = presidentPhoto || variant === "is-top" ? " org-president-photo" : "";
        return `
          <div class="org-person">
            <img class="${imgCls.trim()}" src="${IMG_PREFIX}${photo}" alt="${name}" width="88" height="110" loading="lazy" decoding="async" />
            <span class="who">${name}</span>
            ${sub ? `<span class="who-sub">${sub}</span>` : ""}
          </div>`;
      })
      .join("");
    const noteHtml = note
      ? `<span class="role-note" title="${note}">${note}</span>`
      : "";
    return `
      <div class="${cls}">
        <div class="role-line">
          <span class="role">${role}</span>
          ${noteHtml}
        </div>
        <div class="org-people">${cards}</div>
      </div>`;
  }

  function renderTournamentChart(data) {
    const root = document.querySelector("[data-org='chart']");
    const committee = data.tournamentCommittee;
    if (!root || !committee?.levels) return false;

    const president = data.president;
    const levelsHtml = committee.levels
      .map((level) => {
        if (level.boxes) {
          const rowCls = level.boxes.length > 1 ? " org-level--row" : "";
          return `
            <div class="org-level${rowCls}">
              ${level.boxes
                .map((box) =>
                  orgBox(box.role, box.members, data, box.variant || "", "", box.note || "")
                )
                .join("")}
            </div>`;
        }
        const isTop = level.variant === "is-top";
        const topPhoto =
          isTop && president?.name === level.members?.[0]?.name
            ? president.photo || resolvePhoto(president.name, data)
            : "";
        return `
          <div class="org-level">
            ${orgBox(
              level.role,
              level.members,
              data,
              level.variant || "",
              topPhoto,
              level.note || ""
            )}
          </div>`;
      })
      .join("");

    root.innerHTML = levelsHtml;
    return true;
  }

  function renderAssociationChart(data) {
    const root = document.querySelector("[data-org='association-chart']");
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
          presPhoto,
          "협회 대표"
        )}
      </div>
      <div class="org-level org-level--row">
        ${org.executive
          .slice(0, 3)
          .map((item, i) =>
            orgBox(item.role, item.members, data, i === 0 ? "accent" : "", "", "")
          )
          .join("")}
      </div>
      <div class="org-level org-level--row">
        ${org.executive
          .slice(3)
          .map((item) => orgBox(item.role, item.members, data, "", "", ""))
          .join("")}
      </div>`;
  }

  function renderChart(data) {
    if (renderTournamentChart(data)) return;

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
    if (!root || !names) return;
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
    if (!root) return;

    const committee = data.tournamentCommittee;
    let picks = [];

    if (committee?.levels) {
      committee.levels.forEach((level) => {
        const boxes = level.boxes || [level];
        boxes.forEach((box) => {
          (box.members || []).forEach((m) => {
            picks.push({
              name: typeof m === "string" ? m : m.name,
              role: box.role,
            });
          });
        });
      });
    } else if (data.organization) {
      picks = [
        { name: data.president.name, role: data.president.title, photo: data.president.photo },
        { name: "정행자", role: "여성회장" },
        { name: "최정원", role: "전무이사" },
        { name: "곽현만", role: "감사" },
        { name: "왕석호", role: "명예회장" },
        { name: "신경식", role: "명예회장" },
        { name: "이근호", role: "부회장" },
      ];
    }

    picks = picks.map((item) => ({
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

  function fillCommitteeMeta(data) {
    const committee = data.tournamentCommittee;
    if (!committee) return;
    document.querySelectorAll("[data-org='committee-title']").forEach((el) => {
      el.textContent = committee.title || el.textContent;
    });
    document.querySelectorAll("[data-org='committee-desc']").forEach((el) => {
      const parts = [committee.eventLabel, committee.subtitle].filter(Boolean);
      el.textContent = parts.join(" · ") || el.textContent;
    });
  }

  async function load() {
    const res = await fetch(DATA_URL + (DATA_URL.includes("?") ? "&" : "?") + "v=orginaug14", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("leadership.json 로드 실패");
    return res.json();
  }

  load()
    .then((data) => {
      fillCommitteeMeta(data);
      renderChart(data);
      renderAssociationChart(data);
      renderGrid("[data-org='vice-presidents']", data.organization?.vicePresidents, data);
      renderDirectors(data);
      renderHonorary(data);
      renderPreview(data);

      if (typeof window.__scrollToHash === "function") {
        requestAnimationFrame(() => window.__scrollToHash());
        setTimeout(() => window.__scrollToHash(), 200);
      }
    })
    .catch(() => {
      /* HTML 기본값 유지 */
    });
})();
