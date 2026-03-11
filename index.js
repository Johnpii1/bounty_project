//Dropdown for mobile
const btn = document.getElementById("btn");
const menu = document.querySelector(".menu");
const close = document.querySelector(".close");

btn.addEventListener("click", () => {
  menu.classList.toggle("hidden");
});

close.addEventListener("click", () => {
  menu.classList.toggle("hidden");
});



//FOR MOBILE
const openBtn2 = document.querySelectorAll(".login2");
const closeBnt2 = document.getElementById("closeModal2");
const modals2 = document.getElementById("modalOverlay2");

openBtn2.forEach((bnt) => {
  bnt.addEventListener("click", () => {
    modals2.classList.remove("hidden");
    modals2.classList.add("flex");
  });
});

closeBnt2.addEventListener("click", () => {
  modals2.classList.add("hidden");
  modals2.classList.remove("flex");
});

modals2.addEventListener("click", (e) => {
  if (e.target === modals2) {
    modals2.classList.add("hidden");
    modals2.classList.remove("flex");
  }
});

// PASSWORD TOGGLE
document.querySelectorAll(".toggle-password").forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      icon.classList.replace("bi-eye", "bi-eye-slash");
    } else {
      input.type = "password";
      icon.classList.replace("bi-eye-slash", "bi-eye");
    }
  });


});



//FOR DESKTOP
//FOR MODULAR LOGIN
const openBtn3 = document.querySelectorAll(".login3");
const closeBnt3 = document.getElementById("closeModal3");
const modals3 = document.getElementById("modalOverlay3");

openBtn3.forEach((bnt) => {
  bnt.addEventListener("click", () => {
    modals3.classList.remove("hidden");
    modals3.classList.add("flex");
  });
});

closeBnt3.addEventListener("click", () => {
  modals3.classList.add("hidden");
  modals3.classList.remove("flex");
});

modals3.addEventListener("click", (e) => {
  if (e.target === modals3) {
    modals3.classList.add("hidden");
    modals3.classList.remove("flex");
  }
});

// PASSWORD TOGGLE
document.querySelectorAll(".toggle-password1").forEach((icon) => {
  icon.addEventListener("click", () => {
    const input = icon.previousElementSibling;
    if (input.type === "password") {
      input.type = "text";
      icon.classList.replace("bi-eye", "bi-eye-slash");
    } else {
      input.type = "password";
      icon.classList.replace("bi-eye-slash", "bi-eye");
    }
  });
});

//FOR CATEGORIES FOR DESKTOP 
const dropdown = document.querySelector(".dropdown");
const menu2 = document.querySelector(".Categories");

dropdown.addEventListener("mouseenter", () => {
  menu2.classList.remove("hidden");
});

dropdown.addEventListener("mouseleave", () => {
  menu2.classList.add("hidden");
});


//FOR CATEGORIES FOR DESKTOP
const dropdown1 = document.querySelector(".dropdown1");
const menu3 = document.querySelector(".Categories1");
const close1 = document.getElementById("close1");

dropdown1.addEventListener("click", () => {
  menu3.classList.remove("hidden");
});

close1.addEventListener("click", () => {
  menu3.classList.add("hidden");
});


//MODAL OVERLAY FOR MOBILE
const walletModal = document.querySelector(".wallet")
const openWallet = document.querySelector(".sign")
const closeWallet = document.querySelector(".close-wallet")

openWallet.addEventListener("click", () => {

    walletModal.classList.remove("hidden")

})

closeWallet.addEventListener("click", () => {
    walletModal.classList.add("hidden");
});


//MODAL OVERLAY FOR MOBILE
const walletModal1 = document.querySelector(".wallet1")
const openWallet1 = document.querySelector(".sign1")
const closeWallet1 = document.querySelector(".close-wallet1")

openWallet1.addEventListener("click", () => {
    walletModal1.classList.remove("hidden")

});

closeWallet1.addEventListener("click", () => {
    walletModal1.classList.add("hidden");
});













