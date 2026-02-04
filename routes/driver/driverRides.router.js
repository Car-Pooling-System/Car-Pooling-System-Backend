import express from "express";
import Ride from "../../models/ride.model.js";

const router = express.Router();

/**
 * GET /api/driver-rides/:driverUserId
 * Fetch all rides created by a driver
 */
router.get("/:driverUserId", async (req, res) => {
    try {
        const { driverUserId } = req.params;

        console.log("FETCHING RIDES FOR DRIVER:", driverUserId);

        const rides = await Ride.find({
            "driver.userId": driverUserId,
        }).sort({ "schedule.departureTime": 1 });

        console.log("RIDES FOUND:", rides.length);

        res.json(rides);
    } catch (err) {
        console.error("FETCH DRIVER RIDES ERROR:", err);
        res.status(500).json({ message: "Failed to fetch driver rides" });
    }
});

export default router;