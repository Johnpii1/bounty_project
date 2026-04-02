// Sidebar toggle
const sidebar = document.getElementById("sidebar")
const menuBtn = document.getElementById("menuBtn")
const closeBtn = document.getElementById("closeBtn")
menuBtn.addEventListener("click", () => sidebar.classList.remove("-translate-x-full"))
closeBtn.addEventListener("click", () => sidebar.classList.add("-translate-x-full"))

// Fetch users from backend API
async function fetchUsers() {
  try {
    const response = await fetch("/api/users") // Replace with your real endpoint
    if (!response.ok) throw new Error("Failed to fetch users")
    const users = await response.json()
    renderUsers(users)
  } catch (error) {
    console.error(error)
    alert("Could not load users. Make sure your backend API is running.")
  }
}

// Render users into table and update stats
function renderUsers(users) {
  const userTable = document.getElementById("userTable")
  userTable.innerHTML = "" // Clear previous rows

  let totalDeposits = 0

  users.forEach(user => {
    const earn = (user.deposit * 0.10).toFixed(2)
    totalDeposits += user.deposit

    const tr = document.createElement("tr")
    tr.className = "border-b hover:bg-gray-50"
    tr.innerHTML = `
      <td class="py-2">${user.name}</td>
      <td>${user.email}</td>
      <td>${user.deposit}</td>
      <td>${earn}</td>
    `
    userTable.appendChild(tr)
  })

  // Update cards
  document.getElementById("totalDeposits").textContent = `$${totalDeposits}`
  document.getElementById("earnings").textContent = `$${(totalDeposits*0.10).toFixed(2)}`
  document.getElementById("totalUsers").textContent = users.length
}

// Load users on page load
fetchUsers()
