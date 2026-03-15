let currentStep = 1;

const steps = [
  document.getElementById("step1"),
  document.getElementById("step2"),
  document.getElementById("step3"),
  document.getElementById("step4"),
];

const pages = [
  document.getElementById("page1"),
  document.getElementById("page2"),
  document.getElementById("page3"),
  document.getElementById("page4"),
];

const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

function updateSteps() {
  steps.forEach((step) => {
    step.classList.remove("bg-pink-500");
    step.classList.add("bg-gray-800");
  });

  pages.forEach((page) => {
    page.classList.add("hidden");
  });

  for (let i = 0; i < currentStep; i++) {
    steps[i].classList.remove("bg-gray-800");
    steps[i].classList.add("bg-pink-500");
  }

  pages[currentStep - 1].classList.remove("hidden");

  // Change button text on step 4
  if (currentStep === 4) {
    nextBtn.textContent = "Create Task";
  } else {
    nextBtn.textContent = "Next";
  }
}

nextBtn.addEventListener("click", () => {
  if (currentStep < 4) {
    currentStep++;
    updateSteps();
  }
});

backBtn.addEventListener("click", () => {
  if (currentStep > 1) {
    currentStep--;
    updateSteps();
  }
});

// Run once when page loads
updateSteps();

//===========
//FOR AFTER WHEN YOU HAVE CLICK ON CREATE
//===========
// nextBtn.addEventListener("click", () => {

//   if (currentStep < 4) {
//     currentStep++;
//     updateSteps();
//   } else {

//===========
//     // Step 4 → go to another page
//=========
//     window.location.href = "success.html";
//   }

// });

//
//TOGGLE FOR SELECT MUTIPE
const toggle = document.getElementById("toggle");
const dropdown = document.getElementById("dropdown");

toggle.addEventListener("change", () => {
  dropdown.classList.toggle("hidden", !toggle.checked);
});

//FOR INFORMATION
const inf = document.getElementById("infom");
const inf1 = document.getElementById("infomenu");

if (inf && inf1) {
  inf.addEventListener("click", () => {
    inf1.classList.toggle("hidden");
  });
}
if (inf && inf1) {
  inf.addEventListener("mouseleave", () => {
    inf1.classList.add("hidden");
  });
}

//FOR PLUS NAV BTN
const plus = document.querySelector(".plusbtn");
const minus = document.querySelector(".plusmenu");

plus.addEventListener("click", () => {
  minus.classList.toggle("hidden");
});

//FOR PLUS NAV BTN
const profilem = document.querySelector(".profile");
const profile1 = document.querySelector(".profilemenu ");

profilem.addEventListener("click", () => {
  profile1.classList.toggle("hidden");
});
