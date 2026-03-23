// profile.js - Complete profile page functionality
import {
  getConnectedWallet,
  shortenAddress,
  disconnectWallet,
} from "./wallet.js";
import { initProfile } from "./initProfile.js";
import { getProfileInitials } from "./profileColor.js";
import {
  getUserProfile,
  getDashboardStats,
  getUserSubmissions,
} from "./api.js";

// ==================== DOM ELEMENTS ====================
const walletAddressElem = document.getElementById("walletAddress");
const reputationScoreElem =
  document.querySelector(".reputation-score") ||
  document.getElementById("reputationScore");
const totalEarningsElem =
  document.querySelector(".total-earnings") ||
  document.getElementById("totalEarnings");
const createdTasksElem = document.getElementById("createdTasks");
const totalCompletedElem = document.getElementById("totalCompleted");

// Bounty stats elements
const activeBountiesElem = document.getElementById("activeBounties");
const claimedBountiesElem = document.getElementById("claimedBounties");
const closedBountiesElem = document.getElementById("closedBounties");

// Submission stats elements
const pendingSubmissionsElem = document.getElementById("pendingSubmissions");
const acceptedSubmissionsElem = document.getElementById("acceptedSubmissions");
const rejectedSubmissionsElem = document.getElementById("rejectedSubmissions");

// Profile image element
const profileImageElem = document.querySelector(
  ".w-\\[50px\\].h-\\[50px\\].bg-white.rounded-full.md\\:w-\\[100px\\].md\\:h-\\[100px\\]",
);

// ==================== HELPER FUNCTIONS ====================

/**
 * Update profile image with consistent color based on wallet
 */
function updateProfileImage(wallet) {
  if (!profileImageElem) return;

  // Generate color from wallet address
  const hash = wallet.slice(2, 10);
  const hue = parseInt(hash, 16) % 360;
  const color = `hsl(${hue}, 70%, 60%)`;

  // Apply styling
  profileImageElem.style.background = color;
  profileImageElem.style.display = "flex";
  profileImageElem.style.alignItems = "center";
  profileImageElem.style.justifyContent = "center";
  profileImageElem.style.color = "white";
  profileImageElem.style.fontSize = "24px";
  profileImageElem.style.fontWeight = "bold";
  profileImageElem.textContent = getProfileInitials(wallet);

  // Add tooltip
  profileImageElem.title = `Wallet: ${shortenAddress(wallet)}`;
}

/**
 * Update all profile stats
 */
async function updateProfileStats(wallet) {
  try {
    // Show loading state
    showLoadingStates();

    // Get dashboard stats
    const dashboardData = await getDashboardStats(wallet);
    console.log("Dashboard data:", dashboardData);

    if (dashboardData) {
      // Update earnings
      if (totalEarningsElem) {
        const earnings = dashboardData.user?.totalEarnings || "0";
        const parts = earnings.toString().split(".");
        totalEarningsElem.textContent = parts[0];
        // If you want to show decimal
        const decimalSpan = totalEarningsElem.querySelector("span");
        if (decimalSpan) decimalSpan.textContent = parts[1] || "00";
      }

      // Update created tasks count
      if (createdTasksElem) {
        createdTasksElem.textContent = dashboardData.bounties?.total || 0;
      }

      // Update total completed tasks (from submissions)
      if (totalCompletedElem) {
        totalCompletedElem.textContent =
          dashboardData.submissions?.accepted || 0;
      }

      // Update reputation score (if available)
      if (reputationScoreElem) {
        const score = dashboardData.user?.reputationScore || 0;
        reputationScoreElem.textContent = `Reputation score: ${score}`;
      }

      // Update bounty stats
      if (activeBountiesElem) {
        activeBountiesElem.textContent = dashboardData.bounties?.active || 0;
      }

      if (claimedBountiesElem) {
        claimedBountiesElem.textContent =
          dashboardData.bounties?.completed || 0;
      }

      if (closedBountiesElem) {
        closedBountiesElem.textContent = dashboardData.bounties?.completed || 0;
      }
    }

    // Get user submissions for more detailed stats
    const submissionsData = await getUserSubmissions(wallet);
    console.log("Submissions data:", submissionsData);

    if (submissionsData) {
      // Update submission stats
      if (pendingSubmissionsElem) {
        pendingSubmissionsElem.textContent =
          submissionsData.stats?.pending || 0;
      }

      if (acceptedSubmissionsElem) {
        acceptedSubmissionsElem.textContent =
          submissionsData.stats?.accepted || 0;
      }

      if (rejectedSubmissionsElem) {
        rejectedSubmissionsElem.textContent =
          submissionsData.stats?.rejected || 0;
      }
    }

    // Try to get full user profile for additional data
    try {
      const userProfile = await getUserProfile(wallet);
      console.log("User profile:", userProfile);

      if (userProfile && userProfile.user) {
        // Update reputation score if available in user profile
        if (
          reputationScoreElem &&
          userProfile.user.reputationScore !== undefined
        ) {
          reputationScoreElem.textContent = `Reputation score: ${userProfile.user.reputationScore}`;
        }

        // Update created bounties count
        if (createdTasksElem && userProfile.createdBounties) {
          createdTasksElem.textContent = userProfile.createdBounties.length;
        }
      }
    } catch (error) {
      console.warn("Could not fetch full user profile:", error);
    }
  } catch (error) {
    console.error("Error updating profile stats:", error);
    showToast("Failed to load profile data", "error");
  } finally {
    hideLoadingStates();
  }
}

