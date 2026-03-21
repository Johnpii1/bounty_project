require("dotenv").config();
const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToDb, getDb } = require("./db");
const cors = require("cors");

// init app & midware
const app = express();
app.use(express.json());
app.use(cors());
const port = process.env.PORT;

// connect to the database before starting the server
let db;

connectToDb((err) => {
  if (!err) {
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
    db = getDb();
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate bounty status based on start date and deadline
 */
function calculateBountyStatus(startDate, deadline) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(deadline);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "completed";
}

/**
 * Update status of all bounties based on current date
 * Call this periodically or when fetching bounties
 */
async function updateBountyStatuses() {
  try {
    const bounties = await db.collection("bounty").find({}).toArray();

    for (const bounty of bounties) {
      const newStatus = calculateBountyStatus(
        bounty.startDate,
        bounty.deadline,
      );

      if (bounty.status !== newStatus) {
        await db
          .collection("bounty")
          .updateOne({ _id: bounty._id }, { $set: { status: newStatus } });
        console.log(`Updated bounty ${bounty._id} status to ${newStatus}`);
      }
    }
  } catch (err) {
    console.error("Error updating bounty statuses:", err);
  }
}

// ==================== BOUNTY ROUTES ====================

/**
 * 1. CREATE a new bounty
 */
app.post("/task", async (req, res) => {
  const newBounty = req.body;

  if (!newBounty.title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    // Calculate initial status
    newBounty.status = calculateBountyStatus(
      newBounty.startDate,
      newBounty.deadline,
    );

    // Add timestamps
    newBounty.createdAt = new Date().toISOString();

    // Initialize submissions and winners if not provided
    if (!newBounty.submissions) {
      newBounty.submissions = {
        count: 0,
        maxSubmissions: 100,
        ids: [],
      };
    }

    if (!newBounty.winners) {
      newBounty.winners = {
        assigned: [],
        claimed: [],
      };
    }

    const result = await db.collection("bounty").insertOne(newBounty);

    res.status(201).json({
      message: "Bounty created successfully",
      _id: result.insertedId,
      bounty: newBounty,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ error: "Could not create a new bounty" });
  }
});

/**
 * 2. GET bounties with filtering by status, category, tags
 */
// In your app.js - UPDATE THE GET /task ROUTE

app.get("/task", async (req, res) => {
  try {
    const { status, category, tags, page = 0, limit = 4 } = req.query;

    // Build base filter
    let filter = {};

    if (category) {
      filter.category = category;
    }

    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim());
      filter.tags = { $in: tagArray };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = pageNum * limitNum;
    const now = new Date();

    // Build status filter based on current date
    let statusFilter = {};
    if (status && status !== "all") {
      if (status === "active") {
        statusFilter = {
          startDate: { $lte: now.toISOString() },
          deadline: { $gte: now.toISOString() },
        };
      } else if (status === "upcoming") {
        statusFilter = {
          startDate: { $gt: now.toISOString() },
        };
      } else if (status === "completed") {
        statusFilter = {
          deadline: { $lt: now.toISOString() },
        };
      }
    }

    // Combine filters
    const finalFilter = { ...filter, ...statusFilter };

    // Get total count with filter
    const totalCount = await db
      .collection("bounty")
      .countDocuments(finalFilter);

    // Fetch paginated bounties
    const bounties = await db
      .collection("bounty")
      .find(finalFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    // Calculate and update real-time status for fetched bounties
    const bountiesWithStatus = bounties.map((bounty) => {
      const startDate = new Date(bounty.startDate);
      const deadline = new Date(bounty.deadline);
      const currentNow = new Date();

      let currentStatus;
      if (currentNow < startDate) {
        currentStatus = "upcoming";
      } else if (currentNow >= startDate && currentNow <= deadline) {
        currentStatus = "active";
      } else {
        currentStatus = "completed";
      }

      // Update database if needed
      if (bounty.status !== currentStatus) {
        db.collection("bounty")
          .updateOne({ _id: bounty._id }, { $set: { status: currentStatus } })
          .catch((err) => console.error("Status update error:", err));
      }

      return {
        ...bounty,
        status: currentStatus,
      };
    });

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      bounties: bountiesWithStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: totalPages,
        currentPage: pageNum,
        hasNext: pageNum + 1 < totalPages,
        hasPrev: pageNum > 0,
      },
    });
  } catch (err) {
    console.error("Error fetching bounties:", err);
    res.status(500).json({ error: "Failed to fetch bounties" });
  }
});

