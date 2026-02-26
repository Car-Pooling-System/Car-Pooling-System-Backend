import express from "express";
import riderRides from "../rider/rider.rides.router.js";
import riderVerificationRouter from "./riderVerification.router.js";

const router = express.Router();

router.use("/rider-rides", riderRides);
router.use("/rider-verification", riderVerificationRouter);

export default router;
