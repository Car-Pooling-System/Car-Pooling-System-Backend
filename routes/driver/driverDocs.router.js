import express from "express";
import Driver from "../models/Driver.js";

const router = express.Router();

/**
 * GET driver documents
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId }).select("documents");

        if (!driver || !driver.documents) {
            return res.status(404).json({ message: "Documents not found" });
        }

        res.json(driver.documents);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * ADD / UPDATE documents (partial allowed)
 */
router.put("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const driver = await Driver.findOne({ userId });

        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        driver.documents = {
            ...driver.documents,
            ...updates,
        };

        await driver.save();

        res.json({
            message: "Documents updated successfully",
            documents: driver.documents,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * DELETE specific document
 * body: { field: "drivingLicense" | "vehicleRegistration" | "insurance" }
 */
router.delete("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { field } = req.body;

        if (!field) {
            return res.status(400).json({ message: "Document field required" });
        }

        const allowedFields = [
            "drivingLicense",
            "vehicleRegistration",
            "insurance",
        ];

        if (!allowedFields.includes(field)) {
            return res.status(400).json({ message: "Invalid document field" });
        }

        const driver = await Driver.findOne({ userId });

        if (!driver || !driver.documents) {
            return res.status(404).json({ message: "Documents not found" });
        }

        driver.documents[field] = undefined;
        await driver.save();

        res.json({
            message: `${field} removed successfully`,
            documents: driver.documents,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * DELETE ALL documents
 */
router.delete("/:userId/all", async (req, res) => {
    try {
        const { userId } = req.params;

        const driver = await Driver.findOne({ userId });

        if (!driver || !driver.documents) {
            return res.status(404).json({ message: "Documents not found" });
        }

        driver.documents = {};
        await driver.save();

        res.json({ message: "All documents removed" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
