
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
    description: "Mermer klasik me tonalitet të bardhë-gri dhe damarë të butë. Përshtatet mirë me interiere minimaliste dhe elegante.",
    specs: [["Përdorim", "Interier"], ["Pamje", "E çelët"], ["Mirëmbajtje", "Periodike"]]
  },
  "Calacatta Gold": {
    description: "Material premium me damarë të theksuar dhe nuanca të ngrohta. Ideal për zona fokale dhe ambiente përfaqësuese.",
    specs: [["Përdorim", "Interier"], ["Pamje", "Luksoze"], ["Mirëmbajtje", "E kujdesshme"]]
  },
  "Nero Marquina": {
    description: "Mermer i zi me kontrast të fortë të damarëve të bardhë. Jep identitet të fuqishëm vizual në çdo ambient.",
    specs: [["Përdorim", "Dekorativ"], ["Pamje", "Kontrast"], ["Mirëmbajtje", "Periodike"]]
  },
  "Black Galaxy": {
    description: "Granit me bazë të errët dhe pika metalike. Rezistent dhe i përshtatshëm për sipërfaqe që përdoren shpesh.",
    specs: [["Përdorim", "Brenda/Jashtë"], ["Rezistencë", "E lartë"], ["Mirëmbajtje", "E lehtë"]]
  },
  "Bianco Sardo": {
    description: "Granit me strukturë të imët dhe kombinim neutral ngjyrash. Zgjedhje praktike për shumë lloje projektesh.",
    specs: [["Përdorim", "Universal"], ["Rezistencë", "E lartë"], ["Mirëmbajtje", "E lehtë"]]
  },
  "Tan Brown": {
    description: "Granit me tonalitete të ngrohta kafe dhe të zeza. Kombinohet mirë me dru, metal dhe mobilim klasik.",
    specs: [["Përdorim", "Brenda/Jashtë"], ["Pamje", "E ngrohtë"], ["Rezistencë", "E lartë"]]
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
    ? "Granit"
    : "Mermer";
  modal.close();
});

contactForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(contactForm);
  const name = data.get("name").trim();
  const phone = data.get("phone").trim();
  const message = data.get("message").trim();

  if (!name || !phone || !message) {
    formStatus.textContent = "Ju lutem plotësoni fushat e detyrueshme.";
    return;
  }

  formStatus.textContent = "Faleminderit! Kërkesa u regjistrua në versionin demonstrues.";
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
