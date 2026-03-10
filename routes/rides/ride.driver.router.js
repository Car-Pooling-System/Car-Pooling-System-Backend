import express from "express";
import Ride from "../../models/ride.model.js";
import Driver from "../../models/driver.model.js";
import Rider from "../../models/user.model.js";
import { sendBookingConfirmation } from "../../utils/mailer.utils.js";

const router = express.Router();

/* ------------- SEAT LABELS HELPER ------------- */
const SEAT_LABELS = {
  front: "Front Seat",
  backWindow: "Back Window Seat",
  backMiddle: "Back Middle Seat",
  backArmrest: "Back Seat w/ Armrest",
  thirdRow: "Third Row Seat",
  any: "Any Seat",
};

/* ---------------- CHANGE PASSENGER SEAT (before confirm) ---- */
router.put("/:rideId/change-seat", async (req, res) => {
  try {
    const { driverUserId, passengerUserId, seatType } = req.body;

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.userId !== driverUserId)
      return res.status(403).json({ message: "Unauthorized" });

    const passengerIndex = ride.passengers.findIndex(
      (p) => p.userId === passengerUserId && p.status === "requested",
    );

    if (passengerIndex === -1)
      return res.status(404).json({ message: "Pending (unconfirmed) passenger not found" });

    if (!SEAT_LABELS[seatType])
      return res.status(400).json({ message: "Invalid seat type" });

    ride.passengers[passengerIndex].seatType = seatType;
    ride.passengers[passengerIndex].seatLabel = SEAT_LABELS[seatType];

    await ride.save();

    res.json({
      message: "Seat changed successfully",
      passenger: ride.passengers[passengerIndex],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to change seat" });
  }
});

/* ---------------- CONFIRM RIDE REQUEST (group-aware) ---- */
router.post("/:rideId/confirm-request", async (req, res) => {
  try {
    const { driverUserId, passengerUserId, seatType } = req.body;

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.userId !== driverUserId)
      return res.status(403).json({ message: "Unauthorized" });

    // Find the target passenger
    const target = ride.passengers.find(
      (p) => p.userId === passengerUserId && p.status === "requested",
    );
    if (!target)
      return res.status(404).json({ message: "Pending request not found" });

    // Determine the booker — either this user IS the booker, or the user's bookedBy field
    const bookerId = target.isGuest ? target.bookedBy : target.userId;

    // Collect the whole group: the booker + all guests they booked, all still "requested"
    const groupIndices = [];
    ride.passengers.forEach((p, idx) => {
      if (p.status !== "requested") return;
      if (p.userId === bookerId || p.bookedBy === bookerId) groupIndices.push(idx);
    });

    if (groupIndices.length === 0)
      return res.status(404).json({ message: "No pending passengers in this group" });

    if (ride.seats.available < groupIndices.length)
      return res.status(400).json({ message: `Not enough seats. Need ${groupIndices.length}, only ${ride.seats.available} available.` });

    // Confirm all passengers in the group
    const confirmed = [];
    for (const idx of groupIndices) {
      // Apply seat override only to the specific passenger if provided
      if (seatType && SEAT_LABELS[seatType] && ride.passengers[idx].userId === passengerUserId) {
        ride.passengers[idx].seatType = seatType;
        ride.passengers[idx].seatLabel = SEAT_LABELS[seatType];
      }
      ride.passengers[idx].status = "confirmed";
      ride.seats.available -= 1;
      confirmed.push(ride.passengers[idx]);
    }

    await ride.save();

    // Update the booker's rider record
    await Rider.updateOne(
      {
        userId: bookerId,
        "bookings.rideId": ride._id,
        "bookings.status": "requested",
      },
      {
        $set: { "bookings.$.status": "confirmed" },
      },
    );

    console.log(`Confirmed group: booker=${bookerId}, ${confirmed.length} passenger(s)`);

    res.json({
      message: `Confirmed ${confirmed.length} passenger(s)`,
      passengers: confirmed,
      groupSize: confirmed.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to confirm request" });
  }
});

/* ---------------- REJECT RIDE REQUEST (group-aware) ---- */
router.post("/:rideId/reject-request", async (req, res) => {
  try {
    const { driverUserId, passengerUserId } = req.body;

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.userId !== driverUserId)
      return res.status(403).json({ message: "Unauthorized" });

    const target = ride.passengers.find(
      (p) => p.userId === passengerUserId && p.status === "requested",
    );
    if (!target)
      return res.status(404).json({ message: "Pending request not found" });

    // Determine the booker
    const bookerId = target.isGuest ? target.bookedBy : target.userId;

    // Reject the whole group
    let rejectedCount = 0;
    ride.passengers.forEach((p) => {
      if (p.status !== "requested") return;
      if (p.userId === bookerId || p.bookedBy === bookerId) {
        p.status = "cancelled";
        rejectedCount++;
      }
    });

    await ride.save();

    // Update the booker's rider record
    await Rider.updateOne(
      {
        userId: bookerId,
        "bookings.rideId": ride._id,
        "bookings.status": "requested",
      },
      {
        $set: { "bookings.$.status": "cancelled" },
      },
    );

    console.log(`Rejected group: booker=${bookerId}, ${rejectedCount} passenger(s)`);

    res.json({ message: `Rejected ${rejectedCount} passenger(s)`, rejectedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reject request" });
  }
});

/* ---------------- REMOVE PASSENGER ---------------- */
router.post("/:rideId/remove-passenger", async (req, res) => {
  try {
    const { passengerUserId, driverUserId } = req.body;

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.userId !== driverUserId)
      return res.status(403).json({ message: "Unauthorized" });

    const passengerIndex = ride.passengers.findIndex(
      (p) => p.userId === passengerUserId && p.status === "confirmed",
    );

    if (passengerIndex === -1)
      return res.status(404).json({ message: "Passenger not found" });

    ride.passengers[passengerIndex].status = "cancelled";
    ride.seats.available += 1;

    await ride.save();

    // Update rider stats
    await Rider.updateOne(
      { userId: passengerUserId },
      { $inc: { "rides.cancelled": 1 } },
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
      { $inc: { "rides.cancelled": 1 } },
    );

    // Update all passengers
    for (const p of ride.passengers) {
      if (p.status === "confirmed") {
        await Rider.updateOne(
          { userId: p.userId },
          { $inc: { "rides.cancelled": 1 } },
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

    const confirmedPassengersCount = ride.passengers.filter(
      (p) => p.status === "confirmed",
    ).length;
    if (confirmedPassengersCount > 0) {
      return res
        .status(400)
        .json({
          message: "Cannot update preferences after passengers have booked.",
        });
    }

    if (preferences) {
      ride.preferences = {
        ...ride.preferences,
        ...preferences,
      };
    }

    await ride.save();
    res.json({
      message: "Preferences updated successfully",
      preferences: ride.preferences,
    });
  } catch (err) {
    console.error("UPDATE PREFERENCES ERROR:", err);
    res.status(500).json({ message: "Failed to update preferences" });
  }
});

export default router;
