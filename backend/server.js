import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./src/routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Increase payload size for code submissions
app.use(express.json({ limit: "2mb" }));

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).send("Backend Running Successfully 🚀");
});

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------
app.use("/api", router);

// --------------------------------------------------
// GLOBAL ERROR HANDLER (SAFETY)
// --------------------------------------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
