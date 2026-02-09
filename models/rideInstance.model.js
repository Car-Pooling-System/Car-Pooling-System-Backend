import mongoose from "mongoose";

const RideInstanceSchema = new mongoose.Schema(
    {
        parentRideId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ride",
            index: true,
        },

        rideDate: {
            type: Date,
            index: true,
        },

        status: {
            type: String,
            enum: ["scheduled", "completed", "cancelled"],
            default: "scheduled",
        },
    },
    { timestamps: true }
);

export default mongoose.model("RideInstance", RideInstanceSchema);
