// contractService.js - Smart contract interaction service
import {
  CONTRACT_ADDRESS,
  TOKEN_ADDRESSES,
  wINJAbi,
  BOUNTY_ABI,
  publicClient,
  getWalletClient,
  TokenType,
  PayoutType,
  getTokenType,
  getPayoutType,
  initClients,
} from "./contract.js";
import {
  parseEther,
  formatEther,
  parseUnits,
  keccak256,
  toBytes,
} from "https://esm.sh/viem";

// Initialize clients on import
initClients();

/**
 * Create a bounty on the blockchain
 * @param {Object} bountyData - Bounty data from form
 * @param {string} creator - Wallet address
 */
export async function createBountyOnChain(bountyData, creator) {
  try {
    // Get wallet client
    console.log(`getting wallet client`);
    const wallet = getWalletClient();
    const [account] = await wallet.getAddresses();
    console.log(`connected account ${account}`);

    // Validate creator matches connected wallet
    if (account !== creator) {
      throw new Error("Wallet mismatch");
    }

    // Get token type
    const tokenType = getTokenType(bountyData.token);

    // Get payout type
    const payoutType = getPayoutType(
      bountyData.winnersAllowed,
      bountyData.payoutType,
      bountyData.percentages,
    );
    console.log(`payout type ${payoutType}`);

    // Calculate reward in wei (18 decimals for INJ, 6 for USDT)
    let rewardWei;
    let feeWei;
    let totalWei;

    // Native token (INJ) has 18 decimals
    rewardWei = parseEther(bountyData.reward.toString());
    console.log(`reward ${rewardWei}`);
    const fee = bountyData.reward * 0.05;
    feeWei = parseEther(fee.toString());
    console.log(`fee ${feeWei}`);
    totalWei = rewardWei + feeWei;

    // For wINJ, check balance first
    if (bountyData.token === "WINJ") {
      console.log("Checking wINJ balance...");
      const tokenAddress = TOKEN_ADDRESSES.WINJ;
      console.log(`WINJ address ${tokenAddress}`);

      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: wINJAbi,
        functionName: "balanceOf",
        args: [account],
      });

      console.log(`wINJ Balance: ${formatEther(balance)}`);
      console.log(`Required amount: ${formatEther(totalWei)}`);

      if (balance < totalWei) {
        throw new Error(
          `Insufficient wINJ balance. You have ${formatEther(balance)} wINJ but need ${formatEther(totalWei)} wINJ`,
        );
      }
    }

    // Prepare transaction
    let tx;

    if (tokenType === TokenType.ETH && bountyData.token !== TokenType.WINJ) {
      // For ETH/INJ bounty, send value
      tx = {
        address: CONTRACT_ADDRESS,
        abi: BOUNTY_ABI,
        functionName: "createBounty",
        args: [tokenType, rewardWei, payoutType],
        value: totalWei,
        account,
      };
    } else {
      // For wINJ token, need to approve first
      console.log(`Processing ${bountyData.token} token...`);

      // STEP 1: Approve token spending
      console.log(`Approving ${bountyData.token} amount: ${totalWei}`);
      const approvalTx = await approveToken(
        bountyData.token,
        totalWei,
        account,
      );

      if (approvalTx) {
        console.log(`Waiting for approval confirmation...`);

        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: approvalTx,
        });

        console.log(
          `Approval confirmed in block: ${approvalReceipt.blockNumber}`,
        );
      }

      // Small delay to ensure the approval is registered
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(`Approval is succesful`);

      // Then create bounty without eth value
      tx = {
        address: CONTRACT_ADDRESS,
        abi: BOUNTY_ABI,
        functionName: "createBounty",
        args: [TokenType.WINJ, rewardWei, payoutType],
        account,
      };
    }

    // Send transaction
    console.log("Creating bounty on blockchain...", tx);
    const hash = await wallet.writeContract(tx);
    console.log("Transaction hash:", hash);

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Parse events to get bounty ID
    const eventSignature =
      "BountyCreated(uint256,address,uint256,uint256,uint8,uint8)";
    const eventHash = keccak256(toBytes(eventSignature));

    const bountyCreatedEvent = receipt.logs.find(
      (log) =>
        log.eventName === "BountyCreated" ||
        (log.topics && log.topics[0] === eventHash),
    );

    let bountyId;
    if (bountyCreatedEvent) {
      if (bountyCreatedEvent.args) {
        bountyId = Number(bountyCreatedEvent.args.bountyId);
      } else {
        // Try to decode manually
        try {
          const decodedLog = publicClient.decodeEventLog({
            abi: BOUNTY_ABI,
            data: bountyCreatedEvent.data,
            topics: bountyCreatedEvent.topics,
          });
          bountyId = Number(decodedLog.args.bountyId);
        } catch (e) {
          console.warn("Could not decode event:", e);
          bountyId = null;
        }
      }
    }

    return {
      success: true,
      txHash: hash,
      bountyId: bountyId ? Number(bountyId) : null, // Convert to Number,
      blockNumber: Number(receipt.blockNumber),
    };
  } catch (error) {
    console.error("Error creating bounty on chain:", error);
    throw error;
  }
}

/**
 * Approve token spending for the contract
 * @param {string} tokenSymbol - Token symbol (USDT, wINJ)
 * @param {bigint} amount - Amount to approve
 * @param {string} account - User's account address
 */

