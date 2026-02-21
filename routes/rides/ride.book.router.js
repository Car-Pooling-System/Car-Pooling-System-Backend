import express from "express";
import Ride from "../../models/ride.model.js";
import Rider from "../../models/user.model.js";
import { decodePolyline } from "../../utils/polyline.utils.js";
import { latLngToGrid } from "../../utils/geo.utils.js";
import { findClosestPointIndex } from "../../utils/route.utils.js";
import { calculateSegmentDistance } from "../../utils/fare.utils.js";

const router = express.Router();

router.post("/:rideId/book", async (req, res) => {
  try {
    const { user, pickup, drop } = req.body;

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    if (ride.seats.available <= 0)
      return res.status(400).json({ message: "No seats available" });

    // Check if user already booked this ride
    const alreadyBooked = ride.passengers.some(
      (p) => p.userId === user.userId && p.status === "confirmed",
    );
    if (alreadyBooked) {
      return res
        .status(400)
        .json({ message: "You have already booked this ride" });
    }

    // DECODE POLYLINE
    const path = decodePolyline(ride.route.encodedPolyline);

    const pickupIdx = findClosestPointIndex(path, pickup);
    const dropIdx = findClosestPointIndex(path, drop);

    if (pickupIdx === -1 || dropIdx === -1)
      return res
        .status(400)
        .json({ message: "Pickup/drop too far from route" });

    if (pickupIdx >= dropIdx)
      return res.status(400).json({ message: "Pickup must be before drop" });

    const segmentKm = calculateSegmentDistance(path, pickupIdx, dropIdx);
    const pricePerKm = ride.pricing.baseFare / ride.metrics.totalDistanceKm;
    const farePaid = Math.round(segmentKm * pricePerKm);

    ride.passengers.push({
      userId: user.userId,
      name: user.name,
      profileImage: user.profileImage,
      pickupGrid: latLngToGrid(pickup.lat, pickup.lng),
      dropGrid: latLngToGrid(drop.lat, drop.lng),
      farePaid,
    });

    ride.seats.available -= 1;
    await ride.save();
    const riderUpdate = await Rider.findOneAndUpdate(
      { userId: user.userId },
      {
        $push: {
          bookings: {
            rideId: ride._id,
            pickupGrid: latLngToGrid(pickup.lat, pickup.lng),
            dropGrid: latLngToGrid(drop.lat, drop.lng),
            farePaid,
            status: "confirmed",
          },
        },
        $set: { lastRideAt: new Date() },
      },
      { upsert: true, new: true },
    );

    console.log("Rider booking updated for:", user.userId, !!riderUpdate);

    res.json({ message: "Ride booked", farePaid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Booking failed" });
  }
});

export default router;
