const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
    path: path.join(__dirname, "../.env")
});

const Traveler = require("./models/Traveler");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(__dirname));

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "travel.html"));
});

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        message: "Travel Buddy Finder backend is running",
        database: mongoose.connection.readyState === 1
            ? "Connected"
            : "Disconnected"
    });
});

// Add traveler
app.post("/travelers", async (req, res) => {
    try {
        const { travelerId, name, destination, travelDate } = req.body;

        if (!travelerId || !name || !destination || !travelDate) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const traveler = new Traveler({
            travelerId,
            name,
            destination,
            travelDate
        });

        await traveler.save();

        res.status(201).json({
            message: "Traveler details saved successfully",
            traveler
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Traveler ID already exists"
            });
        }

        res.status(500).json({
            message: "Unable to save traveler details",
            error: error.message
        });
    }
});

// View all travelers
app.get("/travelers", async (req, res) => {
    try {
        const travelers = await Traveler.find().sort({
            createdAt: -1
        });

        res.json(travelers);

    } catch (error) {
        res.status(500).json({
            message: "Unable to retrieve travelers",
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});