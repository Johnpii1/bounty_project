// dashboard.js
import { fetchBounties } from "./api.js";
import { getConnectedWallet } from "./wallet.js";
import { initProfile } from "./initProfile.js";

// ==================== STATE MANAGEMENT ====================
let currentPage = 0;
let currentFilter = "all";
let totalBounties = 0;
const BOUNTIES_PER_PAGE = 6;

// ==================== DOM ELEMENTS ====================
const gridContainer = document.getElementById("gridContainer");
const totalTasksElement = document.querySelector(
  ".border.border-white\\/70 .font-semibold",
);
// Fix these selectors - they were targeting the stats boxes in the dashboard
const completedTasksElement = document.getElementById("completed-tasks");

const inProgressElement = document.getElementById("in-progress-tasks");
const earningsElement = document.querySelector("h4.text-white.text-2xl");
const walletAddressElement = document.querySelector(".bg-white.rounded-full"); // Profile circle
const paginationContainer = document.getElementById("pagination");

// ==================== INITIALIZATION ====================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Dashboard loaded");

  // Initialize profile circle
  await initProfile();

  // Check wallet connection
  const wallet = getConnectedWallet();
  if (wallet) {
    updateWalletDisplay(wallet);
    await loadDashboardStats(wallet);
  }

  // Load bounties
  await loadBounties(currentFilter, currentPage);

  // Setup event listeners
  setupEventListeners();
});

// ==================== LOAD BOUNTIES ====================
async function loadBounties(filter = "all", page = 0) {
  try {
    // Show loading state
    showLoading();

    // Prepare filters
    const filters = {
      page: page,
      limit: BOUNTIES_PER_PAGE,
    };

    if (filter !== "all") {
      filters.status = filter;
    }

    // Fetch bounties from API
    const response = await fetchBounties(filters);

    if (response && response.bounties) {
      const bounties = response.bounties;
      totalBounties = response.pagination?.total || 0;

      // Update the UI
      renderBounties(bounties);
      updatePagination(response.pagination);
      updateTotalTasksCount(totalBounties);

      console.log(
        `Loaded ${bounties.length} bounties, Total: ${totalBounties}`,
      );
      console.log("Pagination:", response.pagination);
    } else {
      // If no bounties, show empty state
      renderEmptyState();
      updatePagination(null); // Clear pagination
    }
  } catch (error) {
    console.error("Error loading bounties:", error);
    showToast("Failed to load bounties", "error");
    renderEmptyState();
  }
}

// ==================== RENDER BOUNTIES ====================
function renderBounties(bounties) {
  if (!gridContainer) return;

  // Clear existing content but keep the grid structure
  gridContainer.innerHTML = "";

  if (bounties.length === 0) {
    renderEmptyState();
    return;
  }

  // Render each bounty
  bounties.forEach((bounty, index) => {
    const bountyCard = createBountyCard(bounty, index);
    gridContainer.appendChild(bountyCard);
  });

  // If we have less than BOUNTIES_PER_PAGE, add placeholder cards
  // to maintain the grid layout
  const remainingSlots = BOUNTIES_PER_PAGE - bounties.length;
  for (let i = 0; i < remainingSlots; i++) {
    const placeholderCard = createPlaceholderCard();
    gridContainer.appendChild(placeholderCard);
  }
}

// ==================== CREATE BOUNTY CARD ====================
function createBountyCard(bounty) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "task-box p-6 text-white h-full";
  cardDiv.setAttribute("data-bounty-id", bounty._id);

  // Format date
  const deadline = new Date(bounty.deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Determine status color
  const statusColor = getStatusColor(bounty.status);

  // Format tags
  const tags =
    bounty.tags && bounty.tags.length > 0 ? bounty.tags.join(", ") : "No tags";

  // Format reward
  const rewardDisplay = bounty.reward
    ? `${bounty.reward} ${bounty.token || "ETH"}`
    : "Reward TBD";

  // Truncate description
  const description =
    bounty.description?.length > 80
      ? bounty.description.substring(0, 80) + "..."
      : bounty.description || "No description provided";

  cardDiv.innerHTML = `
        <div class="bg-[#2D2D2D] rounded-[17px] border border-white/50 h-auto flex flex-col justify-between min-w-[260px]">
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
                <h3 class="text-white text-sm md:text-md">${bounty.title || "Untitled Task"}</h3>

                <p class="text-white text-xs md:text-sm">
                    ${description}
                </p>

                <h3 class="text-white text-sm md:text-md">
                    Tags: ${tags}
                </h3>

                <h3 class="text-white text-sm md:text-md">
                    🗓 Deadline: ${deadline} | Status: <span class="${statusColor}">${bounty.status || "Open"}</span>
                </h3>

                <div class="flex justify-between items-center px-2">
                    <a href="./taskdetails.html" class="Details-btn hover:border hover:border-white hover:bg-[#FF1AC69E] rounded-lg px-2 py-1 text-white text-xs">
                        ➤ View Details |
                    </a>

                    <a href="./taskdetails.html" class="start-task-btn hover:border hover:border-white hover:bg-[#FF1AC69E] rounded-lg px-4 py-1 text-white text-xs">
                        Start Task
                    </a>
                </div>
            </div>
        </div>
    `;

  // Add event listeners
  const detailsBtn = cardDiv.querySelector(".Details-btn");
  const startBtn = cardDiv.querySelector(".start-task-btn");

  detailsBtn.addEventListener("click", () => showBountyDetails(bounty));
  startBtn.addEventListener("click", () => showBountyDetails(bounty));
  // startBtn.addEventListener("click", () => startBounty(bounty._id));

  return cardDiv;
}

