// task.js - Complete bounty details page functionality with submission status
import {
  getBountyById,
  updateBounty,
  createSubmission,
  getUserProfile,
  getUserSubmissions,
  distributeRewards,
  claimRewardOffChain,
  getWinners,
  getUserClaimableAmount,
  hasUserClaimedReward,
  API_BASE,
} from "./api.js";
import {
  disconnectWallet,
  getConnectedWallet,
  shortenAddress,
} from "./wallet.js";
import { initProfile } from "./initProfile.js";

import {
  claimReward as claimRewardOnChain,
  getBountyDetails,
  getClaimableReward,
  hasClaimed,
  delay,
} from "./contractService.js";

// ==================== STATE MANAGEMENT ====================
let bountyData = null;
export let currentUser = null;
let userEnrolled = false;
let isCreator = false;
let claimableAmount = 0;
let hasUserClaimed = false;
let hasUserSubmitted = false;
let userSubmissionData = null; // Store full submission data
let comments = [];
let winnersData = null; // Store winners data

// ==================== DOM ELEMENTS ====================
const loadingState = document.getElementById("loadingState");
const taskCard = document.getElementById("taskCard");
const commentsSection = document.getElementById("commentsSection");
const startTaskBtn = document.getElementById("startTaskBtn");
const claimRewardBtn = document.getElementById("claimRewardBtn");
const submitBtn = document.getElementById("openSubmit");
const distributeRewardBtn = document.getElementById("distributeRewardBtn");
const addCommentBtn = document.getElementById("addCommentBtn");
const newCommentInput = document.getElementById("newComment");
const commentsList = document.getElementById("commentsList");
const distributeModal = document.getElementById("distributeModal");
const winnersInputsDiv = document.getElementById("winnersInputs");

// Modal elements
const submitModal = document.getElementById("submitModal");
const closeSubmitBtn = document.getElementById("closeSubmit");
const submitForm = document.getElementById("submitForm");

// Image preview elements
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");
const imageSizeWarning = document.getElementById("imageSizeWarning");

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Task details page loaded");
  let bountyId = null;

  // Try to get bounty ID from sessionStorage first
  const storedBounty = sessionStorage.getItem("viewBounty");
  if (storedBounty) {
    try {
      const bounty = JSON.parse(storedBounty);
      bountyId = bounty._id;
    } catch (e) {
      console.error("Error parsing stored bounty:", e);
    }
  }

  // If not in sessionStorage, try URL params
  if (!bountyId) {
    const urlParams = new URLSearchParams(window.location.search);
    bountyId = urlParams.get("id");
  }

  if (!bountyId) {
    showToast("No bounty ID provided", "error");
    setTimeout(() => (window.location.href = "./user_dashboard.html"), 2000);
    return;
  }

  // Logout functionality
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      disconnectWallet();
    });
  }

  // Get connected wallet
  currentUser = getConnectedWallet();
  if (!currentUser) {
    showToast("Please connect your wallet first", "warning");
    setTimeout(() => (window.location.href = "./index.html"), 2000);
    return;
  }

  // Initialize profile
  await initProfile();

  // Setup image preview
  setupImagePreview();

  // Load bounty details
  await loadBountyDetails(bountyId);
});

// ==================== IMAGE PREVIEW SETUP ====================
function setupImagePreview() {
  if (imageInput) {
    imageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          imageSizeWarning.textContent =
            "⚠️ Image is too large! Maximum 5MB. Your image will be compressed.";
          imageSizeWarning.classList.remove("hidden");
        } else {
          imageSizeWarning.classList.add("hidden");
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          previewImg.src = event.target.result;
          imagePreview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.classList.add("hidden");
      }
    });
  }
}

