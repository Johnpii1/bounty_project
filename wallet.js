import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
} from "https://esm.sh/viem";

import { INJECTIVE_CHAIN } from "./networkConfig.js";
import { closeW } from "./index.js";

let walletClient;
let publicClient;
let account;

export async function switchNetwork() {
  try {
    console.log(`Switching to chain ID: 0x${INJECTIVE_CHAIN.id.toString(16)}`);

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${INJECTIVE_CHAIN.id.toString(16)}` }],
    });

    console.log("Network switched successfully");
  } catch (err) {
    // This error code indicates that the chain has not been added to MetaMask
    if (err.code === 4902) {
      try {
        console.log("Adding network to wallet...");

        // Prepare chain parameters
        const addChainParams = {
          chainId: `0x${INJECTIVE_CHAIN.id.toString(16)}`,
          chainName: INJECTIVE_CHAIN.name,
          rpcUrls: [INJECTIVE_CHAIN.rpcUrl], // Array of strings ✅
          nativeCurrency: INJECTIVE_CHAIN.nativeCurrency,
        };

        // Only add blockExplorerUrls if it exists and is a string
        if (INJECTIVE_CHAIN.blockExplorerUrls) {
          addChainParams.blockExplorerUrls = [
            INJECTIVE_CHAIN.blockExplorerUrls,
          ]; // Array of strings ✅
        }

        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [addChainParams],
        });

        console.log("Network added successfully");

        // After adding, try switching again
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${INJECTIVE_CHAIN.id.toString(16)}` }],
        });
      } catch (addError) {
        console.error("Failed to add network:", addError);
        throw addError;
      }
    } else {
      throw err;
    }
  }
}

export async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error("NO_WALLET");
    }

    walletClient = createWalletClient({
      chain: INJECTIVE_CHAIN,
      transport: custom(window.ethereum),
    });

    // 🔍 Check network FIRST
    const chainId = await walletClient.getChainId();

    // console.log("Connected chain ID:", chainId);

    // Check if we're on the right network (compare with INJECTIVE_CHAIN)
    if (chainId !== INJECTIVE_CHAIN.id) {
      // Try to switch network automatically
      try {
        await switchNetwork();
        // After switching, we need to reconnect/refresh
        showToast("✅ Network switched. Please click connect again.");
        return; // Stop here, user needs to click connect again
      } catch (switchErr) {
        throw new Error("WRONG_NETWORK");
      }
    }

    console.log("Network is correct, proceeding with connection...");

    const addresses = await walletClient.requestAddresses();
    account = addresses[0];
    localStorage.setItem("connectedAccount", account);
    const shortAddr = shortenAddress(account);

    showToast(`✅ Connected to ${shortAddr}`);

    // Check if closeW exists before calling
    if (typeof closeW === "function") {
      closeW();
    }

    // Redirect to dashboard
    setTimeout(() => {
      location.href = "user_dashboard.html";
    }, 500);

    return account;
  } catch (err) {
    console.error("Error in connectWallet:", err);
    if (err.message === "NO_WALLET") {
      showToast(
        "❌ No wallet detected. Please install a wallet extension.",
        true,
      );
    } else if (err.message === "WRONG_NETWORK") {
      showToast("❌ Please switch to Injective network in your wallet", true);
    } else {
      // Handle other errors
      const errorMessage = err.shortMessage || err.message || "Unknown error";
      showToast(`❌ ${errorMessage}`, true);
    }
    return null;
  }
}

export function shortenAddress(addr) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function showToast(message, isError = false) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.backgroundColor = isError ? "#7f1d1d" : "#1e293b";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2500);
}

export function getConnectedWallet() {
  account = localStorage.getItem("connectedAccount");
  validateConnection(account);
  const shortAddr = account ? shortenAddress(account) : null;
  console.log("getConnectedWallet:", shortAddr);
  return shortAddr;
}

export function disconnectWallet() {
  localStorage.removeItem("connectedAccount");
  account = null;
  // showToast("✅ Disconnected", false);

  setTimeout(() => {
    location.href = "index.html";
  }, 500);
}

// Helper function to check if wallet is connected
export function isWalletConnected() {
  return !!localStorage.getItem("connectedAccount");
}

// ==================== VALIDATE EXISTING CONNECTION ====================
async function validateConnection(address) {
  try {
    if (!window.ethereum) return false;

    // Check if we can still access accounts
    const accounts = await window.ethereum.request({
      method: "eth_accounts", // This doesn't prompt user
    });

    return accounts && accounts.includes(address);
  } catch (error) {
    return false;
  }
}
