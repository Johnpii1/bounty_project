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
// MOBILE CATEGORY DROPDOWN
// ==========================
const dropdown1 = document.getElementById("dropdown1");
const menu3 = document.querySelector(".Categories1");
const close1 = document.getElementById("close1");

if (dropdown1 && menu3) {
  dropdown1.addEventListener("click", () => {
    menu3.classList.remove("hidden");
  });
}

if (close1 && menu3) {
  close1.addEventListener("click", () => {
    menu3.classList.add("hidden");
  });
}



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