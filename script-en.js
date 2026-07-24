const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const filterButtons = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".material-card");
const modal = document.getElementById("materialModal");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const modalSpecs = document.getElementById("modalSpecs");
const modalContact = document.getElementById("modalContact");
const closeModal = document.querySelector(".modal-close");
const contactForm = document.getElementById("contactForm");
const formStatus = document.querySelector(".form-status");

const materialData = {
  "Carrara White": {
    description: "Classic marble with a white-grey tone and soft veining. It works beautifully in minimalist and elegant interiors.",
    specs: [["Application", "Interior"], ["Appearance", "Light"], ["Maintenance", "Periodic"]]
  },
  "Calacatta Gold": {
    description: "A premium material with bold veining and warm undertones. Ideal for focal areas and statement interiors.",
    specs: [["Application", "Interior"], ["Appearance", "Luxurious"], ["Maintenance", "Careful"]]
  },
  "Nero Marquina": {
    description: "Black marble with a strong contrast of white veining. It creates a powerful visual identity in any space.",
    specs: [["Application", "Decorative"], ["Appearance", "High contrast"], ["Maintenance", "Periodic"]]
  },
  "Black Galaxy": {
    description: "Dark granite with metallic speckles. Durable and suitable for surfaces that are used frequently.",
    specs: [["Application", "Indoor/Outdoor"], ["Durability", "High"], ["Maintenance", "Easy"]]
  },
  "Bianco Sardo": {
    description: "Fine-grained granite with a neutral colour combination. A practical choice for many types of projects.",
    specs: [["Application", "Universal"], ["Durability", "High"], ["Maintenance", "Easy"]]
  },
  "Tan Brown": {
    description: "Granite with warm brown and black tones. It combines well with wood, metal and classic furniture.",
    specs: [["Application", "Indoor/Outdoor"], ["Appearance", "Warm"], ["Durability", "High"]]
  }
};

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
    cards.forEach(card => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

document.querySelectorAll(".card-open").forEach(button => {
  button.addEventListener("click", () => {
    const name = button.dataset.material;
    const data = materialData[name];
    modalTitle.textContent = name;
    modalDescription.textContent = data.description;
    modalSpecs.innerHTML = data.specs.map(([label, value]) => `
      <div><span>${label}</span><strong>${value}</strong></div>
    `).join("");
    modalContact.dataset.material = name;
    modal.showModal();
  });
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
  const selected = modalContact.dataset.material;
  const select = document.querySelector('select[name="material"]');
  select.value = selected.includes("Galaxy") || selected.includes("Sardo") || selected.includes("Brown")
    ? "Granite"
    : "Marble";
  modal.close();
});

contactForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const name = data.get("name").trim();
  const phone = data.get("phone").trim();
  const message = data.get("message").trim();

  if (!name || !phone || !message) {
    formStatus.textContent = "Please complete all required fields.";
    return;
  }

  formStatus.textContent = "Thank you! Your request has been recorded in the demonstration version.";
  contactForm.reset();
});

document.getElementById("year").textContent = new Date().getFullYear();

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
