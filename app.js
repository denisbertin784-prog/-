const board = document.querySelector("#board");
const world = document.querySelector("#world");
const scene = document.querySelector("#scene");
const brickCount = document.querySelector("#brick-count");
const brickSizeSelect = document.querySelector("#brick-size");
const palette = document.querySelector("#palette");
const rotateButton = document.querySelector("#rotate-brick");
const removeModeButton = document.querySelector("#remove-mode");
const resetButton = document.querySelector("#reset-build");
const saveButton = document.querySelector("#save-build");
const loadButton = document.querySelector("#load-build");
const modeLabel = document.querySelector("#mode-label");
const rotationLabel = document.querySelector("#rotation-label");
const statusMessage = document.querySelector("#status-message");
const creationTitle = document.querySelector("#creation-title");
const missionItems = [...document.querySelectorAll("#mission-list li")];

const STORAGE_KEY = "lego-3d-build";
const GRID_SIZE = 14;
const brickTypes = {
  "1x1": { width: 1, depth: 1, label: "Cube 1 × 1" },
  "1x2": { width: 1, depth: 2, label: "Fine 1 × 2" },
  "2x2": { width: 2, depth: 2, label: "Carrée 2 × 2" },
  "4x2": { width: 4, depth: 2, label: "Classique 4 × 2" },
};

let selectedColor = "#f44336";
let selectedRotation = 0;
let viewRotation = -45;
let removeMode = false;
let activeGhost = null;
const bricks = [];

buildGrid();
updateUi();
updateView();

function buildGrid() {
  board.style.setProperty("--grid-size", GRID_SIZE);
  for (let z = 0; z < GRID_SIZE; z += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "grid-cell";
      cell.dataset.x = x;
      cell.dataset.z = z;
      cell.style.setProperty("--x", x);
      cell.style.setProperty("--z", z);
      cell.setAttribute("aria-label", `Case ${x + 1}, ${z + 1}`);
      cell.addEventListener("mouseenter", () => showGhost(x, z));
      cell.addEventListener("focus", () => showGhost(x, z));
      cell.addEventListener("click", () => handleCellClick(x, z));
      board.append(cell);
    }
  }
  board.addEventListener("mouseleave", hideGhost);
}

function getSelectedType() {
  return brickTypes[brickSizeSelect.value];
}

function getRotatedDimensions(width, depth, rotation = selectedRotation) {
  return rotation % 180 === 0 ? { width, depth } : { width: depth, depth: width };
}

function clampCell(x, z, width, depth) {
  return {
    x: Math.min(Math.max(x, 0), GRID_SIZE - width),
    z: Math.min(Math.max(z, 0), GRID_SIZE - depth),
  };
}

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.z < b.z + b.depth && a.z + a.depth > b.z;
}

function getNextLevel(x, z, width, depth) {
  const target = { x, z, width, depth };
  return bricks.reduce((level, brick) => (overlaps(target, brick) ? Math.max(level, brick.level + 1) : level), 0);
}

function canPlaceBrick(x, z, width, depth, level) {
  if (x < 0 || z < 0 || x + width > GRID_SIZE || z + depth > GRID_SIZE) return false;
  const target = { x, z, width, depth };
  return !bricks.some((brick) => brick.level === level && overlaps(target, brick));
}

function handleCellClick(rawX, rawZ) {
  const topBrick = findTopBrickAt(rawX, rawZ);
  if (removeMode) {
    if (topBrick) removeBrick(topBrick.id);
    return;
  }

  const type = getSelectedType();
  const dimensions = getRotatedDimensions(type.width, type.depth);
  const { x, z } = clampCell(rawX, rawZ, dimensions.width, dimensions.depth);
  const level = getNextLevel(x, z, dimensions.width, dimensions.depth);
  if (!canPlaceBrick(x, z, dimensions.width, dimensions.depth, level)) {
    setStatus("Cette zone est déjà occupée. Essayez une autre case.");
    return;
  }

  addBrick({
    id: crypto.randomUUID(),
    x,
    z,
    level,
    width: dimensions.width,
    depth: dimensions.depth,
    originalWidth: type.width,
    originalDepth: type.depth,
    rotation: selectedRotation,
    color: selectedColor,
  });
  setStatus(`${type.label} posée au niveau ${level + 1}.`);
  updateUi();
}

function addBrick(brick) {
  bricks.push(brick);
  board.append(createBrickElement(brick));
}

function createBrickElement(brick, ghost = false) {
  const brickElement = document.createElement("div");
  brickElement.className = ghost ? "brick brick--ghost" : "brick";
  brickElement.dataset.id = brick.id;
  brickElement.style.setProperty("--x", brick.x);
  brickElement.style.setProperty("--z", brick.z);
  brickElement.style.setProperty("--level", brick.level);
  brickElement.style.setProperty("--w", brick.width);
  brickElement.style.setProperty("--d", brick.depth);
  brickElement.style.setProperty("--color", brick.color);
  brickElement.style.setProperty("--shade", shadeColor(brick.color, -18));
  brickElement.style.zIndex = String((brick.x + brick.z) * 2 + brick.level * 30 + 10);
  brickElement.setAttribute("aria-hidden", "true");

  const top = document.createElement("div");
  top.className = "brick__top";
  for (let z = 0; z < brick.depth; z += 1) {
    for (let x = 0; x < brick.width; x += 1) {
      const stud = document.createElement("span");
      stud.className = "stud";
      stud.style.setProperty("--stud-x", x);
      stud.style.setProperty("--stud-z", z);
      top.append(stud);
    }
  }

  brickElement.append(top, side("front"), side("right"));
  if (!ghost) brickElement.addEventListener("click", (event) => handleBrickClick(event, brick.id));
  return brickElement;
}

