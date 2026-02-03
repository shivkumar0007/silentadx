console.log("Premium unlock script loaded");

// ✅ Google Apps Script Web App URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwpNHHEOzD-2Rh7DiMb6_ZGPPfYBgpNqH3K9M2IqwXKtue2Y5UY0GkD1v-Jzf2jpZAm7Q/exec";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM loaded");

  // 🔐 Get logged-in user from localStorage
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const userId = loggedInUser.userId;
  let unlockedCourses = loggedInUser.courses || [];

  if (!userId) {
    // Redirect to login if user not logged in
    window.location.href = "login.html";
    return;
  }

  // Elements cache (optimized for faster access)
  const unlockBtn = document.getElementById("unlock-btn");
  const accessCodeInput = document.getElementById("access-code");
  const errorMsg = document.getElementById("error-msg");
  const buyCoursesBtn = document.getElementById("buy-courses-btn");
  const myCoursesBtn = document.getElementById("my-courses-btn");

  const allCoursesSection = document.getElementById("all-courses-section");
  const allCoursesCards = document.getElementById("all-courses-cards");
  const premiumSection = document.getElementById("premium-section");
  const premiumCards = document.getElementById("premium-cards");
  const myCoursesSection = document.getElementById("my-courses-section");
  const myCoursesCards = document.getElementById("my-courses-cards");
  const noCoursesMsg = document.getElementById("no-courses-msg");

  // ⚠️ Demo only: These codes are visible in frontend, use secure backend for real apps
  const courseCodes = {
    js: ["JS123"],
    css: ["CSS456"],
    js1: ["3GHTFT"],
  };

  /* ================= SAVE COURSES TO GOOGLE SHEET ================= */
  async function saveToSheet(courses) {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          action: "updateCourses",
          userId: userId,
          courses: courses.join(","),
        }),
      });

      const result = await response.json();
      console.log("Saved to sheet:", result);

      // Update localStorage as well
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify({ userId, courses })
      );
    } catch (err) {
      console.error("Error saving to sheet:", err);
    }
  }

  /* ================= LOAD COURSES FROM GOOGLE SHEET ================= */
  async function loadFromSheet() {
    try {
      const response = await fetch(`${SCRIPT_URL}?userId=${userId}`);
      const result = await response.json();
      return result.courses || [];
    } catch (err) {
      console.error("Error loading from sheet:", err);
      return [];
    }
  }

  /* ================= SHOW BUY COURSES ================= */
  buyCoursesBtn.addEventListener("click", () => {
    allCoursesSection.style.display = "none";
    myCoursesSection.style.display = "none";
    premiumSection.style.display = "block";

    // Clear previous and show only locked courses (optimized: use DocumentFragment for batch DOM updates)
    const fragment = document.createDocumentFragment();
    const allCards = allCoursesCards.querySelectorAll(".card");

    allCards.forEach((card) => {
      const course = card.getAttribute("data-course");
      if (!unlockedCourses.includes(course)) {
        fragment.appendChild(card.cloneNode(true));
      }
    });
    premiumCards.innerHTML = ""; // Clear once
    premiumCards.appendChild(fragment);
  });

  /* ================= SHOW MY COURSES ================= */
  myCoursesBtn.addEventListener("click", () => {
    allCoursesSection.style.display = "none";
    premiumSection.style.display = "none";
    myCoursesSection.style.display = "block";

    noCoursesMsg.style.display =
      unlockedCourses.length > 0 ? "none" : "block";
  });

  /* ================= MANUAL UNLOCK VIA ACCESS CODE ================= */
  unlockBtn.addEventListener("click", () => {
    const enteredCode = accessCodeInput.value.trim().toUpperCase();

    let unlockedCourse = null;
    for (const [course, codes] of Object.entries(courseCodes)) {
      if (codes.includes(enteredCode)) {
        unlockedCourse = course;
        break;
      }
    }

    if (!unlockedCourse) {
      errorMsg.textContent = "Invalid code";
      errorMsg.style.color = "red";
      errorMsg.style.display = "block";
      return;
    }

    if (unlockedCourses.includes(unlockedCourse)) {
      errorMsg.textContent = "Course already unlocked";
      errorMsg.style.color = "green";
      errorMsg.style.display = "block";
      return;
    }

    errorMsg.style.display = "none";
    unlockCourse(unlockedCourse);
  });

  /* ================= UNLOCK COURSE FUNCTION ================= */
  function unlockCourse(course) {
    console.log("Unlocking course:", course);

    // Find original card in allCoursesCards
    const courseCard = allCoursesCards.querySelector(`[data-course="${course}"]`);
    if (!courseCard) return;

    const buyBtn = courseCard.querySelector(".buy-btn");
    const viewBtn = courseCard.querySelector(".view-btn");
    const courseContent = courseCard.querySelector(".course-content");

    // Hide Buy button, show View button on original card
    if (buyBtn) buyBtn.style.display = "none";
    if (viewBtn) viewBtn.style.display = "inline-block";

    if (viewBtn && courseContent) {
      viewBtn.onclick = () => {
        courseContent.style.display =
          courseContent.style.display === "none" ? "block" : "none";
      };
    }

    // Prevent duplicate in My Courses section
    const alreadyAdded = myCoursesCards.querySelector(`[data-course="${course}"]`);
    if (alreadyAdded) return;

    // Clone card for My Courses (optimized: clone only once and modify)
    const myCourseCard = courseCard.cloneNode(true);
    myCourseCard.setAttribute("data-course", course);

    // Remove Buy button from clone
    const myBuyBtn = myCourseCard.querySelector(".buy-btn");
    if (myBuyBtn) myBuyBtn.remove();

    const myViewBtn = myCourseCard.querySelector(".view-btn");
    const myContent = myCourseCard.querySelector(".course-content");
    if (myContent) myContent.style.display = "none";

    if (myViewBtn && myContent) {
      myViewBtn.style.display = "inline-block";
      myViewBtn.onclick = () => {
        myContent.style.display =
          myContent.style.display === "none" ? "block" : "none";
      };
    }

    myCoursesCards.appendChild(myCourseCard);

    // Save newly unlocked course
    if (!unlockedCourses.includes(course)) {
      unlockedCourses.push(course);
      saveToSheet(unlockedCourses);
    }
  }

  /* ================= INITIALIZE: LOAD UNLOCKED COURSES FROM SHEET ================= */
  unlockedCourses = await loadFromSheet();
  unlockedCourses.forEach((course) => unlockCourse(course));
});