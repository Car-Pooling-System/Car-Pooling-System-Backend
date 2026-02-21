import express from "express";
import Ride from "../../models/ride.model.js";
import { decodePolyline } from "../../utils/polyline.utils.js";
import { findClosestPointIndex } from "../../utils/route.utils.js";
import { calculateSegmentDistance } from "../../utils/fare.utils.js";

const router = express.Router();

router.get("/:rideId", async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    let estimate = null;

    if (req.query.pickupLat && req.query.dropLat) {
      const path = decodePolyline(ride.route.encodedPolyline);

      const pickup = {
        lat: +req.query.pickupLat,
        lng: +req.query.pickupLng,
      };
      const drop = {
        lat: +req.query.dropLat,
        lng: +req.query.dropLng,
      };

      const pIdx = findClosestPointIndex(path, pickup);
      const dIdx = findClosestPointIndex(path, drop);

      if (pIdx !== -1 && dIdx !== -1 && pIdx < dIdx) {
        const km = calculateSegmentDistance(path, pIdx, dIdx);
        const pricePerKm = ride.pricing.baseFare / ride.metrics.totalDistanceKm;

        estimate = {
          distanceKm: km,
          fare: Math.round(km * pricePerKm),
        };
      }
    }

    res.json({
      ride,
      estimate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch ride" });
  }
});

export default router;
