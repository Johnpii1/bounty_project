// api.js - Frontend functions to interact with your backend yh
import {
  createBountyOnChain,
  getBountyDetails,
  getAllBounties,
} from "./contractService.js";

export const API_BASE = "https://happy-bounty.onrender.com";

/**
 * 1. Fetch bounties with filters (combines backend + blockchain data)
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

    // For each bounty, add blockchain data if available
    if (data.bounties && data.bounties.length > 0) {
      for (let bounty of data.bounties) {
        try {
          if (bounty.blockchainId) {
            const chainData = await getBountyDetails(bounty.blockchainId);
            bounty.chainData = chainData;
          }
        } catch (error) {
          console.warn(
            `Could not fetch blockchain data for bounty ${bounty._id}:`,
            error,
          );
        }
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching bounties:", error);
    throw error;
  }
}

/**
 * 2. Create a new bounty (backend + blockchain)
 * @param {Object} bountyData - The bounty object
 */
export async function createBounty(backendData) {
  try {
    // Validate required fields
    if (!backendData.txHash) {
      throw new Error("Missing transaction hash");
    }

    if (!backendData.blockchainId && backendData.blockchainId !== null) {
      console.warn("Bounty created without blockchain ID");
    }

    // Log the data to verify no BigInts remain
    const safeData = JSON.parse(
      JSON.stringify(backendData, (key, value) => {
        if (typeof value === "bigint") {
          return Number(value);
        }
        return value;
      }),
    );

    console.log("Sending to backend:", safeData);

    const response = await fetch(`${API_BASE}/task`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safeData),
    });

    const data = await response.json();

    if (!response.ok) {
      // If database save fails, the blockchain transaction is already confirmed
      // We should still inform the user that blockchain transaction succeeded
      console.error("Database save failed:", data.error);
      throw new Error(
        `Blockchain transaction succeeded but database save failed: ${data.error}`,
      );
    }

    return {
      ...data,
      chainTxHash: backendData.txHash,
      blockchainConfirmed: true,
    };
  } catch (error) {
    console.error("Error creating bounty in database:", error);
    throw error;
  }
}

/**
 * 3. Get a single bounty by ID (with blockchain data)
 * @param {string} id - Bounty ID
 */
