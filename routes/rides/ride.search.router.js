import express from "express";
import Ride from "../../models/ride.model.js";
import { latLngToGrid } from "../../utils/geo.utils.js";
import { decodePolyline } from "../../utils/polyline.utils.js";
import { findClosestPointIndex } from "../../utils/route.utils.js";
import { calculateSegmentDistance } from "../../utils/fare.utils.js";

const router = express.Router();

router.get("/", async (req, res) => {
    console.log("\n================ SEARCH START ================");

    try {
        console.log("RAW QUERY PARAMS:", req.query);

        const { pickupLat, pickupLng, dropLat, dropLng } = req.query;

        if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
            console.log("❌ Missing query params");
            return res.status(400).json({ message: "Missing coordinates" });
        }

        const pickup = { lat: Number(pickupLat), lng: Number(pickupLng) };
        const drop = { lat: Number(dropLat), lng: Number(dropLng) };

        console.log("PICKUP:", pickup);
        console.log("DROP:", drop);

        const pickupGrid = latLngToGrid(pickup.lat, pickup.lng);
        const dropGrid = latLngToGrid(drop.lat, drop.lng);

        console.log("COMPUTED GRIDS:", pickupGrid, dropGrid);

        /* ---------- DB QUERY ---------- */
        console.log("QUERYING DB...");
        const candidates = await Ride.find({
            "route.gridsCovered": { $all: [pickupGrid, dropGrid] },
            status: "scheduled",
            "seats.available": { $gt: 0 },
        });

        console.log("RIDES FOUND:", candidates.length);

        const results = [];

        for (const ride of candidates) {
            console.log("\n--- CHECKING RIDE ---");
            console.log("RIDE ID:", ride._id.toString());

            /* ---------- SAFETY CHECKS ---------- */
            if (!ride.route) {
                console.log("❌ ride.route missing");
                continue;
            }

            if (!ride.route.encodedPolyline) {
                console.log("❌ encodedPolyline missing");
                continue;
            }

            console.log("ENCODED POLYLINE LENGTH:", ride.route.encodedPolyline.length);

            let path;
            try {
                path = decodePolyline(ride.route.encodedPolyline);
            } catch (e) {
                console.error("❌ decodePolyline CRASHED:", e);
                continue;
            }

            console.log("DECODED POINTS:", path.length);

            if (!path.length) {
                console.log("❌ Empty decoded path");
                continue;
            }

            let pickupIdx, dropIdx;

            try {
                pickupIdx = findClosestPointIndex(path, pickup);
                dropIdx = findClosestPointIndex(path, drop);
            } catch (e) {
                console.error("❌ findClosestPointIndex CRASHED:", e);
                continue;
            }

            console.log("pickupIdx:", pickupIdx, "dropIdx:", dropIdx);

            if (pickupIdx === -1 || dropIdx === -1) {
                console.log("❌ pickup/drop too far from route");
                continue;
            }

            if (pickupIdx >= dropIdx) {
                console.log("❌ pickup occurs after drop");
                continue;
            }

            let segmentKm;
            try {
                segmentKm = calculateSegmentDistance(path, pickupIdx, dropIdx);
            } catch (e) {
                console.error("❌ calculateSegmentDistance CRASHED:", e);
                continue;
            }

            console.log("SEGMENT KM:", segmentKm);

            const totalDist = ride.metrics?.totalDistanceKm || 1; // Avoid division by zero
            const pricePerKm = ride.pricing.baseFare / totalDist;

            const fare = Math.round(segmentKm * pricePerKm);

            console.log("ESTIMATED FARE:", fare, "(PricePerKm:", pricePerKm, ")");

            results.push({
                id: ride._id,
                driver: ride.driver,
                schedule: ride.schedule,
                seatsAvailable: ride.seats.available,
                preferences: ride.preferences,
                estimate: {
                    distanceKm: segmentKm,
                    fare: fare || ride.pricing.baseFare, // Fallback to base fare if segment fare is 0
                },
            });
        }

        console.log("\n✅ FINAL RESULTS COUNT:", results.length);
        console.log("================ SEARCH END ================\n");

        res.json(results);
    } catch (err) {
        console.error("\n🔥 SEARCH ROUTE FATAL ERROR 🔥");
        console.error(err);
        res.status(500).json({ message: "Ride search failed" });
    }
});

export default router;