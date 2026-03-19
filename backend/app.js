// require("dotenv").config();
// const express = require("express");
// const { ObjectId } = require("mongodb");
// const { connectToDb, getDb } = require("./db");
// const cors = require("cors");

// // init app & midware
// const app = express();
// app.use(express.json());
// app.use(cors());
// const port = process.env.PORT;

// // connect to the database before starting the server
// let db;

// connectToDb((err) => {
//   if (!err) {
//     app.listen(port, () => {
//       console.log(`App listening on port ${port}`);
//     });
//     db = getDb();
//   }
// });

// // routes
// app.post("/task", async (req, res) => {
//   const newBounty = req.body;

//   if (!newBounty.title) {
//     return res.status(400).json({ error: "Title is required" });
//   }

//   try {
//     const result = await db.collection("bounty").insertOne(newBounty);

//     res.status(201).json({
//       message: "Bounty created",
//       _id: result.insertedId,
//     });
//   } catch (err) {
//     console.error("Insert error:", err);
//     res.status(500).json({ error: "could not create a new bounty" });
//   }
// });

// // fetch all bounties from the database, sorted by active status

// app.get("/task", (req, res) => {
//   // current page
//   const pages = req.query.p || 0;
//   const bountyPerPage = 4;
//   let bounties = [];

//   db.collection("bounty")
//     .find({ status: "upcoming" })
//     .sort({ createdAt: -1 }) // newest first
//     .skip(pages * bountyPerPage)
//     .limit(bountyPerPage)
//     .forEach((bounty) => bounties.push(bounty))
//     .then(() => {
//       res.status(200).json(bounties);
//     })
//     .catch((err) => {
//       res.status(500).json({ error: "Failed to fetch bounties" });
//     });
// });

// // fetch a single bounty by ID
// app.get("/task/:id", (req, res) => {
//   const id = req.params.id;

//   if (ObjectId.isValid(id)) {
//     db.collection("bounty")
//       .findOne({ _id: new ObjectId(id) })
//       .then((doc) => {
//         res.status(200).json(doc);
//         console.log(doc);
//       })
//       .catch((err) => {
//         console.error("Failed to fetch bounty", err);
//         res.status(500).json({ error: "Failed to fetch bounty" });
//       });
//   } else {
//     res.status(500).json({ error: "Invalid bounty ID" });
//   }
// });

// // delete bounty
// app.delete("/task/:id", (req, res) => {
//   const id = req.params.id;
//   if (ObjectId.isValid(id)) {
//     db.collection("bounty")
//       .deleteOne({ _id: new ObjectId(id) })
//       .then((result) => {
//         res.status(200).json(result);
//       })
//       .catch((err) => {
//         console.error("Failed to delete bounty", err);
//         res.status(500).json({ error: "Failed to delete bounty" });
//       });
//   } else {
//     res.status(500).json({ error: "Invalid bounty ID" });
//   }
// });
