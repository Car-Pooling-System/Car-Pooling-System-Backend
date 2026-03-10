import express from "express";
import Driver from "../../models/driver.model.js";
import Rider from "../../models/user.model.js";

const router = express.Router();

/**
 * GET driver verification status
 */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await Driver.findOne({ userId }).select("verification");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(driver.verification);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * UPDATE verification fields (admin / system only)
 * body example:
 * {
 *   "emailVerified": true,
 *   "drivingLicenseVerified": true
 * }
 */
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const allowedFields = [
      "emailVerified",
      "phoneVerified",
      "drivingLicenseVerified",
      "vehicleVerified",
      "aadharVerified",
      "aadharNumber",
    ];

    // Validate allowed fields
    for (const key of Object.keys(updates)) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({
          message: `Invalid verification field: ${key}`,
        });
      }
    }

    const driver = await Driver.findOne({ userId });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.verification = {
      ...driver.verification,
      ...updates,
    };

    await driver.save();

    // Sync with Rider if Aadhar fields are present
    if ("aadharVerified" in updates || "aadharNumber" in updates) {
      const riderUpdates = {};
      if ("aadharVerified" in updates) riderUpdates["verification.aadharVerified"] = updates.aadharVerified;
      if ("aadharNumber" in updates) riderUpdates["verification.aadharNumber"] = updates.aadharNumber;

      await Rider.findOneAndUpdate(
        { userId },
        { $set: riderUpdates },
        { new: true }
      );
    }

    res.json({
      message: "Verification updated successfully",
      verification: driver.verification,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/**
 * RESET verification (admin / moderation)
 * Resets all flags to false
 */
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await Driver.findOne({ userId });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.verification = {
      emailVerified: false,
      phoneVerified: false,
      drivingLicenseVerified: false,
      vehicleVerified: false,
    };

    await driver.save();

    res.json({
      message: "Verification reset successfully",
      verification: driver.verification,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
