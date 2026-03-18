// 2 functions to connect to a database and to retrive from the database
require("dotenv").config();
const { MongoClient } = require("mongodb");

let dbConnection;
let uri = process.env.MONGODB_URI;

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
