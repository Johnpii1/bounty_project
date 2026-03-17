// frontend/dashboard.js - Connect HTML to backend
import { getConnectedWallet, disconnectWallet } from "./wallet.js"; // Your wallet connection function

getConnectedWallet(); // Check if wallet is connected on page load

const API_BASE = "http://localhost:5000/api";

// ==================== CREATE NEW BOUNTY ====================
// This function collects data from your create.html form and sends to backend
export async function createBounty(bountyData) {
  try {
    // Get connected wallet
    const wallet = getConnectedWallet();

    if (!wallet) {
      showToast("Please connect your wallet first", "warning");
      return { success: false, error: "Wallet not connected" };
    }

    // Add creator wallet address to bounty data
    bountyData.creator = wallet;

    // Calculate status based on dates
    const startDate = new Date(bountyData.startDate);
    const deadline = new Date(bountyData.deadline);
    const now = new Date();

    // Determine status
    let status;
    if (now < startDate) status = "upcoming";
    else if (now >= startDate && now <= deadline) status = "active";
    else status = "completed";

    // Format the bounty object exactly like your example
    const bounty = {
      title: bountyData.title,
      description: bountyData.description,
      category: bountyData.category,
      tags: bountyData.tags || [],
      reward: bountyData.reward,
      token: bountyData.token,
      startDate: startDate,
      deadline: deadline,
      winnersAllowed: bountyData.winnersAllowed || 1,
      payoutType: bountyData.payoutType || "single", // single, equal, percentage
      percentages: bountyData.percentages || [], // for percentage split
      network: bountyData.network || "injective",
      originLink: bountyData.originLink || "",
      creator: wallet,
      status: status, // Set initial status
      createdAt: new Date(),
    };

    console.log("📤 Sending bounty to backend:", bounty);

    // Send to backend
    const response = await fetch(`${API_BASE}/bounties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bounty),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create bounty");
    }

    showToast("✅ Bounty created successfully!", "success");

    // Redirect to dashboard after 1.5 seconds
    setTimeout(() => {
      window.location.href = "./user_dashboard.html";
    }, 1500);

    return { success: true, data };
  } catch (error) {
    console.error("Error creating bounty:", error);
    showToast(error.message || "Failed to create bounty", "error");
    return { success: false, error: error.message };
  }
}
/*
// ==================== HELPER: Calculate bounty status ====================
export function calculateBountyStatus(startDate, deadline) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(deadline);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "completed";
}

// ==================== LOAD AND DISPLAY BOUNTIES ====================
async function loadBounties(filterStatus = "all") {
  try {
    // Build URL with filters
    let url = `${API_BASE}/bounties`;
    if (filterStatus !== "all") {
      url += `?status=${filterStatus}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load bounties");
    }

    renderBounties(data.bounties);
    updatePagination(data.pagination);
  } catch (error) {
    console.error("Error loading bounties:", error);
    showToast("Failed to load bounties", "error");
  }
}

