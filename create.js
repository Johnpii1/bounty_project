// import { createBounty, showToast } from "./dashboard.js";
// import { getConnectedWallet } from "./wallet.js";

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

document.addEventListener("DOMContentLoaded", () => {
  function closeAllMenus() {
    document.querySelectorAll(".plusmenu, .profilemenu").forEach((menu) => {
      menu.classList.add("hidden");
    });
  }

  

  // OPEN PLUS MENU
  document.querySelectorAll(".plusbtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllMenus(); // close others first
      const menu = btn.closest(".plus-wrapper").querySelector(".plusmenu");
      menu.classList.remove("hidden");
    });
  });

  // OPEN PROFILE MENU
  document.querySelectorAll(".profile").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllMenus(); // close others first
      const menu = btn.closest(".profile-wrapper").querySelector(".profilemenu");
      menu.classList.remove("hidden");
    });
  });

  // CLOSE BUTTONS
  document.querySelectorAll(".close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      btn.parentElement.classList.add("hidden");
    });
  });

  // CLICK OUTSIDE closes all
  document.addEventListener("click", closeAllMenus);
});

// cj starts here
/*
// ==================== COLLECT BOUNTY DATA FROM FORM ====================
function collectBountyData() {
  // Step 1: Network & Category
  const network = document.querySelector("input[list='networks']")?.value || "";
  const category =
    document.querySelector("input[list='categories']")?.value || "";

  // Step 2: Task Details
  const title =
    document.querySelector("#page2 input[type='text']")?.value || "";
  const description = document.querySelector("#page2 textarea")?.value || "";

  // Tags - collect from your tag buttons
  const tags = collectTags(); // You'll need to implement this based on your tag UI

  // Timeline - get from date pickers
  const startDate =
    document.querySelector("#page2 button:contains('Start') + input")?.value ||
    getDefaultStartDate();
  const deadline =
    document.querySelector("#page2 button:contains('Stop') + input")?.value ||
    getDefaultDeadline();

  // Origin Link
  const originLink =
    document.querySelector("#page2 input[type='url']")?.value || "";

  // Step 3: Reward Info
  const multipleWinner = document.getElementById("toggle")?.checked || false;
  const payoutType = getPayoutType(); // "equal" or "percentage"
  const percentages = getPercentages(); // Array if percentage split

  const token =
    document.querySelector("input[list='network1']")?.value || "USDC";
  const rewardInput =
    document.querySelector("#page3 input[type='number']")?.value || "0";
  const reward = parseFloat(rewardInput);

  // Validate required fields
  if (!title || !description || !reward || reward <= 0) {
    throw new Error("Please fill all required fields");
  }

  // Build the bounty data object
  return {
    // Basic Info
    title,
    description,
    category,
    tags,

    // Timeline
    startDate: new Date(startDate).toISOString(),
    deadline: new Date(deadline).toISOString(),

    // Links
    originLink,

    // Network
    network,

    // Reward
    reward,
    token,

    // Winners
    winnersAllowed: multipleWinner ? 2 : 1, // Default to 2 if multiple enabled
    payoutType: multipleWinner ? payoutType : "single",
    percentages:
      multipleWinner && payoutType === "percentage" ? percentages : [],
  };
}

// Helper: Collect tags (implement based on your UI)
function collectTags() {
  // Example: If you have tag buttons with class "tag-selected"
  const tagElements = document.querySelectorAll(".tag-selected");
  return Array.from(tagElements).map((el) => el.textContent);

  // Or if you have an input with comma-separated tags:
  // const tagInput = document.querySelector("#tags-input").value;
  // return tagInput.split(",").map(t => t.trim()).filter(t => t);
}

// Helper: Get payout type from UI
function getPayoutType() {
  const activeButton = document.querySelector("#dropdown button.bg-pink-500");
  if (activeButton) {
    return activeButton.textContent.toLowerCase().includes("equal")
      ? "equal"
      : "percentage";
  }
  return "equal";
}

// Helper: Get percentages for split
function getPercentages() {
  // If you have percentage inputs, collect them
  const percentageInputs = document.querySelectorAll(".percentage-input");
  if (percentageInputs.length > 0) {
    return Array.from(percentageInputs).map(
      (input) => parseInt(input.value) || 0,
    );
  }
  return [];
}

// Helper: Default dates
function getDefaultStartDate() {
  const date = new Date();
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 30); // 30 days from now
  return date.toISOString().split("T")[0];
}

// ==================== FORM SUBMISSION ====================
async function submitBounty() {
  try {
    // Check if wallet is connected
    const wallet = await getConnectedWallet();
    if (!wallet) {
      showToast("Please connect your wallet first", "warning");
      return;
    }

    // Show loading state
    const submitBtn = document.getElementById("nextBtn");
    const originalText = submitBtn.textContent;
    originalText = "Creating...";
    submitBtn.disabled = true;

    // Collect form data
    const bountyData = collectBountyData();

    // Add creator wallet
    bountyData.creator = wallet;

    console.log("📦 Submitting bounty data:", bountyData);

    // Send to backend
    const result = await createBounty(bountyData);

    if (result.success) {
      // Success message and redirect handled in createBounty
    }
  } catch (error) {
    console.error("❌ Error:", error);
    showToast(error.message || "Failed to create bounty", "error");

    // Reset button
    const submitBtn = document.getElementById("nextBtn");
    submitBtn.textContent = "Next";
    submitBtn.disabled = false;
  }
}

// ==================== STEP NAVIGATION ====================
document
  .getElementById("nextBtn")
  ?.addEventListener("click", async function (e) {
    e.preventDefault();

    const totalSteps = 4;

    if (currentStep < totalSteps) {
      // Validate current step before proceeding
      if (!validateStep(currentStep)) {
        return;
      }

      // Hide current page, show next
      document.getElementById(`page${currentStep}`).classList.add("hidden");
      currentStep++;
      document.getElementById(`page${currentStep}`).classList.remove("hidden");

      // Update progress bar
      updateProgress(currentStep);

      // Update button text on last step
      if (currentStep === totalSteps) {
        this.textContent = "Create Bounty";
      }
    } else {
      // On last step, submit the bounty
      await submitBounty();
    }
  });

document.getElementById("backBtn")?.addEventListener("click", function (e) {
  e.preventDefault();

  if (currentStep > 1) {
    document.getElementById(`page${currentStep}`).classList.add("hidden");
    currentStep--;
    document.getElementById(`page${currentStep}`).classList.remove("hidden");

    updateProgress(currentStep);

    // Update button text
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.textContent = currentStep === 4 ? "Create Bounty" : "Next";
  }
});

// ==================== STEP VALIDATION ====================
function validateStep(step) {
  switch (step) {
    case 1:
      const network = document.querySelector("input[list='networks']")?.value;
      const category = document.querySelector(
        "input[list='categories']",
      )?.value;
      if (!network || !category) {
        showToast("Please select network and category", "warning");
        return false;
      }
      break;

    case 2:
      const title = document.querySelector("#page2 input[type='text']")?.value;
      const description = document.querySelector("#page2 textarea")?.value;
      if (!title || !description) {
        showToast("Please enter title and description", "warning");
        return false;
      }
      break;

    case 3:
      const reward = document.querySelector(
        "#page3 input[type='number']",
      )?.value;
      const token = document.querySelector("input[list='network1']")?.value;
      if (!reward || parseFloat(reward) <= 0 || !token) {
        showToast("Please enter valid reward amount and token", "warning");
        return false;
      }
      break;
  }
  return true;
}

// ==================== UPDATE PROGRESS BAR ====================
function updateProgress(step) {
  for (let i = 1; i <= 4; i++) {
    const progressEl = document.getElementById(`step${i}`);
    if (progressEl) {
      if (i <= step) {
        progressEl.classList.remove("bg-gray-800");
        progressEl.classList.add("bg-pink-500");
      } else {
        progressEl.classList.remove("bg-pink-500");
        progressEl.classList.add("bg-gray-800");
      }
    }
  }
}

// ==================== MULTIPLE WINNERS TOGGLE ====================
document.getElementById("toggle")?.addEventListener("change", function (e) {
  const dropdown = document.getElementById("dropdown");
  if (dropdown) {
    if (this.checked) {
      dropdown.classList.remove("hidden");
    } else {
      dropdown.classList.add("hidden");
    }
  }
});

// ==================== INFO BUTTON TOOLTIP ====================
document.getElementById("infom")?.addEventListener("click", function (e) {
  e.stopPropagation();
  const menu = document.getElementById("infomenu");
  if (menu) {
    menu.classList.toggle("hidden");
  }
});

// Close info menu when clicking outside
document.addEventListener("click", function () {
  const menu = document.getElementById("infomenu");
  if (menu && !menu.classList.contains("hidden")) {
    menu.classList.add("hidden");
  }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Show first page
  updateProgress(1);
});*/

