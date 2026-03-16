// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

// Import routes
import bountyRoutes from "./routes/bounty.js";
import submissionRoutes from "./routes/submission.js";
import userRoutes from "./routes/user.js";

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5500", // Your frontend port (adjust as needed)
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" })); // For larger payloads

// Routes
app.use("/api/bounties", bountyRoutes); // All bounty endpoints
app.use("/api/submissions", submissionRoutes); // All submission endpoints
app.use("/api/users", userRoutes); // All user endpoints

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date(),
    mongodb: db ? "connected" : "disconnected",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 API endpoints:`);
      console.log(`   - GET    /api/health`);
      console.log(`   - POST   /api/bounties`);
      console.log(`   - GET    /api/bounties`);
      console.log(`   - GET    /api/bounties/:id`);
      console.log(`   - POST   /api/submissions`);
      console.log(`   - GET    /api/submissions/user/:wallet`);
      console.log(`   - GET    /api/users/:wallet`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
