(function () {
  const DATA_URL = new URL("../data/kba.json", document.currentScript.src).href;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderList(target, items, emptyText) {
    if (!target) return;
    target.innerHTML = "";
    if (!items || !items.length) {
      target.appendChild(el("li", "", emptyText || "불러온 자료가 없습니다."));
      return;
    }
    items.slice(0, Number(target.dataset.limit || 8)).forEach((item) => {
      const li = el("li");
      const a = el("a");
      a.href = item.url || "http://www.kbaboxing.co.kr/";
      a.target = "_blank";
      a.rel = "noopener";
      if (item.notice) {
        const badge = el("span", "badge", "공지");
        a.appendChild(badge);
      }
      a.appendChild(document.createTextNode(item.title || "(제목 없음)"));
      li.appendChild(a);
      li.appendChild(el("span", "meta", item.date || "KBA"));
      target.appendChild(li);
    });
  }

  function fillText(selector, value) {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  }

  function fillHref(selector, href) {
    document.querySelectorAll(selector).forEach((node) => {
      node.setAttribute("href", href);
    });
  }

  async function load() {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("kba.json 로드 실패");
    return res.json();
  }

  load()
    .then((data) => {
      renderList(document.querySelector("[data-kba=notices]"), data.notices);
      renderList(document.querySelector("[data-kba=schedule]"), data.schedule);
      renderList(document.querySelector("[data-kba=results]"), data.results);
      renderList(document.querySelector("[data-kba=protest]"), data.protest);
      renderList(document.querySelector("[data-kba=ranking]"), data.ranking);
      renderList(document.querySelector("[data-kba=video]"), data.video);

      if (data.updated_at) {
        const local = data.updated_at.replace("T", " ").slice(0, 19);
        fillText("[data-kba-updated]", "중앙회 자료 갱신: " + local);
      }
      if (data.hq) {
        fillText("[data-kba-hq-tel]", data.hq.tel || "");
        fillText("[data-kba-hq-addr]", data.hq.address || "");
        fillHref("[data-kba-hq-url]", data.hq.url || "http://www.kbaboxing.co.kr/");
      }
      if (data.links) {
        fillHref("[data-kba-link=schedule]", data.links.schedule);
        fillHref("[data-kba-link=results]", data.links.results);
        fillHref("[data-kba-link=protest]", data.links.protest);
        fillHref("[data-kba-link=ranking]", data.links.ranking);
        fillHref("[data-kba-link=home]", data.links.home);
      }
    })
    .catch(() => {
      fillText("[data-kba-updated]", "중앙회 자료를 불러오지 못했습니다. 잠시 후 다시 시도하세요.");
    });
})();
