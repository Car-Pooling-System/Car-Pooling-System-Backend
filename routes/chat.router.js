import express from "express";
import Chat from "../models/chat.model.js";
import Ride from "../models/ride.model.js";

const router = express.Router();

router.get("/:rideId", async (req, res) => {
    try {
        const { rideId } = req.params;
        const { userId } = req.query;

        const ride = await Ride.findById(rideId);
        if (!ride) return res.status(404).json({ message: "Ride not found" });

        const isDriver = ride.driver.userId === userId;

        const isPassenger = ride.passengers.some(
            p => p.userId === userId && p.status === "confirmed"
        );

        if (!isDriver && !isPassenger) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const messages = await Chat.find({ rideId })
            .sort({ createdAt: 1 });

        res.json(messages);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
