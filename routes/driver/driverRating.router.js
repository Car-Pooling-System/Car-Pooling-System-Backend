import express from "express";
import Driver from "../models/Driver.js";

const router = express.Router();

/**
 * GET driver rating
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId }).select("rating");

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.json(driver.rating);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * ADD a new rating (safe incremental update)
 * body: { value: Number }  // 1 to 5
 */
router.post("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { value } = req.body;

        if (!value || value < 1 || value > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        const oldAvg = driver.rating.average;
        const oldCount = driver.rating.reviewsCount;

        const newCount = oldCount + 1;
        const newAvg =
            (oldAvg * oldCount + value) / newCount;

        driver.rating.average = Number(newAvg.toFixed(2));
        driver.rating.reviewsCount = newCount;

        await driver.save();

        res.json({
            message: "Rating added successfully",
            rating: driver.rating,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * RESET rating (admin or moderation use)
 */
router.delete("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        driver.rating.average = 0;
        driver.rating.reviewsCount = 0;

        await driver.save();

        res.json({
            message: "Rating reset successfully",
            rating: driver.rating,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
