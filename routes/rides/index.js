import express from "express";

import createRide from "./ride.create.router.js";
import searchRide from "./ride.search.router.js";
import bookRide from "./ride.book.router.js";
import cancelRide from "./ride.cancel.router.js";
import removePassenger from "./ride.remove-passenger.router.js";
import driverActions from "./ride.driver.router.js";
import rideDetails from "./ride.details.router.js";

const router = express.Router();

router.use("/", createRide);
router.use("/search", searchRide);
router.use("/", bookRide);
router.use("/", cancelRide);
router.use("/", removePassenger);
router.use("/", driverActions);
router.use("/", rideDetails);

export default router;
