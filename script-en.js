const pageConfig = {"dataFile": "materials-en.json", "loadError": "The materials could not be loaded. Please refresh the page.", "requiredError": "Please complete all required fields.", "sendingMessage": "Sending your enquiry…", "sentMessage": "Thank you! Your enquiry was sent successfully.", "sendError": "Your enquiry could not be sent. Please try again or email info@klosuja.com.", "marbleSelect": "Marble", "graniteSelect": "Granite", "fallbackDetails": "View details →"};

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const filterButtons = document.querySelectorAll(".filter-btn");
const materialsGrid = document.getElementById("materialsGrid");
const modal = document.getElementById("materialModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalSpecs = document.getElementById("modalSpecs");
const modalContact = document.getElementById("modalContact");
const closeModal = document.querySelector(".modal-close");
const contactForm = document.getElementById("contactForm");
const formStatus = document.querySelector(".form-status");

let materialsById = new Map();
let revealObserver;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = text;
  return element;
}

function createMaterialCard(material) {
  const article = createElement("article", "material-card reveal");
  article.dataset.category = material.category;

  const button = createElement("button", "card-open");
  button.type = "button";
  button.dataset.materialId = material.id;
  button.setAttribute("aria-label", `${material.name}`);

  const image = createElement("img");
  image.src = material.image;
  image.alt = material.image_alt || material.name;
  image.loading = "lazy";

  const body = createElement("div", "card-body");
  const meta = createElement("div", "card-meta");
  meta.appendChild(createElement("span", "", material.category_label));

  if (material.tag) {
    meta.appendChild(createElement("span", "", material.tag));
  }

  body.appendChild(meta);
  body.appendChild(createElement("h3", "", material.name));
  body.appendChild(createElement("p", "", material.summary));
  body.appendChild(createElement("strong", "", material.details_label || pageConfig.fallbackDetails));

  button.appendChild(image);
  button.appendChild(body);
  article.appendChild(button);
  return article;
}

function observeReveals() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }

  document.querySelectorAll(".reveal:not(.visible)").forEach(el => revealObserver.observe(el));
}

async function loadMaterials() {
  try {
    const response = await fetch(pageConfig.dataFile, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const materials = (data.materials || [])
      .filter(material => material.active !== false)
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    materialsById = new Map(materials.map(material => [material.id, material]));
    materialsGrid.textContent = "";

    materials.forEach(material => {
      materialsGrid.appendChild(createMaterialCard(material));
    });

    observeReveals();
  } catch (error) {
    console.error(error);
    materialsGrid.textContent = "";
    materialsGrid.appendChild(createElement("p", "catalog-loading", pageConfig.loadError));
  }
}

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 30);
});

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", isOpen);
});

document.querySelectorAll(".main-nav a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;

    document.querySelectorAll(".material-card").forEach(card => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

materialsGrid.addEventListener("click", event => {
  const button = event.target.closest(".card-open");
  if (!button) return;

  const material = materialsById.get(button.dataset.materialId);
  if (!material) return;

  modalTitle.textContent = material.name;
  modalDescription.textContent = material.description || material.summary;
  modalSpecs.textContent = "";

  (material.specs || []).forEach(spec => {
    const item = createElement("div");
    item.appendChild(createElement("span", "", spec.label));
    item.appendChild(createElement("strong", "", spec.value));
    modalSpecs.appendChild(item);
  });

  modalContact.dataset.category = material.category;
  modal.showModal();
});

closeModal.addEventListener("click", () => modal.close());

modal.addEventListener("click", event => {
  const rect = modal.getBoundingClientRect();
  const clickedOutside =
    event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom;

  if (clickedOutside) modal.close();
});

modalContact.addEventListener("click", () => {
  const select = document.querySelector('select[name="material"]');
  select.value = modalContact.dataset.category === "granit"
    ? pageConfig.graniteSelect
    : pageConfig.marbleSelect;
  modal.close();
});

contactForm.addEventListener("submit", async event => {
  event.preventDefault();

  const data = new FormData(contactForm);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const message = String(data.get("message") || "").trim();
  const submitButton = contactForm.querySelector('button[type="submit"]');

  if (!name || !phone || !message) {
    formStatus.textContent = pageConfig.requiredError;
    return;
  }

  formStatus.textContent = pageConfig.sendingMessage;
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");

  try {
    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    formStatus.textContent = pageConfig.sentMessage;
    contactForm.reset();
  } catch (error) {
    console.error("Form submission failed:", error);
    formStatus.textContent = pageConfig.sendError;
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

observeReveals();
loadMaterials();
