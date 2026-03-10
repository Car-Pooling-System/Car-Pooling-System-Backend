import express from "express";
import Payment from "../../models/payment.model.js";
import Driver from "../../models/driver.model.js";

const router = express.Router();

const PLATFORM_COMMISSION_PERCENT = 10;


/*
==================================================
CREATE PAYMENT
==================================================
*/

router.post("/", async (req, res) => {

  try {

    const {
      rideId,
      passengerId,
      driverId,
      boardingKm,
      dropKm,
      paymentMethod
    } = req.body;

    if (
      !rideId ||
      !passengerId ||
      !driverId ||
      boardingKm === undefined ||
      dropKm === undefined ||
      !paymentMethod
    ) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    if (dropKm <= boardingKm) {
      return res.status(400).json({
        message: "Invalid journey distance"
      });
    }

    /*
    Example Ride Pricing
    */

    const rideDistance = 300;
    const rideCost = 600;

    const costPerKm = rideCost / rideDistance;

    const travelledDistance =
      dropKm - boardingKm;

    const amount =
      travelledDistance * costPerKm;

    const commission =
      (amount * PLATFORM_COMMISSION_PERCENT) / 100;

    const driverEarning =
      amount - commission;

    const payment =
      await Payment.create({

        rideId,
        passengerId,
        driverId,

        boardingKm,
        dropKm,

        travelDistanceKm:
          travelledDistance,

        amount,

        platformCommission:
          commission,

        driverEarning,

        paymentMethod,

        status: "pending",

        isDriverCredited: false

      });

    res.status(201).json({
      message: "Payment initiated",
      payment
    });

  }

  catch (err) {

    res.status(500).json({
      message: "Server error",
      error: err.message
    });

  }

});


/*
==================================================
UPDATE PAYMENT STATUS
==================================================
*/

router.put("/:paymentId/status", async (req, res) => {

  try {

    const { paymentId } = req.params;

    const { status, transactionId } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status required"
      });
    }

    const payment =
      await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }


    /*
    CREDIT DRIVER IF PAYMENT SUCCESS
    */

    if (
      status === "success" &&
      payment.isDriverCredited === false
    ) {

      const driver =
        await Driver.findOne({
          userId: payment.driverId
        });

      if (!driver) {
        return res.status(404).json({
          message: "Driver not found"
        });
      }

      if (!driver.earnings) {
        driver.earnings = { total: 0 };
      }

      if (typeof driver.earnings.total !== "number") {
        driver.earnings.total = 0;
      }

      driver.earnings.total +=
        Number(payment.driverEarning);

      await driver.save();

      payment.isDriverCredited = true;

    }

    payment.status = status;

    if (transactionId) {
      payment.transactionId = transactionId;
    }

    await payment.save();

    res.json({
      message: "Payment Updated Successfully",
      payment
    });

  }

  catch (err) {

    res.status(500).json({
      message: "Server error",
      error: err.message
    });

  }

});


/*
==================================================
GET PAYMENT BY ID
==================================================
*/

router.get("/:paymentId", async (req, res) => {

  try {

    const payment =
      await Payment.findById(
        req.params.paymentId
      );

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }

    res.json(payment);

  }

  catch (err) {

    res.status(500).json({
      message: "Server error",
      error: err.message
    });

  }

});


/*
==================================================
PASSENGER PAYMENT HISTORY
==================================================
*/

router.get("/passenger/:passengerId", async (req, res) => {

  try {

    const payments =
      await Payment.find({
        passengerId:
          req.params.passengerId
      }).sort({
        createdAt: -1
      });

    res.json(payments);

  }

  catch (err) {

    res.status(500).json({
      message: "Server error",
      error: err.message
    });

  }

});


/*
==================================================
DRIVER PAYMENT HISTORY
==================================================
*/

router.get("/driver/:driverId", async (req, res) => {

  try {

    const { driverId } = req.params;
    const { status } = req.query;

    const filter = { driverId };

    if (status) filter.status = status;

    const payments =
      await Payment.find(filter)
        .sort({ createdAt: -1 });

    const all =
      await Payment.find({ driverId });

    const totalEarnings =
      all
        .filter(p => p.status === "success")
        .reduce((sum, p) => sum + p.amount, 0);

    const now = new Date();
    const startOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const currentMonthEarnings =
      all
        .filter(
          p =>
            p.status === "success" &&
            new Date(p.createdAt) >= startOfMonth
        )
        .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayouts =
      all
        .filter(p => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      payments,
      summary: {
        totalEarnings,
        currentMonthEarnings,
        pendingPayouts
      }
    });

  }

  catch (err) {

    res.status(500).json({
      message: "Server error",
      error: err.message
    });

  }

});


export default router;