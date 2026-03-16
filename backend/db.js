import { MongoClient } from "mongodb"

const uri = "mongodb://localhost:27017"

const client = new MongoClient(uri)

let db

export async function connectDB() {
    await client.connect()
    db = client.db("happyBounty")
    console.log("MongoDB connected")
}

export function getDB() {
    return db
}
