import { NameplateViewer3D } from "./viewer3d.js";

let siteData = null;
let viewer3d = null;
let currentItem = null;

const $ = (sel) => document.querySelector(sel);

async function loadData() {
  const res = await fetch("data/nameplates.json");
  if (!res.ok) throw new Error("無法載入資料");
  return res.json();
}

function colorBadgeClass(color) {
  if (color === "白色") return "badge-white";
  if (color === "灰色") return "badge-gray";
  return "badge-black";
}

function renderProjects() {
  const grid = $("#projects-grid");
  grid.innerHTML = "";

  for (const project of siteData.projects) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card project-card";
    btn.innerHTML = `
      <div class="card-thumb">
        <img src="${project.cover}" alt="${project.title}" loading="lazy" />
      </div>
      <div class="card-body">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <p>${project.count} 件作品</p>
      </div>
    `;
    btn.addEventListener("click", () => openGallery(project));
    grid.appendChild(btn);
  }
}

function openGallery(project) {
  const dialog = $("#gallery-dialog");
  $("#gallery-title").textContent = project.title;
  $("#gallery-desc").textContent = project.description;
  $("#filter-class").value = "";
  $("#filter-color").value = "";
  renderNameplateGrid();
  dialog.showModal();
}

function getFilteredNameplates() {
  const cls = $("#filter-class").value;
  const color = $("#filter-color").value;
  return siteData.nameplates.filter((n) => {
    if (cls && n.class !== cls) return false;
    if (color && n.color !== color) return false;
    return true;
  });
}

function renderNameplateGrid() {
  const grid = $("#nameplate-grid");
  const items = getFilteredNameplates();
  $("#gallery-count").textContent = `共 ${items.length} 件`;

  grid.innerHTML = "";
  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    btn.innerHTML = `
      <div class="card-thumb">
        <img src="${item.preview}" alt="${item.name} 名牌" loading="lazy" />
      </div>
      <div class="card-body">
        <h3>${item.name}</h3>
        <p>${item.class} 班 · ${item.color}</p>
        <span class="badge ${colorBadgeClass(item.color)}">${item.color}</span>
      </div>
    `;
    btn.addEventListener("click", () => openViewer(item));
    grid.appendChild(btn);
  }
}

function openViewer(item) {
  currentItem = item;
  const dialog = $("#viewer-dialog");
  const canvasPane = document.querySelector(".canvas-pane");

  $("#viewer-title").textContent = `${item.name} 的名牌`;
  $("#viewer-meta").textContent = `專案 ${item.class} 班 · 列印色：${item.color}`;
  $("#viewer-preview").src = item.preview;
  $("#viewer-preview").alt = `${item.name} 名牌平面圖`;
  $("#btn-download-stl").href = item.stl;
  $("#btn-download-stl").download = `${item.name}_名牌.stl`;

  if (viewer3d) {
    viewer3d.stop();
    viewer3d.dispose();
    viewer3d = null;
  }

  dialog.showModal();
  requestAnimationFrame(() => activate3D());
}

async function activate3D() {
  if (!currentItem) return;
  const container = $("#canvas-container");
  document.querySelector(".canvas-pane").classList.remove("hidden-3d");

  if (!viewer3d) {
    viewer3d = new NameplateViewer3D(container);
  }
  await viewer3d.load(currentItem.stl, currentItem.colorHex);
  viewer3d.start();
}

function setupDialogs() {
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-close");
      const dialog = document.getElementById(id);
      dialog.close();
      if (id === "viewer-dialog" && viewer3d) {
        viewer3d.stop();
        viewer3d.dispose();
        viewer3d = null;
      }
    });
  });

  $("#filter-class").addEventListener("change", renderNameplateGrid);
  $("#filter-color").addEventListener("change", renderNameplateGrid);
  $("#btn-view-3d").addEventListener("click", activate3D);
}

async function init() {
  try {
    siteData = await loadData();
    $("#site-title").textContent = siteData.title;
    renderProjects();
    setupDialogs();
  } catch (err) {
    console.error(err);
    $("#projects-grid").innerHTML =
      "<p>載入失敗，請確認已執行 build_site.py 並使用本地伺服器預覽。</p>";
  }
}

init();
