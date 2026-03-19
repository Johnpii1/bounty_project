// export async function createBounty(formData) {
//   try {
//     const response = await fetch("http://localhost:5000/task", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(formData),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || "Failed to create bounty");
//     }

//     console.log("Success:", data);
//     return data;
//   } catch (error) {
//     console.error("Error:", error.message);
//   }
// }

// api.js - Frontend functions to interact with your backend yh

const API_BASE = "http://localhost:5000";

/**
 * 1. Fetch bounties with filters
 * @param {Object} filters - { status, category, tags, page, limit }
 */
export async function fetchBounties(filters = {}) {
  const queryParams = new URLSearchParams();

  if (filters.status) queryParams.append("status", filters.status);
  if (filters.category) queryParams.append("category", filters.category);
  if (filters.tags) queryParams.append("tags", filters.tags);
  if (filters.page) queryParams.append("page", filters.page);
  if (filters.limit) queryParams.append("limit", filters.limit);

  const url = `${API_BASE}/task?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error fetching bounties:", error);
    throw error;
  }
}

/**
 * 2. Create a new bounty
 * @param {Object} bountyData - The bounty object
 */
export async function createBounty(bountyData) {
  try {
    const response = await fetch(`${API_BASE}/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bountyData),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error creating bounty:", error);
    throw error;
  }
}

/**
 * 3. Get a single bounty by ID
 * @param {string} id - Bounty ID
 */
export async function getBountyById(id) {
  try {
    const response = await fetch(`${API_BASE}/task/${id}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error fetching bounty:", error);
    throw error;
  }
}

/**
 * 4. Get user profile by wallet address
 * @param {string} wallet - Wallet address
 */
export async function getUserProfile(wallet) {
  try {
    const response = await fetch(`${API_BASE}/user/${wallet}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

/**
 * 5. Create a submission
 * @param {Object} submissionData - { bountyId, user, description, projectLink, image }
 */
export async function createSubmission(submissionData) {
  try {
    const response = await fetch(`${API_BASE}/submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionData),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error creating submission:", error);
    throw error;
  }
}

/**
 * 6. Get user submissions
 * @param {string} wallet - Wallet address
 */
export async function getUserSubmissions(wallet) {
  try {
    const response = await fetch(`${API_BASE}/submissions/user/${wallet}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    throw error;
  }
}

/**
 * 7. Get dashboard stats
 * @param {string} wallet - Wallet address
 */
export async function getDashboardStats(wallet) {
  try {
    const response = await fetch(`${API_BASE}/dashboard/${wallet}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

/**
 * 8. Get all categories
 */
export async function getCategories() {
  try {
    const response = await fetch(`${API_BASE}/categories`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

/**
 * 9. Get all tags
 */
export async function getTags() {
  try {
    const response = await fetch(`${API_BASE}/tags`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
}

/**
 * 10. Update a bounty
 * @param {string} id - Bounty ID
 * @param {Object} updates - Fields to update
 */
export async function updateBounty(id, updates) {
  try {
    const response = await fetch(`${API_BASE}/task/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error updating bounty:", error);
    throw error;
  }
}

/**
 * 11. Delete a bounty
 * @param {string} id - Bounty ID
 */
export async function deleteBounty(id) {
  try {
    const response = await fetch(`${API_BASE}/task/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error deleting bounty:", error);
    throw error;
  }
}
