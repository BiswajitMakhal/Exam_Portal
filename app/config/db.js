const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    const dbUrl = process.env.NODE_ENV === "test" ? process.env.MONGO_URL_TEST : process.env.MONGO_URL;
    await mongoose.connect(dbUrl);
    console.log(`Database connected successfully to: ${dbUrl}`);
  } catch (err) {
    console.log(err);
  }
};

module.exports = dbConnection;