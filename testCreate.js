// create.js
import { createBounty, getCategories, getTags } from "./api.js";
import { getConnectedWallet, shortenAddress } from "./wallet.js";
import { createBountyOnChain } from "./contractService.js";
import { initProfile } from "./initProfile.js";

// ==================== STATE MANAGEMENT ====================
let currentStep = 1;
let bountyData = {
  title: "",
  description: "",
  category: "",
  tags: [],
  startDate: "",
  deadline: "",
  originLink: "",
  network: "",
  reward: 0,
  token: "USDC",
  winnersAllowed: 1,
  payoutType: "single",
  percentages: [],
  creator: "",
};

// Multi-winner state
let isMultipleWinner = false;
let selectedPayoutType = "equal"; // "equal" or "percentage"
let winnerCount = 2;
let percentageArray = [];

// ==================== DOM ELEMENTS ====================
const pages = {
  1: document.getElementById("page1"),
  2: document.getElementById("page2"),
  3: document.getElementById("page3"),
  4: document.getElementById("page4"),
};

const stepIndicators = {
  1: document.getElementById("step1"),
  2: document.getElementById("step2"),
  3: document.getElementById("step3"),
  4: document.getElementById("step4"),
};

const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Create page loaded");

  // Check if wallet is connected
  const wallet = getConnectedWallet();
  if (!wallet) {
    showToast("Please connect your wallet first", "warning");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
    return;
  }

  bountyData.creator = wallet;

  // Initialize profile circle
  await initProfile();

  // Set minimum dates for date inputs
  setMinDates();

  // Initialize UI
  updateStepIndicators();
  setupEventListeners();
  setupTokenDisplay();
});

// ==================== SETUP FUNCTIONS ====================

function setMinDates() {
  const today = new Date().toISOString().split("T")[0];
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");

  if (startDateInput) {
    startDateInput.min = today;
    startDateInput.value = today;
  }

  if (endDateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    endDateInput.min = tomorrow.toISOString().split("T")[0];
    endDateInput.value = tomorrow.toISOString().split("T")[0];
  }
}

function setupEventListeners() {
  // Navigation buttons
  nextBtn.addEventListener("click", handleNext);
  backBtn.addEventListener("click", handleBack);

  // Form inputs
  document.getElementById("networks")?.addEventListener("change", (e) => {
    bountyData.network = e.target.value;
  });

  document.getElementById("categories")?.addEventListener("change", (e) => {
    bountyData.category = e.target.value;
  });

  document.getElementById("bountyTitle")?.addEventListener("input", (e) => {
    bountyData.title = e.target.value;
    updateReviewField("title", e.target.value);
  });

  document
    .getElementById("bountyDescription")
    ?.addEventListener("input", (e) => {
      bountyData.description = e.target.value;
      updateReviewField("description", e.target.value);
    });

  document.getElementById("tags")?.addEventListener("change", (e) => {
    bountyData.tags = [e.target.value];
    updateReviewField("tags", e.target.value);
  });

  document.getElementById("startDate")?.addEventListener("change", (e) => {
    bountyData.startDate = e.target.value;
  });

  document.getElementById("endDate")?.addEventListener("change", (e) => {
    bountyData.deadline = e.target.value;
    updateReviewField("deadline", formatDate(e.target.value));
  });

  document.getElementById("submissionLink")?.addEventListener("input", (e) => {
    bountyData.originLink = e.target.value;
    updateReviewField("task-detail-link", e.target.value);
  });

  // Token selection
  document.getElementById("network1")?.addEventListener("change", (e) => {
    bountyData.token = e.target.value;
  });

  // Reward input
  document
    .querySelector('#page3 input[type="number"]')
    ?.addEventListener("input", (e) => {
      bountyData.reward = parseFloat(e.target.value) || 0;
      calculateFees();
    });

  // Multiple winners toggle
  setupMultiWinnerControls();
}

