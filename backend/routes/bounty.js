import express from "express"
import { getDB } from "../db.js"

const router = express.Router()

router.post("/", async (req, res) => {

    const db = getDB()

    const bounty = {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags,
        reward: req.body.reward,
        token: req.body.token,
        startDate: new Date(req.body.startDate),
        deadline: new Date(req.body.deadline),
        winnersAllowed: req.body.winnersAllowed,
        creator: req.body.creator,
        createdAt: new Date()
    }

    const result = await db.collection("bounties").insertOne(bounty)

    res.json(result)
})

export default router
