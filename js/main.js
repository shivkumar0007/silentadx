// ===============================
// SilentADX - Main JS
// ===============================

// On page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("SilentADX website loaded 🚀");

  initSmoothScroll();
  initNavbarHighlight();
  initScrollAnimations();
  initNavIndicator();
  initTabFiltering();
});

// -------------------------------
// Smooth scroll for anchor links
// -------------------------------
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

// -------------------------------
// Active nav highlight
// -------------------------------
function initNavbarHighlight() {
  const links = document.querySelectorAll("nav a");
  links.forEach(link => {
    if (link.href === window.location.href) {
      link.classList.add("active");
    }
  });
}

// -------------------------------
// Simple scroll animation
// -------------------------------
function initScrollAnimations() {
  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      } else {
        entry.target.classList.remove("show"); // Optional: remove on exit
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => observer.observe(card));
}

// -------------------------------
// Nav indicator animation
// -------------------------------
function initNavIndicator() {
  const indicator = document.querySelector(".nav-indicator");
  const links = document.querySelectorAll("nav a");

  if (!indicator || links.length === 0) return; // Safety check

  function moveIndicator(el) {
    const rect = el.getBoundingClientRect();
    const navRect = el.parentElement.getBoundingClientRect();

    indicator.style.width = rect.width + "px";
    indicator.style.left = rect.left - navRect.left + "px";
  }

  // Detect current page
  const page = window.location.pathname.split("/").pop() || "index.html";

  links.forEach(link => {
    if (link.getAttribute("href") === page) {
      moveIndicator(link);
    }

    // Smooth move on hover (optional but sexy)
    link.addEventListener("mouseenter", () => moveIndicator(link));
  });
}

// -------------------------------
// Tab filtering for code library
// -------------------------------
function initTabFiltering() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const cards = document.querySelectorAll('.card');

  if (tabButtons.length === 0 || cards.length === 0) return; // Safety check

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      // Add active class to clicked button
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      const category = button.getAttribute('data-category');

      cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'block';
          // Use setTimeout to ensure display change before animation
          setTimeout(() => card.classList.add('show'), 10);
        } else {
          card.classList.remove('show');
          // Delay hiding to allow animation to finish
          setTimeout(() => card.style.display = 'none', 300);
        }
      });
    });
  });

  // Initial load: show all cards
  cards.forEach(card => card.classList.add('show'));
}