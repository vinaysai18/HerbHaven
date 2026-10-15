
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Atlas connected successfully!");
  } catch (err) {
    console.error("MongoDB connection failed!");
    console.error(err);
    throw err;
  }
};

module.exports = connectDB;
