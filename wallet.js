import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
} from "https://esm.sh/viem";

import { EXPECTED_CHAIN, INJECTIVE_CHAIN } from "./networkConfig.js";
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

        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${INJECTIVE_CHAIN.id.toString(16)}`,
              chainName: INJECTIVE_CHAIN.name,
              rpcUrls: [INJECTIVE_CHAIN.rpcUrl], // Make sure this is an array
              nativeCurrency: INJECTIVE_CHAIN.nativeCurrency,
              blockExplorerUrls: [INJECTIVE_CHAIN.blockExplorerUrls], // Optional: add if you have one
            },
          ],
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
      chain: EXPECTED_CHAIN,
      transport: custom(window.ethereum),
    });

    // 🔍 Check network FIRST
    const chainId = await walletClient.getChainId();

    // console.log("Connected chain ID:", chainId);

    if (chainId !== INJECTIVE_CHAIN.id) {
      throw new Error("WRONG_NETWORK");
    }

    console.log("Network is correct, proceeding with connection...");

    const addresses = await walletClient.requestAddresses();
    account = addresses[0];
    localStorage.setItem("connectedAccount", account);
    const shortAddr = account.slice(0, 6) + "..." + account.slice(-4);

    showToast(`✅ Connected to ${shortAddr}`);
    closeW();
    location.href = "user_dashboard.html";

    return account;
  } catch (err) {
    if (err.message === "NO_WALLET") {
      showToast(
        "❌ No wallet detected. Please install a wallet extension.",
        true,
      );
    } else if (err.message === "WRONG_NETWORK") {
      console.log("Attempting to switch network...");
      await switchNetwork()
        .then(() => {
          showToast("✅ Network switched. Please connect again.");
        })
        .catch((switchErr) => {
          showToast(`❌ ${switchErr.shortMessage}`, true);
        });
      //   showToast("✅ Network switched. Please connect again.");
    }
    showToast(`❌ ${err.shortMessage || err.message}`, true);
    console.error("Connection error:", err);
  }
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
