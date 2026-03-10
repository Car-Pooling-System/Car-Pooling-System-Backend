import express from "express";
import Ride from "../../models/ride.model.js";
import { latLngToGrid } from "../../utils/geo.utils.js";
import { decodePolyline } from "../../utils/polyline.utils.js";
import { findClosestPointIndex } from "../../utils/route.utils.js";
import { calculateSegmentDistance } from "../../utils/fare.utils.js";

const router = express.Router();

/**
 * Returns all grid cells whose centres fall within `radiusKm` of (lat, lng).
 * Grid cells are 0.05° × 0.05° ≈ 5.5 km, so we step in 0.05° increments.
 */
function gridsWithinRadius(lat, lng, radiusKm) {
  const STEP = 0.05; // must match latLngToGrid default size
  const degLat = radiusKm / 111;           // 1° lat ≈ 111 km
  const degLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const grids = new Set();
  for (let dLat = -degLat; dLat <= degLat + STEP / 2; dLat += STEP) {
    for (let dLng = -degLng; dLng <= degLng + STEP / 2; dLng += STEP) {
      const cLat = lat + dLat;
      const cLng = lng + dLng;
      // Haversine check — keep only cells actually within the circle
      const dlat = (cLat - lat) * (Math.PI / 180);
      const dlng = (cLng - lng) * (Math.PI / 180);
      const a =
        Math.sin(dlat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((cLat * Math.PI) / 180) *
          Math.sin(dlng / 2) ** 2;
      const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (distKm <= radiusKm) grids.add(latLngToGrid(cLat, cLng));
    }
  }
  return [...grids];
}

/**
 * GET /api/rides/nearby?lat=&lng=&radiusKm=&limit=
 */
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radiusKm = 50, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "lat and lng are required" });
    }

    const radius = Math.min(Number(radiusKm), 500); // cap at 500 km
    const gridCells = gridsWithinRadius(Number(lat), Number(lng), radius);

    const now = new Date();
    console.log(`[Nearby] lat=${lat}, lng=${lng}, radius=${radius}km, grids=${gridCells.length}`);

    // Rides whose route passes through ANY cell in the radius (future only)
    let candidates = await Ride.find({
      "route.gridsCovered": { $in: gridCells },
      status: "scheduled",
      "seats.available": { $gt: 0 },
      "schedule.departureTime": { $gte: now },
    })
      .sort({ "schedule.departureTime": 1 })
      .limit(Number(limit) * 3); // fetch extra since we'll filter by start-point distance

    console.log(`[Nearby] Grid query found ${candidates.length} candidates (future only)`);

    // Fallback: sparse data / dev environment — return upcoming rides
    if (candidates.length === 0) {
      candidates = await Ride.find({
        status: "scheduled",
        "seats.available": { $gt: 0 },
        "schedule.departureTime": { $gte: now },
      })
        .sort({ "schedule.departureTime": 1 })
        .limit(Number(limit) * 3);
      console.log(`[Nearby] Fallback found ${candidates.length} candidates`);
    }

    const results = [];

    for (const ride of candidates) {
      if (!ride.route?.encodedPolyline) continue;

      let path;
      try {
        path = decodePolyline(ride.route.encodedPolyline);
      } catch {
        continue;
      }

      if (!path.length) continue;

      const userPoint = { lat: Number(lat), lng: Number(lng) };
      const pickupIdx = findClosestPointIndex(path, userPoint);
      if (pickupIdx === -1) continue;

      const dropPoint = {
        lat: ride.route.end?.location?.coordinates[1],
        lng: ride.route.end?.location?.coordinates[0],
      };
      const dropIdx = dropPoint.lat
        ? findClosestPointIndex(path, dropPoint)
        : path.length - 1;

      let estimatedFare = ride.pricing?.baseFare || 0;
      if (dropIdx !== -1 && pickupIdx < dropIdx) {
        const segKm = calculateSegmentDistance(path, pickupIdx, dropIdx);
        const pricePerKm =
          ride.pricing.baseFare / (ride.metrics?.totalDistanceKm || 1);
        estimatedFare = Math.round(segKm * pricePerKm);
      }

      // distance from user to ride's START POINT only
      const startLat = ride.route?.start?.location?.coordinates[1];
      const startLng = ride.route?.start?.location?.coordinates[0];
      let userToStartKm = null;
      if (startLat && startLng) {
        const dlat2 = ((startLat - Number(lat)) * Math.PI) / 180;
        const dlng2 = ((startLng - Number(lng)) * Math.PI) / 180;
        const a2 = Math.sin(dlat2 / 2) ** 2 +
          Math.cos((Number(lat) * Math.PI) / 180) * Math.cos((startLat * Math.PI) / 180) * Math.sin(dlng2 / 2) ** 2;
        userToStartKm = 6371 * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));
      }

      // Only include rides whose START POINT is within the requested radius
      if (userToStartKm !== null && userToStartKm > radius) {
        console.log(`  [skip] "${ride.route?.start?.name}" start is ${userToStartKm.toFixed(1)}km away (> ${radius}km)`);
        continue;
      }

      // Enforce limit after distance filtering
      if (results.length >= Number(limit)) break;

      results.push({
        _id: ride._id,
        driver: ride.driver,
        vehicle: {
          brand: ride.vehicle?.brand,
          model: ride.vehicle?.model,
          color: ride.vehicle?.color,
          year:  ride.vehicle?.year,
        },
        route: {
          start: {
            name: ride.route?.start?.name,
            lat: startLat ?? null,
            lng: startLng ?? null,
          },
          end: {
            name: ride.route?.end?.name,
            lat: ride.route?.end?.location?.coordinates[1] ?? null,
            lng: ride.route?.end?.location?.coordinates[0] ?? null,
          },
        },
        schedule:       ride.schedule,
        seatsAvailable: ride.seats.available,
        preferences:    ride.preferences,
        estimate: {
          distanceKm: Number((ride.metrics?.totalDistanceKm || 0).toFixed(1)),
          userToStartKm: userToStartKm !== null ? Number(userToStartKm.toFixed(1)) : null,
          fare:       estimatedFare,
        },
      });
    }

    console.log(`[Nearby] Returning ${results.length} rides:`);
    results.forEach((r, i) => {
      console.log(`  #${i + 1} ${r.route?.start?.name} -> ${r.route?.end?.name} | userToStart=${r.estimate?.userToStartKm}km | departs=${r.schedule?.departureTime}`);
    });

    res.json(results);
  } catch (err) {
    console.error("Nearby rides error:", err);
    res.status(500).json({ message: "Failed to fetch nearby rides" });
  }
});

export default router;
