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
    const { user, pickup, drop, seatPreference, additionalPassengers, riderIsPartOfRide } = req.body;

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Calculate how many seats are needed
    const extraCount = Array.isArray(additionalPassengers) ? additionalPassengers.length : 0;
    const selfIncluded = riderIsPartOfRide !== false; // default true for backward compatibility
    const totalSeatsNeeded = (selfIncluded ? 1 : 0) + extraCount;

    if (totalSeatsNeeded === 0)
      return res.status(400).json({ message: "No passengers specified" });

    if (ride.seats.available < totalSeatsNeeded)
      return res.status(400).json({ message: `Not enough seats. Need ${totalSeatsNeeded}, only ${ride.seats.available} available.` });

    // Check if user already booked this ride
    const alreadyBooked = ride.passengers.some(
      (p) => p.userId === user.userId && (p.status === "confirmed" || p.status === "requested"),
    );
    if (alreadyBooked) {
      return res
        .status(400)
        .json({ message: "You have already requested or booked this ride" });
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
    const farePerPerson = Math.round(segmentKm * pricePerKm);

    // Resolve seat preference label
    const SEAT_LABELS = {
      front: "Front Seat",
      backWindow: "Back Window Seat",
      backMiddle: "Back Middle Seat",
      backArmrest: "Back Seat w/ Armrest",
      thirdRow: "Third Row Seat",
      any: "Any Seat",
    };

    const passengersAdded = [];
    const pickupGridVal = latLngToGrid(pickup.lat, pickup.lng);
    const dropGridVal = latLngToGrid(drop.lat, drop.lng);

    // 1) Add the primary user (rider themselves) if they are part of the ride
    if (selfIncluded) {
      const chosenSeat = seatPreference || "any";
      const passengerEntry = {
        userId: user.userId,
        name: user.name,
        profileImage: user.profileImage,
        pickupGrid: pickupGridVal,
        dropGrid: dropGridVal,
        farePaid: farePerPerson,
        seatType: chosenSeat,
        seatLabel: SEAT_LABELS[chosenSeat] || "Any Seat",
        isGuest: false,
        email: user.email || "",
        bookedBy: user.userId,
        status: "requested",
      };
      ride.passengers.push(passengerEntry);
      passengersAdded.push(passengerEntry);
    }

    // 2) Add additional passengers (guests booked by this user)
    if (extraCount > 0) {
      for (const guest of additionalPassengers) {
        const guestSeat = guest.seatPreference || "any";
        const guestEntry = {
          userId: `guest_${user.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: guest.name || "Guest",
          profileImage: "",
          pickupGrid: pickupGridVal,
          dropGrid: dropGridVal,
          farePaid: farePerPerson,
          seatType: guestSeat,
          seatLabel: SEAT_LABELS[guestSeat] || "Any Seat",
          isGuest: true,
          age: guest.age || null,
          sex: guest.sex || "",
          email: guest.email || "",
          bookedBy: user.userId,
          status: "requested",
        };
        ride.passengers.push(guestEntry);
        passengersAdded.push(guestEntry);
      }
    }

    // Don't decrement seats yet — seats are only decremented when driver confirms
    await ride.save();

    // Update the booker's rider record
    const riderUpdate = await Rider.findOneAndUpdate(
      { userId: user.userId },
      {
        $push: {
          bookings: {
            rideId: ride._id,
            pickupGrid: pickupGridVal,
            dropGrid: dropGridVal,
            farePaid: farePerPerson * totalSeatsNeeded,
            seatType: seatPreference || "any",
            seatLabel: SEAT_LABELS[seatPreference || "any"] || "Any Seat",
            status: "requested",
          },
        },
        $set: { lastRideAt: new Date() },
      },
      { upsert: true, new: true },
    );

    console.log("Rider booking requested for:", user.userId, "seats:", totalSeatsNeeded, !!riderUpdate);

    res.json({
      message: "Ride requested",
      farePaid: farePerPerson,
      totalFare: farePerPerson * totalSeatsNeeded,
      seatsBooked: totalSeatsNeeded,
      seatType: seatPreference || "any",
      seatLabel: SEAT_LABELS[seatPreference || "any"] || "Any Seat",
      status: "requested",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Booking failed" });
  }
});

export default router;