// ==================== LOAD BOUNTY DETAILS ====================
async function loadBountyDetails(bountyId) {
  try {
    console.log("Loading bounty:", bountyId);

    // Fetch from backend
    const bounty = await getBountyById(bountyId);
    bountyData = bounty;

    console.log("Bounty loaded:", bountyData);

    // Check if user is creator
    isCreator = bountyData.creator === currentUser;

    // Check if user is enrolled
    await checkUserEnrollment();

    // Check if user has already submitted
    await checkUserSubmission();

    // Load winners data
    await loadWinnersData();

    // Check if rewards are claimable
    if (!isCreator && userEnrolled) {
      await checkClaimableReward();
    }

    // Display bounty info
    displayBountyInfo();

    // Display submission status if exists
    if (hasUserSubmitted && userSubmissionData) {
      displaySubmissionStatus();
    }

    // Display winners info if rewards distributed
    if (winnersData && winnersData.isDistributed) {
      displayWinnersInfo();
    }

    // Load comments
    await loadComments();

    // Update button states
    updateButtonStates();

    // Hide loading, show content
    loadingState.classList.add("hidden");
    taskCard.classList.remove("hidden");
    commentsSection.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading bounty:", error);
    showToast("Failed to load bounty details", "error");
    loadingState.innerHTML = `
      <div class="text-center text-white">
        <i class="bi bi-exclamation-triangle text-4xl text-red-500"></i>
        <p class="mt-4">Failed to load bounty</p>
        <a href="./user_dashboard.html" class="inline-block mt-4 px-4 py-2 bg-pink-500 rounded-lg">Go Back</a>
      </div>
    `;
  }
}

// ==================== LOAD WINNERS DATA ====================
async function loadWinnersData() {
  try {
    winnersData = await getWinners(bountyData._id);
    console.log("Winners data loaded:", winnersData);

    // Check if current user has claimed
    if (winnersData.isDistributed) {
      const hasClaimed = await hasUserClaimedReward(
        bountyData._id,
        currentUser,
      );
      hasUserClaimed = hasClaimed;

      // Get claimable amount for current user
      const amount = await getUserClaimableAmount(bountyData._id, currentUser);
      if (amount > 0) {
        claimableAmount = amount;
      }
    }
  } catch (error) {
    console.error("Error loading winners data:", error);
    winnersData = { winners: [], claimed: [], isDistributed: false };
  }
}

// ==================== DISPLAY WINNERS INFO ====================
function displayWinnersInfo() {
  let winnersDiv = document.getElementById("winnersInfo");

  if (!winnersDiv) {
    winnersDiv = document.createElement("div");
    winnersDiv.id = "winnersInfo";
    winnersDiv.className =
      "mt-4 p-4 rounded-lg border border-green-600 bg-green-900/20";

    const actionButtons = document.querySelector(".flex.flex-wrap.gap-3");
    if (actionButtons && actionButtons.parentNode) {
      actionButtons.insertAdjacentElement("afterend", winnersDiv);
    }
  }

  const distributedDate = winnersData.distributedAt
    ? new Date(winnersData.distributedAt).toLocaleDateString()
    : "Unknown";

  let winnersHtml = `
    <div class="flex items-start gap-3">
      <i class="bi bi-trophy-fill text-green-500 text-xl"></i>
      <div class="flex-1">
        <h4 class="font-semibold text-green-400 mb-2">🏆 Rewards Distributed (${distributedDate})</h4>
        <div class="space-y-2">
  `;

  winnersData.winners.forEach((winner) => {
    const isClaimed = winnersData.claimed?.some(
      (c) => c.address === winner.address,
    );
    const claimStatus = isClaimed ? "✅ Claimed" : "⏳ Pending";
    const claimStatusClass = isClaimed ? "text-green-400" : "text-yellow-400";

    winnersHtml += `
      <div class="flex justify-between items-center text-sm border-b border-gray-700 pb-2">
        <span class="font-mono">${shortenAddress(winner.address)}</span>
        <div class="flex gap-4">
          <span class="text-green-400">${winner.amount.toFixed(4)} ${bountyData.token}</span>
          <span class="${claimStatusClass}">${claimStatus}</span>
        </div>
      </div>
    `;
  });

  winnersHtml += `
        </div>
      </div>
    </div>
  `;

  winnersDiv.innerHTML = winnersHtml;
}

// ==================== CHECK USER SUBMISSION ====================
export async function checkUserSubmission() {
  try {
    const response = await fetch(`${API_BASE}/submissions/user/${currentUser}`);
    const data = await response.json();

    // ✅ CRITICAL FIX: correct key
    const submissions = data.formattedSubmissions || [];

    if (submissions.length > 0) {
      const bountyIdString = bountyData._id.toString();

      const existingSubmission = submissions.find(
        (sub) => sub.bountyId === bountyIdString && sub.isSubmitted === true, // ✅ ONLY real submissions
      );

      if (existingSubmission) {
        hasUserSubmitted = true;
        userSubmissionData = existingSubmission;
        return;
      }
    }

    hasUserSubmitted = false;
  } catch (error) {
    console.error("Error checking user submission:", error);
    hasUserSubmitted = false;
  }
}

