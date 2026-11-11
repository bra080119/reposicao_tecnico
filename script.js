const $ = (selector) => document.querySelector(selector);

const registerScreen = $("#registerScreen");
const dashboardScreen = $("#dashboardScreen");
const registerForm = $("#registerForm");
const productForm = $("#productForm");
const inventoryBody = $("#inventoryBody");
const emptyState = $("#emptyState");

let manager = JSON.parse(localStorage.getItem("smartstock_manager") || "null");
let products = JSON.parse(localStorage.getItem("smartstock_products") || "[]");

function saveProducts() {
  localStorage.setItem("smartstock_products", JSON.stringify(products));
}

function showDashboard() {
  registerScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");
  $("#welcomeUser").textContent = manager ? `Olá, ${manager.name}` : "";
  $("#logoutBtn").classList.remove("hidden");
  renderInventory();
}

function showRegister() {
  dashboardScreen.classList.add("hidden");
  registerScreen.classList.remove("hidden");
  $("#logoutBtn").classList.add("hidden");
  $("#welcomeUser").textContent = "";
}

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  manager = {
    name: $("#managerName").value.trim(),
    id: $("#managerId").value.trim(),
    // Demonstração front-end: não armazene senhas reais em localStorage.
    password: $("#managerPassword").value
  };
  localStorage.setItem("smartstock_manager", JSON.stringify({ name: manager.name, id: manager.id }));
  showDashboard();
});

$("#logoutBtn").addEventListener("click", () => {
  manager = null;
  showRegister();
});

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}

function renderInventory() {
  const search = $("#searchInput").value.trim().toLocaleLowerCase("pt-BR");
  const sort = $("#sortSelect").value;
  let visible = products.filter((product) =>
    product.name.toLocaleLowerCase("pt-BR").includes(search) ||
    product.code.toLocaleLowerCase("pt-BR").includes(search)
  );

  if (sort === "quantity-desc") visible.sort((a, b) => b.quantity - a.quantity);
  else if (sort === "quantity-asc") visible.sort((a, b) => a.quantity - b.quantity);
  else visible.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  inventoryBody.innerHTML = "";
  visible.forEach((product) => {
    const row = document.createElement("tr");
    const low = product.quantity <= 10;
    const cells = [
      product.name,
      product.code || "—",
      formatNumber(product.quantity),
      `${formatNumber(product.weight)} kg`,
      low ? "Estoque baixo" : "Disponível"
    ];
    cells.forEach((value, index) => {
      const cell = document.createElement("td");
      if (index === 4) {
        const status = document.createElement("span");
        status.className = `status${low ? " low" : ""}`;
        status.textContent = value;
        cell.append(status);
      } else {
        cell.textContent = value;
      }
      row.append(cell);
    });

    const actionCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.className = "action-button";
    removeButton.type = "button";
    removeButton.title = "Excluir produto";
    removeButton.setAttribute("aria-label", `Excluir ${product.name}`);
    removeButton.textContent = "✕";
    removeButton.addEventListener("click", () => {
      if (confirm(`Deseja excluir "${product.name}" do estoque?`)) {
        products = products.filter((item) => item.id !== product.id);
        saveProducts();
        renderInventory();
      }
    });
    actionCell.append(removeButton);
    row.append(actionCell);
    inventoryBody.append(row);
  });

  emptyState.classList.toggle("hidden", visible.length > 0);
  $("#stockCount").textContent = `${products.length} ${products.length === 1 ? "item" : "itens"}`;
  $("#resultSummary").textContent = `Mostrando ${visible.length} de ${products.length} produtos`;
  $("#totalProducts").textContent = products.length;
  $("#totalUnits").textContent = formatNumber(products.reduce((sum, item) => sum + item.quantity, 0));
  $("#lowStock").textContent = products.filter((item) => item.quantity <= 10).length;
}

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#productName").value.trim();
  const quantity = Number($("#productQuantity").value);
  const weight = Number($("#productWeight").value);
  const code = $("#productCode").value.trim();

  if (!name || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(weight) || weight < 0) {
    $("#formFeedback").textContent = "Confira os dados informados e tente novamente.";
    return;
  }

  products.push({
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name, quantity, weight, code
  });
  saveProducts();
  productForm.reset();
  $("#formFeedback").textContent = "Produto adicionado ao estoque com sucesso!";
  renderInventory();
});

$("#searchInput").addEventListener("input", renderInventory);
$("#sortSelect").addEventListener("change", renderInventory);
$("#clearSearch").addEventListener("click", () => {
  $("#searchInput").value = "";
  renderInventory();
});
$("#addProductTop").addEventListener("click", () => {
  $("#productName").focus();
  $("#productFormPanel").scrollIntoView({ behavior: "smooth", block: "center" });
});

if (manager) showDashboard();
else showRegister();

// Alternância entre as duas áreas internas: cadastro e consulta do estoque.
document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".nav-tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".subview").forEach((view) => view.classList.add("hidden"));
    document.getElementById(tab.dataset.view).classList.remove("hidden");
  });
});
