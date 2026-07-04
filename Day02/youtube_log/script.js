const STORAGE_KEY = "youtube-study-log-items";

const urlForm = document.getElementById("urlForm");
const urlInput = document.getElementById("urlInput");
const errorMessage = document.getElementById("errorMessage");
const helperText = document.getElementById("helperText");
const logList = document.getElementById("logList");
const emptyState = document.getElementById("emptyState");
const totalCount = document.getElementById("totalCount");
const doneCount = document.getElementById("doneCount");
const todoCount = document.getElementById("todoCount");
const clearAllButton = document.getElementById("clearAllButton");

let items = dedupeItemsByVideoIdAndUrl(loadItems());

function createItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `youtube-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeLoadedItems(rawItems) {
  return rawItems.map((item) => ({
    id: item.id || createItemId(),
    url: item.url,
    videoId: item.videoId || "",
    title: item.title || "",
    thumbnailUrl: item.thumbnailUrl || "",
    done: Boolean(item.done),
    createdAt: item.createdAt || Date.now()
  }));
}

function dedupeItemsByVideoIdAndUrl(sourceItems) {
  const seenKeys = new Set();
  const dedupedItems = [];

  sourceItems.forEach((item) => {
    const urlKey = item.url || "";
    const videoKey = item.videoId ? `video:${item.videoId}` : "";
    const alreadySeen = seenKeys.has(urlKey) || (videoKey && seenKeys.has(videoKey));

    if (alreadySeen) {
      return;
    }

    seenKeys.add(urlKey);
    if (videoKey) {
      seenKeys.add(videoKey);
    }

    dedupedItems.push(item);
  });

  return dedupedItems;
}

function loadItems() {
  try {
    const rawItems = localStorage.getItem(STORAGE_KEY);
    if (!rawItems) {
      return [];
    }

    const parsed = JSON.parse(rawItems);
    return Array.isArray(parsed) ? dedupeItemsByVideoIdAndUrl(normalizeLoadedItems(parsed)) : [];
  } catch (error) {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function showError(message) {
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.textContent = "";
}

function formatYoutubeUrl(input) {
  const value = input.trim();
  if (!value) {
    return null;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(value.includes("://") ? value : `https://${value}`);
  } catch (error) {
    return null;
  }

  const hostname = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();
  let videoId = "";

  if (hostname === "youtu.be") {
    videoId = parsedUrl.pathname.replace("/", "").trim();
  } else if (hostname === "youtube.com" || hostname === "m.youtube.com") {
    if (parsedUrl.pathname === "/watch") {
      videoId = parsedUrl.searchParams.get("v") || "";
    } else if (parsedUrl.pathname.startsWith("/shorts/")) {
      videoId = parsedUrl.pathname.split("/shorts/")[1] || "";
    } else if (parsedUrl.pathname.startsWith("/embed/")) {
      videoId = parsedUrl.pathname.split("/embed/")[1] || "";
    }
  }

  if (!videoId) {
    return null;
  }

  videoId = videoId.split("?")[0].split("&")[0].trim();

  if (!videoId) {
    return null;
  }

  return {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    hostname: "youtube.com",
    videoId
  };
}

function buildItemLabel(item) {
  return item.title || `YouTube ${item.videoId}`;
}

async function fetchYoutubeMeta(url) {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error("유튜브 정보를 가져오지 못했습니다.");
  }

  const data = await response.json();
  if (!data || typeof data.title !== "string" || !data.title.trim()) {
    throw new Error("유튜브 정보가 없습니다.");
  }

  return {
    title: data.title.trim(),
    thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : ""
  };
}

function updateItemMeta(itemId, meta) {
  const target = items.find((item) => item.id === itemId);
  if (!target) {
    return;
  }

  if (meta.title) {
    target.title = meta.title;
  }

  if (meta.thumbnailUrl) {
    target.thumbnailUrl = meta.thumbnailUrl;
  }

  saveItems();
}

async function hydrateMissingTitles() {
  const targets = items.filter((item) => !item.title || !item.thumbnailUrl);

  if (targets.length === 0) {
    return;
  }

  await Promise.allSettled(
    targets.map(async (item) => {
      try {
        const meta = await fetchYoutubeMeta(item.url);
        updateItemMeta(item.id, meta);
      } catch (error) {
        updateItemMeta(item.id, {
          title: item.title || `YouTube ${item.videoId}`
        });
      }
    })
  );

  render();
}

function renderCounts() {
  const total = items.length;
  const done = items.filter((item) => item.done).length;
  const todo = total - done;

  totalCount.textContent = total;
  doneCount.textContent = done;
  todoCount.textContent = todo;
}

