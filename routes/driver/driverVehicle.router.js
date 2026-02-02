import express from "express";
import Driver from "../../models/driver.model.js";

const router = express.Router();

/**
 * GET vehicle details
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId }).select("vehicle");

        if (!driver || !driver.vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        res.json(driver.vehicle);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * CREATE / ADD vehicle
 */
router.post("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const vehicleData = req.body;

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Check if vehicle has meaningful data (not just default 'type' field)
        if (driver.vehicle && (driver.vehicle.brand || driver.vehicle.model || driver.vehicle.licensePlate)) {
            return res.status(400).json({ message: "Vehicle already exists" });
        }

        driver.vehicle = vehicleData;
        await driver.save();

        res.status(201).json({
            message: "Vehicle added successfully",
            vehicle: driver.vehicle,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * UPDATE vehicle
 */
router.put("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const driver = await Driver.findOne({ userId });

        if (!driver || !driver.vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        Object.assign(driver.vehicle, updates);
        await driver.save();

        res.json({
            message: "Vehicle updated successfully",
            vehicle: driver.vehicle,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * DELETE vehicle
 */
router.delete("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId });

        if (!driver || !driver.vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        driver.vehicle = undefined;
        await driver.save();

        res.json({ message: "Vehicle removed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
