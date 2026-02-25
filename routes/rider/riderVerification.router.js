import express from "express";
import Rider from "../../models/user.model.js";

const router = express.Router();

/**
 * GET rider verification status
 */
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const rider = await Rider.findOne({ userId }).select("verification");

        if (!rider) {
            // Return default unverified state instead of 404 — rider may not have a record yet
            return res.json({
                emailVerified: false,
                phoneVerified: false,
                idVerified: false,
                aadharVerified: false,
                aadharNumber: "",
            });
        }

        res.json(rider.verification);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * PUT - update rider verification fields (mocked — always passes)
 */
router.put("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        const allowedFields = [
            "emailVerified",
            "phoneVerified",
            "idVerified",
            "aadharVerified",
            "aadharNumber",
        ];

        for (const key of Object.keys(updates)) {
            if (!allowedFields.includes(key)) {
                return res.status(400).json({ message: `Invalid verification field: ${key}` });
            }
        }

        let rider = await Rider.findOne({ userId });
        if (!rider) {
            rider = new Rider({ userId });
        }

        // Merge updates into verification sub-document
        Object.assign(rider.verification, updates);
        await rider.save();

        res.json({
            message: "Verification updated successfully",
            verification: rider.verification,
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

export default router;
