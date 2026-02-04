console.log("Premium unlock script loaded");

// ✅ Apps Script URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzjE10FTnD7ggptin96puZtfQNmzCoPcwofOVwkIHWWMacarFaDPHCDiEUEu6wz3LFhBg/exec";

document.addEventListener("DOMContentLoaded", async () => {

  /* ================= AUTH ================= */
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const userId = loggedInUser.userId;
  if (!userId) {
    location.href = "login.html";
    return;
  }

  /* ================= STATE ================= */
  let unlockedCourses =
    JSON.parse(localStorage.getItem("myCourses")) || [];

  /* ================= UI ================= */
  const unlockBtn = document.getElementById("unlock-btn");
  const accessCodeInput = document.getElementById("access-code");
  const errorMsg = document.getElementById("error-msg");

  const buyCoursesBtn = document.getElementById("buy-courses-btn");
  const myCoursesBtn = document.getElementById("my-courses-btn");

  const allCoursesSection = document.getElementById("all-courses-section");
  const premiumSection = document.getElementById("premium-section");
  const myCoursesSection = document.getElementById("my-courses-section");

  const allCoursesCards = document.getElementById("all-courses-cards");
  const premiumCards = document.getElementById("premium-cards");
  const myCoursesCards = document.getElementById("my-courses-cards");
  const noCoursesMsg = document.getElementById("no-courses-msg");

  /* ================= HELPERS ================= */

  const embedCacheKey = c => `embed_${c}`;

  async function fetchEmbed(course) {
    const cached = localStorage.getItem(embedCacheKey(course));
    if (cached) return cached;

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "getCourse",
        userId,
        courseId: course
      })
    });

    const data = await res.json();
    if (!data.success) return null;

    localStorage.setItem(embedCacheKey(course), data.embed);
    return data.embed;
  }

  async function syncCoursesFromBackend() {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getCourses&userId=${userId}`);
      const data = await res.json();
      unlockedCourses = data.courses || [];
      localStorage.setItem("myCourses", JSON.stringify(unlockedCourses));
      renderAll();
    } catch {}
  }

  /* ================= UNLOCK ================= */
  async function verifyCode(code) {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "verifyCode",
        userId,
        code
      })
    });
    return res.json();
  }

  unlockBtn.onclick = async () => {
    const code = accessCodeInput.value.trim();
    if (!code) return;

    errorMsg.style.display = "none";
    const result = await verifyCode(code);

    if (!result.success) {
      errorMsg.textContent = result.message || "Invalid code";
      errorMsg.style.display = "block";
      return;
    }

    if (!unlockedCourses.includes(result.course)) {
      unlockedCourses.push(result.course);
      localStorage.setItem("myCourses", JSON.stringify(unlockedCourses));
      renderAll();
    }
  };

  /* ================= RENDER LOGIC ================= */

  function renderAll() {
    renderAllCourses();
    renderMyCourses();
  }

  function renderAllCourses() {
    allCoursesCards.querySelectorAll(".card").forEach(card => {
      const course = card.dataset.course;
      const buyBtn = card.querySelector(".buy-btn");
      const viewBtn = card.querySelector(".view-btn");
      const content = card.querySelector(".course-content");

      if (unlockedCourses.includes(course)) {
        buyBtn?.remove();
        viewBtn?.remove();
        setupVideo(content, course);
      } else {
        content.innerHTML = "";
      }
    });
  }

  function renderMyCourses() {
    myCoursesCards.innerHTML = "";

    if (!unlockedCourses.length) {
      noCoursesMsg.style.display = "block";
      return;
    }

    noCoursesMsg.style.display = "none";

    unlockedCourses.forEach(course => {
      const original = allCoursesCards.querySelector(`[data-course="${course}"]`);
      if (!original) return;

      const clone = original.cloneNode(true);
      clone.querySelector(".buy-btn")?.remove();
      clone.querySelector(".view-btn")?.remove();

      const content = clone.querySelector(".course-content");
      setupVideo(content, course);

      myCoursesCards.appendChild(clone);
    });
  }

  /* ================= VIDEO (FAST) ================= */

  function setupVideo(container, course) {
    if (container.dataset.ready) return;

    container.dataset.ready = "1";
    container.innerHTML = `
      <div class="video-placeholder" data-course="${course}">
        ▶ Video loads when visible
      </div>
    `;
    observe(container);
  }

  const observer = new IntersectionObserver(async entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      const box = entry.target;
      observer.unobserve(box);

      const course = box.querySelector(".video-placeholder")?.dataset.course;
      if (!course) return;

      const embed = await fetchEmbed(course);
      if (!embed) return;

      box.innerHTML = `
        <iframe
          width="100%"
          height="315"
          src="${embed}"
          loading="lazy"
          allowfullscreen>
        </iframe>
      `;
    }
  }, { threshold: 0.3 });

  function observe(el) {
    observer.observe(el);
  }

  /* ================= NAV ================= */

  buyCoursesBtn.onclick = () => {
    allCoursesSection.style.display = "none";
    myCoursesSection.style.display = "none";
    premiumSection.style.display = "block";
  };

  myCoursesBtn.onclick = () => {
    allCoursesSection.style.display = "none";
    premiumSection.style.display = "none";
    myCoursesSection.style.display = "block";
  };

  /* ================= INIT ================= */

  renderAll();               // ⚡ instant (localStorage)
  syncCoursesFromBackend();  // 🔁 background sync

  window.unlockCourse = () => console.warn("Blocked");
});