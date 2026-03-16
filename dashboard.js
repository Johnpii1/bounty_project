const account = localStorage.getItem("account");
console.log("Retrieved account from localStorage:", account);

//FOR SORT BY FOR DESKTOP
const sort = document.getElementById("sortby");
const menu1 = document.getElementById("sortmenu");

if (sort && menu1) {
  sort.addEventListener("click", () => {
    menu1.classList.toggle("hidden");
  });

  if (sort && menu1) {
    sort.addEventListener("mouseleave", () => {
      menu1.classList.add("hidden");
    });
  }
}

//FOR SORT BY FOR MOBILE
const sort1 = document.getElementById("sortby1");
const menu2 = document.getElementById("sortmenu1");

if (sort && menu1) {
  sort1.addEventListener("click", () => {
    menu2.classList.toggle("hidden");
  });

  if (sort && menu1) {
    sort1.addEventListener("mouseleave", () => {
      menu2.classList.add("hidden");
    });
  }
}

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