// Get buttons and modals
const equalBtn = document.getElementById("equalBtn");
const percentBtn = document.getElementById("percentBtn");

const equalModal = document.getElementById("equalModal");
const percentModal = document.getElementById("percentModal");

const equalConfirm = document.getElementById("closeEqual");
const percentConfirm = document.getElementById("closePercent");

// Open modals
equalBtn.addEventListener("click", () => {
  equalModal.classList.remove("hidden");
});

percentBtn.addEventListener("click", () => {
  percentModal.classList.remove("hidden");
});

// Close modals on confirm
equalConfirm.addEventListener("click", () => {
  equalModal.classList.add("hidden");
});

percentConfirm.addEventListener("click", () => {
  percentModal.classList.add("hidden");
});

const presetButtons = document.querySelectorAll(".preset-btn");

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const selected = btn.dataset.value; // get the data-value
    console.log("Selected preset:", selected);
    // you can now store it or update an input
  });
});

// Get the selected token value (this returns "INJ", "wETH", "USDT", or "USDC")

document.addEventListener("DOMContentLoaded", function () {
  const tokenSelect = document.getElementById("network1");

  // Only proceed if token select exists on this page
  if (!tokenSelect) return;

  // Map token values to display symbols
  const tokenSymbolMap = {
    INJ: "INJ",
    wETH: "wINJ",
    USDT: "USDT",
    USDC: "USDC",
  };

  // Function to update token displays - ONLY runs when value changes
  function updateTokenDisplay() {
    const selectedValue = tokenSelect.value;
    const displaySymbol = tokenSymbolMap[selectedValue] || "USDC";

    console.log(`Token changed to: ${displaySymbol}`);

    // Update all token type elements
    const tokenElements = document.querySelectorAll(
      ".tokenType, .token-symbol",
    );
    tokenElements.forEach((el) => {
      el.textContent = displaySymbol;
    });

    // Update balance displays (preserve the number)
    const balanceElements = document.querySelectorAll(".balance");
    balanceElements.forEach((el) => {
      // Extract number if it exists, otherwise use default
      const match = el.textContent.match(/[\d.]+/);
      const number = match ? match[0] : "0.0000";
      el.textContent = `${number} ${displaySymbol}`;
    });
  }

  // ONLY run when the select value changes - THIS IS THE KEY
  tokenSelect.addEventListener("change", updateTokenDisplay);

  // Initial update (runs once when page loads)
  updateTokenDisplay();
});
