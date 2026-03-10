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



