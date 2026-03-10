import express from "express";
import riderRides from "../rider/rider.rides.router.js";
import riderVerificationRouter from "./riderVerification.router.js";
import riderEmergencyRouter from "./riderEmergency.router.js";

const router = express.Router();

router.use("/rider-rides", riderRides);
router.use("/rider-verification", riderVerificationRouter);
router.use("/emergency", riderEmergencyRouter);

export default router;
