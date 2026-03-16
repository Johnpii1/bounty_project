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

//FOR CREAT
const boxes = document.querySelectorAll(".task-box");

const perPage = 4;
const totalPages = Math.ceil(boxes.length / perPage);

let currentPage = 1;
const visibleButtons = 4;

const container = document.getElementById("pagination");

function showBoxes(page){

  const start = (page - 1) * perPage;
  const end = page * perPage;

  boxes.forEach((box, index)=>{

    if(index >= start && index < end){
      box.style.display = "block";
    }else{
      box.style.display = "none";
    }

  });

}

function renderButtons(){

  container.innerHTML = "";

  let start = Math.max(1, currentPage - 2);
  let end = start + visibleButtons - 1;

  if(end > totalPages){
    end = totalPages;
    start = Math.max(1, end - visibleButtons + 1);
  }

  for(let i = start; i <= end; i++){

    const btn = document.createElement("button");

    btn.textContent = i;

    btn.className =
      "text-white border border-white bg-gray-800 rounded-lg px-3 h-[30px]";

    if(i === currentPage){
      btn.classList.remove("bg-gray-800");
      btn.classList.add("bg-pink-600");
    }

    btn.onclick = () => {

      currentPage = i;

      renderButtons();
      showBoxes(currentPage);

    };

    container.appendChild(btn);

  }

}

renderButtons();
showBoxes(1);
