import express from 'express'
import Driver from '../../models/driver.model.js'

const router = express.Router()

router.put("/:userId", async (req, res) => {
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

export default router;