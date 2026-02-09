import express from "express";
import riderRides from "../rider/rider.rides.router.js";

const router = express.Router();

router.use("/rider-rides", riderRides);

export default router;