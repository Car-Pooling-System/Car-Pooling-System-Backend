import express from "express";
import Rider from "../../models/user.model.js";
import Ride from "../../models/ride.model.js";

const router = express.Router();

/**
 * GET /api/rider-rides/:userId
 * Fetch upcoming rides for a rider
 */
router.get("/:userId", async (req, res) => {
    try {
        console.log("FETCHING RIDES FOR RIDER:", req.params.userId);

        const rider = await Rider.findOne({ userId: req.params.userId })
            .populate({
                path: "bookings.rideId",
                match: { status: "scheduled" },
            });

        if (!rider) {
            console.log("Rider record not found for user:", req.params.userId);
            return res.json([]); // Return empty list instead of error
        }

        const upcoming = rider.bookings
            .filter((b) => {
                if (!b.rideId) {
                    console.log("Skipping booking due to missing/non-scheduled ride:", b._id);
                    return false;
                }
                return true;
            })
            .map((b) => ({
                bookingId: b._id,
                ride: b.rideId,
                farePaid: b.farePaid,
                status: b.status,
                bookedAt: b.bookedAt,
            }));

        console.log(`RIDES FOUND for ${req.params.userId}:`, upcoming.length);
        console.log("UPCOMING RIDES DATA (Sample):", upcoming.slice(0, 2).map(r => r.ride?._id));

        res.json(upcoming);
    } catch (err) {
        console.error("FETCH RIDER RIDES ERROR:", err);
        res.status(500).json({ message: "Failed to fetch rider rides" });
    }
});

export default router;
