// backend/routes/submission.js
import express from "express";
import { getDB } from "../db.js";
import { ObjectId } from "mongodb";

const router = express.Router();

// ==================== CREATE SUBMISSION ====================
// POST /submissions - Submit work for a bounty
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const {
      bountyId,
      user, // wallet address
      image, // IPFS link or URL
      description,
      projectLink,
      email, // optional for contact
    } = req.body;

    // Validate required fields
    if (!bountyId || !user || !description || !projectLink) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if bounty exists and is active
    const bounty = await db.collection("bounties").findOne({
      _id: new ObjectId(bountyId),
    });

    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    // Check if bounty is still active
    const now = new Date();
    if (now > bounty.timeline.deadline) {
      return res.status(400).json({ error: "Bounty deadline has passed" });
    }

    // Check submission limit
    if (bounty.submissions.count >= bounty.submissions.maxSubmissions) {
      return res.status(400).json({ error: "Maximum submissions reached" });
    }

    // Check if user already submitted
    const existingSubmission = await db.collection("submissions").findOne({
      bountyId: new ObjectId(bountyId),
      user: user,
    });

    if (existingSubmission) {
      return res
        .status(400)
        .json({ error: "You have already submitted to this bounty" });
    }

    // Create submission
    const submission = {
      bountyId: new ObjectId(bountyId),
      bountyTitle: bounty.title,
      user,
      image: image || "",
      description,
      projectLink,
      email: email || "",
      status: "pending", // pending, accepted, rejected
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("submissions").insertOne(submission);

    // Update bounty submission count
    await db.collection("bounties").updateOne(
      { _id: new ObjectId(bountyId) },
      {
        $inc: { "submissions.count": 1 },
        $push: { "submissions.ids": result.insertedId },
      },
    );

    // Update user stats
    await db.collection("users").updateOne(
      { walletAddress: user },
      {
        $inc: { "stats.submissions.pending": 1 },
        $setOnInsert: {
          walletAddress: user,
          createdAt: new Date(),
          reputationScore: 0,
          totalEarnings: "0",
          stats: {
            tasksCreated: 0,
            tasksCompleted: 0,
            submissions: { pending: 1, accepted: 0, rejected: 0 },
          },
        },
      },
      { upsert: true },
    );

    res.status(201).json({
      message: "Submission created successfully",
      submissionId: result.insertedId,
      submission,
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({ error: "Failed to create submission" });
  }
});

// ==================== GET USER SUBMISSIONS ====================
// GET /submissions/user/:wallet - Get all submissions by a user
router.get("/user/:wallet", async (req, res) => {
  try {
    const db = getDB();
    const { wallet } = req.params;

    const submissions = await db
      .collection("submissions")
      .find({ user: wallet })
      .sort({ submittedAt: -1 }) // Most recent first
      .toArray();

    // Group by status for stats
    const stats = {
      pending: submissions.filter((s) => s.status === "pending").length,
      accepted: submissions.filter((s) => s.status === "accepted").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    };

    res.json({
      submissions,
      stats,
    });
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// ==================== UPDATE SUBMISSION STATUS ====================
// PATCH /submissions/:id/status - Update status (accepted/rejected)
router.patch("/:id/status", async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { status, txHash } = req.body; // status: "accepted" or "rejected"

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid submission ID" });
    }

    // Get submission details
    const submission = await db.collection("submissions").findOne({
      _id: new ObjectId(id),
    });

    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    // Update submission
    const result = await db.collection("submissions").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          updatedAt: new Date(),
          transactionHash: txHash,
        },
      },
    );

    // Update user stats
    const updateField =
      status === "accepted"
        ? {
            $inc: {
              "stats.submissions.accepted": 1,
              "stats.submissions.pending": -1,
              "stats.tasksCompleted": 1,
            },
          }
        : {
            $inc: {
              "stats.submissions.rejected": 1,
              "stats.submissions.pending": -1,
            },
          };

    await db
      .collection("users")
      .updateOne({ walletAddress: submission.user }, updateField);

    // If accepted, update bounty winners
    if (status === "accepted") {
      await db
        .collection("bounties")
        .updateOne(
          { _id: submission.bountyId },
          { $addToSet: { "winners.assigned": submission.user } },
        );
    }

    res.json({ message: `Submission marked as ${status}` });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({ error: "Failed to update submission" });
  }
});

export default router;
