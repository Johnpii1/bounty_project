// initProfile.js - Initialize profile across all pages
import { getConnectedWallet } from "./wallet.js";
import { applyProfileStyle } from "./profileColor.js";

/**
 * Initialize profile circle on any page
 */
export async function initProfile() {
  const profileElement =
    document.getElementById("profileCircle") ||
    document.querySelector(".profile-circle") ||
    document.querySelector(".bg-white.rounded-full");

  if (!profileElement) {
    console.warn("Profile element not found on this page");
    return;
  }

  // Get connected wallet
  const wallet = getConnectedWallet();

  if (wallet) {
    // Apply consistent styling
    applyProfileStyle(profileElement, wallet, true);

    // Add click handler to show wallet options
    profileElement.addEventListener("click", (e) => {
      e.stopPropagation();
      showWalletMenu(wallet);
    });
  } else {
    // Show default icon for disconnected state
    profileElement.style.background = "#6B7280";
    profileElement.innerHTML = "👤";
    profileElement.style.display = "flex";
    profileElement.style.alignItems = "center";
    profileElement.style.justifyContent = "center";
    profileElement.style.fontSize = "16px";
  }
}

/**
 * Show wallet menu on click
 */
function showWalletMenu(wallet) {
  // Remove existing menu if any
  const existingMenu = document.querySelector(".profile-menu");
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement("div");
  menu.className =
    "profile-menu absolute bg-white rounded-lg shadow-lg py-2 z-50 min-w-[200px]";
  menu.style.top = "60px";
  menu.style.right = "20px";

  menu.innerHTML = `
    <div class="px-4 py-2 border-b border-gray-200">
      <p class="text-xs text-gray-500">Connected Wallet</p>
      <p class="text-sm font-mono text-gray-800">${wallet}</p>
    </div>
    <button class="copy-address w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
      📋 Copy Address
    </button>
    <button class="disconnect-wallet w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">
      🔌 Disconnect
    </button>
  `;

  document.body.appendChild(menu);

  // Handle copy
  menu.querySelector(".copy-address")?.addEventListener("click", () => {
    navigator.clipboard.writeText(wallet);
    showToast("Address copied!", "success");
    menu.remove();
  });

  // Handle disconnect
  menu
    .querySelector(".disconnect-wallet")
    ?.addEventListener("click", async () => {
      const { disconnectWallet } = await import("./wallet.js");
      disconnectWallet();
      menu.remove();
      // Refresh profile display
      initProfile();
    });

  // Close menu on click outside
  setTimeout(() => {
    document.addEventListener("click", function closeMenu(e) {
      if (
        !menu.contains(e.target) &&
        e.target !== document.querySelector(".profile-circle")
      ) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    });
  }, 100);
}

function showToast(message, type) {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
    type === "success" ? "bg-green-600" : "bg-gray-800"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}