// ==================== CREATE PLACEHOLDER CARD ====================
function createPlaceholderCard() {
  const cardDiv = document.createElement("div");
  cardDiv.className = "task-box p-6 text-white opacity-30";
  cardDiv.innerHTML = `
        <div class="bg-[#2D2D2D] rounded-[17px] border border-white/50">
            <div class="flex justify-between items-center px-4">
                <h3 class="text-white text-sm md:text-[18px]">
                    Coming Soon
                </h3>
                <div class="relative flex flex-col items-center py-2">
                    <span class="absolute top-0 -left-[5%] border h-[66px] border-white/50"></span>
                    <h4 class="flex gap-4 items-center text-white text-xs md:text-[14px]">
                        <p class="bg-white rounded-full w-[35px] h-[26px]"></p>
                        Rewards
                    </h4>
                    <p class="text-white text-xs md:text-[16px]">---</p>
                </div>
            </div>
            <div class="border-b border-white/50 mt-2"></div>
            <div class="flex flex-col gap-6 m-4">
                <h3 class="text-white text-sm md:text-md">New tasks coming soon</h3>
                <p class="text-white text-xs md:text-sm">Check back later for more opportunities</p>
                <h3 class="text-white text-sm md:text-md">Tags: ---</h3>
                <h3 class="text-white text-sm md:text-md">🗓 Deadline: --- | Status: ---</h3>
                <div class="flex justify-between items-center px-4">
                    <button class="border-none text-white text-xs opacity-50">➤ View Details |</button>
                    <button class="opacity-50 rounded-lg px-4 py-1 text-white text-xs">Start Task</button>
                </div>
            </div>
        </div>
    `;
  return cardDiv;
}

// ==================== RENDER EMPTY STATE ====================
function renderEmptyState() {
  if (!gridContainer) return;

  gridContainer.innerHTML = `
        <div class="col-span-1 md:col-span-2 text-center text-white py-20">
            <p class="text-xl">No bounties found</p>
            <p class="text-gray-400 mt-2">Be the first to create a bounty!</p>
            <a href="./create.html" class="inline-block mt-4 px-6 py-2 bg-pink-500 rounded-lg hover:bg-pink-600">
                Create Bounty
            </a>
        </div>
    `;
}

// ==================== SHOW LOADING STATE ====================
function showLoading() {
  if (!gridContainer) return;

  gridContainer.innerHTML = `
        <div class="col-span-1 md:col-span-2 flex justify-center items-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    `;
}