/**
 * 3. GET single bounty by ID
 */
app.get("/task/:id", async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid bounty ID" });
  }

  try {
    const bounty = await db
      .collection("bounty")
      .findOne({ _id: new ObjectId(id) });

    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    // Update status in real-time
    bounty.status = calculateBountyStatus(bounty.startDate, bounty.deadline);

    res.status(200).json(bounty);
  } catch (err) {
    console.error("Failed to fetch bounty", err);
    res.status(500).json({ error: "Failed to fetch bounty" });
  }
});

/**
 * 4. UPDATE bounty
 */
app.patch("/task/:id", async (req, res) => {
  const id = req.params.id;
  const updates = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid bounty ID" });
  }

  try {
    // If dates are updated, recalculate status
    if (updates.startDate || updates.deadline) {
      const bounty = await db
        .collection("bounty")
        .findOne({ _id: new ObjectId(id) });
      const startDate = updates.startDate || bounty.startDate;
      const deadline = updates.deadline || bounty.deadline;
      updates.status = calculateBountyStatus(startDate, deadline);
    }

    updates.updatedAt = new Date().toISOString();

    const result = await db
      .collection("bounty")
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    res.status(200).json({
      message: "Bounty updated successfully",
      modified: result.modifiedCount > 0,
    });
  } catch (err) {
    console.error("Failed to update bounty", err);
    res.status(500).json({ error: "Failed to update bounty" });
  }
});

/**
 * 5. DELETE bounty
 */
app.delete("/task/:id", async (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid bounty ID" });
  }

  try {
    const result = await db
      .collection("bounty")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    res.status(200).json({ message: "Bounty deleted successfully" });
  } catch (err) {
    console.error("Failed to delete bounty", err);
    res.status(500).json({ error: "Failed to delete bounty" });
  }
});

// ==================== USER ROUTES ====================

/**
 * 6. GET user by wallet address
 */
