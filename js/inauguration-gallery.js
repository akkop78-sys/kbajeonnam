(function () {
  const DATA_URL = new URL("../data/inauguration.json", document.currentScript.src).href;
  const PREFIX = /\/pages\//.test(location.pathname) ? "../" : "";

  function featuredVideo(videos) {
    return videos.find((v) => v.featured) || videos[0] || null;
  }

  function renderHeroVideo(root, videos, date) {
    if (!root || !videos.length) return;
    const main = featuredVideo(videos);
    if (!main) return;
    root.innerHTML = `
      <figure class="inauguration-video inauguration-video--hero">
        <video controls preload="metadata" playsinline>
          <source src="${PREFIX}${main.file}" type="video/mp4" />
          브라우저가 동영상 재생을 지원하지 않습니다.
        </video>
        <figcaption>${main.title}${date ? ` · ${date}` : ""}</figcaption>
      </figure>`;
  }

  function renderVideos(root, videos, compact) {
    if (!root || !videos.length) return;
    const main = featuredVideo(videos);
    const others = videos.filter((v) => v !== main);

    let html = "";
    if (main) {
      html += `
        <figure class="inauguration-video inauguration-video--main">
          <video controls preload="metadata" playsinline poster="">
            <source src="${PREFIX}${main.file}" type="video/mp4" />
            브라우저가 동영상 재생을 지원하지 않습니다.
          </video>
          <figcaption>${main.title}${main.sizeMb ? ` · ${main.sizeMb}MB` : ""}</figcaption>
        </figure>`;
    }
    if (!compact && others.length) {
      html += `<div class="inauguration-video-list">`;
      for (const v of others) {
        html += `
          <figure class="inauguration-video">
            <video controls preload="metadata" playsinline>
              <source src="${PREFIX}${v.file}" type="video/mp4" />
            </video>
            <figcaption>${v.title}${v.sizeMb ? ` · ${v.sizeMb}MB` : ""}</figcaption>
          </figure>`;
      }
      html += `</div>`;
    }
    root.innerHTML = html;
  }

  function renderPhotoWall(root, photos, limit) {
    if (!root || !photos.length) return;
    const slice = limit ? photos.slice(0, limit) : photos;
    root.innerHTML = slice
      .map(
        (p) => `
      <a class="inauguration-photo" href="${PREFIX}${p.file}" target="_blank" rel="noopener">
        <img src="${PREFIX}${p.file}" alt="${p.title}" width="380" height="285" loading="lazy" decoding="async" />
        <span class="inauguration-photo-label">${p.title}</span>
      </a>`
      )
      .join("");
  }

  function renderGalleryGrid(root, photos) {
    if (!root || !photos.length) return;
    root.innerHTML = photos
      .map(
        (p) => `
      <a class="gallery-item inauguration-gallery-item" href="${PREFIX}${p.file}" target="_blank" rel="noopener"
         style="background:center/cover url('${PREFIX}${p.file}')">${p.title}</a>`
      )
      .join("");
  }

  fetch(DATA_URL, { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => {
      const videos = data.videos || [];
      const photos = data.photos || [];

      renderHeroVideo(document.querySelector("[data-inauguration=hero-video]"), videos, data.date);
      renderVideos(document.querySelector("[data-inauguration=videos]"), videos, false);
      renderPhotoWall(document.querySelector("[data-inauguration=wall]"), photos, 8);
      renderPhotoWall(document.querySelector("[data-inauguration=wall-all]"), photos, 0);
      renderGalleryGrid(document.querySelector("[data-inauguration=grid]"), photos);

      const countEl = document.querySelector("[data-inauguration=count]");
      if (countEl) {
        countEl.textContent = `사진 ${photos.length}장 · 동영상 ${videos.length}개 · ${data.date || ""}`;
      }
    })
    .catch((err) => console.warn("발대식 갤러리 로드 실패", err));
})();
