const API_BASE = (
  window.RRRIVO_API_BASE ||
  document.querySelector("meta[name='api-base']")?.content ||
  `${window.location.origin}/api`
).replace(/\/$/, "");
const API_ORIGIN = new URL(API_BASE, window.location.origin).origin;
const fallbackImages = [
  "images/image4.jpeg",
  "images/image5.jpeg",
  "images/image6.jpeg",
  "images/image7.jpeg",
  "images/iamge2.jpeg",
  "images/image3.jpeg",
];

const store = {
  products: [],
  categories: [],
  subcategories: [],
  banners: [],
  reviews: [],
  settings: null,
};

let selectedOrderProduct = null;
let whatsappNumber = "919636984162";

const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const productGrid = document.querySelector("#productGrid");
const categoryFilter = document.querySelector("#categoryFilter");
const subcategoryFilter = document.querySelector("#subcategoryFilter");
const categoryDropdowns = document.querySelector("#categoryDropdowns");
const featuredStrip = document.querySelector(".featured-strip");
const categoryGrid = document.querySelector(".category-grid");
const reviewGrid = document.querySelector(".review-grid");

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return whatsappNumber;
  return digits.startsWith("91") ? digits : `91${digits}`;
}

function idOf(value) {
  return typeof value === "object" && value ? value._id : value || "";
}

function nameOf(value, fallback = "") {
  return typeof value === "object" && value
    ? value.name || value.title || fallback
    : fallback;
}

function categoryName(product) {
  return nameOf(product.category, "Uncategorized");
}

function subcategoryName(product) {
  return nameOf(product.subcategory, "");
}

function fallbackImage(index = 0) {
  return fallbackImages[index % fallbackImages.length];
}

function imageUrl(src, fallback = fallbackImage()) {
  const value = String(src || "").trim();
  if (!value) return fallback;

  if (value.startsWith("/uploads/") || value.startsWith("uploads/")) {
    return new URL(value.replace(/^\/?/, "/"), API_ORIGIN).href;
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {}

  return new URL(value, window.location.href).href;
}

function productImage(product, index = 0) {
  const img =
    product.image ||
    product.gallery?.[0] ||
    product.category?.image;
  return imageUrl(img, fallbackImage(index));
}

function imageError(index = 0) {
  return `this.onerror=null;this.src='${escapeHtml(fallbackImage(index))}';`;
}

function api(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "API request failed");
    }
    return response.json();
  });
}

function option(label, value) {
  const element = document.createElement("option");
  element.textContent = label;
  element.value = value;
  return element;
}

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navMenu.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

let heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
const heroPrev = document.querySelector(".hero-prev");
const heroNext = document.querySelector(".hero-next");
let heroSlideIndex = 0;
let heroSlideTimer = null;

function showHeroSlide(index) {
  if (!heroSlides.length) return;
  heroSlideIndex = (index + heroSlides.length) % heroSlides.length;
  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === heroSlideIndex);
  });
}

function restartHeroSlider() {
  window.clearInterval(heroSlideTimer);
  heroSlideTimer = window.setInterval(
    () => showHeroSlide(heroSlideIndex + 1),
    4500,
  );
}

function setupHeroSlider() {
  if (!heroSlides.length) return;

  heroSlides.forEach((slide, index) => {
    slide.addEventListener(
      "error",
      () => {
        slide.src = fallbackImage(index);
      },
      { once: true },
    );
  });

  heroPrev?.addEventListener("click", () => {
    showHeroSlide(heroSlideIndex - 1);
    restartHeroSlider();
  });

  heroNext?.addEventListener("click", () => {
    showHeroSlide(heroSlideIndex + 1);
    restartHeroSlider();
  });

  restartHeroSlider();
  showHeroSlide(0);
}

function renderHeroBanners() {
  const activeBanners = store.banners.filter(
    (banner) => banner.active !== false && banner.image,
  );
  const slider = document.querySelector(".hero-slider");
  if (!slider || !activeBanners.length) return;

  slider.innerHTML = activeBanners
    .map(
      (banner, index) => `
      <img
        class="hero-slide ${index === 0 ? "active" : ""}"
        src="${escapeHtml(imageUrl(banner.image, fallbackImage(index)))}"
        alt=""
        data-title="${escapeHtml(banner.title)}"
        onerror="${imageError(index)}"
      />
    `,
    )
    .join("");

  const firstBanner = activeBanners[0];
  const heroTitle = document.querySelector("#hero-title");
  const heroCopy = document.querySelector(".hero-content p");
  const heroButton = document.querySelector(".hero-actions .btn");

  if (heroTitle && firstBanner.title) heroTitle.textContent = firstBanner.title;
  if (heroCopy && firstBanner.subtitle)
    heroCopy.textContent = firstBanner.subtitle;
  if (heroButton) {
    heroButton.textContent = firstBanner.buttonText || "Shop Products";
    heroButton.setAttribute("href", firstBanner.buttonLink || "#products");
  }

  heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
  showHeroSlide(0);
}

