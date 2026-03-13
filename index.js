import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
} from "https://esm.sh/viem";

import { EXPECTED_CHAIN } from "./networkConfig.js";

let walletClient;
let publicClient;
let account;

// ==========================
// MOBILE MENU DROPDOWN
// ==========================
const btn = document.getElementById("btn");
const menu = document.querySelector(".menu");
const close = document.querySelector(".close");

if (btn && menu) {
  btn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });
}

if (close && menu) {
  close.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });
}

// ==========================
// MOBILE LOGIN MODAL
// ==========================
const openBtn2 = document.querySelectorAll(".login2");
const modal2 = document.getElementById("modalOverlay2");
const closeBtn2 = document.getElementById("closeModal2");

openBtn2.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (modal2) {
      modal2.classList.remove("hidden");
      modal2.classList.add("flex");
    }
  });
});

if (closeBtn2 && modal2) {
  closeBtn2.addEventListener("click", () => {
    modal2.classList.add("hidden");
    modal2.classList.remove("flex");
  });
}

if (modal2) {
  modal2.addEventListener("click", (e) => {
    if (e.target === modal2) {
      modal2.classList.add("hidden");
      modal2.classList.remove("flex");
    }
  });
}

// ==========================
// DESKTOP LOGIN MODAL
// ==========================
const openBtn3 = document.querySelectorAll(".login3");
const modal3 = document.getElementById("modalOverlay3");
const closeBtn3 = document.getElementById("closeModal3");
openBtn3.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (modal3) {
      modal3.classList.remove("hidden");
      modal3.classList.add("flex");
    }
  });
});

if (closeBtn3 && modal3) {
  closeBtn3.addEventListener("click", () => {
    modal3.classList.add("hidden");
    modal3.classList.remove("flex");
  });
}

if (modal3) {
  modal3.addEventListener("click", (e) => {
    if (e.target === modal3) {
      modal3.classList.add("hidden");
      modal3.classList.remove("flex");
    }
  });
}

// ==========================
// DESKTOP CATEGORY DROPDOWN
// ==========================
const dropdown = document.querySelector(".dropdown");
const menu2 = document.querySelector(".Categories");

dropdown.addEventListener("mouseenter", () => {
  menu2.classList.remove("hidden");
});

dropdown.addEventListener("mouseleave", () => {
  menu2.classList.add("hidden");
});

// ==========================
// WALLET MODAL (DESKTOP)
// ==========================
const walletModal = document.querySelector(".wallet1");
const openWallet = document.querySelector(".sign1");
const closeWallet = document.querySelector(".close-wallet1");

if (openWallet && walletModal) {
  openWallet.addEventListener("click", () => {
    walletModal.classList.remove("hidden");
  });
}

if (closeWallet && walletModal) {
  closeWallet.addEventListener("click", () => {
    walletModal.classList.add("hidden");
  });
}

function closeW() {
  if (openWallet && walletModal) {
    walletModal.classList.add("hidden");
  }
  if (modal3) {
    modal3.classList.add("hidden");
    modal3.classList.remove("flex");
  }
}

// ==========================
// WALLET MODAL (MOBILE)
// ==========================
const openWallet1 = document.querySelector(".sign");
const walletModal1 = document.querySelector(".wallet2");
const closeWallet1 = document.querySelector(".close-wallet");

if (openWallet1 && walletModal1) {
  openWallet1.addEventListener("click", () => {
    walletModal1.classList.remove("hidden");
  });
}

if (closeWallet1 && walletModal1) {
  closeWallet1.addEventListener("click", () => {
    walletModal1.classList.add("hidden");
  });
}

//CATIGORIES
const buttons = document.querySelectorAll(".categories");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const answer = button.nextElementSibling;
    const icon = button.querySelector(".icon");

    // Toggle answer
    answer.classList.toggle("hidden");
  });
});

// ==========================
// Wallet connection
// =========================