function setupMultiWinnerControls() {
  const toggle = document.getElementById("toggle");
  const dropdown = document.getElementById("dropdown");
  const equalBtn = document.getElementById("equalBtn");
  const percentBtn = document.getElementById("percentBtn");
  const equalModal = document.getElementById("equalModal");
  const percentModal = document.getElementById("percentModal");
  const infom = document.getElementById("infom");
  const infomenu = document.getElementById("infomenu");

  // Toggle dropdown visibility
  toggle.addEventListener("change", (e) => {
    isMultipleWinner = e.target.checked;
    dropdown.classList.toggle("hidden", !isMultipleWinner);

    if (isMultipleWinner) {
      bountyData.winnersAllowed = 2;
      bountyData.payoutType = selectedPayoutType;
    } else {
      bountyData.winnersAllowed = 1;
      bountyData.payoutType = "single";
      bountyData.percentages = [];
    }
  });

  // Equal split button
  equalBtn.addEventListener("click", () => {
    selectedPayoutType = "equal";
    equalBtn.classList.add("bg-pink-500");
    percentBtn.classList.remove("bg-pink-500");
    equalModal.classList.remove("hidden");
  });

  // Percentage split button
  percentBtn.addEventListener("click", () => {
    selectedPayoutType = "percentage";
    percentBtn.classList.add("bg-pink-500");
    equalBtn.classList.remove("bg-pink-500");
    percentModal.classList.remove("hidden");
  });

  // Close equal modal
  document.getElementById("closeEqual").addEventListener("click", () => {
    const input = document.getElementById("equalWinnersInput");
    winnerCount = parseInt(input.value) || 2;

    if (winnerCount < 2) winnerCount = 2;
    if (winnerCount > 5) winnerCount = 5;

    bountyData.winnersAllowed = winnerCount;
    bountyData.payoutType = "equal";
    bountyData.percentages = [];

    equalModal.classList.add("hidden");
    showToast(`${winnerCount} winners selected for equal split`, "success");
  });

  // Close percent modal
  document.getElementById("closePercent").addEventListener("click", () => {
    const input = document.getElementById("percentWinnersInput");
    const count = parseInt(input.value) || 2;

    if (count < 2) {
      showToast("Minimum 2 winners required", "error");
      return;
    }
    if (count > 5) {
      showToast("Maximum 5 winners allowed", "error");
      return;
    }

    winnerCount = count;
    bountyData.winnersAllowed = winnerCount;
    bountyData.payoutType = "percentage";

    // Use preset or create default percentages
    if (percentageArray.length === 0) {
      // Create equal percentages as default
      const equalPercent = Math.floor(100 / winnerCount);
      const remainder = 100 - equalPercent * winnerCount;
      percentageArray = Array(winnerCount).fill(equalPercent);
      percentageArray[winnerCount - 1] += remainder;
    }

    bountyData.percentages = percentageArray;
    percentModal.classList.add("hidden");
    showToast(
      `${winnerCount} winners selected with percentage split`,
      "success",
    );
  });

  // Preset buttons
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-value");
      percentageArray = JSON.parse(value);
      winnerCount = percentageArray.length;
      document.getElementById("percentWinnersInput").value = winnerCount;
      showToast(`Preset ${value} selected`, "success");
    });
  });

  // Info button
  infom.addEventListener("click", (e) => {
    e.stopPropagation();
    infomenu.classList.toggle("hidden");
  });

  // Close info menu when clicking outside
  document.addEventListener("click", () => {
    infomenu.classList.add("hidden");
  });
}

function setupTokenDisplay() {
  const tokenSelect = document.getElementById("network1");
  const tokenSymbols = {
    INJ: "INJ",
    wETH: "wINJ",
    USDT: "USDT",
    USDC: "USDC",
  };

  tokenSelect.addEventListener("change", function () {
    const symbol = tokenSymbols[this.value] || "wINJ";
    document.querySelectorAll(".tokenType").forEach((el) => {
      el.textContent = symbol;
    });
    updateReviewField("token", symbol);
  });
}

