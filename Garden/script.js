const categories = {
  "Vegetables": ["Potato", "Onion", "Tomato", "Cabbage", "Cauliflower", "Brinjal", "Okra (Bhindi)", "Peas", "Carrot", "Cucumber"],
  "Fruits": ["Mango", "Banana", "Apple", "Orange", "Grapes", "Guava", "Pomegranate", "Pineapple", "Watermelon"],
  "Spices": ["Turmeric (Haldi)", "Coriander (Dhaniya)", "Cumin (Jeera)", "Red Chilli", "Black Pepper", "Ginger", "Garlic", "Fenugreek (Methi)"],
  "Food Grains (Anaj)": ["Rice (Chawal)", "Wheat (Gehu)", "Maize (Makka)", "Jowar", "Bajra"],
  "Oil Seeds": ["Mustard", "Groundnut (Moongfali)", "Sesame (Til)"],
  "Pulses (Dal)": ["Gram / Chana", "Arhar / Toor", "Moong", "Urad", "Masoor"]
};

const productPhotoPages = {
  "Potato": "Potato",
  "Onion": "Onion",
  "Tomato": "Tomato",
  "Cabbage": "Cabbage",
  "Cauliflower": "Cauliflower",
  "Brinjal": "Eggplant",
  "Okra (Bhindi)": "Okra",
  "Peas": "Pea",
  "Carrot": "Carrot",
  "Cucumber": "Cucumber",
  "Mango": "Mango",
  "Banana": "Banana",
  "Apple": "Apple",
  "Orange": "Orange (fruit)",
  "Grapes": "Grape",
  "Guava": "Guava",
  "Pomegranate": "Pomegranate",
  "Pineapple": "Pineapple",
  "Watermelon": "Watermelon",
  "Turmeric (Haldi)": "Turmeric",
  "Coriander (Dhaniya)": "Coriander",
  "Cumin (Jeera)": "Cumin",
  "Red Chilli": "Chili pepper",
  "Black Pepper": "Black pepper",
  "Ginger": "Ginger",
  "Garlic": "Garlic",
  "Fenugreek (Methi)": "Fenugreek",
  "Rice (Chawal)": "Rice",
  "Wheat (Gehu)": "Wheat",
  "Maize (Makka)": "Maize",
  "Jowar": "Sorghum",
  "Bajra": "Pearl millet",
  "Mustard": "Mustard plant",
  "Groundnut (Moongfali)": "Peanut",
  "Sesame (Til)": "Sesame",
  "Gram / Chana": "Chickpea",
  "Arhar / Toor": "Pigeon pea",
  "Moong": "Mung bean",
  "Urad": "Vigna mungo",
  "Masoor": "Lentil"
};

const categoryFallbackPhotos = {
  "Vegetables": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80",
  "Fruits": "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=900&q=80",
  "Spices": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=80",
  "Food Grains (Anaj)": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80",
  "Oil Seeds": "https://images.unsplash.com/photo-1567892737950-30c4db37cd89?auto=format&fit=crop&w=900&q=80",
  "Pulses (Dal)": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=900&q=80"
};

const imageCache = new Map();

