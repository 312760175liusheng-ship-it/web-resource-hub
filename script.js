const cards = [...document.querySelectorAll(".resource-card")];
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const search = document.querySelector("#search");
const clearSearch = document.querySelector("#clear-search");
const noResults = document.querySelector("#no-results");
const searchPanel = document.querySelector("#search-panel");
const searchToggle = document.querySelector(".search-toggle");
const favoritesBox = document.querySelector("#favorites");
const recentBox = document.querySelector("#recent");
const storage = {
  favorites: "liushengHubFavorites",
  recent: "liushengHubRecent"
};
let activeFilter = "active";

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); }
  catch { return []; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch {}
};
const cardData = (card) => ({
  name: card.dataset.name,
  url: card.querySelector("a").href,
  category: card.dataset.category
});

function applyFilters() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach((card) => {
    const text = `${card.dataset.name} ${card.dataset.keywords} ${card.textContent}`.toLowerCase();
    const categoryMatch = query || activeFilter === "all"
      || (activeFilter === "active" && card.dataset.category !== "history")
      || card.dataset.category === activeFilter;
    const show = categoryMatch && (!query || text.includes(query));
    card.hidden = !show;
    if (show) visible += 1;
  });
  noResults.hidden = visible > 0;
  clearSearch.hidden = !query;
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    applyFilters();
  });
});
search.addEventListener("input", applyFilters);
clearSearch.addEventListener("click", () => {
  search.value = "";
  applyFilters();
  search.focus();
});
searchToggle.addEventListener("click", () => {
  searchPanel.classList.toggle("collapsed");
  if (!searchPanel.classList.contains("collapsed")) search.focus();
});

function renderMiniList(box, items, emptyText) {
  if (!items.length) {
    box.innerHTML = `<p class="placeholder">${emptyText}</p>`;
    return;
  }
  box.innerHTML = items.map((item) =>
    `<a class="mini-item" href="${item.url}" data-track="${item.name}"><span>${item.name}</span><small>打开 ↗</small></a>`
  ).join("");
  bindTracking(box);
}

function renderFavorites() {
  const keys = read(storage.favorites);
  const items = cards.map(cardData).filter((item) => keys.includes(item.url));
  renderMiniList(favoritesBox, items, "在下方资料卡点击☆，常用入口会出现在这里。");
  cards.forEach((card) => {
    const button = card.querySelector(".favorite");
    const selected = keys.includes(cardData(card).url);
    button.classList.toggle("active", selected);
    button.textContent = selected ? "★" : "☆";
  });
}

cards.forEach((card) => {
  card.querySelector(".favorite").addEventListener("click", () => {
    const url = cardData(card).url;
    const keys = read(storage.favorites);
    const next = keys.includes(url) ? keys.filter((item) => item !== url) : [url, ...keys];
    write(storage.favorites, next);
    renderFavorites();
  });
});

function addRecent(name, url) {
  const current = read(storage.recent).filter((item) => item.url !== url);
  write(storage.recent, [{ name, url }, ...current].slice(0, 4));
  renderRecent();
}
function renderRecent() {
  renderMiniList(recentBox, read(storage.recent), "打开过的资料会保存在这台设备上。");
}
function bindTracking(root = document) {
  root.querySelectorAll("a[data-track]").forEach((link) => {
    if (link.dataset.bound) return;
    link.dataset.bound = "true";
    link.addEventListener("click", () => addRecent(link.dataset.track, link.href));
  });
}

if (matchMedia("(max-width: 620px)").matches) searchPanel.classList.add("collapsed");
applyFilters();
renderFavorites();
renderRecent();
bindTracking();
