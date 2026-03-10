import express from "express";
import crypto from "crypto";
import Ride from "../../models/ride.model.js";
import Rider from "../../models/user.model.js";
import { sendRideStartedEmail } from "../../utils/mailer.utils.js";

const router = express.Router();

/* ─── Generate 4-digit OTP ─── */
const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

/* ══════════════════════════════════════════════════
   POST /:rideId/start
   Driver starts the ride (must be within 1 hour of departure).
   Sets status → ongoing, emails all confirmed riders.
   ══════════════════════════════════════════════════ */
router.post("/:rideId/start", async (req, res) => {
  try {
    const { driverUserId } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.userId !== driverUserId)
      return res.status(403).json({ message: "Unauthorized" });

    if (ride.status !== "scheduled")
      return res.status(400).json({ message: `Ride is already ${ride.status}` });

    // Must be within 1 hour of departure time
    const now = new Date();
    const departure = new Date(ride.schedule.departureTime);
    const diffMs = departure.getTime() - now.getTime();
    const oneHourMs = 60 * 60 * 1000;

    if (diffMs > oneHourMs)
      return res.status(400).json({
        message: "Too early. You can start the ride within 1 hour of departure.",
      });

    // Start the ride
    ride.status = "ongoing";
    ride.startedAt = now;
    await ride.save();

    // Update all confirmed riders' booking status
    const confirmedPassengers = ride.passengers.filter(p => p.status === "confirmed");

    for (const p of confirmedPassengers) {
      await Rider.updateOne(
        { userId: p.userId, "bookings.rideId": ride._id },
        { $set: { "bookings.$.status": "confirmed" } }, // keep confirmed, rider sees ongoing via ride.status
      );
    }

    // Send email to all confirmed riders (non-blocking)
    for (const p of confirmedPassengers) {
      if (p.email || p.userId) {
        const riderDoc = await Rider.findOne({ userId: p.isGuest ? p.bookedBy : p.userId }).lean();
        const email = p.email || riderDoc?.email;
        if (email) {
          sendRideStartedEmail({
            to: email,
            riderName: p.name || "Rider",
            rideId: ride._id.toString(),
            from: ride.route?.start?.name || "",
            to_place: ride.route?.end?.name || "",
            departureTime: ride.schedule.departureTime,
            driverName: ride.driver.name || "Driver",
          }).catch(err => console.error("Email send error:", err.message));
        }
      }
    }

    console.log(`[LiveRide] Ride ${ride._id} started by driver ${driverUserId}`);
    res.json({ message: "Ride started successfully", ride });
  } catch (err) {
    console.error("[LiveRide] start error:", err);
    res.status(500).json({ message: "Failed to start ride" });
  }
});

/* ══════════════════════════════════════════════════
   POST /:rideId/rider-ready
   Rider signals they are ready for pickup.
   If userId is a booker, also mark their guests ready.
   ══════════════════════════════════════════════════ */
router.post("/:rideId/rider-ready", async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.status !== "ongoing")
      return res.status(400).json({ message: "Ride is not ongoing" });

    // Find all passengers that belong to this user (self + guests they booked)
    const myPassengerIndices = [];
    ride.passengers.forEach((p, idx) => {
      if (p.status === "confirmed" && (p.userId === userId || p.bookedBy === userId)) {
        myPassengerIndices.push(idx);
      }
    });

    if (myPassengerIndices.length === 0)
      return res.status(404).json({ message: "Passenger not found" });

    const otps = [];
    for (const idx of myPassengerIndices) {
      if (!ride.passengers[idx].isReady) {
        const otp = generateOtp();
        ride.passengers[idx].isReady = true;
        ride.passengers[idx].readyAt = new Date();
        ride.passengers[idx].boardingOtp = otp;

        if (lat && lng) {
          ride.passengers[idx].liveLocation = { lat, lng, updatedAt: new Date() };
        }

        otps.push({
          passengerId: ride.passengers[idx].userId,
          name: ride.passengers[idx].name,
          isGuest: ride.passengers[idx].isGuest || false,
          otp,
        });
      } else {
        // Already ready — return existing OTP
        otps.push({
          passengerId: ride.passengers[idx].userId,
          name: ride.passengers[idx].name,
          isGuest: ride.passengers[idx].isGuest || false,
          otp: ride.passengers[idx].boardingOtp,
        });
      }
    }

    await ride.save();

    console.log(`[LiveRide] Rider ${userId} + ${otps.length - 1} guests ready on ride ${ride._id}`);
    res.json({
      message: "You and your guests are marked as ready for pickup",
      otps,
      otp: otps.find(o => o.passengerId === userId)?.otp || otps[0]?.otp,
    });
  } catch (err) {
    console.error("[LiveRide] rider-ready error:", err);
    res.status(500).json({ message: "Failed to mark as ready" });
  }
});

/* ══════════════════════════════════════════════════
   POST /:rideId/verify-otp
   Driver enters OTP to confirm rider has boarded.
   ══════════════════════════════════════════════════ */