app.get("/user/:wallet", async (req, res) => {
  const wallet = req.params.wallet;

  try {
    // Find user by wallet address
    let user = await db.collection("users").findOne({ walletAddress: wallet });

    // If user doesn't exist, create a new one
    if (!user) {
      const newUser = {
        walletAddress: wallet,
        reputationScore: 0,
        totalEarnings: "0",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        stats: {
          tasksCreated: 0,
          tasksCompleted: 0,
          submissions: { pending: 0, accepted: 0, rejected: 0 },
        },
      };

      const result = await db.collection("users").insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
      // Update last login
      await db
        .collection("users")
        .updateOne(
          { walletAddress: wallet },
          { $set: { lastLogin: new Date().toISOString() } },
        );
    }

    // Get user's created bounties
    const createdBounties = await db
      .collection("bounty")
      .find({ creator: wallet })
      .toArray();

    // Get user's submissions (you'll need a submissions collection)
    const submissions = await db
      .collection("submissions")
      .find({ user: wallet })
      .toArray();

    res.status(200).json({
      user,
      createdBounties,
      submissions,
    });
  } catch (err) {
    console.error("Failed to fetch user", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ==================== SUBMISSION ROUTES ====================

/**
 * 7. CREATE a submission
 */
app.post("/submission", async (req, res) => {
  const { bountyId, user, description, projectLink, image } = req.body;

  if (!bountyId || !user || !description || !projectLink) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if bounty exists
    const bounty = await db.collection("bounty").findOne({
      _id: new ObjectId(bountyId),
    });

    if (!bounty) {
      return res.status(404).json({ error: "Bounty not found" });
    }

    // Check if user already submitted
    const existingSubmission = await db.collection("submissions").findOne({
      bountyId: new ObjectId(bountyId),
      user: user,
    });

    if (existingSubmission) {
      return res
        .status(400)
        .json({ error: "Already submitted to this bounty" });
    }

    // Create submission
    const submission = {
      bountyId: new ObjectId(bountyId),
      bountyTitle: bounty.title,
      user,
      description,
      projectLink,
      image: image || "",
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    const result = await db.collection("submissions").insertOne(submission);

    // Update bounty submission count
    await db.collection("bounty").updateOne(
      { _id: new ObjectId(bountyId) },
      {
        $inc: { "submissions.count": 1 },
        $push: { "submissions.ids": result.insertedId },
      },
    );

    res.status(201).json({
      message: "Submission created successfully",
      _id: result.insertedId,
    });
  } catch (err) {
    console.error("Failed to create submission", err);
    res.status(500).json({ error: "Failed to create submission" });
  }
});

/**
 * 8. GET submissions by user
 */
app.get("/submissions/user/:wallet", async (req, res) => {
  const wallet = req.params.wallet;

  try {
    const submissions = await db
      .collection("submissions")
      .find({ user: wallet })
      .sort({ submittedAt: -1 })
      .toArray();

    // Calculate stats
    const stats = {
      pending: submissions.filter((s) => s.status === "pending").length,
      accepted: submissions.filter((s) => s.status === "accepted").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    };

    res.status(200).json({
      submissions,
      stats,
    });
  } catch (err) {
    console.error("Failed to fetch submissions", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// ==================== DASHBOARD STATS ====================

/**
 * 9. GET dashboard stats for a user
 */
app.get("/dashboard/:wallet", async (req, res) => {
  const wallet = req.params.wallet;

  try {
    // Get user
    const user = await db
      .collection("users")
      .findOne({ walletAddress: wallet });

    // Get user's bounties
    const createdBounties = await db
      .collection("bounty")
      .find({ creator: wallet })
      .toArray();

    // Get user's submissions
    const submissions = await db
      .collection("submissions")
      .find({ user: wallet })
      .toArray();

    // Calculate bounty stats
    const bountyStats = {
      active: createdBounties.filter((b) => {
        const status = calculateBountyStatus(b.startDate, b.deadline);
        return status === "active";
      }).length,
      completed: createdBounties.filter((b) => {
        const status = calculateBountyStatus(b.startDate, b.deadline);
        return status === "completed";
      }).length,
      total: createdBounties.length,
    };

    // Calculate submission stats
    const submissionStats = {
      pending: submissions.filter((s) => s.status === "pending").length,
      accepted: submissions.filter((s) => s.status === "accepted").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
      total: submissions.length,
    };

    // Calculate total earnings
    let totalEarnings = 0;
    submissions
      .filter((s) => s.status === "accepted")
      .forEach((s) => {
        const bounty = createdBounties.find(
          (b) => b._id.toString() === s.bountyId.toString(),
        );
        if (bounty) {
          totalEarnings += bounty.reward || 0;
        }
      });

    res.status(200).json({
      user: {
        walletAddress: wallet,
        reputationScore: user?.reputationScore || 0,
        totalEarnings: totalEarnings.toString(),
      },
      bounties: bountyStats,
      submissions: submissionStats,
    });
  } catch (err) {
    console.error("Failed to fetch dashboard stats", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// ==================== UTILITY ROUTES ====================

/**
 * 10. GET all unique categories
 */
app.get("/categories", async (req, res) => {
  try {
    const categories = await db.collection("bounty").distinct("category");
    res.status(200).json(categories);
  } catch (err) {
    console.error("Failed to fetch categories", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/**
 * 11. GET all unique tags
 */
app.get("/tags", async (req, res) => {
  try {
    const tags = await db.collection("bounty").distinct("tags");
    // Flatten the array of arrays
    const allTags = [...new Set(tags.flat())];
    res.status(200).json(allTags);
  } catch (err) {
    console.error("Failed to fetch tags", err);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// ==================== STATUS UPDATE ENDPOINT ====================

/**
 * 12. Manually trigger status update (for testing)
 */
app.post("/update-statuses", async (req, res) => {
  try {
    await updateBountyStatuses();
    res.status(200).json({ message: "Bounty statuses updated successfully" });
  } catch (err) {
    console.error("Failed to update statuses", err);
    res.status(500).json({ error: "Failed to update statuses" });
  }
});
