import express from "express";
import Ride from "../../models/ride.model.js";
import Driver from "../../models/driver.model.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("CREATE RIDE BODY:", JSON.stringify(req.body, null, 2));

        const {
            driver,
            vehicle,
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

    if (
      !validation.hasStart ||
      !validation.hasEnd ||
      !validation.hasPolyline ||
      !validation.isGridsArray
    ) {
      return res.status(400).json({
        message: "Invalid route data",
        details: validation,
      });
    }

    // --- COLLISION DETECTION ---
    const existingRides = await Ride.find({
      "driver.userId": driver.userId,
      status: { $in: ["scheduled", "ongoing"] },
      "schedule.departureTime": { $gt: new Date() }, // Check future/active rides
    });

    const newStart = new Date(schedule.departureTime);
    const newEnd = new Date(
      newStart.getTime() + (metrics.durationMinutes || 60) * 60000,
    );

    for (const ride of existingRides) {
      const exStart = new Date(ride.schedule.departureTime);
      const exEnd = new Date(
        exStart.getTime() + (ride.metrics.durationMinutes || 60) * 60000,
      );

        const ride = await Ride.create({
            driver,
            vehicle: vehicle || {},
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
      }
    }
    // ---------------------------

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

    await Driver.updateOne(
      { userId: driver.userId },
      {
        $inc: { "rides.hosted": 1 },
        $set: { lastRideHostedAt: new Date() },
      },
    );

    res.status(201).json(ride);
  } catch (err) {
    console.error("CREATE RIDE ERROR:", err);
    res.status(500).json({ message: "Failed to create ride" });
  }
});

export default router;
