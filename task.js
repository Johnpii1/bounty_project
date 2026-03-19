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

document.addEventListener("click", () => {
  plusMenu.classList.add("hidden");
  profileMenu.classList.add("hidden");
});