async function productImageUrl(name, category) {
  const pageTitle = productPhotoPages[name] || name;
  const cacheKey = `${name}:${category}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const fallback = categoryFallbackPhotos[category] || categoryFallbackPhotos.Vegetables;

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=900&titles=${encodeURIComponent(pageTitle)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Image lookup failed");

    const data = await response.json();
    const page = Object.values(data.query.pages)[0];
    const image = page?.thumbnail?.source || fallback;
    imageCache.set(cacheKey, image);
    return image;
  } catch {
    imageCache.set(cacheKey, fallback);
    return fallback;
  }
}

const priceByCategory = {
  "Vegetables": [28, 76],
  "Fruits": [60, 220],
  "Spices": [95, 360],
  "Food Grains (Anaj)": [45, 120],
  "Oil Seeds": [90, 180],
  "Pulses (Dal)": [80, 165]
};

const products = Object.entries(categories).flatMap(([category, names]) => {
  const range = priceByCategory[category];
  return names.map((name, index) => {
    const price = range[0] + ((index * 17 + category.length * 3) % (range[1] - range[0]));
    const unit = category === "Spices" || category === "Oil Seeds" || category === "Pulses (Dal)" ? "500g" : "kg";
    return {
      name,
      category,
      subcategory: name,
      price: `Rs. ${price} / ${unit}`,
      rating: (4.4 + ((index % 6) * 0.1)).toFixed(1),
      image: categoryFallbackPhotos[category] || categoryFallbackPhotos.Vegetables
    };
  });
});

const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");

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

const productGrid = document.querySelector("#productGrid");
const categoryFilter = document.querySelector("#categoryFilter");
const subcategoryFilter = document.querySelector("#subcategoryFilter");
const categoryDropdowns = document.querySelector("#categoryDropdowns");

function option(label, value) {
  const element = document.createElement("option");
  element.textContent = label;
  element.value = value;
  return element;
}

function setupFilters() {
  if (!categoryFilter || !subcategoryFilter || !categoryDropdowns) return;

  Object.keys(categories).forEach((category) => {
    categoryFilter.appendChild(option(category, category));

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = category;
    const list = document.createElement("div");
    list.className = "subcategory-list";

    categories[category].forEach((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.addEventListener("click", () => {
        categoryFilter.value = category;
        updateSubcategoryOptions();
        subcategoryFilter.value = name;
        renderProducts();
        document.querySelector("#products")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      list.appendChild(button);
    });

    details.append(summary, list);
    categoryDropdowns.appendChild(details);
  });

  updateSubcategoryOptions();
  categoryFilter.addEventListener("change", () => {
    updateSubcategoryOptions();
    renderProducts();
  });
  subcategoryFilter.addEventListener("change", renderProducts);
}

function updateSubcategoryOptions() {
  if (!categoryFilter || !subcategoryFilter) return;

  const selectedCategory = categoryFilter.value;
  subcategoryFilter.innerHTML = "";
  subcategoryFilter.appendChild(option("All Subcategories", "all"));

  const names = selectedCategory === "all"
    ? Object.values(categories).flat()
    : categories[selectedCategory];

  names.forEach((name) => subcategoryFilter.appendChild(option(name, name)));
}

async function renderProducts() {
  if (!productGrid) return;

  const selectedCategory = categoryFilter?.value || "all";
  const selectedSubcategory = subcategoryFilter?.value || "all";

  const filtered = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === "all" || product.subcategory === selectedSubcategory;
    return matchesCategory && matchesSubcategory;
  });

  productGrid.innerHTML = `<p class="empty-state">Loading real product photos...</p>`;

  const productsWithImages = await Promise.all(filtered.map(async (product) => ({
    ...product,
    image: await productImageUrl(product.name, product.category)
  })));

  productGrid.innerHTML = productsWithImages.map((product) => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <div class="product-body">
        <div class="product-meta">
          <span>${product.category}</span>
          <span class="rating">★ ${product.rating}</span>
        </div>
        <h3>${product.name}</h3>
        <p class="price">${product.price}</p>
        <div class="product-actions">
          <button class="btn primary" type="button" data-action="buy" data-product="${product.name}">Buy Now</button>
        </div>
      </div>
    </article>
  `).join("");

  if (!productsWithImages.length) {
    productGrid.innerHTML = `<p class="empty-state">No products matched this filter. Try another category.</p>`;
  }
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
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const product = products.find((item) => item.name === button.dataset.product);
  if (product) {
    openOrderModal(product);
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
        <input id="orderQuantity" type="text" placeholder="Example: 2 kg" required>
        <button class="btn primary" type="submit">Send Order on WhatsApp</button>
      </form>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest(".order-close")) {
      closeOrderModal();
    }
  });

  modal.querySelector("#orderForm").addEventListener("submit", (event) => {
    event.preventDefault();
    sendOrderToWhatsApp();
  });

  return modal;
}

let selectedOrderProduct = null;

function openOrderModal(product) {
  selectedOrderProduct = product;
  const modal = ensureOrderModal();
  modal.querySelector("#orderProductName").textContent = `${product.name} - ${product.price}`;
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

function sendOrderToWhatsApp() {
  if (!selectedOrderProduct) return;

  const name = document.querySelector("#orderName")?.value.trim() || "Customer";
  const phone = document.querySelector("#orderPhone")?.value.trim() || "Not provided";
  const address = document.querySelector("#orderAddress")?.value.trim() || "Not provided";
  const quantity = document.querySelector("#orderQuantity")?.value.trim() || "Not provided";
  const whatsappMessage = [
    "New product order from website:",
    `Product: ${selectedOrderProduct.name}`,
    `Category: ${selectedOrderProduct.category}`,
    `Price: ${selectedOrderProduct.price}`,
    `Quantity: ${quantity}`,
    `Customer Name: ${name}`,
    `Customer WhatsApp: ${phone}`,
    `Delivery Address: ${address}`
  ].join("\n");

  window.location.href = `https://wa.me/919636984162?text=${encodeURIComponent(whatsappMessage)}`;
}

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (form.id === "contactForm") {
      const name = document.querySelector("#name")?.value.trim() || "Customer";
      const email = document.querySelector("#email")?.value.trim() || "Not provided";
      const phone = document.querySelector("#phone")?.value.trim() || "Not provided";
      const message = document.querySelector("#message")?.value.trim() || "I want to know more about RRRIVO Global Trade.";
      const whatsappMessage = [
        "New contact request from website:",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Message: ${message}`
      ].join("\n");

      window.location.href = `https://wa.me/919636984162?text=${encodeURIComponent(whatsappMessage)}`;
      return;
    }

    showToast("Thank you. We will get back to you soon.");
    form.reset();
  });
});

const observer = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 })
  : null;

document.querySelectorAll(".reveal").forEach((element) => {
  if (observer) {
    observer.observe(element);
  } else {
    element.classList.add("visible");
  }
});

setupFilters();
renderProducts();
