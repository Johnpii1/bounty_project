import { connectWallet } from "./wallet.js";

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

export function closeW() {
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

const getWallet = document.querySelector(".walletLink");
getWallet.addEventListener("click", () => {
  location.href = "https://metamask.io/en-GB/download";
});

(function () {
  /* ------------------------------
     CONNECT WALLET
     --------------------------------*/

  const walletButtons = document.querySelectorAll(".wallet");

  // =========== SWITCH NETWORK ============

  /* ------------------------------
ATTACH BUTTON LISTENERS
--------------------------------*/

  walletButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      await connectWallet();
    });
  });

  // END
})();

const bountySection = document.getElementById("bountySection");

window.addEventListener("scroll", () => {
  if (window.scrollY < 100) {
    bountySection.classList.add("scale-90");
  } else {
    bountySection.classList.remove("scale-90");
  }
});

const cards = document.querySelectorAll(".bounty-card");
const section = document.querySelector("#bounty");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.remove("opacity-0", "translate-y-10");
        }, index * 300);
      });
    } else {
      cards.forEach((card) => {
        card.classList.add("opacity-0", "translate-y-10");
      });
    }
  });
});

observer.observe(section);