function calculateFees() {
  // Get reward value, ensure it's a valid number
  const reward = parseFloat(bountyData.reward) || 0;

  if (reward <= 0) {
    // Clear fee and total if reward is invalid
    if (feeInput) feeInput.value = "0.00";
    if (totalInput) totalInput.value = "0.00";
    return;
  }

  // Calculate fee (5%) and total
  const fee = reward * 0.05;
  const total = reward + fee;
  const symbol = bountyData.token || "WINJ";

  console.log(`Calculating: Reward=${reward}, Fee=${fee}, Total=${total}`);

  // Update fee input (if it exists)
  if (feeInput) {
    feeInput.value = fee.toFixed(4);
  } else {
    // Fallback to old method
    const inputs = document.querySelectorAll('#page3 input[type="number"]');
    if (inputs.length >= 2) {
      inputs[1].value = fee.toFixed(4);
    }
  }

  // Update total input (if it exists)
  if (totalInput) {
    totalInput.value = total.toFixed(4);
  } else {
    // Fallback to old method
    const inputs = document.querySelectorAll('#page3 input[type="number"]');
    if (inputs.length >= 3) {
      inputs[2].value = total.toFixed(4);
    }
  }

  // Update review fields
  updateReviewField("reward", `${reward.toFixed(2)} ${symbol}`);
  updateReviewField("total", `${total.toFixed(2)} ${symbol}`);
}

// ==================== NAVIGATION ====================

function handleNext() {
  if (currentStep < 4) {
    // Validate current step before proceeding
    if (!validateStep(currentStep)) {
      return;
    }

    // Hide current page, show next
    pages[currentStep].classList.add("hidden");
    currentStep++;
    pages[currentStep].classList.remove("hidden");

    updateStepIndicators();
    updateReviewPage();

    // Update button text on last step
    if (currentStep === 4) {
      nextBtn.textContent = "Create Bounty";
    }
  } else {
    // On last step, submit the bounty
    submitBounty();
  }
}

function handleBack() {
  if (currentStep > 1) {
    pages[currentStep].classList.add("hidden");
    currentStep--;
    pages[currentStep].classList.remove("hidden");

    updateStepIndicators();

    // Update button text
    nextBtn.textContent = currentStep === 4 ? "Create Bounty" : "Next";
  }
}

function validateStep(step) {
  switch (step) {
    case 1:
      if (!bountyData.network) {
        showToast("Please select a network", "warning");
        return false;
      }
      if (!bountyData.category) {
        showToast("Please select a category", "warning");
        return false;
      }
      break;

    case 2:
      if (!bountyData.title || bountyData.title.length < 5) {
        showToast("Title must be at least 5 characters", "warning");
        return false;
      }
      if (!bountyData.description || bountyData.description.length < 20) {
        showToast("Description must be at least 20 characters", "warning");
        return false;
      }
      if (!bountyData.startDate || !bountyData.deadline) {
        showToast("Please select start and end dates", "warning");
        return false;
      }
      break;

    case 3:
      if (bountyData.reward <= 0) {
        showToast("Please enter a valid reward amount", "warning");
        return false;
      }
      break;
  }
  return true;
}

function updateStepIndicators() {
  for (let i = 1; i <= 4; i++) {
    if (i <= currentStep) {
      stepIndicators[i].classList.remove("bg-gray-800");
      stepIndicators[i].classList.add("bg-pink-500");
    } else {
      stepIndicators[i].classList.remove("bg-pink-500");
      stepIndicators[i].classList.add("bg-gray-800");
    }
  }
}

// ==================== REVIEW PAGE ====================

function updateReviewPage() {
  if (currentStep !== 4) return;

  updateReviewField("category", bountyData.category);
  updateReviewField("title", bountyData.title);
  updateReviewField(
    "description",
    bountyData.description.substring(0, 100) + "...",
  );
  updateReviewField("tags", bountyData.tags.join(", "));
  updateReviewField("task-detail-link", bountyData.originLink);
  updateReviewField("deadline", formatDate(bountyData.deadline));
  updateReviewField("reward", `${bountyData.reward} ${bountyData.token}`);

  const total = bountyData.reward + bountyData.reward * 0.05;
  updateReviewField("total", `${total.toFixed(2)} ${bountyData.token}`);

  let winnerText = "No";
  if (bountyData.winnersAllowed > 1) {
    winnerText = `Yes (${bountyData.winnersAllowed} winners, ${bountyData.payoutType} split)`;
    if (bountyData.percentages.length > 0) {
      winnerText += ` - ${bountyData.percentages.join("% / ")}%`;
    }
  }
  updateReviewField("multipleWinners", winnerText);
}

