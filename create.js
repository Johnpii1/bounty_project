//
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


//TOGGLE FOR SELECT MUTIPE
 const toggle = document.getElementById("toggle");
    const dropdown = document.getElementById("dropdown");

    toggle.addEventListener("change", () => {
      dropdown.classList.toggle("hidden", !toggle.checked);
    });
