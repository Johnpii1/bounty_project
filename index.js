//Dropdown for mobile










// Get all buttons that open modals
const loginButtons = document.querySelectorAll(".open-login");
const signupButtons = document.querySelectorAll(".open-signup");

// Get modal elements
const loginModal = document.querySelector(".login-modal");
const signupModal = document.querySelector(".signup-modal");

// Get all close buttons
const closeButtons = document.querySelectorAll(".close-modal");

// FUNCTION to open a modal
function openModal(modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

// FUNCTION to close a modal
function closeModal(modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

// OPEN LOGIN MODAL
loginButtons.forEach(btn => {
    btn.addEventListener("click", e => {
        e.preventDefault();
        openModal(loginModal);
    });
});

// OPEN SIGNUP MODAL
signupButtons.forEach(btn => {
    btn.addEventListener("click", e => {
        e.preventDefault();
        openModal(signupModal);
    });
});

// CLOSE MODALS using close button
closeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const modal = btn.closest(".modal");
        closeModal(modal);
    });
});

// CLOSE MODAL WHEN CLICKING OUTSIDE CONTENT
document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", e => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

// PASSWORD TOGGLE
document.querySelectorAll(".toggle-password").forEach(icon => {
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


