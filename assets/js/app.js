// assets/js/app.js
// Lógica principal de BurgerLab (frontend)

// Helpers cortos para el DOM
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// Formateo de moneda en pesos argentinos
const money = (n) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

// -----------------------------------------------------
// Carga dinámica del menú desde PHP (get_menu.php)
// -----------------------------------------------------
async function loadMenu() {
  try {
    const res = await fetch("get_menu.php");
    if (!res.ok) throw new Error("HTTP " + res.status);
    // MENU está declarado en menu.js como: let MENU = [];
    MENU = await res.json();
    console.log("Menú cargado:", MENU);
  } catch (err) {
    console.error("No se pudo cargar el menú", err);
    MENU = [];
  }
}

// -----------------------------------------------------
// Menú responsive (mobile)
// -----------------------------------------------------
function setupMobileMenu() {
  const btn = $("#btnMenu");
  const nav = $("#mainNav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const open = nav.hasAttribute("hidden");
    if (open) {
      nav.removeAttribute("hidden");
      btn.setAttribute("aria-expanded", "true");
    } else {
      nav.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
    }
  });

  // Cerrar al hacer click fuera
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && e.target !== btn) {
      nav.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
    }
  });
}

// -----------------------------------------------------
// Carrito (localStorage)
// -----------------------------------------------------
const CART_KEY = "burgerlab_cart";

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");

const setCart = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));

const updateCartCount = () => {
  const count = getCart().reduce((acc, it) => acc + it.cantidad, 0);
  const el = $("#cartCount");
  if (el) el.textContent = count;
};

function addToCart(id, cantidad) {
  const cart = getCart();
  const idx = cart.findIndex((it) => it.id === id);
  if (idx > -1) {
    cart[idx].cantidad += cantidad;
  } else {
    cart.push({ id, cantidad });
  }
  setCart(cart);
  updateCartCount();
  renderCarrito();
}

function removeFromCart(id) {
  const cart = getCart().filter((it) => it.id !== id);
  setCart(cart);
  updateCartCount();
  renderCarrito();
}

function setupCartLink() {
  const link = $("#cartLink");
  if (!link) return;
  link.addEventListener("click", (e) => {
    e.preventDefault();
    location.href = "comprar.html";
  });
}

// -----------------------------------------------------
// Listado en TABLA (listado_tabla.html)
// -----------------------------------------------------
function renderTabla() {
  const tbody = $("#tbodyProductos");
  if (!tbody) return;

  const qInput = $("#qTabla");
  const ordenSel = $("#ordenTabla");
  let q = (qInput && qInput.value) ? qInput.value.toLowerCase() : "";
  let orden = ordenSel ? ordenSel.value : "nombre";

  let arr = MENU.filter(
    (p) =>
      p.nombre.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q)
  );

  if (orden === "nombre") arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (orden === "precio_asc") arr.sort((a, b) => a.precio - b.precio);
  if (orden === "precio_desc") arr.sort((a, b) => b.precio - a.precio);

  tbody.innerHTML = arr
    .map(
      (p) => `
    <tr>
      <td><img src="${p.img}" alt="${p.nombre}"/></td>
      <td><a href="producto.html?id=${p.id}">${p.nombre}</a></td>
      <td>${p.categoria}</td>
      <td>${money(p.precio)}</td>
      <td><button class="btn" data-add="${p.id}">Agregar</button></td>
    </tr>
  `
    )
    .join("");

  tbody.querySelectorAll("button[data-add]").forEach((btn) => {
    btn.addEventListener("click", () =>
      addToCart(parseInt(btn.dataset.add, 10), 1)
    );
  });
}

// -----------------------------------------------------
// Listado en CARDS (listado_box.html)
// -----------------------------------------------------
function fillCategorias() {
  const sel = $("#categoriaBox");
  if (!sel) return;
  const cats = [...new Set(MENU.map((p) => p.categoria))];
  sel.innerHTML = '<option value="">Todas</option>';
  cats.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function renderCards() {
  const grid = $("#gridProductos");
  if (!grid) return;

  const qInput = $("#qBox");
  const ordenSel = $("#ordenBox");
  const catSel = $("#categoriaBox");

  let q = (qInput && qInput.value) ? qInput.value.toLowerCase() : "";
  let orden = ordenSel ? ordenSel.value : "nombre";
  let cat = catSel ? catSel.value : "";

  let arr = MENU.filter(
    (p) =>
      (p.nombre.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q)) &&
      (!cat || p.categoria === cat)
  );

  if (orden === "nombre") arr.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (orden === "precio_asc") arr.sort((a, b) => a.precio - b.precio);
  if (orden === "precio_desc") arr.sort((a, b) => b.precio - a.precio);

  grid.innerHTML = arr
    .map(
      (p) => `
    <article class="product-card">
      <img src="${p.img}" alt="${p.nombre}" />
      <h3><a href="producto.html?id=${p.id}">${p.nombre}</a></h3>
      <p class="tag">${p.categoria}</p>
      <p>${p.desc}</p>
      <p class="price">${money(p.precio)}</p>
      <button class="btn" data-add="${p.id}">Agregar</button>
    </article>
  `
    )
    .join("");

  grid.querySelectorAll("button[data-add]").forEach((btn) => {
    btn.addEventListener("click", () =>
      addToCart(parseInt(btn.dataset.add, 10), 1)
    );
  });
}