function updateReviewField(field, value) {
  const reviewElements = document.querySelectorAll("#page4 h4");
  reviewElements.forEach((el) => {
    if (el.textContent.toLowerCase().includes(field.toLowerCase())) {
      const nextEl = el.nextElementSibling;
      if (nextEl && nextEl.tagName === "H4") {
        nextEl.textContent = value;
      }
    }
  });
}

function formatDate(dateString) {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ==================== SUBMISSION ===================

async function submitBounty() {
  try {
    // Show loading state
    nextBtn.disabled = true;
    nextBtn.textContent = "Creating on Blockchain...";

    // Prepare final bounty data
    const finalBountyData = {
      title: bountyData.title,
      description: bountyData.description,
      category: bountyData.category,
      tags: bountyData.tags,
      startDate: new Date(bountyData.startDate).toISOString(),
      deadline: new Date(bountyData.deadline).toISOString(),
      originLink: bountyData.originLink,
      network: bountyData.network,
      reward: bountyData.reward,
      token: bountyData.token,
      winnersAllowed: bountyData.winnersAllowed,
      payoutType: bountyData.payoutType,
      percentages: bountyData.percentages,
      creator: bountyData.creator,
    };

    console.log("Creating bounty on blockchain...", finalBountyData);

    // Show transaction pending message
    showToast("📝 Please confirm transaction in your wallet...", "info");

    // Call blockchain to create bounty
    console.log(`creator ${bountyData.creator}`);
    const chainResult = await createBountyOnChain(
      finalBountyData,
      bountyData.creator,
    );

    if (chainResult.success) {
      showToast(
        `✅ Transaction confirmed! TX: ${chainResult.txHash.slice(0, 10)}...`,
        "success",
      );

      // Now save to backend
      nextBtn.textContent = "Saving to Database...";

      // Then save to backend with blockchain info
      const backendData = {
        ...bountyData,
        blockchainId: chainResult.bountyId
          ? Number(chainResult.bountyId)
          : null, // Convert BigInt to Number,
        txHash: chainResult.txHash,
        blockNumber: chainResult.blockNumber
          ? Number(chainResult.blockNumber)
          : null, // Convert BigInt to Number,
        isOnChain: true,
      };

      const result = await createBounty(backendData);

      if (result && result._id) {
        showToast("✅ Bounty created successfully!", "success");

        // Store the created bounty ID
        sessionStorage.setItem("createdBountyId", result._id);

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          window.location.href = "./user_dashboard.html";
        }, 3000);
      }
    } else {
      throw new Error("Blockchain transaction failed");
    }
  } catch (error) {
    console.error("Error creating bounty:", error);

    // Handle user rejection
    if (error.message.includes("rejected") || error.code === 4001) {
      showToast("❌ Transaction rejected by user", "error");
    } else {
      showToast(error.message || "Failed to create bounty", "error");
    }

    // Reset button
    nextBtn.disabled = false;
    nextBtn.textContent = "Create Bounty";
  }
}

// ==================== TOAST NOTIFICATION ====================

function showToast(message, type = "info") {
  // Remove existing toast
  const existingToast = document.getElementById("toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement("div");
  toast.id = "toast";

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600",
  };

  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-opacity duration-300 ${colors[type] || colors.info}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Auto hide after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==================== MENU TOGGLES (from header) ====================

document.querySelector(".plusbtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.querySelector(".plusmenu")?.classList.toggle("hidden");
});

document.querySelector(".profile")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.querySelector(".profilemenu")?.classList.toggle("hidden");
});

// Close menus when clicking outside
document.addEventListener("click", () => {
  document.querySelector(".plusmenu")?.classList.add("hidden");
  document.querySelector(".profilemenu")?.classList.add("hidden");
});

// ==================== CHECK WALLET BALANCE ====================
async function checkWalletBalance(tokenSymbol, amount) {
  try {
    // Implement balance check here
    // You'll need to fetch the user's balance for the selected token
    console.log(`Checking ${tokenSymbol} balance...`);
    return true; // Placeholder
  } catch (error) {
    console.error("Error checking balance:", error);
    return false;
  }
}

// ==================== EXPORT FOR DEBUGGING ====================
// For debugging in console
window.bountyData = bountyData;