/**
 * Show loading states on all numeric elements
 */
function showLoadingStates() {
  const allStats = [
    totalEarningsElem,
    createdTasksElem,
    totalCompletedElem,
    activeBountiesElem,
    claimedBountiesElem,
    closedBountiesElem,
    pendingSubmissionsElem,
    acceptedSubmissionsElem,
    rejectedSubmissionsElem,
  ];

  allStats.forEach((elem) => {
    if (elem && elem.textContent === "0") {
      elem.style.opacity = "0.5";
      const originalText = elem.textContent;
      elem.setAttribute("data-original", originalText);
      elem.textContent = "...";
    }
  });
}

/**
 * Hide loading states
 */
function hideLoadingStates() {
  const allStats = [
    totalEarningsElem,
    createdTasksElem,
    totalCompletedElem,
    activeBountiesElem,
    claimedBountiesElem,
    closedBountiesElem,
    pendingSubmissionsElem,
    acceptedSubmissionsElem,
    rejectedSubmissionsElem,
  ];

  allStats.forEach((elem) => {
    if (elem && elem.textContent === "...") {
      elem.style.opacity = "1";
      const original = elem.getAttribute("data-original");
      if (original) elem.textContent = original;
    }
  });
}

/**
 * Display wallet address
 */
function displayWalletAddress() {
  const connectedWallet = getConnectedWallet();
  if (connectedWallet) {
    walletAddressElem.textContent = shortenAddress(connectedWallet);
    walletAddressElem.title = connectedWallet; // Show full address on hover
    return connectedWallet;
  } else {
    walletAddressElem.textContent = "Not connected";
    return null;
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = "info") {
  const existingToast = document.getElementById("profile-toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.id = "profile-toast";

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600",
  };

  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-opacity duration-300 ${colors[type]}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Copy wallet address to clipboard
 */
async function copyWalletAddress() {
  const wallet = getConnectedWallet();
  if (wallet) {
    try {
      await navigator.clipboard.writeText(wallet);
      showToast("✅ Wallet address copied!", "success");
    } catch (err) {
      showToast("Failed to copy address", "error");
    }
  }
}

// ==================== EVENT LISTENERS ====================

// Add click handler to copy wallet address when clicked
if (walletAddressElem) {
  walletAddressElem.style.cursor = "pointer";
  walletAddressElem.addEventListener("click", copyWalletAddress);
  walletAddressElem.title = "Click to copy full address";
}

// ==================== MENU TOGGLES ====================
const plus = document.querySelector(".plusbtn");
const plusMenu = document.querySelector(".plusmenu");

const profile = document.querySelector(".profile");
const profileMenu = document.querySelector(".profilemenu");

if (plus) {
  plus.addEventListener("click", (e) => {
    e.stopPropagation();
    if (plusMenu) plusMenu.classList.toggle("hidden");
    if (profileMenu) profileMenu.classList.add("hidden");
  });
}

if (profile) {
  profile.addEventListener("click", (e) => {
    e.stopPropagation();
    if (profileMenu) profileMenu.classList.toggle("hidden");
    if (plusMenu) plusMenu.classList.add("hidden");
  });
}

// Logout functionality
const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    disconnectWallet();
  });
}

// Close menus when clicking outside
document.addEventListener("click", () => {
  if (plusMenu) plusMenu.classList.add("hidden");
  if (profileMenu) profileMenu.classList.add("hidden");
});

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Profile page loaded");

  // Display wallet address and get wallet
  const wallet = displayWalletAddress();

  if (!wallet) {
    showToast("Please connect your wallet first", "warning");
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 2000);
    return;
  }

  // Update profile image with consistent color
  updateProfileImage(wallet);

  // Initialize profile circle in header
  await initProfile();

  // Load and display all profile stats
  await updateProfileStats(wallet);

  // Optional: Refresh stats every 30 seconds
  setInterval(async () => {
    if (getConnectedWallet()) {
      await updateProfileStats(wallet);
    }
  }, 30000);
});

// Export for debugging
window.profileData = {
  updateProfileStats,
  displayWalletAddress,
};