// -----------------------------------------------------
// Página de producto (producto.html)
// -----------------------------------------------------
function renderProducto() {
  const ficha = $("#ficha");
  if (!ficha) return;

  const params = new URLSearchParams(location.search);
  const id = parseInt(params.get("id") || "0", 10);
  let p = MENU.find((x) => x.id === id);
  if (!p) p = MENU[0]; // fallback simple
  if (!p) return;

  const img = $("#fotoPrincipal");
  if (img) {
    img.src = p.img;
    img.alt = p.nombre;
  }

  const nom = $("#nombreProd");
  const cat = $("#categoriaProd");
  const desc = $("#descripcionProd");
  const precio = $("#precioProd");

  if (nom) nom.textContent = p.nombre;
  if (cat) cat.textContent = p.categoria;
  if (desc) desc.textContent = p.desc;
  if (precio) precio.textContent = money(p.precio);

  const btnAdd = $("#btnAgregar");
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const qtyInput = $("#cantidad");
      const qty = parseInt((qtyInput && qtyInput.value) || "1", 10) || 1;
      addToCart(p.id, qty);
    });
  }

  const combos = [
    { txt: "+ Papas clásicas + Gaseosa 354 ml", extra: 2100 },
    { txt: "+ Papas cheddar + Gaseosa 500 ml", extra: 2700 },
  ];
  const ul = $("#combosSugeridos");
  if (ul) {
    ul.innerHTML = combos
      .map(
        (c) =>
          `<li>${c.txt}: <strong>${money(c.extra)}</strong></li>`
      )
      .join("");
  }
}

// -----------------------------------------------------
// Carrito en la página de compra (comprar.html)
// -----------------------------------------------------
function renderCarrito() {
  const ul = $("#listaCarrito");
  if (!ul) return;

  const totalEl = $("#totalCarrito");
  const cart = getCart();

  if (!MENU.length) {
    // Si el menú aún no se cargó, evitamos errores
    ul.innerHTML = "";
    if (totalEl) totalEl.textContent = money(0);
    return;
  }

  let total = 0;
  ul.innerHTML = cart
    .map((it) => {
      const p = MENU.find((x) => x.id === it.id);
      if (!p) return "";
      const subtotal = p.precio * it.cantidad;
      total += subtotal;
      return `<li>
        <span>${p.nombre} × ${it.cantidad}</span>
        <span>${money(subtotal)}</span>
        <button class="btn outline" data-del="${it.id}">Quitar</button>
      </li>`;
    })
    .join("");

  if (totalEl) totalEl.textContent = money(total);

  ul.querySelectorAll("button[data-del]").forEach((btn) => {
    btn.addEventListener("click", () =>
      removeFromCart(parseInt(btn.dataset.del, 10))
    );
  });
}

// -----------------------------------------------------
// Formulario de compra (comprar.html) + guardar_pedido.php
// -----------------------------------------------------
function setupForm() {
  const form = $("#formCompra");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const required = ["nombre", "direccion", "telefono", "email", "pago"];
    const msg = $("#msgForm");

    const missing = required.filter((k) => !data[k] || !data[k].trim());
    if (missing.length) {
      if (msg) {
        msg.textContent = "Completá todos los campos requeridos.";
        msg.style.color = "#f87171";
      }
      return;
    }

    const emailOk = /.+@.+\..+/.test(data.email);
    if (!emailOk) {
      if (msg) {
        msg.textContent = "Ingresá un e-mail válido.";
        msg.style.color = "#f87171";
      }
      return;
    }

    const cart = getCart();
    if (cart.length === 0) {
      if (msg) {
        msg.textContent = "Tu pedido está vacío.";
        msg.style.color = "#f87171";
      }
      return;
    }

    try {
      const res = await fetch("guardar_pedido.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente: data, carrito: cart }),
      });
      const result = await res.json();

      if (!result.ok) {
        console.error(result.error || result);
        if (msg) {
          msg.textContent = "Ocurrió un problema al guardar el pedido.";
          msg.style.color = "#f87171";
        }
        return;
      }

      // Todo OK
      setCart([]);
      updateCartCount();
      renderCarrito();

      if (msg) {
        msg.textContent =
          "¡Pedido confirmado! Número de pedido: " + result.pedido_id;
        msg.style.color = "#34d399";
      }
      form.reset();
    } catch (err) {
      console.error(err);
      if (msg) {
        msg.textContent = "Error al conectar con el servidor.";
        msg.style.color = "#f87171";
      }
    }
  });
}

// -----------------------------------------------------
// Inicialización general
// -----------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  setupMobileMenu();
  setupCartLink();
  updateCartCount();

  // Primero cargamos el menú desde la base de datos
  await loadMenu();

  // Cada página usa solo lo que necesita
  if ($("#tbodyProductos")) {
    const qInput = $("#qTabla");
    const ordenSel = $("#ordenTabla");
    if (qInput) qInput.addEventListener("input", renderTabla);
    if (ordenSel) ordenSel.addEventListener("change", renderTabla);
    renderTabla();
  }

  if ($("#gridProductos")) {
    fillCategorias();
    const qInput = $("#qBox");
    const ordenSel = $("#ordenBox");
    const catSel = $("#categoriaBox");
    if (qInput) qInput.addEventListener("input", renderCards);
    if (ordenSel) ordenSel.addEventListener("change", renderCards);
    if (catSel) catSel.addEventListener("change", renderCards);
    renderCards();
  }

  if ($("#ficha")) {
    renderProducto();
  }

  if ($("#formCompra")) {
    renderCarrito();
    setupForm();
  }
});
