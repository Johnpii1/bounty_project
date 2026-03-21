// task.js - Complete bounty details page functionality
import {
  getBountyById,
  updateBounty,
  createSubmission,
  getUserProfile,
} from "./api.js";
import { getConnectedWallet, shortenAddress } from "./wallet.js";
import {
  claimReward,
  getBountyDetails,
  getClaimableReward,
  hasClaimed,
  delay,
} from "./contractService.js";

// ==================== STATE MANAGEMENT ====================
let bountyData = null;
let currentUser = null;
let userEnrolled = false;
let isCreator = false;
let claimableAmount = 0;
let hasUserClaimed = false;
let comments = [];

// ==================== DOM ELEMENTS ====================
const loadingState = document.getElementById("loadingState");
const taskCard = document.getElementById("taskCard");
const commentsSection = document.getElementById("commentsSection");
const startTaskBtn = document.getElementById("startTaskBtn");
const claimRewardBtn = document.getElementById("claimRewardBtn");
const distributeRewardBtn = document.getElementById("distributeRewardBtn");
const addCommentBtn = document.getElementById("addCommentBtn");
const newCommentInput = document.getElementById("newComment");
const commentsList = document.getElementById("commentsList");
const distributeModal = document.getElementById("distributeModal");
const winnersInputsDiv = document.getElementById("winnersInputs");

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Task details page loaded");
  let bountyId = 0;

  const storedBounty = sessionStorage.getItem("viewBounty");
  if (storedBounty) {
    const bounty = JSON.parse(storedBounty);
    bountyId = bounty._id;
    // console.log(`bountyid ${bountyId}`);
    // Optionally clear it after use
    // sessionStorage.removeItem("viewBounty");
  }

  // Get bounty ID from URL
  // const urlParams = new URLSearchParams(window.location.search);
  // const bountyId = urlParams.get("id");

  if (!bountyId) {
    showToast("No bounty ID provided", "error");
    // setTimeout(() => (window.location.href = "./user_dashboard.html"), 2000);
    return;
  }

  // Get connected wallet
  currentUser = getConnectedWallet();
  if (!currentUser) {
    showToast("Please connect your wallet first", "warning");
    console.log(`user ${currentUser}`);
    setTimeout(() => (window.location.href = "./index.html"), 2000);
    return;
  }

  console.log("Task details page loaded");

  // Load bounty details
  await loadBountyDetails(bountyId);
});

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

    // Check if rewards are claimable
    if (!isCreator && userEnrolled) {
      await checkClaimableReward();
    }

    // Display bounty info
    displayBountyInfo();

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