function updateSubcategoryOptions() {
  if (!categoryFilter || !subcategoryFilter) return;

  const selectedCategory = categoryFilter.value;
  subcategoryFilter.innerHTML = "";
  subcategoryFilter.appendChild(option("All Subcategories", "all"));

  const matchingSubcategories = store.subcategories.filter((subcategory) => {
    return (
      selectedCategory === "all" ||
      idOf(subcategory.categoryId) === selectedCategory
    );
  });

  matchingSubcategories.forEach((subcategory) => {
    subcategoryFilter.appendChild(option(subcategory.name, subcategory._id));
  });
}

function setupFilters() {
  if (!categoryFilter || !subcategoryFilter || !categoryDropdowns) return;

  categoryFilter.innerHTML = "";
  subcategoryFilter.innerHTML = "";
  categoryDropdowns.innerHTML = "";

  categoryFilter.appendChild(option("All Categories", "all"));
  store.categories.forEach((category) => {
    if (category.status === false) return;
    categoryFilter.appendChild(option(category.name, category._id));

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    const list = document.createElement("div");
    const subcategories = store.subcategories.filter(
      (item) => idOf(item.categoryId) === category._id && item.status !== false,
    );

    summary.textContent = category.name;
    list.className = "subcategory-list";

    if (subcategories.length) {
      subcategories.forEach((subcategory) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = subcategory.name;
        button.addEventListener("click", () => {
          categoryFilter.value = category._id;
          updateSubcategoryOptions();
          subcategoryFilter.value = subcategory._id;
          renderProducts();
          document
            .querySelector("#products")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        list.appendChild(button);
      });
    } else {
      const empty = document.createElement("p");
      empty.className = "empty-state mini";
      empty.textContent = "No subcategories added yet.";
      list.appendChild(empty);
    }

    details.append(summary, list);
    categoryDropdowns.appendChild(details);
  });

  if (!store.categories.length) {
    categoryDropdowns.innerHTML = `<p class="empty-state">No categories added from admin yet.</p>`;
  }

  updateSubcategoryOptions();
  categoryFilter.addEventListener("change", () => {
    updateSubcategoryOptions();
    renderProducts();
  });
  subcategoryFilter.addEventListener("change", renderProducts);
}

function productMatchesFilters(product) {
  const selectedCategory = categoryFilter?.value || "all";
  const selectedSubcategory = subcategoryFilter?.value || "all";
  const productCategoryId = idOf(product.category);
  const productSubcategoryId = idOf(product.subcategory);

  const matchesCategory =
    selectedCategory === "all" || productCategoryId === selectedCategory;
  const matchesSubcategory =
    selectedSubcategory === "all" ||
    productSubcategoryId === selectedSubcategory;
  return matchesCategory && matchesSubcategory && product.status !== false;
}

function renderProducts() {
  if (!productGrid) return;

  const filtered = store.products.filter(productMatchesFilters);
  if (!filtered.length) {
    productGrid.innerHTML = `<p class="empty-state">No products available from admin for this selection.</p>`;
    return;
  }

  productGrid.innerHTML = filtered
    .map(
      (product, index) => `
      <article class="product-card">
        <img src="${escapeHtml(productImage(product, index))}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="${imageError(index)}">
        <div class="product-body">
          <div class="product-meta">
            <span>${escapeHtml(categoryName(product))}</span>
            <span class="rating">★ ${Number(product.rating || 0).toFixed(1)}</span>
          </div>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-description">${escapeHtml(product.description || "Fresh product available for order.")}</p>
          <div class="product-actions">
            <button class="btn primary" type="button" data-action="buy" data-product-id="${product._id}">Buy Now</button>
          </div>
        </div>
      </article>
    `,
    )
    .join("");
}

function renderFeaturedProducts() {
  if (!featuredStrip) return;

  const featured = store.products
    .filter((product) => product.featured && product.status !== false)
    .slice(0, 3);
  const products = featured.length
    ? featured
    : store.products.filter((product) => product.status !== false).slice(0, 3);

  if (!products.length) {
    featuredStrip.innerHTML = `<p class="empty-state">No featured products added from admin yet.</p>`;
    return;
  }

  featuredStrip.innerHTML = products
    .map(
      (product, index) => `
      <article class="feature-card">
        <img src="${escapeHtml(productImage(product, index))}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="${imageError(index)}">
        <div>
          <span>${product.featured ? "Featured" : "Available"}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description || `${categoryName(product)} product available now.`)}</p>
        </div>
      </article>
    `,
    )
    .join("");
}

function renderCategories() {
  if (!categoryGrid) return;

  const categories = store.categories.filter(
    (category) => category.status !== false,
  );
  if (!categories.length) {
    categoryGrid.innerHTML = `<p class="empty-state">No categories added from admin yet.</p>`;
    return;
  }

  categoryGrid.innerHTML = categories
    .map((category, index) => {
      const count = store.products.filter(
        (product) =>
          idOf(product.category) === category._id && product.status !== false,
      ).length;
      return `
        <article>
          <span>${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(category.name)}</h3>
          <p>${count} product${count === 1 ? "" : "s"} available.</p>
        </article>
      `;
    })
    .join("");
}

function renderReviews() {
  if (!reviewGrid) return;

  const approvedReviews = store.reviews
    .filter((review) => review.approved)
    .slice(0, 3);
  if (!approvedReviews.length) {
    reviewGrid.innerHTML = `<p class="empty-state">No approved customer reviews yet.</p>`;
    return;
  }

  reviewGrid.innerHTML = approvedReviews
    .map((review) => {
      const rating = Math.max(1, Math.min(5, Number(review.rating || 5)));
      return `
        <article>
          <div class="stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</div>
          <p>"${escapeHtml(review.review)}"</p>
          <strong>${escapeHtml(nameOf(review.userId, "Customer"))}</strong>
        </article>
      `;
    })
    .join("");
}

function updateSettings() {
  const settings = store.settings;
  if (!settings) return;

  const contactPoints = document.querySelectorAll(".contact-points p");
  const footerColumns = document.querySelectorAll(".footer-grid > div");

  whatsappNumber = normalizePhone(settings.contactNumber);

  const heroAbout = document.querySelector("#about-title + p");
  if (heroAbout && settings.aboutUsContent)
    heroAbout.textContent = settings.aboutUsContent;

  if (contactPoints[0] && settings.address)
    contactPoints[0].textContent = settings.address;
  if (contactPoints[1] && settings.contactNumber)
    contactPoints[1].textContent = settings.contactNumber;
  if (contactPoints[2]) contactPoints[2].textContent = settings.email || "";

  const footerIntro = footerColumns[0]?.querySelector("p");
  if (footerIntro && settings.footerContent)
    footerIntro.textContent = settings.footerContent;

  const footerContact = footerColumns[2]?.querySelectorAll("p");
  if (footerContact?.[0] && settings.contactNumber)
    footerContact[0].textContent = settings.contactNumber;
  if (footerContact?.[1]) footerContact[1].textContent = settings.email || "";
  if (footerContact?.[2] && settings.address)
    footerContact[2].textContent = settings.address;

  const socials = document.querySelectorAll(".social-links a");
  const socialLinks = settings.socialLinks || {};
  [
    socialLinks.facebook,
    socialLinks.instagram,
    socialLinks.x,
    socialLinks.linkedin,
  ].forEach((href, index) => {
    if (socials[index] && href) socials[index].href = href;
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(
    () => toast.classList.remove("show"),
    2600,
  );
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='buy']");
  if (!button) return;

  const product = store.products.find(
    (item) => item._id === button.dataset.productId,
  );
  if (product) openOrderModal(product);
});

const processCards = document.querySelectorAll(".process-gallery article");

processCards.forEach((card) => {
  card.addEventListener("click", () => {
    processCards.forEach((item) => {
      if (item !== card) item.classList.remove("show-process-gallery");
    });
    card.classList.toggle("show-process-gallery");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    processCards.forEach((card) =>
      card.classList.remove("show-process-gallery"),
    );
    closeOrderModal();
  }
});

function ensureOrderModal() {
  let modal = document.querySelector("#orderModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.className = "order-modal";
  modal.id = "orderModal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="order-dialog" role="dialog" aria-modal="true" aria-labelledby="orderTitle">
      <button class="order-close" type="button" aria-label="Close order form">×</button>
      <span class="eyebrow">Quick checkout</span>
      <h2 id="orderTitle">Buy Now</h2>
      <p class="order-product" id="orderProductName"></p>
      <form id="orderForm" class="order-form">
        <label for="orderName">Full Name</label>
        <input id="orderName" type="text" placeholder="Your name" required>
        <label for="orderPhone">WhatsApp Number</label>
        <input id="orderPhone" type="tel" placeholder="+91 98765 43210" required>
        <label for="orderAddress">Delivery Address</label>
        <textarea id="orderAddress" rows="3" placeholder="House no, area, city" required></textarea>
        <label for="orderQuantity">Quantity</label>
        <input id="orderQuantity" type="number" min="1" value="1" required>
        <button class="btn primary" type="submit">Place Order</button>
      </form>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest(".order-close"))
      closeOrderModal();
  });

  modal.querySelector("#orderForm").addEventListener("submit", submitOrder);
  return modal;
}

