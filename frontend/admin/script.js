const API_BASE = "https://rrrivo-market.onrender.com/api";
const TOKEN_KEY = "rrrivoAdminToken";
const ADMIN_KEY = "rrrivoAdmin";

const page = $("body").data("page") || "login";
const state = {
  products: [],
  categories: [],
  subcategories: [],
  banners: [],
  offers: [],
  users: [],
  orders: [],
  reviews: [],
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

function setSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin || {}));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function idOf(value) {
  return typeof value === "object" && value ? value._id : value || "";
}

function nameOf(value, fallback = "-") {
  if (!value) return fallback;
  return typeof value === "object"
    ? value.name || value.title || fallback
    : fallback;
}

function badge(active, yes = "Active", no = "Inactive") {
  return `<span class="badge ${active ? "badge-soft" : "text-bg-secondary"}">${active ? yes : no}</span>`;
}

function imageTag(src, alt = "Image") {
  return src
    ? `<img class="thumb" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />`
    : `<div class="thumb d-grid place-items-center"></div>`;
}

function showAlert(message, type = "success") {
  $("#alertBox")
    .removeClass("d-none alert-success alert-danger alert-warning alert-info")
    .addClass(`alert-${type}`)
    .text(message);
}

function hideAlert() {
  $("#alertBox").addClass("d-none").text("");
}

function handleAjaxError(xhr) {
  if (xhr.status === 401) {
    clearSession();
    window.location.href = "/admin/index.html";
    return;
  }
  showAlert(
    xhr.responseJSON?.message || xhr.responseText || "Request failed",
    "danger",
  );
}

function request(path, options = {}) {
  const headers = options.headers || {};
  if (token()) headers.Authorization = `Bearer ${token()}`;

  return $.ajax({
    url: `${API_BASE}${path}`,
    method: options.method || "GET",
    data: options.data,
    headers,
    contentType: options.contentType,
    processData: options.processData,
  });
}

function jsonRequest(path, method, data) {
  return request(path, {
    method,
    data: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    contentType: "application/json",
  });
}

function formRequest(path, method, formData) {
  return request(path, {
    method,
    data: formData,
    contentType: false,
    processData: false,
  });
}

function formDataFrom(form) {
  const data = new FormData(form);
  $(form)
    .find("input[type='checkbox']")
    .each(function () {
      data.set(this.name, this.checked ? "true" : "false");
    });
  return data;
}

function confirmDelete(label) {
  return window.confirm(`Delete ${label}? This cannot be undone.`);
}

function sidebar() {
  const items = [
    ["dashboard", "dashboard.html", "bi-speedometer2", "Dashboard"],
    ["products", "products.html", "bi-box-seam", "Products"],
    ["categories", "categories.html", "bi-tags", "Categories"],
    ["subcategories", "subcategories.html", "bi-diagram-3", "Subcategories"],
    ["banners", "banners.html", "bi-images", "Banners"],
    ["offers", "offers.html", "bi-percent", "Offers"],
    ["orders", "orders.html", "bi-receipt", "Orders"],
    ["users", "users.html", "bi-people", "Users"],
    ["reviews", "reviews.html", "bi-star", "Reviews"],
    ["settings", "settings.html", "bi-gear", "Settings"],
  ];

  $(".sidebar").html(`
    <a class="brand" href="dashboard.html">
      <span class="brand-mark">R</span>
      <span><strong>Rrrivo Admin</strong><span>Content Management</span></span>
    </a>
    <nav class="nav-menu">
      ${items.map(([key, href, icon, label]) => `<a class="${page === key ? "active" : ""}" href="${href}"><i class="bi ${icon}"></i>${label}</a>`).join("")}
    </nav>
    <div class="sidebar-footer">
      <button class="logout-link" id="logoutButton" type="button"><i class="bi bi-box-arrow-left"></i>Logout</button>
    </div>
  `);

  $("#logoutButton").on("click", function () {
    clearSession();
    window.location.href = "/index.html";
  });
}