function renderList() {
  logList.innerHTML = "";

  const sortedItems = [...items].sort((a, b) => b.createdAt - a.createdAt);
  emptyState.style.display = sortedItems.length === 0 ? "grid" : "none";

  sortedItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = `log-item${item.done ? " done" : ""}`;
    li.dataset.id = item.id;

    const topRow = document.createElement("div");
    topRow.className = "log-top";

    const meta = document.createElement("div");
    meta.className = "log-meta";

    const thumbnail = document.createElement("img");
    thumbnail.className = "thumbnail";
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    thumbnail.referrerPolicy = "no-referrer";
    thumbnail.src = item.thumbnailUrl || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

    const titleBlock = document.createElement("div");
    titleBlock.className = "title-block";

    const title = document.createElement("h3");
    title.className = "log-title";

    const link = document.createElement("a");
    link.className = "log-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = buildItemLabel(item);
    link.title = item.title || item.url;

    title.appendChild(link);

    const badge = document.createElement("span");
    badge.className = `status-badge${item.done ? " done" : " active"}`;
    badge.textContent = item.done ? "학습 완료" : "학습 중";

    const urlText = document.createElement("p");
    urlText.className = "log-url";
    urlText.textContent = item.url;

    titleBlock.appendChild(title);
    titleBlock.appendChild(badge);
    titleBlock.appendChild(urlText);

    meta.appendChild(thumbnail);
    meta.appendChild(titleBlock);
    topRow.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "log-actions";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "icon-button";
    openButton.textContent = "새 창 열기";
    openButton.addEventListener("click", () => {
      window.open(item.url, "_blank", "noopener,noreferrer");
    });

    const toggleWrap = document.createElement("label");
    toggleWrap.className = "toggle-wrap";

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = item.done;
    toggle.addEventListener("change", () => {
      item.done = toggle.checked;
      saveItems();
      render();
    });

    const toggleText = document.createElement("span");
    toggleText.textContent = "학습 완료";

    toggleWrap.appendChild(toggle);
    toggleWrap.appendChild(toggleText);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "icon-button danger";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", () => {
      items = items.filter((entry) => entry.id !== item.id);
      saveItems();
      render();
    });

    actions.appendChild(openButton);
    actions.appendChild(toggleWrap);
    actions.appendChild(deleteButton);

    li.appendChild(topRow);
    li.appendChild(actions);

    logList.appendChild(li);
  });
}

function render() {
  renderCounts();
  renderList();
}

function addItemFromUrl(rawUrl) {
  const normalized = formatYoutubeUrl(rawUrl);

  if (!normalized) {
    showError("유튜브 링크만 저장해주세요.");
    return;
  }

  const duplicate = items.some((item) => item.url === normalized.url || item.videoId === normalized.videoId);
  if (duplicate) {
    showError("이미 저장된 URL입니다.");
    return;
  }

  items.push({
    id: createItemId(),
    url: normalized.url,
    videoId: normalized.videoId,
    title: "",
    thumbnailUrl: "",
    done: false,
    createdAt: Date.now()
  });

  saveItems();
  clearError();
  helperText.textContent = "저장되었습니다. 제목을 불러오는 중입니다.";
  urlInput.value = "";
  render();

  const currentItemId = items[items.length - 1].id;

  fetchYoutubeMeta(normalized.url)
    .then((meta) => {
      updateItemMeta(currentItemId, meta);
      helperText.textContent = "저장되었습니다. 목록에서 새 창 열기, 완료 체크, 삭제가 가능합니다.";
      render();
    })
    .catch(() => {
      updateItemMeta(currentItemId, {
        title: `YouTube ${normalized.videoId}`
      });
      helperText.textContent = "제목을 불러오지 못해 영상 ID로 표시했습니다.";
      render();
    });
}

urlForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addItemFromUrl(urlInput.value);
});

clearAllButton.addEventListener("click", () => {
  if (items.length === 0) {
    return;
  }

  const confirmed = window.confirm("저장된 URL을 모두 삭제할까요?");
  if (!confirmed) {
    return;
  }

  items = [];
  saveItems();
  render();
});

urlInput.addEventListener("input", () => {
  clearError();
});

urlInput.addEventListener("paste", (event) => {
  const pastedText = event.clipboardData?.getData("text") || "";
  const normalized = formatYoutubeUrl(pastedText);

  if (!normalized) {
    event.preventDefault();
    showError("유튜브 링크만 저장해주세요.");
    return;
  }

  event.preventDefault();
  urlInput.value = normalized.url;
  clearError();
});

window.addEventListener("storage", () => {
  items = loadItems();
  render();
});

render();
hydrateMissingTitles();
