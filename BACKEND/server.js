
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const { expirePaymentReservations } = require("./services/inventoryService");

const {
  handleRazorpayWebhook,
} = require("./controllers/paymentController");

const app = express();
const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "uploads")
);

connectDB()
  .then(() => {
    expirePaymentReservations().catch((error) => {
      console.error("Initial inventory reservation expiry sweep failed:", error);
    });
    setInterval(() => {
      expirePaymentReservations().catch((error) => {
        console.error("Inventory reservation expiry sweep failed:", error);
      });
    }, 60 * 1000);
  })
  .catch((error) => {
    console.error("Inventory reservation expiry scheduler could not start:", error);
  });

app.use(cors());

// Serve uploaded product images.
// Adjust the path if your uploads folder is elsewhere.
app.use(
  "/uploads",
  express.static(uploadDir)
);

// Register the Razorpay webhook BEFORE express.json().
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook
);

// Parse normal JSON API requests.
app.use(express.json());

// API routes
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.send("HerbHaven API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