(function () {
  /* ------------------------------
TOAST POPUP
--------------------------------*/

  function showToast(message, isError = false) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.style.opacity = "1";
    toast.style.backgroundColor = isError ? "#7f1d1d" : "#1e293b";

    setTimeout(() => {
      toast.style.opacity = "1";
    }, 2500);
  }

  /* ------------------------------
     WALLET DETECTION
     --------------------------------*/

  const hasMetaMask = () => window.isMetaMask;

  const hasBitget = () => window.ethereum && window.ethereum.isBitget;

  const hasOKX = () => window.okxwallet;

  const hasBrave = () =>
    (window.ethereum && window.ethereum.isBraveWallet) ||
    (navigator.brave && navigator.brave.isBrave);

  /* ------------------------------
    DETECT INSTALLED
    --------------------------------*/

  const installedWallets = [];

  if (hasBrave())
    installedWallets.push({
      name: "Brave Wallet",
      id: "brave",
      icon: "fa-brands fa-brave",
    });

  if (hasBitget())
    installedWallets.push({
      name: "Bitget Wallet",
      id: "bitget",
      icon: "fa-solid fa-coins",
    });

  if (hasOKX())
    installedWallets.push({
      name: "OKX Wallet",
      id: "okx",
      icon: "fa-brands fa-opera",
    });

  if (hasMetaMask())
    installedWallets.push({
      name: "MetaMask",
      id: "metamask",
      icon: "fab fa-ethereum",
    });

  /* ------------------------------
      RENDER INSTALLED WALLETS
     --------------------------------*/

  // const installedRow = document.getElementById("installedRow");
  const installedCount = document.getElementById("installedCount");

  /* update detected count */

  installedCount.innerText = `(${installedWallets.length} detected)`;

  /* ------------------------------
     CONNECT WALLET
     --------------------------------*/

  const walletButtons = document.querySelectorAll(".wallet");

  // =========== SWITCH NETWORK ============
  async function switchNetwork() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${EXPECTED_CHAIN.id.toString(16)}` }], //"0x7a69"
      });
    } catch (err) {
      // chain not added yet
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${EXPECTED_CHAIN.id.toString(16)}`,
              chainName: EXPECTED_CHAIN.name,
              rpcUrls: [EXPECTED_CHAIN.rpcUrl],
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
            },
          ],
        });
      } else {
        throw err;
      }
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        throw new Error("NO_WALLET");
      }

      walletClient = createWalletClient({
        chain: EXPECTED_CHAIN,
        transport: custom(window.ethereum),
      });

      // 🔍 Check network FIRST
      // "I COMMENTED BECAUSE THI IMPLEMENTATION I NOT NEEDED NOW"
      const chainId = await walletClient.getChainId();

      // console.log("Connected chain ID:", chainId);

      if (chainId !== EXPECTED_CHAIN.id) {
        throw new Error("WRONG_NETWORK");
      }

      const addresses = await walletClient.requestAddresses();
      account = addresses[0];
      const shortAddr = account.slice(0, 6) + "..." + account.slice(-4);

      showToast(`✅ Connected to ${shortAddr}`);
      closeW();

      return account;
    } catch (err) {
      if (err.message === "NO_WALLET") {
        showToast(
          "❌ No wallet detected. Please install a wallet extension.",
          true,
        );
      } else if (err.message === "WRONG_NETWORK") {
        await switchNetwork()
          .then(() => {
            showToast("✅ Network switched. Please connect again.");
          })
          .catch((switchErr) => {
            showToast(`❌ ${switchErr.shortMessage}`, true);
          });
      }
      showToast(`❌ ${err.shortMessage}`, true);
    }
  }

  /* ------------------------------
ATTACH BUTTON LISTENERS
--------------------------------*/

  walletButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      // await connectWalleT(btn.dataset.wallet);
      await connectWallet();
      location.href = "user_dashboard.html";
    });
  });

  // END
})();