function side(name) {
  const element = document.createElement("div");
  element.className = `brick__side brick__side--${name}`;
  return element;
}

function handleBrickClick(event, id) {
  if (!removeMode) return;
  event.stopPropagation();
  removeBrick(id);
}

function removeBrick(id) {
  const index = bricks.findIndex((brick) => brick.id === id);
  if (index === -1) return;
  bricks.splice(index, 1);
  board.querySelector(`[data-id="${id}"]`)?.remove();
  setStatus("Brique supprimée.");
  updateUi();
}

function findTopBrickAt(x, z) {
  return bricks
    .filter((brick) => x >= brick.x && x < brick.x + brick.width && z >= brick.z && z < brick.z + brick.depth)
    .sort((a, b) => b.level - a.level)[0];
}

function showGhost(rawX, rawZ) {
  if (removeMode) {
    hideGhost();
    return;
  }

  const type = getSelectedType();
  const dimensions = getRotatedDimensions(type.width, type.depth);
  const { x, z } = clampCell(rawX, rawZ, dimensions.width, dimensions.depth);
  const level = getNextLevel(x, z, dimensions.width, dimensions.depth);
  const valid = canPlaceBrick(x, z, dimensions.width, dimensions.depth, level);
  const ghostData = { id: "ghost", x, z, level, width: dimensions.width, depth: dimensions.depth, color: valid ? selectedColor : "#ef4444" };
  hideGhost();
  activeGhost = createBrickElement(ghostData, true);
  board.append(activeGhost);
}

function hideGhost() {
  activeGhost?.remove();
  activeGhost = null;
}

function updateUi() {
  brickCount.textContent = bricks.length;
  rotationLabel.textContent = `Brique : ${selectedRotation}° · Vue : ${Math.round(viewRotation)}°`;
  modeLabel.textContent = removeMode ? "Mode suppression" : "Mode construction";
  removeModeButton.textContent = removeMode ? "Revenir à construire" : "Mode suppression";
  removeModeButton.setAttribute("aria-pressed", String(removeMode));
  creationTitle.textContent = bricks.length ? `${bricks.length} brique${bricks.length > 1 ? "s" : ""} assemblée${bricks.length > 1 ? "s" : ""}` : "Terrain vide";
  updateMissions();
}

function updateMissions() {
  const colors = new Set(bricks.map((brick) => brick.color));
  const maxLevel = bricks.reduce((max, brick) => Math.max(max, brick.level + 1), 0);
  const complete = {
    count: bricks.length >= 12,
    height: maxLevel >= 4,
    colors: colors.size >= 4,
  };
  missionItems.forEach((item) => item.classList.toggle("is-complete", complete[item.dataset.mission]));
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function saveBuild() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bricks));
  setStatus("Construction sauvegardée dans ce navigateur.");
}

function loadBuild() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    setStatus("Aucune construction sauvegardée pour le moment.");
    return;
  }

  try {
    clearBuild();
    JSON.parse(raw).forEach((brick) => addBrick(brick));
    setStatus("Construction chargée avec succès.");
    updateUi();
  } catch {
    setStatus("Sauvegarde illisible : elle a été ignorée.");
  }
}

function clearBuild() {
  bricks.splice(0);
  board.querySelectorAll(".brick:not(.brick--ghost)").forEach((brick) => brick.remove());
  updateUi();
}

function updateView() {
  world.style.setProperty("--view-rotation", `${viewRotation}deg`);
}

function shadeColor(color, percent) {
  const value = Number.parseInt(color.replace("#", ""), 16);
  const amount = Math.round(2.55 * percent);
  const red = Math.max(0, Math.min(255, (value >> 16) + amount));
  const green = Math.max(0, Math.min(255, ((value >> 8) & 0x00ff) + amount));
  const blue = Math.max(0, Math.min(255, (value & 0x0000ff) + amount));
  return `#${(0x1000000 + red * 0x10000 + green * 0x100 + blue).toString(16).slice(1)}`;
}

brickSizeSelect.addEventListener("change", hideGhost);
palette.addEventListener("click", (event) => {
  const swatch = event.target.closest(".color-swatch");
  if (!swatch) return;
  selectedColor = swatch.dataset.color;
  document.querySelectorAll(".color-swatch").forEach((button) => button.classList.toggle("is-active", button === swatch));
  hideGhost();
});
rotateButton.addEventListener("click", () => {
  selectedRotation = (selectedRotation + 90) % 180;
  hideGhost();
  updateUi();
});
removeModeButton.addEventListener("click", () => {
  removeMode = !removeMode;
  hideGhost();
  updateUi();
});
resetButton.addEventListener("click", () => {
  clearBuild();
  setStatus("Plateforme réinitialisée. À vous de jouer !");
});
saveButton.addEventListener("click", saveBuild);
loadButton.addEventListener("click", loadBuild);

scene.addEventListener("wheel", (event) => {
  event.preventDefault();
  const currentScale = Number.parseFloat(world.style.getPropertyValue("--zoom")) || 1;
  const nextScale = Math.min(1.25, Math.max(0.72, currentScale - event.deltaY * 0.001));
  world.style.setProperty("--zoom", nextScale.toFixed(2));
}, { passive: false });

let dragStart = null;
scene.addEventListener("pointerdown", (event) => {
  dragStart = { x: event.clientX, rotation: viewRotation };
  scene.setPointerCapture(event.pointerId);
});
scene.addEventListener("pointermove", (event) => {
  if (!dragStart) return;
  viewRotation = dragStart.rotation + (event.clientX - dragStart.x) * 0.35;
  updateView();
  updateUi();
});
scene.addEventListener("pointerup", () => {
  dragStart = null;
});
