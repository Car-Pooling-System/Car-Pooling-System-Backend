import express from "express";
import Ride from "../../models/ride.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        console.log("CREATE RIDE BODY:", JSON.stringify(req.body, null, 2));

        const {
            driver,
            route,
            schedule,
            pricing,
            preferences,
            seats,
            metrics,
        } = req.body;

        const validation = {
            hasStart: !!route?.start,
            hasEnd: !!route?.end,
            hasPolyline: typeof route?.encodedPolyline === "string",
            polylineLength: route?.encodedPolyline?.length || 0,
            isGridsArray: Array.isArray(route?.gridsCovered),
            gridsCount: route?.gridsCovered?.length || 0,
        };

        console.log("ROUTE VALIDATION:", validation);

        if (!validation.hasStart ||
            !validation.hasEnd ||
            !validation.hasPolyline ||
            !validation.isGridsArray) {
            return res.status(400).json({
                message: "Invalid route data",
                details: validation,
            });
        }

        const ride = await Ride.create({
            driver,
            route: {
                start: route.start,
                end: route.end,
                stops: [],
                encodedPolyline: route.encodedPolyline,
                gridsCovered: route.gridsCovered,
            },
            schedule,
            pricing,
            preferences,
            seats,
            metrics,
            status: "scheduled",
        });

        res.status(201).json(ride);
    } catch (err) {
        console.error("CREATE RIDE ERROR:", err);
        res.status(500).json({ message: "Failed to create ride" });
    }
});

export default router;