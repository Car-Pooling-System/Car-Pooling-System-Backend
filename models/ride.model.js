import mongoose from "mongoose";

/* ---------- GEO ---------- */

const PointSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    { _id: false }
);

/* ---------- RIDE ---------- */

const RideSchema = new mongoose.Schema(
    {
        driver: {
            userId: { type: String, required: true, index: true },
            name: String,
            profileImage: String,
            rating: Number,
            isVerified: { type: Boolean, default: false },
        },

        vehicle: {
            brand: String,
            model: String,
            year: String,
            color: String,
            licensePlate: String,
            image: String,
        },

        route: {
            start: {
                name: String,
                location: PointSchema,
                grid: { type: String, index: true },
            },

            end: {
                name: String,
                location: PointSchema,
                grid: { type: String, index: true },
            },

            stops: [
                {
                    name: String,
                    location: PointSchema,
                    grid: String,
                    pickupAllowed: { type: Boolean, default: true },
                    etaMinutesFromStart: Number,
                },
            ],

            /* 🔥 SMALL & FAST */
            encodedPolyline: {
                type: String,
                required: true,
            },

            /* 🔥 CORE SEARCH STRUCTURE */
            gridsCovered: {
                type: [String],
                index: true,
            },
        },

        schedule: {
            departureTime: { type: Date, required: true },
            recurrence: {
                type: {
                    type: String,
                    enum: ["one-time", "daily", "weekly", "monthly", "weekends"],
                    default: "one-time",
                },
                daysOfWeek: [Number],
                endDate: Date,
            },
        },

        seats: {
            total: { type: Number, required: true },
            available: { type: Number, required: true },
            // Named seat type breakdown chosen by driver
            seatTypes: [
                {
                    type: {
                        type: String,
                        enum: [
                            "front",          // Front passenger seat
                            "backWindow",     // Back window seat (left/right)
                            "backMiddle",     // Back middle seat
                            "backArmrest",    // Back seat with armrest
                            "thirdRow",       // Third row / van/SUV extra row
                            "any",            // No preference / any seat
                        ],
                    },
                    label: String,   // display label e.g. "Front Seat"
                    count: { type: Number, default: 0 },
                },
            ],
        },

        pricing: {
            baseFare: { type: Number, required: true },
            currency: { type: String, default: "INR" },
            pricePerKm: Number,
        },

        preferences: {
            smokingAllowed: Boolean,
            petsAllowed: Boolean,
            max2Allowed: Boolean,
        },

        passengers: [
            {
                userId: String,
                name: String,
                profileImage: String,

                pickupGrid: String,
                dropGrid: String,

                farePaid: Number,
                status: {
                    type: String,
                    enum: ["confirmed", "cancelled"],
                    default: "confirmed",
                },
            },
        ],

        status: {
            type: String,
            enum: ["scheduled", "ongoing", "completed", "cancelled"],
            default: "scheduled",
        },

        metrics: {
            totalDistanceKm: Number,
            durationMinutes: Number,
        },
    },
    { timestamps: true }
);

/* ---------- INDEXES ---------- */
RideSchema.index({ "schedule.departureTime": 1 });

export default mongoose.model("Ride", RideSchema);