// =========== Erc20 Approve function ============
// =========== Erc20 Approve function ============
async function approveToken(tokenSymbol, amount, owner) {
  console.log(`Approving ${tokenSymbol} for contract...`);

  const wallet = getWalletClient();

  const allowance = await publicClient.readContract({
    address: TOKEN_ADDRESSES.WINJ,
    abi: wINJAbi,
    functionName: "allowance",
    args: [owner, CONTRACT_ADDRESS],
  });

  if (allowance >= amount) {
    console.log("Already approved");
    return null; // important
  }

  const hash = await wallet.writeContract({
    address: TOKEN_ADDRESSES.WINJ,
    abi: wINJAbi,
    functionName: "approve",
    args: [CONTRACT_ADDRESS, amount],
    account: owner,
  });

  console.log("Approval tx hash:", hash);

  return hash; // ✅ THIS IS THE FIX
}

// delay
export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get bounty details from blockchain
 * @param {number} bountyId - Bounty ID
 */
export async function getBountyDetails(bountyId) {
  try {
    const result = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "getBountyInfo",
      args: [Number(bountyId)],
    });

    return {
      creator: result[0],
      winners: result[1],
      reward: formatEther(result[2]),
      fee: formatEther(result[3]),
      rewardsAssigned: result[4],
      isClaimed: result[5],
      tokenType: result[6],
      payoutType: result[7],
    };
  } catch (error) {
    console.error("Error getting bounty details:", error);
    throw error;
  }
}

/**
 * Get all available bounties
 */
export async function getAllBounties() {
  try {
    const bountyIds = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "availableBounties",
      args: [],
    });

    return bountyIds.map((id) => Number(id));
  } catch (error) {
    console.error("Error getting all bounties:", error);
    throw error;
  }
}

/**
 * Get bounties by creator
 * @param {string} creator - Creator address
 */
export async function getBountiesByCreator(creator) {
  try {
    const bountyIds = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "bountiesByCreator",
      args: [creator],
    });

    return bountyIds.map((id) => Number(id));
  } catch (error) {
    console.error("Error getting bounties by creator:", error);
    throw error;
  }
}

/**
 * Claim reward for a bounty
 * @param {number} bountyId - Bounty ID
 */
export async function claimReward(bountyId) {
  try {
    const wallet = getWalletClient();
    const [account] = await wallet.getAddresses();

    const tx = {
      address: CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "claimReward",
      args: [BigInt(bountyId)],
      account,
    };

    const hash = await wallet.writeContract(tx);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error claiming reward:", error);
    throw error;
  }
}

/**
 * Submit a solution for a bounty
 * @param {number} bountyId - Bounty ID
 * @param {string} submissionLink - Link to submission
 */
export async function submitSolution(bountyId, submissionLink) {
  try {
    const wallet = getWalletClient();
    const [account] = await wallet.getAddresses();

    const tx = {
      address: CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "submit",
      args: [BigInt(bountyId), submissionLink],
      account,
    };

    const hash = await wallet.writeContract(tx);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("Error submitting solution:", error);
    throw error;
  }
}

/**
 * Check claimable reward for a user
 * @param {number} bountyId - Bounty ID
 * @param {string} user - User address
 */
export async function getClaimableReward(bountyId, user) {
  try {
    const amount = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "claimableRewards",
      args: [BigInt(bountyId), user],
    });

    return formatEther(amount);
  } catch (error) {
    console.error("Error getting claimable reward:", error);
    throw error;
  }
}

/**
 * Check if reward has been claimed
 * @param {number} bountyId - Bounty ID
 * @param {string} user - User address
 */
export async function hasClaimed(bountyId, user) {
  try {
    const claimed = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: BOUNTY_ABI,
      functionName: "claimed",
      args: [BigInt(bountyId), user],
    });

    return claimed;
  } catch (error) {
    console.error("Error checking claim status:", error);
    throw error;
  }
}

/**
 * Listen to BountyCreated events
 * @param {Function} callback - Callback function when event is emitted
 */
export function listenToBountyCreated(callback) {
  publicClient.watchEvent({
    address: CONTRACT_ADDRESS,
    event: {
      type: "event",
      name: "BountyCreated",
      inputs: [
        { indexed: true, type: "uint256", name: "bountyId" },
        { indexed: true, type: "address", name: "creator" },
        { indexed: false, type: "uint256", name: "reward" },
        { indexed: false, type: "uint256", name: "fee" },
        { indexed: false, type: "uint8", name: "tokenType" },
        { indexed: false, type: "uint8", name: "payoutType" },
      ],
    },
    onLogs: (logs) => {
      logs.forEach((log) => {
        callback({
          bountyId: Number(log.args.bountyId),
          creator: log.args.creator,
          reward: formatEther(log.args.reward),
          fee: formatEther(log.args.fee),
          tokenType: log.args.tokenType,
          payoutType: log.args.payoutType,
          txHash: log.transactionHash,
        });
      });
    },
  });
}

/**
 * Listen to RewardClaimed events
 * @param {Function} callback - Callback function when event is emitted
 */
export function listenToRewardClaimed(callback) {
  publicClient.watchEvent({
    address: CONTRACT_ADDRESS,
    event: {
      type: "event",
      name: "RewardClaimed",
      inputs: [
        { indexed: true, type: "uint256", name: "bountyId" },
        { indexed: true, type: "address", name: "winner" },
        { indexed: false, type: "uint256", name: "amount" },
      ],
    },
    onLogs: (logs) => {
      logs.forEach((log) => {
        callback({
          bountyId: Number(log.args.bountyId),
          winner: log.args.winner,
          amount: formatEther(log.args.amount),
          txHash: log.transactionHash,
        });
      });
    },
  });
}
