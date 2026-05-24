const STORAGE_KEY = "stock-rustique-data";

const productForm = document.querySelector("#product-form");
const movementForm = document.querySelector("#movement-form");
const productSelect = document.querySelector("#movement-product");
const stockTable = document.querySelector("#stock-table");
const historyList = document.querySelector("#history-list");
const status = document.querySelector("#status");
const resetButton = document.querySelector("#reset-data");

const statProducts = document.querySelector("#stat-products");
const statUnits = document.querySelector("#stat-units");
const statSales = document.querySelector("#stat-sales");
const statPurchases = document.querySelector("#stat-purchases");

const state = loadState();
render();

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#product-name").value.trim();
  const category = document.querySelector("#product-category").value.trim() || "Non classé";
  const price = Number.parseFloat(document.querySelector("#product-price").value);

  if (!name || Number.isNaN(price) || price < 0) {
    setStatus("Veuillez saisir un nom et un prix valide.");
    return;
  }

  state.products.push({
    id: crypto.randomUUID(),
    name,
    category,
    price,
    stock: 0,
  });

  saveState();
  productForm.reset();
  setStatus(`Produit « ${name} » ajouté.`);
  render();
});

movementForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const productId = productSelect.value;
  const type = document.querySelector("#movement-type").value;
  const quantity = Number.parseInt(document.querySelector("#movement-qty").value, 10);

  const product = state.products.find((item) => item.id === productId);
  if (!product) {
    setStatus("Produit introuvable.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    setStatus("La quantité doit être un entier positif.");
    return;
  }

  if (type === "sale" && product.stock < quantity) {
    setStatus(`Stock insuffisant pour ${product.name}.`);
    return;
  }

  product.stock += type === "purchase" ? quantity : -quantity;

  state.movements.unshift({
    id: crypto.randomUUID(),
    type,
    quantity,
    productId,
    productName: product.name,
    createdAt: new Date().toISOString(),
  });

  saveState();
  movementForm.reset();
  setStatus(`Mouvement enregistré : ${type === "purchase" ? "achat" : "vente"} de ${quantity}.`);
  render();
});

resetButton.addEventListener("click", () => {
  state.products = [];
  state.movements = [];
  saveState();
  setStatus("Données réinitialisées.");
  render();
});

function render() {
  renderProductOptions();
  renderStockTable();
  renderHistory();
  renderStats();
}

function renderProductOptions() {
  if (!state.products.length) {
    productSelect.innerHTML = "<option value=''>Aucun produit</option>";
    return;
  }

  productSelect.innerHTML = state.products
    .map((product) => `<option value="${product.id}">${product.name}</option>`)
    .join("");
}

function renderStockTable() {
  if (!state.products.length) {
    stockTable.innerHTML = "<tr><td colspan='5'>Aucun produit enregistré.</td></tr>";
    return;
  }

  stockTable.innerHTML = state.products
    .map((product) => {
      const value = product.stock * product.price;
      return `
        <tr>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${formatCurrency(product.price)}</td>
          <td>${product.stock}</td>
          <td>${formatCurrency(value)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderHistory() {
  if (!state.movements.length) {
    historyList.innerHTML = "<li>Aucun mouvement pour le moment.</li>";
    return;
  }

  historyList.innerHTML = state.movements
    .slice(0, 30)
    .map((item) => {
      const label = item.type === "purchase" ? "Achat" : "Vente";
      return `<li><strong>${label}</strong> · ${item.productName} · ${item.quantity} unité(s) · ${formatDate(item.createdAt)}</li>`;
    })
    .join("");
}

function renderStats() {
  const sales = state.movements
    .filter((item) => item.type === "sale")
    .reduce((total, item) => total + item.quantity, 0);
  const purchases = state.movements
    .filter((item) => item.type === "purchase")
    .reduce((total, item) => total + item.quantity, 0);
  const units = state.products.reduce((total, product) => total + product.stock, 0);

  statProducts.textContent = String(state.products.length);
  statUnits.textContent = String(units);
  statSales.textContent = String(sales);
  statPurchases.textContent = String(purchases);
}

function setStatus(message) {
  status.textContent = message;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function formatDate(isoDate) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { products: [], movements: [] };
    const parsed = JSON.parse(raw);
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      movements: Array.isArray(parsed.movements) ? parsed.movements : [],
    };
  } catch {
    return { products: [], movements: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