function openOrderModal(product) {
  selectedOrderProduct = product;
  const modal = ensureOrderModal();
  modal.querySelector("#orderProductName").textContent = `${product.name}`;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  modal.querySelector("#orderName").focus();
}

function closeOrderModal() {
  const modal = document.querySelector("#orderModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

async function submitOrder(event) {
  event.preventDefault();
  if (!selectedOrderProduct) return;

  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const quantity = Math.max(
    1,
    Number(form.querySelector("#orderQuantity").value || 1),
  );
  const customer = {
    name: form.querySelector("#orderName").value.trim(),
    mobile: form.querySelector("#orderPhone").value.trim(),
    address: form.querySelector("#orderAddress").value.trim(),
  };

  const orderPayload = {
    customer,
    products: [
      {
        productId: selectedOrderProduct._id,
        name: selectedOrderProduct.name,
        quantity,
      },
    ],
    totalAmount: 0,
  };

  try {
    button.disabled = true;
    button.textContent = "Placing Order...";
    const order = await api("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    closeOrderModal();
    form.reset();
    showToast("Order placed successfully. Admin panel me order aa gaya hai.");

    const whatsappMessage = [
      "New product order from website:",
      `Order ID: ${order._id}`,
      `Product: ${selectedOrderProduct.name}`,
      `Category: ${categoryName(selectedOrderProduct)}`,
      `Quantity: ${quantity}`,
      `Total: ${money.format(orderPayload.totalAmount)}`,
      `Customer Name: ${customer.name}`,
      `Customer WhatsApp: ${customer.mobile}`,
      `Delivery Address: ${customer.address}`,
    ].join("\n");

    if (
      window.confirm(
        "Order backend me save ho gaya. WhatsApp par bhi message bhejna hai?",
      )
    ) {
      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    }
  } catch (error) {
    showToast(error.message || "Order place nahi ho paya. Please try again.");
  } finally {
    button.disabled = false;
    button.textContent = "Place Order";
  }
}

document.querySelectorAll("form").forEach((form) => {
  if (form.id === "orderForm") return;

  form.addEventListener("submit", (event) => {
    if (form.id === "contactForm") {
      event.preventDefault();
      const name = document.querySelector("#name")?.value.trim() || "Customer";
      const email =
        document.querySelector("#email")?.value.trim() || "Not provided";
      const phone =
        document.querySelector("#phone")?.value.trim() || "Not provided";
      const message =
        document.querySelector("#message")?.value.trim() ||
        "I want to know more about RRRIVO Global Trade.";
      const whatsappMessage = [
        "New contact request from website:",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Message: ${message}`,
      ].join("\n");

      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
      return;
    }

    event.preventDefault();
    showToast("Thank you. We will get back to you soon.");
    form.reset();
  });
});

const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 },
      )
    : null;

document.querySelectorAll(".reveal").forEach((element) => {
  if (observer) {
    observer.observe(element);
  } else {
    element.classList.add("visible");
  }
});

async function loadStorefrontData() {
  if (productGrid)
    productGrid.innerHTML = `<p class="empty-state">Loading products from admin...</p>`;

  try {
    const [products, categories, subcategories, banners, reviews, settings] =
      await Promise.all([
        api("/products"),
        api("/categories"),
        api("/subcategories"),
        api("/banners"),
        api("/reviews"),
        api("/settings"),
      ]);

    store.products = Array.isArray(products) ? products : [];
    store.categories = Array.isArray(categories) ? categories : [];
    store.subcategories = Array.isArray(subcategories) ? subcategories : [];
    store.banners = Array.isArray(banners) ? banners : [];
    store.reviews = Array.isArray(reviews) ? reviews : [];
    store.settings = settings || null;

    renderHeroBanners();
    setupFilters();
    renderFeaturedProducts();
    renderCategories();
    renderReviews();
    renderProducts();
    updateSettings();
  } catch (error) {
    if (productGrid) {
      productGrid.innerHTML = `<p class="empty-state">Products load nahi ho paye. Backend API check karein.</p>`;
    }
    showToast(error.message || "Backend API se data load nahi ho paya.");
  }
}

setupHeroSlider();
loadStorefrontData();
