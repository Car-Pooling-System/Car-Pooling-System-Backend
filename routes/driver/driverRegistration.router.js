import express from "express";
import Driver from "../../models/driver.model.js";

const router = express.Router();

/* ============================
   CREATE driver (already done)
============================ */
router.post("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const existing = await Driver.findOne({ userId });
        if (existing) {
            return res.status(200).json({
                message: "Driver already registered",
                driver: existing,
            });
        }

        const driver = await Driver.create({
            userId,

            // ⬇️ IMPORTANT: prevent auto-creation
            vehicle: undefined,
            documents: undefined,

            verification: {
                emailVerified: false,
                phoneVerified: false,
                drivingLicenseVerified: false,
                vehicleVerified: false,
            },
        });

        res.status(201).json({
            message: "Driver registered successfully",
            driver,
        });
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});


/* ============================
   GET driver (full profile)
============================ */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({
                message: "Driver not found",
            });
        }

        res.status(200).json(driver);
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});

/* ============================
   DELETE driver (hard delete)
============================ */
router.delete("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOneAndDelete({ userId });

        if (!driver) {
            return res.status(404).json({
                message: "Driver not found",
            });
        }

        res.status(200).json({
            message: "Driver deleted successfully",
        });
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message,
        });
    }
});

export default router;