// ==================== RENDER BOUNTY CARDS ====================
function renderBounties(bounties) {
  const container = document.querySelector(".grid");
  if (!container) return;

  if (bounties.length === 0) {
    container.innerHTML = `
            <div class="col-span-full text-center text-white py-20">
                <p class="text-xl">No bounties found</p>
                <p class="text-gray-400 mt-2">Be the first to create a bounty!</p>
                <a href="./create.html" class="inline-block mt-4 px-6 py-2 bg-pink-500 rounded-lg hover:bg-pink-600">
                    Create Bounty
                </a>
            </div>
        `;
    return;
  }

  container.innerHTML = bounties
    .map((bounty) => {
      // Format reward display
      const rewardDisplay = bounty.reward?.amount
        ? `${bounty.reward.amount} ${bounty.reward.token}`
        : "Reward TBD";

      // Determine button text based on status
      const buttonText =
        bounty.status === "active" ? "Start Task" : "View Details";
      const buttonDisabled =
        bounty.status !== "active" ? "opacity-50 cursor-not-allowed" : "";

      return `
        <div class="task-box p-6 text-white">
            <div class="bg-[#2D2D2D] rounded-[17px] border border-white/50">
                <div class="flex justify-between items-center px-4">
                    <h3 class="text-white text-sm md:text-[18px]">
                        ${bounty.category || "Uncategorized"}
                    </h3>

                    <div class="relative flex flex-col items-center py-2">
                        <span class="absolute top-0 -left-[5%] border h-[66px] border-white/50"></span>
                        <h4 class="flex gap-4 items-center text-white text-xs md:text-[14px]">
                            <p class="bg-white rounded-full w-[35px] h-[26px]"></p>
                            Rewards
                        </h4>
                        <p class="text-white text-xs md:text-[16px]">${rewardDisplay}</p>
                    </div>
                </div>

                <div class="border-b border-white/50 mt-2"></div>

                <div class="flex flex-col gap-6 m-4">
                    <h3 class="text-white text-sm md:text-md">${bounty.title}</h3>

                    <p class="text-white text-xs md:text-sm">
                        ${bounty.description?.substring(0, 100)}${bounty.description?.length > 100 ? "..." : ""}
                    </p>

                    <h3 class="text-white text-sm md:text-md">
                        Tags: ${bounty.tags?.join(", ") || "No tags"}
                    </h3>

                    <h3 class="text-white text-sm md:text-md">
                        🗓 Deadline: ${new Date(bounty.timeline?.deadline).toLocaleDateString()} | 
                        Status: <span class="${getStatusColor(bounty.status)}">${bounty.status}</span>
                    </h3>

                    <div class="flex justify-between items-center px-4">
                        <button onclick="viewBountyDetails('${bounty._id}')" class="border-none text-white text-xs">
                            ➤ View Details |
                        </button>

                        <button 
                            onclick="startBounty('${bounty._id}')" 
                            class="hover:border hover:border-white hover:bg-[#FF1AC69E] rounded-lg px-4 py-1 text-white text-xs ${buttonDisabled}"
                            ${bounty.status !== "active" ? "disabled" : ""}
                        >
                            ${buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    })
    .join("");
}

// Helper for status colors
function getStatusColor(status) {
  switch (status) {
    case "active":
      return "text-green-500";
    case "upcoming":
      return "text-yellow-500";
    case "completed":
      return "text-gray-500";
    default:
      return "text-white";
  }
}

// ==================== VIEW BOUNTY DETAILS ====================
window.viewBountyDetails = async function (bountyId) {
  // Store bounty ID in session storage and navigate to details page
  sessionStorage.setItem("viewBountyId", bountyId);
  window.location.href = "./bounty-details.html";
};

// ==================== START TASK / SUBMIT ====================
window.startBounty = async function (bountyId) {
  const wallet = getConnectedWallet();

  if (!wallet) {
    showToast("Please connect your wallet first", "warning");
    // Trigger wallet connect modal here
    return;
  }

  // Check if user already submitted
  try {
    const response = await fetch(`${API_BASE}/submissions/user/${wallet}`);
    const data = await response.json();

    const alreadySubmitted = data.submissions.some(
      (s) => s.bountyId === bountyId,
    );

    if (alreadySubmitted) {
      showToast("You have already submitted to this bounty", "info");
      return;
    }

    // Store bounty ID and redirect to submission page
    sessionStorage.setItem("submissionBountyId", bountyId);
    window.location.href = "./submit.html";
  } catch (error) {
    console.error("Error checking submissions:", error);
    showToast("Error starting task", "error");
  }
};

// ==================== PAGINATION ====================
function updatePagination(pagination) {
  const container = document.getElementById("pagination");
  if (!container || !pagination) return;

  let html = "";
  for (let i = 1; i <= pagination.pages; i++) {
    html += `
            <button 
                onclick="loadBountiesPage(${i})"
                class="px-3 py-1 rounded ${i === pagination.page ? "bg-pink-500" : "bg-gray-700"} text-white"
            >
                ${i}
            </button>
        `;
  }
  container.innerHTML = html;
}

window.loadBountiesPage = function (page) {
  // Get current filter from URL or state
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get("status") || "all";
  loadBounties(status, page);
};

// ==================== SORTING AND FILTERING ====================
// Sort by dropdown
document.getElementById("sortby")?.addEventListener("click", function () {
  document.getElementById("sortmenu")?.classList.toggle("hidden");
});

// Filter options
document.querySelectorAll("#sortmenu span").forEach((option) => {
  option.addEventListener("click", function () {
    const status = this.textContent.toLowerCase();
    loadBounties(status);
    document.getElementById("sortmenu")?.classList.add("hidden");

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set("status", status);
    window.history.pushState({}, "", url);
  });
});

// ==================== SEARCH ====================
let searchTimeout;
document
  .querySelector("input[type='search']")
  ?.addEventListener("input", function (e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const searchTerm = e.target.value;
      if (searchTerm.length > 2) {
        searchBounties(searchTerm);
      } else if (searchTerm.length === 0) {
        loadBounties();
      }
    }, 500);
  });

async function searchBounties(term) {
  try {
    const response = await fetch(`${API_BASE}/bounties?search=${term}`);
    const data = await response.json();
    renderBounties(data.bounties);
  } catch (error) {
    console.error("Search error:", error);
  }
}*/

// ==================== TOAST NOTIFICATION ====================
export function showToast(message, type = "info") {
  // Create toast element if it doesn't exist
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className =
      "fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-opacity duration-300";
    document.body.appendChild(toast);
  }

  // Set color based on type
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-opacity duration-300 ${colors[type] || colors.info}`;

  toast.textContent = message;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 3000);
}
/*

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  // Get filter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const status = urlParams.get("status") || "all";
  loadBounties(status);
});*/

document.addEventListener("DOMContentLoaded", () => {

  const logout = document.querySelector(".logout");

  if (logout) {
    logout.addEventListener("click", () => {
      disconnectWallet();

      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1500);
    });
  }

});

