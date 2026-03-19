// 2 functions to connect to a database and to retrive from the database
require("dotenv").config();
const { MongoClient } = require("mongodb");

let dbConnection;
// adding for testing purpose only
// let uri = process.env.MONGODB_URI;
const uri =
  "mongodb+srv://oselufortunatus2002_db_user:nb9WpKAOIanncY1s@cluster0.3y7d5qk.mongodb.net/";

module.exports = {
  connectToDb: (callBack) => {
    MongoClient.connect(uri)
      .then((client) => {
        dbConnection = client.db();
        return callBack();
      })
      .catch((err) => {
        console.error("Failed to connect to the database", err);
        return callBack(err);
      });
  },
  getDb: () => dbConnection,
};