// ==================== CHECK USER ENROLLMENT ====================
export async function checkUserEnrollment() {
  try {
    const response = await fetch(`${API_BASE}/enrollments/user/${currentUser}`);
    const data = await response.json();

    const enrollments = data.enrollments || []; // ✅ FIX

    if (enrollments.length > 0) {
      const bountyIdString = bountyData._id.toString();

      userEnrolled = enrollments.some((e) => e.bountyId === bountyIdString);
    } else {
      userEnrolled = false;
    }
  } catch (error) {
    console.error("Error checking enrollment:", error);
    userEnrolled = false;
  }
}

// ==================== DISPLAY SUBMISSION STATUS ====================
function displaySubmissionStatus() {
  let statusDiv = document.getElementById("submissionStatus");

  if (!statusDiv) {
    statusDiv = document.createElement("div");
    statusDiv.id = "submissionStatus";
    statusDiv.className = "mt-4 p-4 rounded-lg border";

    const actionButtons = document.querySelector(".flex.flex-wrap.gap-3");
    if (actionButtons && actionButtons.parentNode) {
      actionButtons.insertAdjacentElement("afterend", statusDiv);
    } else {
      const blockchainInfo = document.getElementById("blockchainInfo");
      if (blockchainInfo) {
        blockchainInfo.insertAdjacentElement("beforebegin", statusDiv);
      }
    }
  }

  const status = userSubmissionData.status || "pending";
  let statusConfig = {
    pending: {
      text: "⏳ Pending Review",
      color: "bg-yellow-900 text-yellow-300 border-yellow-600",
      icon: "bi-hourglass-split",
    },
    accepted: {
      text: "✅ Accepted",
      color: "bg-green-900 text-green-300 border-green-600",
      icon: "bi-check-circle-fill",
    },
    rejected: {
      text: "❌ Rejected",
      color: "bg-red-900 text-red-300 border-red-600",
      icon: "bi-x-circle-fill",
    },
    reviewing: {
      text: "🔍 Under Review",
      color: "bg-blue-900 text-blue-300 border-blue-600",
      icon: "bi-eye-fill",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const submittedDate = userSubmissionData.submittedAt
    ? new Date(userSubmissionData.submittedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown";

  statusDiv.innerHTML = `
    <div class="flex items-start gap-3">
      <i class="bi ${config.icon} text-xl"></i>
      <div class="flex-1">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-semibold">Submission Status: <span class="${config.color} px-2 py-0.5 rounded text-sm ml-2">${config.text}</span></h4>
          <span class="text-xs text-gray-400">Submitted: ${submittedDate}</span>
        </div>
        <p class="text-sm text-gray-300 mt-1"><strong>Description:</strong> ${escapeHtml(userSubmissionData.description || "No description")}</p>
        <p class="text-sm text-gray-300 mt-1"><strong>Link:</strong> <a href="${userSubmissionData.projectLink}" target="_blank" class="text-blue-400 hover:underline">${userSubmissionData.projectLink}</a></p>
        ${userSubmissionData.image ? `<p class="text-sm text-gray-300 mt-1"><strong>Image:</strong> <button onclick="viewSubmissionImage('${userSubmissionData.image}')" class="text-blue-400 hover:underline">View Submission</button></p>` : ""}
        ${status === "rejected" && userSubmissionData.feedback ? `<p class="text-sm text-red-400 mt-2"><strong>Feedback:</strong> ${escapeHtml(userSubmissionData.feedback)}</p>` : ""}
      </div>
    </div>
  `;
}

// ==================== CHECK CLAIMABLE REWARD ====================
async function checkClaimableReward() {
  try {
    if (bountyData.blockchainId) {
      const amount = await getClaimableReward(
        bountyData.blockchainId,
        currentUser,
      );
      claimableAmount = parseFloat(amount);
      const claimed = await hasClaimed(bountyData.blockchainId, currentUser);
      hasUserClaimed = claimed;
      console.log(
        `Claimable amount: ${claimableAmount}, Already claimed: ${hasUserClaimed}`,
      );
    } else {
      claimableAmount = await getUserClaimableAmount(
        bountyData._id,
        currentUser,
      );
    }
  } catch (error) {
    console.error("Error checking claimable reward:", error);
    claimableAmount = 0;
    hasUserClaimed = false;
  }
}

// ==================== DISPLAY BOUNTY INFO ====================
function displayBountyInfo() {
  document.getElementById("taskTitle").textContent = bountyData.title;
  document.getElementById("taskDescription").textContent =
    bountyData.description;
  document.getElementById("taskDue").textContent = formatDate(
    bountyData.deadline,
  );
  document.getElementById("taskReward").textContent =
    `${bountyData.reward} ${bountyData.token || "INJ"}`;
  document.getElementById("taskCreator").textContent = shortenAddress(
    bountyData.creator,
  );
  document.getElementById("taskCategory").textContent =
    bountyData.category || "Uncategorized";
  document.getElementById("taskTags").textContent =
    bountyData.tags?.join(", ") || "No tags";

  const taskLink = document.getElementById("taskLink");
  if (bountyData.originLink && bountyData.originLink !== "") {
    taskLink.href = bountyData.originLink;
    taskLink.textContent =
      bountyData.originLink.length > 50
        ? bountyData.originLink.substring(0, 50) + "..."
        : bountyData.originLink;
  } else {
    taskLink.textContent = "No link provided";
    taskLink.href = "#";
    taskLink.classList.add("cursor-not-allowed", "opacity-50");
  }

  const statusBadge = document.getElementById("taskStatusBadge");
  const status = bountyData.status;
  if (status === "active") {
    statusBadge.textContent = "🟢 Active";
    statusBadge.className =
      "px-3 py-1 rounded-full text-sm font-semibold bg-green-900 text-green-300";
  } else if (status === "upcoming") {
    statusBadge.textContent = "🟡 Upcoming";
    statusBadge.className =
      "px-3 py-1 rounded-full text-sm font-semibold bg-yellow-900 text-yellow-300";
  } else {
    statusBadge.textContent = "⚫ Completed";
    statusBadge.className =
      "px-3 py-1 rounded-full text-sm font-semibold bg-gray-700 text-gray-300";
  }

  if (bountyData.blockchainId) {
    const blockchainInfo = document.getElementById("blockchainInfo");
    blockchainInfo.classList.remove("hidden");
    document.getElementById("chainStatus").textContent =
      "✅ Confirmed on blockchain";
    document.getElementById("bountyId").textContent = bountyData.blockchainId;
    document.getElementById("rewardsAssigned").textContent = bountyData
      .chainData?.rewardsAssigned
      ? "Yes"
      : "No";
  }
}

// ==================== UPDATE BUTTON STATES ====================
function updateButtonStates() {
  const isBountyActive = bountyData.status === "active";
  const isBountyCompleted = bountyData.status === "completed";
  const isBountyEnded = new Date(bountyData.deadline) < new Date();

  startTaskBtn.disabled = false;
  claimRewardBtn.disabled = false;
  submitBtn.disabled = false;

  // Update button text based on submission status
  if (hasUserSubmitted) {
    const status = userSubmissionData?.status || "pending";
    if (status === "pending") {
      submitBtn.innerHTML = "⏳ Submission Pending";
      submitBtn.classList.add("opacity-70");
    } else if (status === "accepted") {
      submitBtn.innerHTML = "✅ Submission Accepted";
      submitBtn.classList.add("opacity-70");
    } else if (status === "rejected") {
      submitBtn.innerHTML = "❌ Submission Rejected";
      submitBtn.classList.add("opacity-70");
    } else {
      submitBtn.innerHTML = "📝 Submitted";
      submitBtn.classList.add("opacity-70");
    }
  } else {
    submitBtn.innerHTML = "📝 Submit";
    submitBtn.classList.remove("opacity-70");
  }

  // Update tooltips
  if (isCreator) {
    startTaskBtn.title = "You cannot start your own task";
    claimRewardBtn.title = "Creator cannot claim reward";
    submitBtn.title = "Creator cannot submit to their own task";
  } else if (userEnrolled) {
    startTaskBtn.title = "You have already enrolled";
    if (hasUserSubmitted) {
      const status = userSubmissionData?.status || "pending";
      if (status === "pending")
        submitBtn.title = "Your submission is pending review";
      else if (status === "accepted")
        submitBtn.title = "Your submission was accepted!";
      else if (status === "rejected")
        submitBtn.title = "Your submission was rejected";
      else submitBtn.title = "You have already submitted";
    } else if (!isBountyActive) {
      submitBtn.title = "Task is not active";
    } else {
      submitBtn.title = "Submit your work";
    }
  } else {
    startTaskBtn.title = "Start this task";
    claimRewardBtn.title = !isBountyCompleted
      ? "Task must be completed first"
      : "Claim your reward";
    submitBtn.title = "You must start the task first";
  }

  if (hasUserClaimed) {
    claimRewardBtn.title = "Reward already claimed";
  } else if (claimableAmount === 0 && userEnrolled && !hasUserClaimed) {
    claimRewardBtn.title = "No reward assigned to you yet";
  }

  // Distribute Reward Button
  if (isCreator && isBountyEnded && !winnersData?.isDistributed) {
    distributeRewardBtn.disabled = false;
    distributeRewardBtn.title = "Distribute rewards to winners";
  } else {
    distributeRewardBtn.disabled = true;
    if (!isCreator)
      distributeRewardBtn.title =
        "Only the bounty creator can distribute rewards";
    else if (!isBountyEnded)
      distributeRewardBtn.title =
        "Cannot distribute until task deadline has passed";
    else if (winnersData?.isDistributed)
      distributeRewardBtn.title = "Rewards already distributed";
  }
}

// ==================== START TASK ====================
startTaskBtn.addEventListener("click", async () => {
  if (isCreator) {
    showToast("❌ You cannot start your own task", "warning");
    return;
  }

  if (userEnrolled) {
    showToast("ℹ️ You have already enrolled in this task", "info");
    return;
  }

  if (bountyData.status !== "active") {
    showToast("⚠️ This task is not currently active", "warning");
    return;
  }

  try {
    startTaskBtn.textContent = "Enrolling...";
    startTaskBtn.disabled = true;

    await fetch(`${API_BASE}/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bountyId: bountyData._id,
        user: currentUser,
      }),
    });

    showToast("✅ Successfully enrolled!", "success");
    userEnrolled = true;
    updateButtonStates();
  } catch (error) {
    console.error("Enrollment error:", error);
    showToast("Failed to enroll", "error");
  } finally {
    startTaskBtn.textContent = "🚀 Start Task";
    startTaskBtn.disabled = false;
  }
});

// ==================== CLAIM REWARD ====================
claimRewardBtn.addEventListener("click", async () => {
  if (isCreator) {
    showToast("❌ Creator cannot claim reward", "warning");
    return;
  }

  if (!userEnrolled) {
    showToast("ℹ️ You must start the task first", "info");
    return;
  }

  if (hasUserClaimed) {
    showToast("ℹ️ Reward already claimed", "info");
    return;
  }

  if (claimableAmount === 0) {
    showToast("⚠️ No reward has been assigned to you yet", "warning");
    return;
  }

  if (bountyData.status !== "completed") {
    showToast("⚠️ Task must be completed before claiming reward", "warning");
    return;
  }

  try {
    claimRewardBtn.textContent = "Claiming...";
    claimRewardBtn.disabled = true;

    if (bountyData.blockchainId) {
      showToast("📝 Please confirm transaction in your wallet...", "info");
      const result = await claimRewardOnChain(bountyData.blockchainId);

      if (result.success) {
        // Update off-chain database
        await claimRewardOffChain(bountyData._id, {
          winnerAddress: currentUser,
          txHash: result.txHash,
        });

        showToast(
          `✅ Reward claimed successfully! TX: ${result.txHash.slice(0, 10)}...`,
          "success",
        );
        hasUserClaimed = true;
        claimableAmount = 0;

        // Reload winners data
        await loadWinnersData();
        displayWinnersInfo();
      } else {
        throw new Error("Claim failed");
      }
    } else {
      // Off-chain only claim
      await claimRewardOffChain(bountyData._id, {
        winnerAddress: currentUser,
        txHash: null,
      });

      showToast(
        `✅ Claimed ${claimableAmount} ${bountyData.token}!`,
        "success",
      );
      hasUserClaimed = true;
      claimableAmount = 0;

      await loadWinnersData();
      displayWinnersInfo();
    }

    updateButtonStates();
  } catch (error) {
    console.error("Error claiming reward:", error);
    if (error.message.includes("rejected")) {
      showToast("❌ Transaction rejected by user", "error");
    } else {
      showToast(error.message || "Failed to claim reward", "error");
    }
  } finally {
    claimRewardBtn.textContent = "💰 Claim Reward";
    claimRewardBtn.disabled = false;
  }
});

// ==================== COMPRESS IMAGE FUNCTION ====================
function compressImage(file, maxWidth = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality,
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== SUBMIT BUTTON HANDLER ====================
submitBtn.addEventListener("click", () => {
  if (isCreator) {
    showToast("❌ You cannot submit to your own task", "warning");
    return;
  }

  if (!userEnrolled) {
    showToast("ℹ️ You must start the task first", "info");
    return;
  }

  if (hasUserSubmitted) {
    const status = userSubmissionData?.status || "submitted";
    if (status === "pending") {
      showToast(
        "ℹ️ You have already submitted. Your submission is pending review.",
        "info",
      );
    } else if (status === "accepted") {
      showToast(
        "✅ Your submission was accepted! You will receive rewards when distributed.",
        "success",
      );
    } else if (status === "rejected") {
      showToast(
        "❌ Your submission was rejected. You can submit again.",
        "warning",
      );
      hasUserSubmitted = false;
      userSubmissionData = null;
      const statusDiv = document.getElementById("submissionStatus");
      if (statusDiv) statusDiv.remove();
      submitBtn.innerHTML = "📝 Submit";
      submitBtn.classList.remove("opacity-70");
      if (imagePreview) imagePreview.classList.add("hidden");
      if (imageInput) imageInput.value = "";
      submitModal.classList.remove("hidden");
      submitModal.classList.add("flex");
      return;
    } else {
      showToast("ℹ️ You have already submitted for this task", "info");
    }
    return;
  }

  if (bountyData.status !== "active") {
    showToast("⚠️ This task is not currently active", "warning");
    return;
  }

  submitModal.classList.remove("hidden");
  submitModal.classList.add("flex");
});

// ==================== SUBMIT FORM HANDLER ====================
submitForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const imageFile = document.getElementById("image").files[0];
  const description = document.getElementById("description").value.trim();
  const link = document.getElementById("link").value.trim();

  if (!imageFile) {
    showToast("Please upload an image", "warning");
    return;
  }

  if (!description) {
    showToast("Please enter a description", "warning");
    return;
  }

  if (!link) {
    showToast("Please provide a proof link", "warning");
    return;
  }

  if (imageFile.size > 5 * 1024 * 1024) {
    showToast(
      "Image too large! Maximum 5MB. Please compress your image.",
      "warning",
    );
    return;
  }

  try {
    showToast("📸 Compressing image...", "info");
    const compressedImage = await compressImage(imageFile, 1024, 0.7);

    const reader = new FileReader();

    reader.onload = async (event) => {
      const imageBase64 = event.target.result;

      const submitButton = submitForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = "Submitting...";
      submitButton.disabled = true;

      try {
        const submissionData = {
          bountyId: bountyData._id,
          user: currentUser,
          description: description,
          projectLink: link,
          image: imageBase64,
          status: "pending",
          isSubmitted: true, // 👈 important
        };

        const result = await createSubmission(submissionData);

        if (result && result._id) {
          showToast(
            "✅ Task submitted successfully! Your submission is pending review.",
            "success",
          );
          hasUserSubmitted = true;
          userSubmissionData = {
            ...submissionData,
            _id: result._id,
            submittedAt: new Date().toISOString(),
            status: "pending",
          };

          displaySubmissionStatus();
          submitModal.classList.add("hidden");
          submitForm.reset();
          if (imagePreview) imagePreview.classList.add("hidden");
          if (imageSizeWarning) imageSizeWarning.classList.add("hidden");
          updateButtonStates();
        } else {
          throw new Error("Failed to submit");
        }
      } catch (error) {
        console.error("Error submitting task:", error);
        if (error.message.includes("413")) {
          showToast(
            "Image too large! Please use a smaller image (under 2MB).",
            "error",
          );
        } else {
          showToast(error.message || "Failed to submit task", "error");
        }
      } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }
    };

    reader.readAsDataURL(compressedImage);
  } catch (error) {
    console.error("Error processing image:", error);
    showToast("Failed to process image", "error");
  }
});

// ==================== MODAL CLOSE HANDLERS ====================
closeSubmitBtn.addEventListener("click", () => {
  submitModal.classList.add("hidden");
  submitForm.reset();
  if (imagePreview) imagePreview.classList.add("hidden");
  if (imageSizeWarning) imageSizeWarning.classList.add("hidden");
});

submitModal.addEventListener("click", (e) => {
  if (e.target === submitModal) {
    submitModal.classList.add("hidden");
    submitForm.reset();
    if (imagePreview) imagePreview.classList.add("hidden");
    if (imageSizeWarning) imageSizeWarning.classList.add("hidden");
  }
});

// ==================== DISTRIBUTE REWARD ====================
distributeRewardBtn.addEventListener("click", async () => {
  openDistributeModal();
});

function openDistributeModal() {
  const modal = distributeModal;
  document.getElementById("distributeBountyTitle").textContent =
    bountyData.title;
  document.getElementById("distributeRewardAmount").textContent =
    `${bountyData.reward} ${bountyData.token}`;

  let payoutTypeText = "Single Winner";
  if (bountyData.winnersAllowed > 1) {
    payoutTypeText = `${bountyData.winnersAllowed} Winners - ${bountyData.payoutType === "equal" ? "Equal Split" : "Percentage Split"}`;
  }
  document.getElementById("distributePayoutType").textContent = payoutTypeText;

  generateWinnerInputs();
  modal.classList.remove("hidden");
}

function generateWinnerInputs() {
  winnersInputsDiv.innerHTML = "";
  const winnerCount = bountyData.winnersAllowed || 1;

  if (bountyData.payoutType === "equal" || bountyData.winnersAllowed === 1) {
    const share = bountyData.reward / winnerCount;
    for (let i = 0; i < winnerCount; i++) {
      const inputDiv = document.createElement("div");
      inputDiv.className = "space-y-2";
      inputDiv.innerHTML = `
        <label class="text-white text-sm block">Winner ${i + 1} Address</label>
        <input type="text" class="winner-address w-full p-2 rounded bg-gray-700 text-white border border-gray-600" 
               placeholder="0x..." data-index="${i}">
        <p class="text-green-400 text-xs">Will receive: ${share.toFixed(4)} ${bountyData.token}</p>
      `;
      winnersInputsDiv.appendChild(inputDiv);
    }
  } else if (bountyData.payoutType === "percentage" && bountyData.percentages) {
    for (let i = 0; i < winnerCount; i++) {
      const percentage = bountyData.percentages[i] || 0;
      const amount = (bountyData.reward * percentage) / 100;
      const inputDiv = document.createElement("div");
      inputDiv.className = "space-y-2";
      inputDiv.innerHTML = `
        <label class="text-white text-sm block">Winner ${i + 1} Address (${percentage}%)</label>
        <input type="text" class="winner-address w-full p-2 rounded bg-gray-700 text-white border border-gray-600" 
               placeholder="0x..." data-index="${i}">
        <p class="text-green-400 text-xs">Will receive: ${amount.toFixed(4)} ${bountyData.token}</p>
      `;
      winnersInputsDiv.appendChild(inputDiv);
    }
  }
}

// Add global function for viewing submission image
window.viewSubmissionImage = (imageBase64) => {
  const imageWindow = window.open("");
  imageWindow.document.write(`
    <html>
      <head><title>Submission Image</title></head>
      <body style="display: flex; justify-content: center; align-items: center; background: black; margin: 0;">
        <img src="${imageBase64}" style="max-width: 100vw; max-height: 100vh; object-fit: contain;">
      </body>
    </html>
  `);
};

// ==================== CONFIRM DISTRIBUTION ====================
document
  .getElementById("confirmDistributeBtn")
  ?.addEventListener("click", async () => {
    try {
      const winnerInputs = document.querySelectorAll(".winner-address");
      const winners = [];
      for (let input of winnerInputs) {
        const address = input.value.trim();
        if (!address) {
          showToast("Please fill in all winner addresses", "warning");
          return;
        }
        if (!address.startsWith("0x") || address.length !== 42) {
          showToast(`Invalid address: ${address}`, "warning");
          return;
        }
        winners.push(address);
      }
      if (new Set(winners).size !== winners.length) {
        showToast("Duplicate winner addresses found", "warning");
        return;
      }
      if (
        !confirm(
          `Distribute ${bountyData.reward} ${bountyData.token} to ${winners.length} winner(s)?`,
        )
      ) {
        return;
      }
      distributeModal.classList.add("hidden");
      distributeRewardBtn.disabled = true;
      distributeRewardBtn.textContent = "Distributing...";

      let txHash = null;
      let percentages = [];

      if (bountyData.blockchainId) {
        showToast("📝 Please confirm transaction in your wallet...", "info");
        if (bountyData.payoutType === "percentage" && bountyData.percentages) {
          percentages = bountyData.percentages;
        }
        showToast("⚠️ Blockchain distribution not yet implemented", "warning");
      }

      // Call the API to distribute rewards
      const distributionResult = await distributeRewards(bountyData._id, {
        winners: winners,
        payoutType: bountyData.payoutType === "equal" ? "equal" : "percentage",
        percentages: percentages,
        txHash: txHash,
      });

      if (distributionResult) {
        showToast("✅ Rewards distributed successfully!", "success");

        // Reload winners data
        await loadWinnersData();
        displayWinnersInfo();
        updateButtonStates();
      } else {
        throw new Error("Distribution failed");
      }
    } catch (error) {
      console.error("Error distributing rewards:", error);
      showToast(error.message || "Failed to distribute rewards", "error");
    } finally {
      distributeRewardBtn.disabled = false;
      distributeRewardBtn.textContent = "🏆 Distribute Reward";
    }
  });

document
  .getElementById("closeDistributeModal")
  ?.addEventListener("click", () => {
    distributeModal.classList.add("hidden");
  });

document
  .getElementById("cancelDistributeBtn")
  ?.addEventListener("click", () => {
    distributeModal.classList.add("hidden");
  });

// ==================== COMMENTS ====================
async function loadComments() {
  try {
    const storedComments = localStorage.getItem(`comments_${bountyData._id}`);
    if (storedComments) {
      comments = JSON.parse(storedComments);
      displayComments();
    }
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}

function displayComments() {
  if (!commentsList) return;
  if (comments.length === 0) {
    commentsList.innerHTML =
      '<p class="text-gray-400 text-center py-4">No comments yet. Be the first to comment!</p>';
    return;
  }
  commentsList.innerHTML = comments
    .map(
      (comment) => `
    <div class="p-3 bg-gray-800 border border-gray-700 rounded-lg">
      <div class="flex justify-between items-start mb-2">
        <span class="font-semibold text-pink-400">${shortenAddress(comment.user)}</span>
        <span class="text-xs text-gray-500">${formatDate(comment.timestamp)}</span>
      </div>
      <p class="text-gray-300">${escapeHtml(comment.text)}</p>
    </div>
  `,
    )
    .join("");
}

addCommentBtn?.addEventListener("click", async () => {
  const commentText = newCommentInput.value.trim();
  if (!commentText) {
    showToast("Please enter a comment", "warning");
    return;
  }
  if (commentText.length > 500) {
    showToast("Comment too long (max 500 characters)", "warning");
    return;
  }
  const hasCommented = comments.some((c) => c.user === currentUser);
  if (hasCommented) {
    showToast("You can only comment once per bounty", "warning");
    return;
  }
  const newComment = {
    id: Date.now(),
    user: currentUser,
    text: commentText,
    timestamp: new Date().toISOString(),
  };
  comments.push(newComment);
  localStorage.setItem(`comments_${bountyData._id}`, JSON.stringify(comments));
  displayComments();
  newCommentInput.value = "";
  showToast("✅ Comment added!", "success");
});

// ==================== UTILITY FUNCTIONS ====================
function formatDate(dateString) {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600",
  };
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${colors[type]}`;
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, 3000);
}

// Menu toggles
document.querySelector(".plusbtn")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.querySelector(".plusmenu")?.classList.toggle("hidden");
});

document.querySelector(".profile")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.querySelector(".profilemenu")?.classList.toggle("hidden");
});

document.addEventListener("click", () => {
  document.querySelector(".plusmenu")?.classList.add("hidden");
  document.querySelector(".profilemenu")?.classList.add("hidden");
});