// Jp handling starts here

//FOR SORT BY FOR DESKTOP
const sort = document.getElementById("sortby");
const menu1 = document.getElementById("sortmenu");

if (sort && menu1) {
  sort.addEventListener("click", () => {
    menu1.classList.toggle("hidden");
  });

  if (sort && menu1) {
    sort.addEventListener("mouseleave", () => {
      menu1.classList.add("hidden");
    });
  }
}

//FOR SORT BY FOR MOBILE
const sort1 = document.getElementById("sortby1");
const menu2 = document.getElementById("sortmenu1");

if (sort && menu1) {
  sort1.addEventListener("click", () => {
    menu2.classList.toggle("hidden");
  });

  if (sort && menu1) {
    sort1.addEventListener("mouseleave", () => {
      menu2.classList.add("hidden");
    });
  }
}

//FOR ADD
const plus = document.querySelector(".plusbtn");
const plusMenu = document.querySelector(".plusmenu");

//FOR PROFILE
const profile = document.querySelector(".profile");
const profileMenu = document.querySelector(".profilemenu");

plus.addEventListener("click", (e) => {
  e.stopPropagation();

  plusMenu.classList.toggle("hidden");
  profileMenu.classList.add("hidden"); // close profile menu
});

//FOR PROFILE
profile.addEventListener("click", (e) => {
  e.stopPropagation();

  profileMenu.classList.toggle("hidden");
  plusMenu.classList.add("hidden"); // close plus menu
});

document.addEventListener("click", () => {
  plusMenu.classList.add("hidden");
  profileMenu.classList.add("hidden");
});



//FOR CREAT
const boxes = document.querySelectorAll(".task-box");

const perPage = 4;
const totalPages = Math.ceil(boxes.length / perPage);

let currentPage = 1;
const visibleButtons = 4;

const container = document.getElementById("pagination");

function showBoxes(page) {
  const start = (page - 1) * perPage;
  const end = page * perPage;

  boxes.forEach((box, index) => {
    if (index >= start && index < end) {
      box.style.display = "block";
    } else {
      box.style.display = "none";
    }
  });
}
if (window.location.href.endsWith("user_dashboard.html")) {
  function renderButtons() {
    container.innerHTML = "";

    let start = Math.max(1, currentPage - 2);
    let end = start + visibleButtons - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - visibleButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement("button");

      btn.textContent = i;

      btn.className =
        "text-white border border-white bg-gray-800 rounded-lg px-3 h-[30px]";

      if (i === currentPage) {
        btn.classList.remove("bg-gray-800");
        btn.classList.add("bg-pink-600");
      }

      btn.onclick = () => {
        currentPage = i;

        renderButtons();
        showBoxes(currentPage);
      };

      container.appendChild(btn);
    }
  }

  renderButtons();
  showBoxes(1);
}