function protectPage() {
  if (page !== "login" && !token()) {
    window.location.href = "/admin/index.html";
    return false;
  }
  if (page !== "login") sidebar();
  return true;
}

function emptyRow(target, colspan, message) {
  $(target).html(
    `<tr><td class="empty-row" colspan="${colspan}">${message}</td></tr>`,
  );
}

async function loadDashboard() {
  try {
    hideAlert();
    const data = await request("/dashboard/analytics");
    const stats = [
      ["Total Products", data.totalProducts ?? 0],
      ["Total Categories", data.totalCategories ?? 0],
      ["Total Orders", data.totalOrders ?? 0],
      ["Total Users", data.totalUsers ?? 0],
      ["Active Offers", data.activeOffers ?? 0],
      ["Revenue", money.format(data.totalRevenue ?? 0)],
    ];
    $("#dashboardStats").html(
      stats
        .map(
          ([label, value]) =>
            `<article class="stat-card"><span>${label}</span><strong>${value}</strong></article>`,
        )
        .join(""),
    );
    $("#monthlyOrdersBody").html(
      data.monthlyOrders?.length
        ? data.monthlyOrders
            .map(
              (item) =>
                `<tr><td>${new Date(0, item._id - 1).toLocaleString("en-IN", { month: "long" })}</td><td>${item.count}</td><td>${money.format(item.revenue ?? 0)}</td></tr>`,
            )
            .join("")
        : `<tr><td class="empty-row" colspan="3">No order data yet.</td></tr>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

function modal(title, body, footer) {
  $("#modalMount").html(`
    <div class="modal fade" id="cmsModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title fs-5">${title}</h2>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${body}</div>
          <div class="modal-footer">${footer}</div>
        </div>
      </div>
    </div>
  `);
  const instance = new bootstrap.Modal(document.getElementById("cmsModal"));
  instance.show();
  return instance;
}

function categoryOptions(selected = "") {
  return state.categories
    .map(
      (item) =>
        `<option value="${item._id}" ${idOf(selected) === item._id ? "selected" : ""}>${escapeHtml(item.name)}</option>`,
    )
    .join("");
}

function subcategoryOptions(selected = "") {
  return state.subcategories
    .map(
      (item) =>
        `<option value="${item._id}" ${idOf(selected) === item._id ? "selected" : ""}>${escapeHtml(item.name)}</option>`,
    )
    .join("");
}

async function loadCatalogLookups() {
  const [categories, subcategories] = await Promise.all([
    request("/categories"),
    request("/subcategories"),
  ]);
  state.categories = categories;
  state.subcategories = subcategories;
}

function productForm(item = {}) {
  return `
    <form id="productForm">
      <div class="row g-3">
        <div class="col-md-6"><label class="form-label">Name</label><input class="form-control" name="name" value="${escapeHtml(item.name)}" required /></div>
        <div class="col-md-6"><label class="form-label">Category</label><select class="form-select" name="category" required><option value="">Select category</option>${categoryOptions(item.category)}</select></div>
        <div class="col-md-6"><label class="form-label">Subcategory</label><select class="form-select" name="subcategory"><option value="">No subcategory</option>${subcategoryOptions(item.subcategory)}</select></div>
        <div class="col-md-6"><label class="form-label">Rating</label><input class="form-control" name="rating" type="number" min="0" max="5" step="0.1" value="${item.rating ?? 4.5}" /></div>
        <div class="col-md-6"><label class="form-label">Product Image</label><input class="form-control" name="image" type="file" accept="image/*" /></div>
        <div class="col-12"><label class="form-label">Gallery Images</label><input class="form-control" name="gallery" type="file" accept="image/*" multiple /></div>
        <div class="col-12"><label class="form-label">Description</label><textarea class="form-control" name="description" rows="4">${escapeHtml(item.description)}</textarea></div>
        <div class="col-md-6"><div class="form-check form-switch"><input class="form-check-input" name="featured" type="checkbox" ${item.featured ? "checked" : ""} /><label class="form-check-label">Featured product</label></div></div>
        <div class="col-md-6"><div class="form-check form-switch"><input class="form-check-input" name="status" type="checkbox" ${item.status !== false ? "checked" : ""} /><label class="form-check-label">Active</label></div></div>
      </div>
    </form>`;
}

async function openProduct(item = {}) {
  await loadCatalogLookups();
  const isEdit = Boolean(item._id);
  modal(
    `${isEdit ? "Edit" : "Add"} Product`,
    productForm(item),
    `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-success" id="saveProduct">Save Product</button>`,
  );
  $("#saveProduct").on("click", async function () {
    try {
      const data = formDataFrom(document.getElementById("productForm"));
      await formRequest(
        isEdit ? `/products/${item._id}` : "/products",
        isEdit ? "PUT" : "POST",
        data,
      );
      bootstrap.Modal.getInstance(document.getElementById("cmsModal")).hide();
      showAlert("Product saved.");
      loadProducts();
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });
}

async function loadProducts(q = "") {
  try {
    hideAlert();
    state.products = await request(
      `/products${q ? `?q=${encodeURIComponent(q)}` : ""}`,
    );
    $("#productsTable").html(
      state.products.length
        ? state.products
            .map(
              (p) => `
              <tr>
                <td>${imageTag(p.image, p.name)}</td>
                <td><strong>${escapeHtml(p.name)}</strong><div class="text-muted small">${escapeHtml(p.description).slice(0, 70)}</div></td>
                <td>${escapeHtml(nameOf(p.category))}<div class="text-muted small">${escapeHtml(nameOf(p.subcategory, ""))}</div></td>
                <td>${badge(p.status !== false)}</td>
                <td class="text-end"><span class="action-group">
                  <button class="btn btn-outline-primary btn-icon" data-edit-product="${p._id}" title="Edit"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-outline-danger btn-icon" data-delete-product="${p._id}" title="Delete"><i class="bi bi-trash"></i></button>
                </span></td>
              </tr>`,
            )
            .join("")
        : `<tr><td class="empty-row" colspan="7">No products found.</td></tr>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

function simpleForm(kind, item = {}) {
  if (kind === "category") {
    return `<form id="simpleForm"><div class="row g-3"><div class="col-md-8"><label class="form-label">Name</label><input class="form-control" name="name" value="${escapeHtml(item.name)}" required /></div><div class="col-md-4"><label class="form-label">Image</label><input class="form-control" name="image" type="file" accept="image/*" /></div><div class="col-12"><div class="form-check form-switch"><input class="form-check-input" name="status" type="checkbox" ${item.status !== false ? "checked" : ""} /><label class="form-check-label">Active</label></div></div></div></form>`;
  }
  if (kind === "subcategory") {
    return `<form id="simpleForm"><div class="row g-3"><div class="col-md-6"><label class="form-label">Name</label><input class="form-control" name="name" value="${escapeHtml(item.name)}" required /></div><div class="col-md-6"><label class="form-label">Category</label><select class="form-select" name="categoryId" required><option value="">Select category</option>${categoryOptions(item.categoryId)}</select></div><div class="col-md-6"><label class="form-label">Image</label><input class="form-control" name="image" type="file" accept="image/*" /></div><div class="col-md-6 d-flex align-items-end"><div class="form-check form-switch"><input class="form-check-input" name="status" type="checkbox" ${item.status !== false ? "checked" : ""} /><label class="form-check-label">Active</label></div></div></div></form>`;
  }
  if (kind === "banner") {
    return `<form id="simpleForm"><div class="row g-3"><div class="col-md-6"><label class="form-label">Title</label><input class="form-control" name="title" value="${escapeHtml(item.title)}" required /></div><div class="col-md-6"><label class="form-label">Subtitle</label><input class="form-control" name="subtitle" value="${escapeHtml(item.subtitle)}" /></div><div class="col-md-6"><label class="form-label">${item._id ? "Replace" : "Upload"} Banner</label><input class="form-control" name="image" type="file" accept="image/*" ${item._id ? "" : "required"} /></div><div class="col-md-3"><label class="form-label">Button Text</label><input class="form-control" name="buttonText" value="${escapeHtml(item.buttonText || "Shop Products")}" /></div><div class="col-md-3"><label class="form-label">Button Link</label><input class="form-control" name="buttonLink" value="${escapeHtml(item.buttonLink || "#products")}" /></div><div class="col-12"><div class="form-check form-switch"><input class="form-check-input" name="active" type="checkbox" ${item.active !== false ? "checked" : ""} /><label class="form-check-label">Active</label></div></div></div></form>`;
  }
  return `<form id="simpleForm"><div class="row g-3"><div class="col-md-6"><label class="form-label">Title</label><input class="form-control" name="title" value="${escapeHtml(item.title)}" required /></div><div class="col-md-3"><label class="form-label">Discount</label><input class="form-control" name="discount" type="number" min="0" value="${item.discount ?? 0}" /></div><div class="col-md-3"><label class="form-label">Image</label><input class="form-control" name="image" type="file" accept="image/*" /></div><div class="col-md-6"><label class="form-label">Start Date</label><input class="form-control" name="startDate" type="date" value="${item.startDate ? item.startDate.slice(0, 10) : ""}" /></div><div class="col-md-6"><label class="form-label">End Date</label><input class="form-control" name="endDate" type="date" value="${item.endDate ? item.endDate.slice(0, 10) : ""}" /></div><div class="col-12"><label class="form-label">Description</label><textarea class="form-control" name="description" rows="3">${escapeHtml(item.description)}</textarea></div><div class="col-12"><div class="form-check form-switch"><input class="form-check-input" name="active" type="checkbox" ${item.active !== false ? "checked" : ""} /><label class="form-check-label">Active</label></div></div></div></form>`;
}

async function openSimple(kind, item = {}) {
  if (kind === "subcategory") await loadCatalogLookups();
  const resource = {
    category: "categories",
    subcategory: "subcategories",
    banner: "banners",
    offer: "offers",
  }[kind];
  const title = kind.charAt(0).toUpperCase() + kind.slice(1);
  const isEdit = Boolean(item._id);
  modal(
    `${isEdit ? (kind === "banner" ? "Replace" : "Edit") : "Add"} ${title}`,
    simpleForm(kind, item),
    `<button class="btn btn-light" data-bs-dismiss="modal">Cancel</button><button class="btn btn-success" id="saveSimple">Save</button>`,
  );
  $("#saveSimple").on("click", async function () {
    try {
      await formRequest(
        isEdit ? `/${resource}/${item._id}` : `/${resource}`,
        isEdit ? "PUT" : "POST",
        formDataFrom(document.getElementById("simpleForm")),
      );
      bootstrap.Modal.getInstance(document.getElementById("cmsModal")).hide();
      showAlert(`${title} saved.`);
      loaders[resource]();
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });
}

async function loadCategories() {
  try {
    state.categories = await request("/categories");
    $("#categoriesTable").html(
      state.categories.length
        ? state.categories
            .map(
              (c) =>
                `<tr><td>${imageTag(c.image, c.name)}</td><td><strong>${escapeHtml(c.name)}</strong></td><td>${badge(c.status !== false)}</td><td>${formatDate(c.createdAt)}</td><td class="text-end"><span class="action-group"><button class="btn btn-outline-primary btn-icon" data-edit-category="${c._id}"><i class="bi bi-pencil"></i></button><button class="btn btn-outline-danger btn-icon" data-delete-resource="categories:${c._id}:category"><i class="bi bi-trash"></i></button></span></td></tr>`,
            )
            .join("")
        : `<tr><td class="empty-row" colspan="5">No categories found.</td></tr>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

async function loadSubcategories() {
  try {
    state.subcategories = await request("/subcategories");
    $("#subcategoriesTable").html(
      state.subcategories.length
        ? state.subcategories
            .map(
              (s) =>
                `<tr><td>${imageTag(s.image, s.name)}</td><td><strong>${escapeHtml(s.name)}</strong></td><td>${escapeHtml(nameOf(s.categoryId))}</td><td>${badge(s.status !== false)}</td><td class="text-end"><span class="action-group"><button class="btn btn-outline-primary btn-icon" data-edit-subcategory="${s._id}"><i class="bi bi-pencil"></i></button><button class="btn btn-outline-danger btn-icon" data-delete-resource="subcategories:${s._id}:subcategory"><i class="bi bi-trash"></i></button></span></td></tr>`,
            )
            .join("")
        : `<tr><td class="empty-row" colspan="5">No subcategories found.</td></tr>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

async function loadBanners() {
  try {
    state.banners = await request("/banners");
    $("#bannersGrid").html(
      state.banners.length
        ? state.banners
            .map(
              (b) =>
                `<div class="col-md-6 col-xl-4"><article class="card h-100"><img class="banner-img" src="${escapeHtml(b.image)}" alt="${escapeHtml(b.title)}" /><div class="card-body"><div class="d-flex justify-content-between gap-2"><h3 class="h6 mb-1">${escapeHtml(b.title)}</h3>${badge(b.active !== false)}</div><p class="text-muted small mb-3">${escapeHtml(b.subtitle)}</p><div class="action-group"><button class="btn btn-outline-primary btn-sm" data-edit-banner="${b._id}"><i class="bi bi-arrow-repeat me-1"></i>Replace</button><button class="btn btn-outline-danger btn-sm" data-delete-resource="banners:${b._id}:banner"><i class="bi bi-trash me-1"></i>Delete</button></div></div></article></div>`,
            )
            .join("")
        : `<div class="col-12"><div class="empty-row">No banners found.</div></div>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

async function loadOffers() {
  try {
    state.offers = await request("/offers");
    $("#offersTable").html(
      state.offers.length
        ? state.offers
            .map(
              (o) =>
                `<tr><td>${imageTag(o.image, o.title)}</td><td><strong>${escapeHtml(o.title)}</strong><div class="text-muted small">${escapeHtml(o.description).slice(0, 70)}</div></td><td>${o.discount ?? 0}%</td><td>${formatDate(o.startDate)} - ${formatDate(o.endDate)}</td><td>${badge(o.active !== false)}</td><td class="text-end"><span class="action-group"><button class="btn btn-outline-primary btn-icon" data-edit-offer="${o._id}"><i class="bi bi-pencil"></i></button><button class="btn btn-outline-danger btn-icon" data-delete-resource="offers:${o._id}:offer"><i class="bi bi-trash"></i></button></span></td></tr>`,
            )
            .join("")
        : `<tr><td class="empty-row" colspan="6">No offers found.</td></tr>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

async function loadUsers() {
  try {
    state.users = await request("/users");
    $("#usersTable").html(
      state.users.length
        ? state.users
            .map(
              (u) =>
                `<tr><td><strong>${escapeHtml(u.name)}</strong></td><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.mobile)}</td><td>${escapeHtml(u.address)}</td><td>${badge(u.status !== false, "Allowed", "Blocked")}</td><td class="text-end"><span class="action-group"><button class="btn btn-outline-warning btn-sm" data-toggle-user="${u._id}">${u.status === false ? "Unblock" : "Block"}</button><button class="btn btn-outline-danger btn-icon" data-delete-resource="users:${u._id}:user"><i class="bi bi-trash"></i></button></span></td></tr>`,
            )
            .join("")
        : `<tr><td class="empty-row" colspan="6">No users found.</td></tr>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

async function loadOrders() {
  try {
    state.orders = await request("/orders");
    const statuses = [
      "pending",
      "accepted",
      "rejected",
      "processing",
      "shipped",
      "delivered",
    ];
    $("#ordersTable").html(
      state.orders.length
        ? state.orders
            .map(
              (o) =>
                `<tr><td><strong>#${escapeHtml(String(o._id).slice(-6))}</strong><div class="text-muted small">${formatDate(o.createdAt)}</div></td><td>${escapeHtml(nameOf(o.userId))}<div class="text-muted small">${escapeHtml(o.userId?.mobile || o.userId?.email || "")}</div></td><td>${(o.products || []).map((p) => `${escapeHtml(p.name || nameOf(p.productId, "Product"))} x ${p.quantity}`).join("<br>")}</td><td>${money.format(o.totalAmount ?? 0)}</td><td>${escapeHtml(o.paymentStatus)}</td><td><select class="form-select form-select-sm order-status" data-order-id="${o._id}">${statuses.map((s) => `<option value="${s}" ${o.orderStatus === s ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`,
            )
            .join("")
        : `<tr><td class="empty-row" colspan="6">No orders found.</td></tr>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

async function loadReviews() {
  try {
    state.reviews = await request("/reviews");
    $("#reviewsTable").html(
      state.reviews.length
        ? state.reviews
            .map(
              (r) =>
                `<tr><td>${escapeHtml(nameOf(r.productId))}</td><td>${escapeHtml(nameOf(r.userId))}</td><td>${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</td><td>${escapeHtml(r.review)}</td><td>${badge(r.approved, "Approved", "Pending")}</td><td class="text-end"><span class="action-group"><button class="btn btn-outline-success btn-sm" data-approve-review="${r._id}">${r.approved ? "Unapprove" : "Approve"}</button><button class="btn btn-outline-danger btn-icon" data-delete-resource="reviews:${r._id}:review"><i class="bi bi-trash"></i></button></span></td></tr>`,
            )
            .join("")
        : `<tr><td class="empty-row" colspan="6">No reviews found.</td></tr>`,
    );
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

async function loadSettings() {
  try {
    const settings = await request("/settings");
    const form = document.getElementById("settingsForm");
    if (!form) return;
    form.storeName.value = settings.storeName || "";
    form.contactNumber.value = settings.contactNumber || "";
    form.email.value = settings.email || "";
    form.address.value = settings.address || "";
    form.footerContent.value = settings.footerContent || "";
    form.aboutUsContent.value = settings.aboutUsContent || "";
    form.facebook.value = settings.socialLinks?.facebook || "";
    form.instagram.value = settings.socialLinks?.instagram || "";
    form.x.value = settings.socialLinks?.x || "";
    form.linkedin.value = settings.socialLinks?.linkedin || "";
  } catch (xhr) {
    handleAjaxError(xhr);
  }
}

const loaders = {
  dashboard: loadDashboard,
  products: loadProducts,
  categories: loadCategories,
  subcategories: loadSubcategories,
  banners: loadBanners,
  offers: loadOffers,
  users: loadUsers,
  orders: loadOrders,
  reviews: loadReviews,
  settings: loadSettings,
};

function bindEvents() {
  $("#loginForm").on("submit", async function (event) {
    event.preventDefault();
    try {
      hideAlert();
      const data = await jsonRequest("/auth/login", "POST", {
        email: $("#adminEmail").val(),
        password: $("#adminPassword").val(),
      });
      setSession(data);
      window.location.href = "/admin/dashboard.html";
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });

  $("#refreshDashboard").on("click", loadDashboard);
  $("#refreshOrders").on("click", loadOrders);
  $("[data-action='open-product-add']").on("click", () => openProduct());
  $("[data-action='open-category-add']").on("click", () =>
    openSimple("category"),
  );
  $("[data-action='open-subcategory-add']").on("click", () =>
    openSimple("subcategory"),
  );
  $("[data-action='open-banner-add']").on("click", () => openSimple("banner"));
  $("[data-action='open-offer-add']").on("click", () => openSimple("offer"));

  $("#productSearch").on("input", function () {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => loadProducts(this.value.trim()), 250);
  });

  $(document).on("click", "[data-edit-product]", function () {
    openProduct(
      state.products.find((item) => item._id === $(this).data("edit-product")),
    );
  });
  $(document).on("click", "[data-edit-category]", function () {
    openSimple(
      "category",
      state.categories.find(
        (item) => item._id === $(this).data("edit-category"),
      ),
    );
  });
  $(document).on("click", "[data-edit-subcategory]", function () {
    openSimple(
      "subcategory",
      state.subcategories.find(
        (item) => item._id === $(this).data("edit-subcategory"),
      ),
    );
  });
  $(document).on("click", "[data-edit-banner]", function () {
    openSimple(
      "banner",
      state.banners.find((item) => item._id === $(this).data("edit-banner")),
    );
  });
  $(document).on("click", "[data-edit-offer]", function () {
    openSimple(
      "offer",
      state.offers.find((item) => item._id === $(this).data("edit-offer")),
    );
  });

  $(document).on("click", "[data-delete-product]", async function () {
    const id = $(this).data("delete-product");
    if (!confirmDelete("product")) return;
    try {
      await request(`/products/${id}`, { method: "DELETE" });
      showAlert("Product deleted.");
      loadProducts();
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });

  $(document).on("click", "[data-delete-resource]", async function () {
    const [resource, id, label] = String($(this).data("delete-resource")).split(
      ":",
    );
    if (!confirmDelete(label)) return;
    try {
      await request(`/${resource}/${id}`, { method: "DELETE" });
      showAlert(`${label.charAt(0).toUpperCase() + label.slice(1)} deleted.`);
      loaders[resource]();
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });

  $(document).on("click", "[data-toggle-user]", async function () {
    const id = $(this).data("toggle-user");
    const user = state.users.find((item) => item._id === id);
    try {
      const data = new FormData();
      data.set("status", user.status === false ? "true" : "false");
      await formRequest(`/users/${id}`, "PUT", data);
      showAlert("User status updated.");
      loadUsers();
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });

  $(document).on("change", ".order-status", async function () {
    try {
      await jsonRequest(`/orders/${$(this).data("order-id")}`, "PUT", {
        orderStatus: this.value,
      });
      showAlert("Order status updated.");
      loadOrders();
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });

  $(document).on("click", "[data-approve-review]", async function () {
    const id = $(this).data("approve-review");
    const review = state.reviews.find((item) => item._id === id);
    try {
      const data = new FormData();
      data.set("approved", review.approved ? "false" : "true");
      await formRequest(`/reviews/${id}`, "PUT", data);
      showAlert("Review updated.");
      loadReviews();
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });

  $("#settingsForm").on("submit", async function (event) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await jsonRequest("/settings", "PUT", {
        storeName: form.storeName.value,
        contactNumber: form.contactNumber.value,
        email: form.email.value,
        address: form.address.value,
        footerContent: form.footerContent.value,
        aboutUsContent: form.aboutUsContent.value,
        socialLinks: {
          facebook: form.facebook.value,
          instagram: form.instagram.value,
          x: form.x.value,
          linkedin: form.linkedin.value,
        },
      });
      showAlert("Settings saved.");
    } catch (xhr) {
      handleAjaxError(xhr);
    }
  });
}

$(function () {
  if (page === "login" && token()) {
    window.location.href = "/admin/dashboard.html";
    return;
  }
  if (!protectPage()) return;
  bindEvents();
  if (loaders[page]) loaders[page]();
});
