// backend/routes/bounty.js
import express from "express";
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// Helper function to determine bounty status
function getBountyStatus(startDate, deadline) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(deadline);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "completed";
}

// ==================== CREATE BOUNTY ====================
// POST /bounties - Create a new bounty
router.post("/", async (req, res) => {
  try {
    const db = getDB();

    // Destructure all fields from request body
    const {
      title,
      description,
      category,
      tags,
      reward,
      token,
      startDate,
      deadline,
      winnersAllowed,
      payoutType, // "single", "equal", or "percentage"
      percentages, // array for percentage split
      creator, // wallet address
      originLink,
      network,
    } = req.body;

    // Validate required fields
    if (!title || !description || !creator || !reward || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate winners limit
    if (winnersAllowed > 5) {
      return res.status(400).json({ error: "Maximum 5 winners allowed" });
    }

    // Create bounty object
    const bounty = {
      title,
      description,
      category,
      tags: tags || [],
      reward: {
        amount: parseFloat(reward),
        token: token,
        total: parseFloat(reward), // Will add fee calculation later
      },
      timeline: {
        startDate: new Date(startDate),
        deadline: new Date(deadline),
      },
      winners: {
        allowed: winnersAllowed || 1,
        payoutType: payoutType || "single", // single, equal, percentage
        percentages: percentages || [], // for percentage split
        assigned: [], // addresses of winners when assigned
        claimed: [], // addresses who have claimed
      },
      submissions: {
        count: 0,
        maxSubmissions: 100, // Cap at 100 submissions
        ids: [], // Array of submission ObjectIds
      },
      creator: creator,
      network: network || "injective",
      originLink: originLink || "",
      status: getBountyStatus(startDate, deadline),
      createdAt: new Date(),
      updatedAt: new Date(),
      contractBountyId: null, // Will be filled after smart contract creation
    };

    // Insert into database
    const result = await db.collection("bounties").insertOne(bounty);

    // Update user's created tasks count
    await db.collection("users").updateOne(
      { walletAddress: creator },
      {
        $inc: { "stats.tasksCreated": 1 },
        $setOnInsert: {
          walletAddress: creator,
          createdAt: new Date(),
          reputationScore: 0,
          totalEarnings: "0",
          stats: {
            tasksCreated: 1,
            tasksCompleted: 0,
            submissions: { pending: 0, accepted: 0, rejected: 0 },
          },
        },
      },
      { upsert: true }, // Create user if doesn't exist
    );

    res.status(201).json({
      message: "Bounty created successfully",
      bountyId: result.insertedId,
      bounty: { ...bounty, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Error creating bounty:", error);
    res.status(500).json({ error: "Failed to create bounty" });
  }
});

// ==================== GET ALL BOUNTIES ====================
// GET /bounties - Get all bounties with optional filters
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const { status, category, creator, limit = 20, page = 1 } = req.query;

    // Build filter object
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (creator) filter.creator = creator;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bounties from database
    const bounties = await db
      .collection("bounties")
      .find(filter)
      .sort({ "timeline.deadline": 1 }) // Show soonest deadlines first
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count for pagination
    const total = await db.collection("bounties").countDocuments(filter);

    // Update status for each bounty (in case they've expired)
    const updatedBounties = bounties.map((bounty) => {
      const currentStatus = getBountyStatus(
        bounty.timeline.startDate,
        bounty.timeline.deadline,
      );

      // If status changed, update in background (don't await)
      if (currentStatus !== bounty.status) {
        db.collection("bounties").updateOne(
          { _id: bounty._id },
          { $set: { status: currentStatus, updatedAt: new Date() } },
        );
      }

      return { ...bounty, status: currentStatus };
    });

    res.json({
      bounties: updatedBounties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching bounties:", error);
    res.status(500).json({ error: "Failed to fetch bounties" });
  }
});

// ==================== GET SINGLE BOUNTY ====================
// GET /bounties/:id - Get detailed bounty info
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    // Validate ID format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid bounty ID format" });
    }

    // Get bounty with submissions populated
    const bounty = await db.collection("bounties").findOne({
      _id: new ObjectId(id),
    });

    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    // Get submissions for this bounty
    const submissions = await db
      .collection("submissions")
      .find({ bountyId: new ObjectId(id) })
      .toArray();

    // Update status if needed
    const currentStatus = getBountyStatus(
      bounty.timeline.startDate,
      bounty.timeline.deadline,
    );

    res.json({
      ...bounty,
      status: currentStatus,
      submissions: {
        count: submissions.length,
        list: submissions,
      },
    });
  } catch (error) {
    console.error("Error fetching bounty:", error);
    res.status(500).json({ error: "Failed to fetch bounty" });
  }
});

// ==================== UPDATE BOUNTY WITH CONTRACT ID ====================
// PATCH /bounties/:id/contract - Update with smart contract data
router.patch("/:id/contract", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { contractBountyId, transactionHash } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid bounty ID" });
    }

    const result = await db.collection("bounties").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          contractBountyId,
          transactionHash,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    res.json({ message: "Bounty updated with contract data" });
  } catch (error) {
    console.error("Error updating bounty:", error);
    res.status(500).json({ error: "Failed to update bounty" });
  }
});

export default router;
