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

    // 1. Check if the user is the DRIVER
    if (ride.driver.userId === userId) {
      ride.status = "cancelled";

      // Loop through all confirmed/requested passengers to cancel them
      const cancelledPassengers = [];
      for (const passenger of ride.passengers) {
        if (passenger.status === "confirmed" || passenger.status === "requested") {
          passenger.status = "cancelled";
          cancelledPassengers.push(passenger.userId);
        }
      }

      await ride.save();

      // Update all passengers' booking status in parallel
      await Rider.updateMany(
        { userId: { $in: cancelledPassengers }, "bookings.rideId": ride._id },
        { $set: { "bookings.$.status": "cancelled" } },
      );

      console.log("Ride cancelled by driver:", userId, "Ride ID:", ride._id);
      
      return res.json({
        message: "Ride cancelled successfully. Passengers notified.",
      });
    }

    // 2. If not driver, proceed as PASSENGER cancellation
    const passengerIndex = ride.passengers.findIndex(
      (p) => p.userId === userId && (p.status === "confirmed" || p.status === "requested"),
    );

    if (passengerIndex === -1) {
      return res
        .status(404)
        .json({ message: "Booking not found or already cancelled" });
    }

    const wasConfirmed = ride.passengers[passengerIndex].status === "confirmed";

    // Mark passenger as cancelled
    ride.passengers[passengerIndex].status = "cancelled";

    // Only increase available seats if the booking was confirmed (seats were decremented)
    if (wasConfirmed) {
      ride.seats.available += 1;
    }

    await ride.save();

    // Update rider's booking status
    await Rider.updateOne(
      {
        userId: userId,
        "bookings.rideId": ride._id,
      },
      {
        $set: { "bookings.$.status": "cancelled" },
      },
    );

    console.log("Booking cancelled for user:", userId, "on ride:", ride._id);

    res.json({
      message: "Booking cancelled successfully",
      refundAmount: ride.passengers[passengerIndex].farePaid,
    });
  } catch (err) {
    console.error("CANCEL BOOKING ERROR:", err);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

export default router;