// ==================== DISPLAY BOUNTY INFO ====================
function displayBountyInfo() {
  // Basic info
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

  // Project link
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

  // Status badge
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

  // Blockchain info if available
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

// ==================== CHECK USER ENROLLMENT ====================
async function checkUserEnrollment() {
  try {
    // Check if user has already submitted to this bounty
    const response = await fetch(
      `http://localhost:5000/submissions/user/${currentUser}`,
    );
    const data = await response.json();

    if (data.submissions) {
      userEnrolled = data.submissions.some(
        (sub) => sub.bountyId === bountyData._id,
      );
    }

    console.log("User enrolled:", userEnrolled);
  } catch (error) {
    console.error("Error checking enrollment:", error);
    userEnrolled = false;
  }
}

// ==================== CHECK CLAIMABLE REWARD ====================
async function checkClaimableReward() {
  try {
    if (bountyData.blockchainId) {
      // Check on blockchain
      const amount = await getClaimableReward(
        bountyData.blockchainId,
        currentUser,
      );
      claimableAmount = parseFloat(amount);

      // Check if already claimed
      const claimed = await hasClaimed(bountyData.blockchainId, currentUser);
      hasUserClaimed = claimed;

      console.log(
        `Claimable amount: ${claimableAmount}, Already claimed: ${hasUserClaimed}`,
      );
    } else {
      // Check from database
      if (bountyData.winners && bountyData.winners.assigned) {
        const winner = bountyData.winners.assigned.find(
          (w) => w.address === currentUser,
        );
        if (winner && !winner.claimed) {
          claimableAmount = winner.amount;
          hasUserClaimed = false;
        } else if (winner && winner.claimed) {
          hasUserClaimed = true;
        }
      }
    }
  } catch (error) {
    console.error("Error checking claimable reward:", error);
    claimableAmount = 0;
    hasUserClaimed = false;
  }
}

// ==================== UPDATE BUTTON STATES ====================
function updateButtonStates() {
  const isBountyActive = bountyData.status === "active";
  const isBountyCompleted = bountyData.status === "completed";
  const isBountyEnded = new Date(bountyData.deadline) < new Date();

  // Start Task Button
  if (!isCreator && !userEnrolled && isBountyActive) {
    startTaskBtn.disabled = false;
    startTaskBtn.title = "Start this task";
  } else {
    startTaskBtn.disabled = true;
    if (isCreator) startTaskBtn.title = "You cannot start your own task";
    else if (userEnrolled) startTaskBtn.title = "You have already enrolled";
    else if (!isBountyActive) startTaskBtn.title = "Task is not active";
  }

  // Claim Reward Button
  if (
    !isCreator &&
    userEnrolled &&
    claimableAmount > 0 &&
    !hasUserClaimed &&
    isBountyCompleted
  ) {
    claimRewardBtn.disabled = false;
    claimRewardBtn.title = `Claim ${claimableAmount} ${bountyData.token}`;
  } else {
    claimRewardBtn.disabled = true;
    if (isCreator) claimRewardBtn.title = "Creator cannot claim reward";
    else if (!userEnrolled)
      claimRewardBtn.title = "You must start the task first";
    else if (hasUserClaimed) claimRewardBtn.title = "Reward already claimed";
    else if (claimableAmount === 0)
      claimRewardBtn.title = "No reward assigned to you";
    else if (!isBountyCompleted)
      claimRewardBtn.title = "Task must be completed first";
  }

  // Distribute Reward Button (only creator, only after deadline)
  if (isCreator && isBountyEnded && !bountyData.rewardsAssignedOnChain) {
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
    else if (bountyData.rewardsAssignedOnChain)
      distributeRewardBtn.title = "Rewards already distributed";
  }
}

// ==================== START TASK ====================
startTaskBtn.addEventListener("click", async () => {
  try {
    startTaskBtn.disabled = true;
    startTaskBtn.textContent = "Enrolling...";

    // Create submission in database
    const submissionData = {
      bountyId: bountyData._id,
      user: currentUser,
      description: "Started working on this task",
      projectLink: "In progress",
      image: "",
    };

    const result = await createSubmission(submissionData);

    if (result && result._id) {
      showToast("✅ Successfully enrolled in this task!", "success");
      userEnrolled = true;
      updateButtonStates();

      // Also update on blockchain if needed
      if (bountyData.blockchainId) {
        // Optional: Call blockchain submit function
        console.log("Would call blockchain submit here");
      }
    } else {
      throw new Error("Failed to enroll");
    }
  } catch (error) {
    console.error("Error starting task:", error);
    showToast(error.message || "Failed to enroll in task", "error");
    startTaskBtn.disabled = false;
  } finally {
    startTaskBtn.textContent = "🚀 Start Task";
  }
});

// ==================== CLAIM REWARD ====================
claimRewardBtn.addEventListener("click", async () => {
  try {
    claimRewardBtn.disabled = true;
    claimRewardBtn.textContent = "Claiming...";

    if (bountyData.blockchainId) {
      // Claim on blockchain
      showToast("📝 Please confirm transaction in your wallet...", "info");
      const result = await claimReward(bountyData.blockchainId);

      if (result.success) {
        showToast(
          `✅ Reward claimed successfully! TX: ${result.txHash.slice(0, 10)}...`,
          "success",
        );
        hasUserClaimed = true;
        claimableAmount = 0;

        // Update database
        await updateBounty(bountyData._id, {
          "winners.claimed": [
            ...(bountyData.winners?.claimed || []),
            currentUser,
          ],
        });
      } else {
        throw new Error("Claim failed");
      }
    } else {
      // Claim from database (if not on blockchain)
      showToast(
        `✅ Claimed ${claimableAmount} ${bountyData.token}!`,
        "success",
      );
      hasUserClaimed = true;
      claimableAmount = 0;

      // Update database
      await updateBounty(bountyData._id, {
        "winners.claimed": [
          ...(bountyData.winners?.claimed || []),
          currentUser,
        ],
      });
    }

    updateButtonStates();
  } catch (error) {
    console.error("Error claiming reward:", error);
    if (error.message.includes("rejected")) {
      showToast("❌ Transaction rejected by user", "error");
    } else {
      showToast(error.message || "Failed to claim reward", "error");
    }
    claimRewardBtn.disabled = false;
  } finally {
    claimRewardBtn.textContent = "💰 Claim Reward";
  }
});

// ==================== DISTRIBUTE REWARD ====================
distributeRewardBtn.addEventListener("click", async () => {
  // Show modal
  openDistributeModal();
});

function openDistributeModal() {
  const modal = distributeModal;

  // Set modal content
  document.getElementById("distributeBountyTitle").textContent =
    bountyData.title;
  document.getElementById("distributeRewardAmount").textContent =
    `${bountyData.reward} ${bountyData.token}`;

  // Show payout type
  let payoutTypeText = "Single Winner";
  if (bountyData.winnersAllowed > 1) {
    payoutTypeText = `${bountyData.winnersAllowed} Winners - ${bountyData.payoutType === "equal" ? "Equal Split" : "Percentage Split"}`;
  }
  document.getElementById("distributePayoutType").textContent = payoutTypeText;

  // Generate winner input fields
  generateWinnerInputs();

  // Show modal
  modal.classList.remove("hidden");
}

function generateWinnerInputs() {
  winnersInputsDiv.innerHTML = "";

  const winnerCount = bountyData.winnersAllowed || 1;

  if (bountyData.payoutType === "equal" || bountyData.winnersAllowed === 1) {
    // Equal split or single winner
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
    // Percentage split
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

// Confirm distribution
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

      // Check for duplicates
      if (new Set(winners).size !== winners.length) {
        showToast("Duplicate winner addresses found", "warning");
        return;
      }

      // Confirm with user
      if (
        !confirm(
          `Distribute ${bountyData.reward} ${bountyData.token} to ${winners.length} winner(s)?`,
        )
      ) {
        return;
      }

      // Close modal
      distributeModal.classList.add("hidden");

      // Show loading
      distributeRewardBtn.disabled = true;
      distributeRewardBtn.textContent = "Distributing...";

      // Call blockchain function to assign winners
      if (bountyData.blockchainId) {
        showToast("📝 Please confirm transaction in your wallet...", "info");

        // Prepare percentages if needed
        let percentages = [];
        if (bountyData.payoutType === "percentage" && bountyData.percentages) {
          percentages = bountyData.percentages;
        } else if (bountyData.payoutType === "equal") {
          // Equal split - percentages not needed, just array of winners
          percentages = [];
        }

        // Call assign winners function (you'll need to implement this in contractService)
        // For now, we'll simulate success
        showToast("⚠️ Blockchain distribution not yet implemented", "warning");

        // Update database
        await updateBounty(bountyData._id, {
          winners: { assigned: winners, claimed: [] },
          rewardsAssignedOnChain: true,
        });
      } else {
        // Just update database
        await updateBounty(bountyData._id, {
          winners: { assigned: winners, claimed: [] },
          rewardsAssignedOnChain: true,
        });
      }

      showToast("✅ Rewards distributed successfully!", "success");
      bountyData.rewardsAssignedOnChain = true;
      updateButtonStates();
    } catch (error) {
      console.error("Error distributing rewards:", error);
      showToast(error.message || "Failed to distribute rewards", "error");
    } finally {
      distributeRewardBtn.disabled = false;
      distributeRewardBtn.textContent = "🏆 Distribute Reward";
    }
  });

// Close modal buttons
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
    // Load comments from localStorage or backend
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

  // Check if user already commented
  const hasCommented = comments.some((c) => c.user === currentUser);
  if (hasCommented) {
    showToast("You can only comment once per bounty", "warning");
    return;
  }

  // Add comment
  const newComment = {
    id: Date.now(),
    user: currentUser,
    text: commentText,
    timestamp: new Date().toISOString(),
  };

  comments.push(newComment);

  // Save to localStorage
  localStorage.setItem(`comments_${bountyData._id}`, JSON.stringify(comments));

  // Display
  displayComments();

  // Clear input
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
