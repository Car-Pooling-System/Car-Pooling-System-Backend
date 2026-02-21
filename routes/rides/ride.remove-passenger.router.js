import express from "express";
import Ride from "../../models/ride.model.js";
import Rider from "../../models/user.model.js";

const router = express.Router();

/**
 * POST /api/rides/:rideId/remove-passenger
 * Remove a passenger from a ride (driver only)
 */
router.post("/:rideId/remove-passenger", async (req, res) => {
  try {
    const { passengerId, driverId } = req.body;

    if (!passengerId || !driverId) {
      return res
        .status(400)
        .json({ message: "Passenger ID and Driver ID are required" });
    }

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Verify the requester is the driver
    if (ride.driver.userId !== driverId) {
      return res
        .status(403)
        .json({ message: "Only the driver can remove passengers" });
    }

    // Find the passenger in the ride
    const passengerIndex = ride.passengers.findIndex(
      (p) => p.userId === passengerId && p.status === "confirmed",
    );

    if (passengerIndex === -1) {
      return res
        .status(404)
        .json({ message: "Passenger not found in this ride" });
    }

    // Mark passenger as cancelled
    ride.passengers[passengerIndex].status = "cancelled";

    // Increase available seats
    ride.seats.available += 1;

    await ride.save();

    // Update rider's booking status
    await Rider.updateOne(
      {
        userId: passengerId,
        "bookings.rideId": ride._id,
      },
      {
        $set: { "bookings.$.status": "cancelled" },
      },
    );

    console.log(
      "Passenger removed by driver:",
      driverId,
      "passenger:",
      passengerId,
    );

    res.json({
      message: "Passenger removed successfully",
      passengerName: ride.passengers[passengerIndex].name,
    });
  } catch (err) {
    console.error("REMOVE PASSENGER ERROR:", err);
    res.status(500).json({ message: "Failed to remove passenger" });
  }
});

export default router;
