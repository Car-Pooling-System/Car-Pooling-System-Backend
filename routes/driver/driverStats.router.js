import express from "express";
import Driver from "../../models/driver.model.js";

const router = express.Router();

/**
 * GET driver stats
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await Driver.findOne({ userId }).select(
      "rides hoursDriven distanceDrivenKm lastRideHostedAt trustScore",
    );

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * MARK ride hosted (when driver publishes a ride)
 */
router.post("/:userId/hosted", async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.rides.hosted += 1;
    driver.lastRideHostedAt = new Date();

    await driver.save();

    res.json({ message: "Ride hosted recorded" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * MARK ride completed
 * body: { hours: Number, distanceKm: Number }
 */
router.post("/:userId/completed", async (req, res) => {
  try {
    const { userId } = req.params;
    const { hours, distanceKm } = req.body;

    if (hours <= 0 || distanceKm <= 0) {
      return res.status(400).json({ message: "Invalid hours or distance" });
    }

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.rides.completed += 1;
    driver.hoursDriven += hours;
    driver.distanceDrivenKm += distanceKm;

    await recalculateTrustScore(driver);

    await driver.save();

    res.json({
      message: "Ride completed stats updated",
      stats: {
        rides: driver.rides,
        hoursDriven: driver.hoursDriven,
        distanceDrivenKm: driver.distanceDrivenKm,
        trustScore: driver.trustScore,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * MARK ride cancelled
 */
router.post("/:userId/cancelled", async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.rides.cancelled += 1;

    await recalculateTrustScore(driver);
    await driver.save();

    res.json({ message: "Ride cancellation recorded" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * RESET stats (admin/moderation only)
 */
router.delete("/:userId/reset", async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.rides = { hosted: 0, completed: 0, cancelled: 0 };
    driver.hoursDriven = 0;
    driver.distanceDrivenKm = 0;
    driver.trustScore = 0;
    driver.lastRideHostedAt = null;

    await driver.save();

    res.json({ message: "Driver stats reset successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ---------------- TRUST SCORE LOGIC ---------------- */

async function recalculateTrustScore(driver) {
  const { completed, cancelled } = driver.rides;
  const total = completed + cancelled;

  let score = 0;

  if (total > 0) {
    const completionRate = completed / total;
    score += completionRate * 50;
  }

  score += Math.min(driver.hoursDriven / 10, 20);
  score += Math.min(driver.distanceDrivenKm / 500, 20);

  driver.trustScore = Math.round(score);
}

export default router;
