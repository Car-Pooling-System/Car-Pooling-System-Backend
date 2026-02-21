import express from "express";
import Ride from "../../models/ride.model.js";
import Driver from "../../models/driver.model.js";
import { decodePolyline } from "../../utils/polyline.utils.js";
import { findClosestPointIndex } from "../../utils/route.utils.js";
import { calculateSegmentDistance } from "../../utils/fare.utils.js";

const router = express.Router();

router.get("/:rideId", async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.rideId);
        if (!ride) return res.status(404).json({ message: "Ride not found" });

        // Enrich with driver verification
        const driverRecord = await Driver.findOne({ userId: ride.driver.userId }).lean();
        const v = driverRecord?.verification || {};
        const isVerified = !!(v.emailVerified && v.phoneVerified && v.drivingLicenseVerified && v.vehicleVerified);
        const rideObj = ride.toObject();
        rideObj.driver.isVerified = isVerified;
        rideObj.driver.verificationDetails = {
            email: !!v.emailVerified,
            phone: !!v.phoneVerified,
            license: !!v.drivingLicenseVerified,
            vehicle: !!v.vehicleVerified,
        };
        if (driverRecord?.rating?.average > 0) {
            rideObj.driver.rating = driverRecord.rating.average;
            rideObj.driver.reviewsCount = driverRecord.rating.reviewsCount;
        }
        rideObj.driver.ridesHosted = driverRecord?.rides?.hosted || 0;

        // Fallback: if ride has no vehicle data, use first vehicle from driver record
        if (!rideObj.vehicle?.brand && driverRecord?.vehicles?.length > 0) {
            const v = driverRecord.vehicles[0];
            rideObj.vehicle = {
                brand: v.brand,
                model: v.model,
                year: v.year,
                color: v.color,
                licensePlate: v.licensePlate,
                image: v.images?.[0] || null,
            };
        }

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
                const pricePerKm =
                    ride.pricing.baseFare / ride.metrics.totalDistanceKm;

                estimate = {
                    distanceKm: km,
                    fare: Math.round(km * pricePerKm),
                };
            }
        }

        res.json({
            ride: rideObj,
            estimate,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch ride" });
    }
});

export default router;