export async function getBountyById(id) {
  try {
    const response = await fetch(`${API_BASE}/task/${id}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    // Fetch blockchain data if available
    if (data.blockchainId) {
      try {
        const chainData = await getBountyDetails(data.blockchainId);
        data.chainData = chainData;
      } catch (error) {
        console.warn(`Could not fetch blockchain data:`, error);
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching bounty:", error);
    throw error;
  }
}

/**
 * 4. Get user profile by wallet address (with blockchain data)
 * @param {string} wallet - Wallet address
 */
export async function getUserProfile(wallet) {
  try {
    const response = await fetch(`${API_BASE}/user/${wallet}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    // Add blockchain data for user's bounties
    if (data.bounties && data.bounties.length > 0) {
      for (let bounty of data.bounties) {
        if (bounty.blockchainId) {
          try {
            const chainData = await getBountyDetails(bounty.blockchainId);
            bounty.chainData = chainData;
          } catch (error) {
            console.warn(`Could not fetch blockchain data:`, error);
          }
        }
      }
    }

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
      body: JSON.stringify(submissionData, (key, value) => {
        if (typeof value === "bigint") {
          return Number(value);
        }
        return value;
      }),
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
      body: JSON.stringify(updates, (key, value) => {
        if (typeof value === "bigint") {
          return Number(value);
        }
        return value;
      }),
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

// ==================== REWARD DISTRIBUTION FUNCTIONS ====================

/**
 * 12. Distribute rewards to winners
 * @param {string} bountyId - Bounty ID
 * @param {Object} distributionData - { winners, payoutType, percentages, txHash }
 */
export async function distributeRewards(bountyId, distributionData) {
  try {
    const response = await fetch(`${API_BASE}/task/${bountyId}/distribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(distributionData, (key, value) => {
        if (typeof value === "bigint") {
          return Number(value);
        }
        return value;
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error distributing rewards:", error);
    throw error;
  }
}

/**
 * 13. Claim reward for a winner
 * @param {string} bountyId - Bounty ID
 * @param {Object} claimData - { winnerAddress, txHash }
 */
export async function claimRewardOffChain(bountyId, claimData) {
  try {
    const response = await fetch(`${API_BASE}/task/${bountyId}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(claimData, (key, value) => {
        if (typeof value === "bigint") {
          return Number(value);
        }
        return value;
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error claiming reward:", error);
    throw error;
  }
}

/**
 * 14. Get winners for a bounty
 * @param {string} bountyId - Bounty ID
 */
export async function getWinners(bountyId) {
  try {
    console.log(`Trying to fetch winners with bounty id ${bountyId}`);

    const response = await fetch(`${API_BASE}/task/${bountyId}/winners`);
    console.log(`${API_BASE}/task/${bountyId}/winners`);
    if (!response.ok) {
      // throw new Error(`HTTP ${response.status}`);
      console.log(response.status);
      // console.log(`Response status text: ${response.statusText}`);
      console.log("coundn't fetch winners");
    }
    const data = await response.json();
    try {
      return data;
    } catch {
      console.error("Non-JSON response:", data);
      return { winners: [], claimed: [], isDistributed: false };
    }
  } catch (error) {
    console.error("Error fetching winners:", error);
    return { winners: [], claimed: [], isDistributed: false };
  }
}

/**
 * 15. Check if user has claimed reward
 * @param {string} bountyId - Bounty ID
 * @param {string} userAddress - User wallet address
 */
export async function hasUserClaimedReward(bountyId, userAddress) {
  try {
    console.log(
      `is this user a winner and has he claimed, id ${bountyId} user ${userAddress}`,
    );
    const winnersData = await getWinners(bountyId);

    if (!winnersData.claimed || winnersData.claimed.length === 0) {
      return false;
    }

    const claimUpdate = winnersData.claimed.some(
      (claim) => claim.address.toLowerCase() === userAddress.toLowerCase(),
    );

    console.log(`winner updated with user address ${claimUpdate}`);

    return claimUpdate;
  } catch (error) {
    console.error("Error checking if user claimed:", error);
    return false;
  }
}

/**
 * 16. Get user's claimable amount
 * @param {string} bountyId - Bounty ID
 * @param {string} userAddress - User wallet address
 */
export async function getUserClaimableAmount(bountyId, userAddress) {
  try {
    const winnersData = await getWinners(bountyId);

    if (!winnersData.winners || winnersData.winners.length === 0) {
      console.log("no winner");
      return 0;
    }

    const winner = winnersData.winners.find(
      (w) => w.address.toLowerCase() === userAddress.toLowerCase(),
    );

    if (!winner) {
      return 0;
    }

    // Check if already claimed
    const alreadyClaimed = winnersData.claimed?.some(
      (c) => c.address.toLowerCase() === userAddress.toLowerCase(),
    );

    return alreadyClaimed ? 0 : winner.amount;
  } catch (error) {
    console.error("Error getting claimable amount:", error);
    return 0;
  }
}

// Add these functions to your existing api.js

/**
 * 12. Add a comment to a bounty
 * @param {string} bountyId - Bounty ID
 * @param {string} user - User wallet address
 * @param {string} comment - Comment text
 */
export async function addComment(bountyId, user, comment) {
  try {
    const response = await fetch(`${API_BASE}/task/${bountyId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, comment }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

/**
 * 13. Get comments for a bounty
 * @param {string} bountyId - Bounty ID
 */
export async function getComments(bountyId) {
  try {
    const response = await fetch(`${API_BASE}/task/${bountyId}/comments`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data.comments || [];
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

/**
 * 14. Check if user is enrolled in bounty
 * @param {string} bountyId - Bounty ID
 * @param {string} user - User wallet address
 */
export async function checkEnrollment(bountyId, user) {
  try {
    const response = await fetch(
      `${API_BASE}/task/${bountyId}/enrollments/${user}`,
    );
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data.enrolled || false;
  } catch (error) {
    console.error("Error checking enrollment:", error);
    return false;
  }
}
