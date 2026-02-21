import express from "express";
import Driver from "../../models/driver.model.js";

const router = express.Router();

// GET driver profile
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE driver profile (with selective verification reset)
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Track which fields are being modified
    const modifiedFields = [];

    // Check vehicle fields
    if (updates.vehicle) {
      Object.keys(updates.vehicle).forEach((key) => {
        if (driver.vehicle && driver.vehicle[key] !== updates.vehicle[key]) {
          modifiedFields.push("vehicle");
        }
      });
      driver.vehicle = { ...driver.vehicle, ...updates.vehicle };
    }

    // Check documents
    if (updates.documents) {
      Object.keys(updates.documents).forEach((key) => {
        if (
          driver.documents &&
          driver.documents[key] !== updates.documents[key]
        ) {
          modifiedFields.push("documents");
        }
      });
      driver.documents = { ...driver.documents, ...updates.documents };
    }

    // Check profile image
    if (updates.profileImage && driver.profileImage !== updates.profileImage) {
      modifiedFields.push("profileImage");
      driver.profileImage = updates.profileImage;
    }

    // Check phone number
    if (updates.phoneNumber && driver.phoneNumber !== updates.phoneNumber) {
      modifiedFields.push("phoneNumber");
      driver.phoneNumber = updates.phoneNumber;
    }

    // Reset verification flags only for modified fields
    if (modifiedFields.includes("vehicle")) {
      driver.verification.vehicleVerified = false;
    }
    if (modifiedFields.includes("documents")) {
      driver.verification.drivingLicenseVerified = false;
    }
    if (modifiedFields.includes("phoneNumber")) {
      driver.verification.phoneVerified = false;
    }

    await driver.save();

    res.json({
      message: "Profile updated successfully",
      driver,
      modifiedFields,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE phone number specifically
router.put("/:userId/phone", async (req, res) => {
  try {
    const { userId } = req.params;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.phoneNumber = phoneNumber;
    driver.verification.phoneVerified = true; // Set to true after OTP verification

    await driver.save();

    res.json({
      message: "Phone number updated and verified",
      phoneNumber,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// UPDATE profile image
router.put("/:userId/image", async (req, res) => {
  try {
    const { userId } = req.params;
    const { profileImage } = req.body;

    if (!profileImage) {
      return res.status(400).json({ message: "profileImage is required" });
    }

    const driver = await Driver.findOne({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    driver.profileImage = profileImage;
    await driver.save();

    res.json({
      message: "Profile image updated",
      profileImage,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE driver profile
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const driver = await Driver.findOneAndDelete({ userId });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({
      message: "Driver profile deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
