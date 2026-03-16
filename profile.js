import { getConnectedWallet } from "./wallet.js";

//FOR PROFILE
// const profile = document.querySelector(".profile");
// const profileMenu = document.querySelector(".profilemenu");

// Display connected wallet address in profile menu
function displayWalletAddress() {
  const walletAddressElem = document.getElementById("walletAddress");
  const connectedWallet = getConnectedWallet();
  if (connectedWallet) {
    walletAddressElem.textContent = connectedWallet;
  } else {
    walletAddressElem.textContent = "Not connected";
  }
}

// Call the function to display the wallet address on page load
document.addEventListener("DOMContentLoaded", () => {
  displayWalletAddress();
});

//FOR ADD
const plus = document.querySelector(".plusbtn");
const plusMenu = document.querySelector(".plusmenu");

//FOR PROFILE
const profile = document.querySelector(".profile");
const profileMenu = document.querySelector(".profilemenu");

plus.addEventListener("click", (e) => {
  e.stopPropagation();

  plusMenu.classList.toggle("hidden");
  profileMenu.classList.add("hidden"); // close profile menu
});

//FOR PROFILE
profile.addEventListener("click", (e) => {
  e.stopPropagation();

  profileMenu.classList.toggle("hidden");
  plusMenu.classList.add("hidden"); // close plus menu
});
