import express from "express";
import Rider from "../../models/user.model.js";

const router = express.Router();

/**
 * GET /api/rider-rides/:userId?filter=latest|upcoming|done|oldest
 * Fetch rides for a rider with optional filter
 */
router.get("/:userId", async (req, res) => {
  try {
    const { filter = "latest" } = req.query;
    console.log("FETCHING RIDES FOR RIDER:", req.params.userId, "Filter:", filter);

    const rider = await Rider.findOne({ userId: req.params.userId }).populate({
      path: "bookings.rideId",
    });

    if (!rider) {
      console.log("Rider record not found for user:", req.params.userId);
      return res.json([]); // Return empty list instead of error
    }

    let bookings = rider.bookings
      .filter((b) => {
        if (!b.rideId) {
          console.log("Skipping booking due to missing ride:", b._id);
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

    const now = new Date();

    // Apply filters
    if (filter === "upcoming") {
      bookings = bookings.filter(
        (b) =>
          new Date(b.ride?.schedule?.departureTime) > now &&
          b.ride?.status !== "completed" &&
          b.ride?.status !== "cancelled"
      );
      bookings.sort((a, b) =>
        new Date(a.ride?.schedule?.departureTime) - new Date(b.ride?.schedule?.departureTime)
      );
    } else if (filter === "done") {
      bookings = bookings.filter(
        (b) =>
          b.ride?.status === "completed" ||
          b.ride?.status === "cancelled" ||
          new Date(b.ride?.schedule?.departureTime) < now
      );
      bookings.sort((a, b) =>
        new Date(b.ride?.schedule?.departureTime) - new Date(a.ride?.schedule?.departureTime)
      );
    } else if (filter === "oldest") {
      bookings.sort((a, b) =>
        new Date(a.ride?.schedule?.departureTime) - new Date(b.ride?.schedule?.departureTime)
      );
    } else {
      // "latest" - default: newest first
      bookings.sort((a, b) =>
        new Date(b.ride?.schedule?.departureTime) - new Date(a.ride?.schedule?.departureTime)
      );
    }

    console.log(`RIDES FOUND for ${req.params.userId}:`, bookings.length, `(${filter})`);

    res.json(bookings);
  } catch (err) {
    console.error("FETCH RIDER RIDES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch rider rides" });
  }
});

export default router;