// ==================== LOAD DASHBOARD STATS ====================
export async function loadDashboardStats(wallet) {
  try {
    // You'll need to implement this endpoint in your backend
    const response = await fetch(
      `https://happy-bounty.onrender.com/dashboard/${wallet}`,
    );
    const data = await response.json();

    if (data) {
      // Update earnings
      if (earningsElement) {
        const earnings = data.user?.totalEarnings || "0";
        const parts = earnings.split(".");
        earningsElement.innerHTML = `$${parts[0]}.<span class="text-gray-400 text-lg">${parts[1] || "00"}</span>`;
      }

      // Update completed tasks
      if (completedTasksElement) {
        completedTasksElement.textContent = data.submissions?.accepted || 0;
      }

      // Update in progress tasks
      if (inProgressElement) {
        inProgressElement.textContent = data.submissions?.pending || 0;
      }
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}

// ==================== UPDATE WALLET DISPLAY ====================
function updateWalletDisplay(wallet) {
  if (walletAddressElement) {
    // You might want to show the wallet address or profile image
    walletAddressElement.title = wallet;
  }
}

// ==================== UPDATE TOTAL TASKS COUNT ====================
function updateTotalTasksCount(total) {
  if (totalTasksElement) {
    totalTasksElement.textContent = total;
  }
}

// ==================== PAGINATION ====================
function updatePagination(pagination) {
  if (!paginationContainer) return;

  // Don't show pagination if there's only one page or no bounties
  if (!pagination || pagination.pages <= 1 || pagination.total === 0) {
    paginationContainer.innerHTML = "";
    return;
  }

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
    <button class="page-btn px-3 py-1 rounded bg-gray-700 text-white ${!pagination.hasPrev ? "opacity-50 cursor-not-allowed" : ""}"
      ${!pagination.hasPrev ? "disabled" : ""} data-page="${pagination.page - 1}">
      ←
    </button>
  `;

  // Page numbers - show limited number of pages
  const maxVisiblePages = 5;
  let startPage = Math.max(
    0,
    pagination.page - Math.floor(maxVisiblePages / 2),
  );
  let endPage = Math.min(pagination.pages - 1, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(0, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="page-btn px-3 py-1 rounded ${i === pagination.page ? "bg-pink-500" : "bg-gray-700"} text-white"
        data-page="${i}">
        ${i + 1}
      </button>
    `;
  }

  // Next button
  paginationHTML += `
    <button class="page-btn px-3 py-1 rounded bg-gray-700 text-white ${!pagination.hasNext ? "opacity-50 cursor-not-allowed" : ""}"
      ${!pagination.hasNext ? "disabled" : ""} data-page="${pagination.page + 1}">
      →
    </button>
  `;

  paginationContainer.innerHTML = paginationHTML;

  // Add event listeners
  document.querySelectorAll(".page-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const page = parseInt(btn.dataset.page);
      if (!isNaN(page) && page !== pagination.page) {
        currentPage = page;
        loadBounties(currentFilter, currentPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

// ==================== FILTERING ====================
function setupEventListeners() {
  // Sort by dropdown (desktop)
  const sortBtn = document.getElementById("sortby");
  const sortMenu = document.getElementById("sortmenu");

  if (sortBtn) {
    sortBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sortMenu?.classList.toggle("hidden");
    });
  }

  // Sort by dropdown (mobile)
  const sortBtn1 = document.getElementById("sortby1");
  const sortMenu1 = document.getElementById("sortmenu1");

  if (sortBtn1) {
    sortBtn1.addEventListener("click", (e) => {
      e.stopPropagation();
      sortMenu1?.classList.toggle("hidden");
    });
  }

  // Filter options
  document
    .querySelectorAll("#sortmenu span, #sortmenu1 span")
    .forEach((option) => {
      option.addEventListener("click", async (e) => {
        const filter = e.target.textContent.toLowerCase().replace(" ", "");
        console.log(`selected filter is ${filter}`);

        // Map filter text to status values
        let status = "all";
        if (filter === "active") status = "active";
        if (filter === "completed") status = "completed";
        if (filter === "upnext") status = "upcoming";

        currentFilter = status;
        console.log(`current filter is ${currentFilter}`);
        currentPage = 0;

        await loadBounties(currentFilter, currentPage);

        // Hide menus
        sortMenu?.classList.add("hidden");
        sortMenu1?.classList.add("hidden");

        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set("status", status);
        window.history.pushState({}, "", url);
      });
    });

  // Search functionality
  const searchInput = document.querySelector('input[type="search"]');
  let searchTimeout;

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const term = e.target.value;
        if (term.length > 2) {
          searchBounties(term);
        } else if (term.length === 0) {
          loadBounties(currentFilter, currentPage);
        }
      }, 500);
    });
  }

  // Profile dropdown
  const profileBtn = document.querySelector(".profile");
  const profileMenu = document.querySelector(".profilemenu");

  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu?.classList.toggle("hidden");
    });
  }

  // Plus button menu
  const plusBtn = document.querySelector(".plusbtn");
  const plusMenu = document.querySelector(".plusmenu");

  if (plusBtn) {
    plusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      plusMenu?.classList.toggle("hidden");
    });
  }

  // Logout
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      import("./wallet.js").then(({ disconnectWallet }) => {
        disconnectWallet();
      });
    });
  }

  // Close menus when clicking outside
  document.addEventListener("click", () => {
    sortMenu?.classList.add("hidden");
    sortMenu1?.classList.add("hidden");
    profileMenu?.classList.add("hidden");
    plusMenu?.classList.add("hidden");
  });
}

// ==================== SEARCH ====================
async function searchBounties(term) {
  try {
    showLoading();
    const response = await fetch(
      `https://happy-bounty.onrender.com/task?search=${term}`,
    );
    const bounties = await response.json();
    renderBounties(bounties);
  } catch (error) {
    console.error("Search error:", error);
  }
}

// ==================== BOUNTY ACTIONS ====================
function showBountyDetails(bounty) {
  // Store bounty in session storage for details page
  sessionStorage.setItem("viewBounty", JSON.stringify(bounty));
  console.log(`Bounty id ${bounty._id}`);
  window.location.href = `./bounty-details.html?id=${bounty._id}`;
}

function startBounty(bountyId) {
  // Store bounty ID for submission
  sessionStorage.setItem("activeBountyId", bountyId);
  window.location.href = "./submission.html";
}

// ==================== UTILITY FUNCTIONS ====================
function getStatusColor(status) {
  switch (status?.toLowerCase()) {
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

function showToast(message, type = "info") {
  const toast = document.getElementById("toast") || createToast();

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-600",
    info: "bg-blue-600",
  };

  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-opacity duration-300 ${colors[type] || colors.info}`;
  toast.textContent = message;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 3000);
}

function createToast() {
  const toast = document.createElement("div");
  toast.id = "toast";
  document.body.appendChild(toast);
  return toast;
}

// ==================== EXPORT FOR DEBUGGING ====================
window.loadBounties = loadBounties;
