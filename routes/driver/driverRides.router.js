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

/**
 * DELETE /api/driver-rides/:rideId
 * Delete a ride by ID
 */
router.delete("/:rideId", async (req, res) => {
  try {
    const { rideId } = req.params;
    console.log("DELETING RIDE:", rideId);

    const deletedRide = await Ride.findByIdAndDelete(rideId);

    if (!deletedRide) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.json({ message: "Ride deleted successfully" });
  } catch (err) {
    console.error("DELETE RIDE ERROR:", err);
    res.status(500).json({ message: "Failed to delete ride" });
  }
});

/**
 * PUT /api/driver-rides/:rideId
 * Update an existing ride by ID (driver-owned)
 */
router.put("/:rideId", async (req, res) => {
  try {
    const { rideId } = req.params;
    const { driverUserId, vehicle, route, schedule, pricing, preferences, seats, metrics } = req.body;

    if (!driverUserId) {
      return res.status(400).json({ message: "driverUserId is required" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    if (ride.driver?.userId !== driverUserId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (["cancelled", "completed"].includes(String(ride.status || "").toLowerCase())) {
      return res.status(400).json({ message: "Cannot edit a completed/cancelled ride" });
    }

    if (vehicle) ride.vehicle = { ...ride.vehicle, ...vehicle };

    if (route) {
      ride.route = {
        ...ride.route,
        ...route,
        start: route.start ? { ...ride.route?.start, ...route.start } : ride.route?.start,
        end: route.end ? { ...ride.route?.end, ...route.end } : ride.route?.end,
      };
    }

    if (schedule?.departureTime) {
      ride.schedule = { ...ride.schedule, departureTime: schedule.departureTime };
    }

    if (pricing) {
      ride.pricing = { ...ride.pricing, ...pricing };
    }

    if (preferences) {
      ride.preferences = { ...ride.preferences, ...preferences };
    }

    if (seats?.total !== undefined) {
      const nextTotal = Number(seats.total);
      const confirmedPassengers = (ride.passengers || []).filter((p) => p.status === "confirmed").length;
      if (Number.isNaN(nextTotal) || nextTotal < confirmedPassengers) {
        return res.status(400).json({
          message: `Total seats cannot be less than confirmed passengers (${confirmedPassengers})`,
        });
      }
      ride.seats.total = nextTotal;
      ride.seats.available = Math.max(0, nextTotal - confirmedPassengers);
    }

    if (metrics) {
      ride.metrics = { ...ride.metrics, ...metrics };
    }

    await ride.save();
    res.json({ message: "Ride updated successfully", ride });
  } catch (err) {
    console.error("UPDATE DRIVER RIDE ERROR:", err);
    res.status(500).json({ message: "Failed to update ride" });
  }
});

export default router;
