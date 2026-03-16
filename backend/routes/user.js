// backend/routes/user.js
import express from "express";
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// ==================== GET USER PROFILE ====================
// GET /users/:wallet - Get complete user profile
router.get("/:wallet", async (req, res) => {
  try {
    const db = getDB();
    const { wallet } = req.params;

    // Get or create user
    let user = await db.collection("users").findOne({
      walletAddress: wallet,
    });

    if (!user) {
      // Create new user if doesn't exist
      const newUser = {
        walletAddress: wallet,
        reputationScore: 0,
        totalEarnings: "0",
        createdAt: new Date(),
        lastLogin: new Date(),
        stats: {
          tasksCreated: 0,
          tasksCompleted: 0,
          submissions: { pending: 0, accepted: 0, rejected: 0 },
        },
      };

      await db.collection("users").insertOne(newUser);
      user = newUser;
    } else {
      // Update last login
      await db
        .collection("users")
        .updateOne(
          { walletAddress: wallet },
          { $set: { lastLogin: new Date() } },
        );
    }

    // Get user's bounties (created)
    const createdBounties = await db
      .collection("bounties")
      .find({ creator: wallet })
      .toArray();

    // Get user's submissions
    const submissions = await db
      .collection("submissions")
      .find({ user: wallet })
      .toArray();

    // Calculate bounty stats for creator
    const bountyStats = {
      active: createdBounties.filter((b) => b.status === "active").length,
      claimed: createdBounties.filter(
        (b) => b.winners.claimed && b.winners.claimed.length > 0,
      ).length,
      closed: createdBounties.filter((b) => b.status === "completed").length,
    };

    // Calculate submission stats
    const submissionStats = {
      pending: submissions.filter((s) => s.status === "pending").length,
      accepted: submissions.filter((s) => s.status === "accepted").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    };

    res.json({
      user,
      bounties: {
        created: createdBounties,
        stats: bountyStats,
      },
      submissions: {
        list: submissions,
        stats: submissionStats,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// ==================== UPDATE REPUTATION SCORE ====================
// PATCH /users/:wallet/reputation - Update user's reputation
router.patch("/:wallet/reputation", async (req, res) => {
  try {
    const db = getDB();
    const { wallet } = req.params;
    const { score } = req.body;

    const result = await db
      .collection("users")
      .updateOne(
        { walletAddress: wallet },
        { $set: { reputationScore: score } },
      );

    res.json({ message: "Reputation updated" });
  } catch (error) {
    console.error("Error updating reputation:", error);
    res.status(500).json({ error: "Failed to update reputation" });
  }
});

export default router;
