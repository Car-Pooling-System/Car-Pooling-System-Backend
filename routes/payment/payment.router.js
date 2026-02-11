import express from "express";
import Payment from "../../models/payment.model.js";

const router = express.Router();

/**
 * CREATE Payment
 */
router.post("/", async (req, res) => {
  try {
    const { rideId, passengerId, driverId, amount, paymentMethod } = req.body;

    if (!rideId || !passengerId || !driverId || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const payment = await Payment.create({
      rideId,
      passengerId,
      driverId,
      amount,
      paymentMethod,
      status: "pending",
    });

    res.status(201).json({
      message: "Payment initiated",
      payment,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * UPDATE Payment Status
 */
router.put("/:paymentId/status", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, transactionId } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    payment.status = status;

    if (transactionId) {
      payment.transactionId = transactionId;
    }

    await payment.save();

    res.json({
      message: "Payment status updated",
      payment,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * GET Payment by ID
 */
router.get("/:paymentId", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * GET Payments by Passenger
 */
router.get("/passenger/:passengerId", async (req, res) => {
  try {
    const payments = await Payment.find({
      passengerId: req.params.passengerId,
    });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
export default router;