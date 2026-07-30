const pageConfig = {
  requiredError: "Ju lutem plotësoni fushat e detyrueshme.",
  sendingMessage: "Duke dërguar kërkesën…",
  sentMessage: "Faleminderit! Kërkesa u dërgua me sukses.",
  sendError: "Kërkesa nuk u dërgua. Ju lutem provoni përsëri ose na shkruani në info@klosuja.com."
};

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const filterButtons = document.querySelectorAll(".filter-btn");
const contactForm = document.getElementById("contactForm");
const formStatus = document.querySelector(".form-status");
let revealObserver;

function observeReveals() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(element => element.classList.add("visible"));
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
  document.querySelectorAll(".reveal:not(.visible)").forEach(element => revealObserver.observe(element));
}

if (header) {
  const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 30);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
  mainNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    const filter = button.dataset.filter;
    document.querySelectorAll(".material-card").forEach(card => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

const requestedMaterial = new URLSearchParams(window.location.search).get("material");
if (requestedMaterial) {
  const select = document.querySelector('select[name="material"]');
  if (select && Array.from(select.options).some(option => option.value === requestedMaterial)) {
    select.value = requestedMaterial;
  }
}

if (contactForm && formStatus) {
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
observeReveals();
