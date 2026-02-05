import express from "express";
import Ride from "../../models/ride.model.js";
import Rider from "../../models/user.model.js";

const router = express.Router();

/**
 * POST /api/rides/:rideId/cancel
 * Cancel a ride booking
 */
router.post("/:rideId/cancel", async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const ride = await Ride.findById(req.params.rideId);
        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        // Find the passenger in the ride
        const passengerIndex = ride.passengers.findIndex(
            (p) => p.userId === userId && p.status === "confirmed"
        );

        if (passengerIndex === -1) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Mark passenger as cancelled
        ride.passengers[passengerIndex].status = "cancelled";

        // Increase available seats
        ride.seats.available += 1;

        await ride.save();

        // Update rider's booking status
        await Rider.updateOne(
            {
                userId: userId,
                "bookings.rideId": ride._id
            },
            {
                $set: { "bookings.$.status": "cancelled" }
            }
        );

        console.log("Booking cancelled for user:", userId, "on ride:", ride._id);

        res.json({
            message: "Booking cancelled successfully",
            refundAmount: ride.passengers[passengerIndex].farePaid
        });
    } catch (err) {
        console.error("CANCEL BOOKING ERROR:", err);
        res.status(500).json({ message: "Failed to cancel booking" });
    }
});

export default router;