router.post("/:rideId/verify-otp", async (req, res) => {
  try {
    const { driverUserId, passengerUserId, otp } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.userId !== driverUserId)
      return res.status(403).json({ message: "Unauthorized" });

    const pIdx = ride.passengers.findIndex(
      p => p.userId === passengerUserId && p.status === "confirmed"
    );
    if (pIdx === -1)
      return res.status(404).json({ message: "Passenger not found" });

    if (ride.passengers[pIdx].boardingOtp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    ride.passengers[pIdx].isBoarded = true;
    ride.passengers[pIdx].boardedAt = new Date();
    ride.passengers[pIdx].boardingOtp = ""; // Clear OTP after use

    await ride.save();

    console.log(`[LiveRide] Rider ${passengerUserId} boarded ride ${ride._id}`);
    res.json({ message: "Rider boarding verified", passenger: ride.passengers[pIdx] });
  } catch (err) {
    console.error("[LiveRide] verify-otp error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

/* ══════════════════════════════════════════════════
   POST /:rideId/update-location
   Any participant updates their live location.
   ══════════════════════════════════════════════════ */
router.post("/:rideId/update-location", async (req, res) => {
  try {
    const { userId, lat, lng } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.status !== "ongoing")
      return res.status(400).json({ message: "Ride is not ongoing" });

    // Check if it's the driver
    if (ride.driver.userId === userId) {
      if (!ride.driver.liveLocation) ride.driver.liveLocation = {};
      ride.set("driver.liveLocation", { lat, lng, updatedAt: new Date() });
      await ride.save();
      return res.json({ message: "Driver location updated" });
    }

    // Check if it's a passenger
    const pIdx = ride.passengers.findIndex(
      p => p.userId === userId && p.status === "confirmed"
    );
    if (pIdx === -1)
      return res.status(404).json({ message: "Participant not found" });

    ride.passengers[pIdx].liveLocation = { lat, lng, updatedAt: new Date() };
    await ride.save();

    res.json({ message: "Location updated" });
  } catch (err) {
    console.error("[LiveRide] update-location error:", err);
    res.status(500).json({ message: "Failed to update location" });
  }
});

/* ══════════════════════════════════════════════════
   GET /:rideId/live
   Get live ride data (locations, status, OTPs etc.)
   ══════════════════════════════════════════════════ */
router.get("/:rideId/live", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).lean();
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    res.json({ ride });
  } catch (err) {
    console.error("[LiveRide] get live error:", err);
    res.status(500).json({ message: "Failed to fetch live data" });
  }
});

/* ══════════════════════════════════════════════════
   POST /:rideId/complete
   Driver completes the ride.
   ══════════════════════════════════════════════════ */
router.post("/:rideId/complete", async (req, res) => {
  try {
    const { driverUserId } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.driver.userId !== driverUserId)
      return res.status(403).json({ message: "Unauthorized" });

    ride.status = "completed";
    await ride.save();

    // Update rider bookings
    for (const p of ride.passengers.filter(p => p.status === "confirmed")) {
      await Rider.updateOne(
        { userId: p.userId, "bookings.rideId": ride._id },
        { $set: { "bookings.$.status": "completed" } },
      );
    }

    res.json({ message: "Ride completed", ride });
  } catch (err) {
    console.error("[LiveRide] complete error:", err);
    res.status(500).json({ message: "Failed to complete ride" });
  }
});

/* ══════════════════════════════════════════════════
   POST /:rideId/washroom-break
   A rider/booker requests a washroom break.
   ══════════════════════════════════════════════════ */
router.post("/:rideId/washroom-break", async (req, res) => {
  try {
    const { userId, riderName } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.status !== "ongoing")
      return res.status(400).json({ message: "Ride is not ongoing" });

    // Verify this user is a confirmed passenger or booker
    const isPassenger = ride.passengers.some(
      p => (p.userId === userId || p.bookedBy === userId) && p.status === "confirmed"
    );
    if (!isPassenger)
      return res.status(403).json({ message: "Not a confirmed passenger" });

    console.log(`[LiveRide] Washroom break requested by ${riderName || userId} on ride ${ride._id}`);
    res.json({ message: "Washroom break request sent", riderName });
  } catch (err) {
    console.error("[LiveRide] washroom-break error:", err);
    res.status(500).json({ message: "Failed to request break" });
  }
});

/* ══════════════════════════════════════════════════
   POST /:rideId/drop-passenger
   Mark a passenger as dropped off at current location.
   Can be triggered by rider (self/guests) or driver.
   ══════════════════════════════════════════════════ */
router.post("/:rideId/drop-passenger", async (req, res) => {
  try {
    const { userId, passengerUserId, lat, lng } = req.body;
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.status !== "ongoing")
      return res.status(400).json({ message: "Ride is not ongoing" });

    const targetId = passengerUserId || userId;

    const pIdx = ride.passengers.findIndex(
      p => p.userId === targetId && p.status === "confirmed"
    );
    if (pIdx === -1)
      return res.status(404).json({ message: "Passenger not found" });

    // Verify the requester is the passenger themselves, their booker, or the driver
    const passenger = ride.passengers[pIdx];
    const isAuthorized =
      userId === targetId ||
      passenger.bookedBy === userId ||
      ride.driver.userId === userId;

    if (!isAuthorized)
      return res.status(403).json({ message: "Unauthorized" });

    ride.passengers[pIdx].isDropped = true;
    ride.passengers[pIdx].droppedAt = new Date();
    if (lat && lng) {
      ride.passengers[pIdx].droppedLocation = { lat, lng };
    }

    await ride.save();

    // Check if ALL confirmed & boarded passengers are now dropped
    const boarded = ride.passengers.filter(p => p.status === "confirmed" && p.isBoarded);
    const allDropped = boarded.length > 0 && boarded.every(p => p.isDropped);

    console.log(`[LiveRide] Passenger ${targetId} dropped on ride ${ride._id}. All dropped: ${allDropped}`);

    res.json({
      message: `${passenger.name || "Passenger"} has been dropped off`,
      passenger: ride.passengers[pIdx],
      allDropped,
    });
  } catch (err) {
    console.error("[LiveRide] drop-passenger error:", err);
    res.status(500).json({ message: "Failed to drop passenger" });
  }
});

export default router;
