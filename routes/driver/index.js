import express from "express";

import driverDocsRouter from "./driverDocs.router.js";
import driverRatingRouter from "./driverRating.router.js";
import driverRegisterRouter from "./driverRegistration.router.js";
import driverStatsRouter from "./driverStats.router.js";
import driverVehicleRouter from "./driverVehicle.router.js";
import driverVehiclesRouter from "./driverVehicles.router.js";
import driverVerificationRouter from "./driverVerification.router.js";
import driverProfileRouter from "./driverProfile.router.js";
import driverRidesRouter from "./driverRides.router.js";

const router = express.Router();

// Maintain legacy paths to avoid frontend changes
router.use("/driver-docs", driverDocsRouter);
router.use("/driver-profile", driverProfileRouter);
router.use("/driver-rating", driverRatingRouter);
router.use("/driver-register", driverRegisterRouter);
router.use("/driver-stats", driverStatsRouter);
router.use("/driver-vehicle", driverVehicleRouter);
router.use("/driver-vehicles", driverVehiclesRouter); // New route for multiple vehicles
router.use("/driver-verification", driverVerificationRouter);
router.use("/driver-rides", driverRidesRouter);

export default router;
