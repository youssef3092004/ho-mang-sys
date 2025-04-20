require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const session = require('express-session');

const doctorRoutes = require("./routes/doctorRoutes");
const nurseRoutes = require("./routes/nurseRoutes");
const technicalRoutes = require("./routes/technicalStaffRoutes");
const authRoutes = require("./routes/authRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");

const cors = require('cors');

const DB_PORT = process.env.DB_PORT || 3000;

connectDB();

const app = express();
app.use(express.json());
// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    // Ensure cookie is secure in production (HTTPS)
    secure: process.env.NODE_ENV === 'production',
  }
}));
app.use(errorHandler);
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// setup Routes
app.use("/api/doctors", doctorRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/technical", technicalRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/auth", authRoutes);


app.get("/", (req, res) => {
  res.send("Welcome to home page");
});

console.log('Node.js Version:', process.version);

app.listen(DB_PORT, () => {
  console.log(`Server is listening on port ${DB_PORT}`);
});
