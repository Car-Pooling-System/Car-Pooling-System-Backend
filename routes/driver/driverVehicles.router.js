import express from "express";
import Driver from "../../models/driver.model.js";

const router = express.Router();

/**
 * GET all vehicles for a driver
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId }).select("vehicles");

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        res.json({ vehicles: driver.vehicles || [] });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * POST - Add a new vehicle
 */
router.post("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const vehicleData = req.body;

        // Validate required fields
        if (!vehicleData.brand || !vehicleData.model || !vehicleData.year || 
            !vehicleData.color || !vehicleData.licensePlate) {
            return res.status(400).json({ 
                message: "Missing required fields: brand, model, year, color, licensePlate" 
            });
        }

        // Upsert: create driver record if it doesn't exist yet
        let driver = await Driver.findOne({ userId });
        if (!driver) {
            driver = await Driver.create({
                userId,
                verification: {
                    emailVerified: false,
                    phoneVerified: false,
                    drivingLicenseVerified: false,
                    vehicleVerified: false,
                },
            });
        }

        // Initialize vehicles array if it doesn't exist
        if (!driver.vehicles) {
            driver.vehicles = [];
        }

        // Add the new vehicle
        driver.vehicles.push(vehicleData);
        await driver.save();

        res.status(201).json({
            message: "Vehicle added successfully",
            vehicle: driver.vehicles[driver.vehicles.length - 1],
            vehicles: driver.vehicles,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * PUT - Update a specific vehicle by index
 */
router.put("/:userId/:vehicleIndex", async (req, res) => {
    try {
        const { userId, vehicleIndex } = req.params;
        const updates = req.body;
        const index = parseInt(vehicleIndex);

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Initialize vehicles array if it doesn't exist
        if (!driver.vehicles) {
            driver.vehicles = [];
        }

        if (!driver.vehicles[index]) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        // Update the vehicle at the specified index
        Object.assign(driver.vehicles[index], updates);
        await driver.save();

        res.json({
            message: "Vehicle updated successfully",
            vehicle: driver.vehicles[index],
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * DELETE - Remove a specific vehicle by index
 */
router.delete("/:userId/:vehicleIndex", async (req, res) => {
    try {
        const { userId, vehicleIndex } = req.params;
        const index = parseInt(vehicleIndex);

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Initialize vehicles array if it doesn't exist
        if (!driver.vehicles) {
            driver.vehicles = [];
        }

        if (!driver.vehicles[index]) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        // Remove the vehicle at the specified index
        driver.vehicles.splice(index, 1);
        await driver.save();

        res.json({ 
            message: "Vehicle deleted successfully",
            vehicles: driver.vehicles 
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * POST - Migrate old vehicle data to vehicles array
 */
router.post("/:userId/migrate", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Initialize vehicles array if it doesn't exist
        if (!driver.vehicles) {
            driver.vehicles = [];
        }

        res.json({
            message: "Migration endpoint deprecated - vehicles array is now the primary storage",
            vehicles: driver.vehicles
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
