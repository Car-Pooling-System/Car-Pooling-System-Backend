import express from "express";
import Ride from "../../models/ride.model.js";
import Driver from "../../models/driver.model.js";
import Rider from "../../models/user.model.js";

const router = express.Router();

/* ---------------- REMOVE PASSENGER ---------------- */
router.post("/:rideId/remove-passenger", async (req, res) => {
    try {
        const { passengerUserId, driverUserId } = req.body;

        const ride = await Ride.findById(req.params.rideId);
        if (!ride) return res.status(404).json({ message: "Ride not found" });

        if (ride.driver.userId !== driverUserId)
            return res.status(403).json({ message: "Unauthorized" });

        const passengerIndex = ride.passengers.findIndex(
            (p) => p.userId === passengerUserId && p.status === "confirmed"
        );

        if (passengerIndex === -1)
            return res.status(404).json({ message: "Passenger not found" });

        ride.passengers[passengerIndex].status = "cancelled";
        ride.seats.available += 1;

        await ride.save();

        // Update rider stats
        await Rider.updateOne(
            { userId: passengerUserId },
            { $inc: { "rides.cancelled": 1 } }
        );

        res.json({ message: "Passenger removed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to remove passenger" });
    }
});

/* ---------------- CANCEL ENTIRE RIDE ---------------- */
router.post("/:rideId/cancel", async (req, res) => {
    try {
        const { driverUserId } = req.body;

        const ride = await Ride.findById(req.params.rideId);
        if (!ride) return res.status(404).json({ message: "Ride not found" });

        if (ride.driver.userId !== driverUserId)
            return res.status(403).json({ message: "Unauthorized" });

        const hoursToDeparture =
            (new Date(ride.schedule.departureTime) - new Date()) / (1000 * 60 * 60);

        if (hoursToDeparture < 6)
            return res
                .status(400)
                .json({ message: "Cannot cancel within 6 hours of departure" });

        ride.status = "cancelled";
        await ride.save();

        // Update driver stats
        await Driver.updateOne(
            { userId: driverUserId },
            { $inc: { "rides.cancelled": 1 } }
        );

        // Update all passengers
        for (const p of ride.passengers) {
            if (p.status === "confirmed") {
                await Rider.updateOne(
                    { userId: p.userId },
                    { $inc: { "rides.cancelled": 1 } }
                );
            }
        }

        res.json({ message: "Ride cancelled successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Ride cancellation failed" });
    }
});

/* ---------------- UPDATE PREFERENCES ---------------- */
router.put("/:rideId/preferences", async (req, res) => {
    try {
        const { driverUserId, preferences } = req.body;
        const { rideId } = req.params;

        const ride = await Ride.findById(rideId);
        if (!ride) return res.status(404).json({ message: "Ride not found" });

        if (ride.driver.userId !== driverUserId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const confirmedPassengersCount = ride.passengers.filter(p => p.status === "confirmed").length;
        if (confirmedPassengersCount > 0) {
            return res.status(400).json({ message: "Cannot update preferences after passengers have booked." });
        }

        if (preferences) {
            ride.preferences = {
                ...ride.preferences,
                ...preferences
            };
        }

        await ride.save();
        res.json({ message: "Preferences updated successfully", preferences: ride.preferences });
    } catch (err) {
        console.error("UPDATE PREFERENCES ERROR:", err);
        res.status(500).json({ message: "Failed to update preferences" });
    }
});

export default router;