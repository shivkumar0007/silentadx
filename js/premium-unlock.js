console.log("Premium unlock script loaded");

// ✅ Apps Script URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw1yseP_PSDMlT5T-K7020SXyzw72MhheJrqbQkMOdMZmGFxW122yk7zf_a_zPvrb7Czg/exec";

// ✅ Razorpay TEST KEY (later LIVE se replace kar dena)
const RZP_KEY = "rzp_test_SCBRYHk2Rhhl1I";

document.addEventListener("DOMContentLoaded", async () => {

  /* ================= AUTH ================= */
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const userId = loggedInUser.userId;
  const userEmail = loggedInUser.email || "";

  if (!userId) {
    location.href = "login.html";
    return;
  }

  /* ================= STATE ================= */
  let unlockedCourses =
    JSON.parse(localStorage.getItem("myCourses")) || [];

  /* ================= UI ================= */
  const buyCoursesBtn = document.getElementById("buy-courses-btn");
  const myCoursesBtn = document.getElementById("my-courses-btn");

  const allCoursesSection = document.getElementById("all-courses-section");
  const premiumSection = document.getElementById("premium-section");
  const myCoursesSection = document.getElementById("my-courses-section");

  const allCoursesCards = document.getElementById("all-courses-cards");
  const premiumCards = document.getElementById("premium-cards");
  const myCoursesCards = document.getElementById("my-courses-cards");
  const noCoursesMsg = document.getElementById("no-courses-msg");

  /* ================= VIDEO CACHE ================= */

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

  /* ================= BACKEND SYNC ================= */

  async function syncCoursesFromBackend() {
    try {
      const res = await fetch(
        `${SCRIPT_URL}?action=getCourses&userId=${userId}`
      );
      const data = await res.json();
      unlockedCourses = data.courses || [];
      localStorage.setItem("myCourses", JSON.stringify(unlockedCourses));
      renderAll();
    } catch {}
  }

  /* ================= RAZORPAY BUY ================= */

  window.buyCourse = function (courseId, price) {

    const options = {
      key: RZP_KEY,
      amount: price * 100, // paise
      currency: "INR",
      name: "SilentADX",
      description: "Premium Course",
      prefill: {
        email: userEmail
      },
      notes: {
        userId: userId,
        courseId: courseId
      },
      handler: function (response) {
        // ✅ SUCCESS ONLY
        paymentSuccess(response.razorpay_payment_id, courseId);
      }
    };

    new Razorpay(options).open();
  };

  async function paymentSuccess(paymentId, courseId) {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "paymentSuccess",
        paymentId,
        userId,
        courseId
      })
    });

    const data = await res.json();
    if (!data.success) return;

    if (!unlockedCourses.includes(courseId)) {
      unlockedCourses.push(courseId);
      localStorage.setItem("myCourses", JSON.stringify(unlockedCourses));
    }

    renderAll();
    alert("Payment successful 🎉 Course unlocked!");
  }

  /* ================= RENDER ================= */

  function renderAll() {
    renderAllCourses();
    renderMyCourses();
  }

  function renderAllCourses() {
    allCoursesCards.querySelectorAll(".card").forEach(card => {
      const course = card.dataset.course;
      const buyBtn = card.querySelector(".buy-btn");
      const content = card.querySelector(".course-content");

      if (unlockedCourses.includes(course)) {
        buyBtn?.remove();
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
      const original =
        allCoursesCards.querySelector(`[data-course="${course}"]`);
      if (!original) return;

      const clone = original.cloneNode(true);
      clone.querySelector(".buy-btn")?.remove();

      const content = clone.querySelector(".course-content");
      setupVideo(content, course);

      myCoursesCards.appendChild(clone);
    });
  }

  /* ================= FAST VIDEO LOAD ================= */

  function setupVideo(container, course) {
    if (container.dataset.ready) return;

    container.dataset.ready = "1";
    container.innerHTML = `
      <div class="video-placeholder" data-course="${course}">
        ▶ Video loads when visible
      </div>
    `;
    observer.observe(container);
  }

  const observer = new IntersectionObserver(async entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      observer.unobserve(entry.target);

      const course =
        entry.target.querySelector(".video-placeholder")?.dataset.course;
      if (!course) return;

      const embed = await fetchEmbed(course);
      if (!embed) return;

      entry.target.innerHTML = `
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

  /* ================= NAV ================= */

  buyCoursesBtn.onclick = () => {
    allCoursesSection.style.display = "none";
    myCoursesSection.style.display = "none";
    premiumSection.style.display = "block";

    premiumCards.innerHTML = "";
    allCoursesCards.querySelectorAll(".card").forEach(card => {
      const course = card.dataset.course;
      if (!unlockedCourses.includes(course)) {
        premiumCards.appendChild(card.cloneNode(true));
      }
    });
  };

  myCoursesBtn.onclick = () => {
    allCoursesSection.style.display = "none";
    premiumSection.style.display = "none";
    myCoursesSection.style.display = "block";
  };

  /* ================= INIT ================= */

  renderAll();               // ⚡ instant
  syncCoursesFromBackend();  // 🔁 background

  window.unlockCourse = () => console.warn("Blocked");
});