import mongoose from "mongoose";

const RiderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    documents: [
      {
        type: String,
      },
    ],

    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      reviewsCount: {
        type: Number,
        default: 0,
      },
    },
    bookings: [
      {
        rideId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ride",
          index: true,
        },

        pickupGrid: String,
        dropGrid: String,

        farePaid: Number,

        status: {
          type: String,
          enum: ["confirmed", "cancelled"],
          default: "confirmed",
        },

        bookedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    rides: {
      completed: {
        type: Number,
        default: 0,
      },
      cancelled: {
        type: Number,
        default: 0,
      },
    },

    hoursTravelled: {
      type: Number,
      default: 0,
    },

    distanceTravelledKm: {
      type: Number,
      default: 0,
    },

    verification: {
      emailVerified: {
        type: Boolean,
        default: false,
      },
      phoneVerified: {
        type: Boolean,
        default: false,
      },
      idVerified: {
        type: Boolean,
        default: false,
      },
    },

    trustScore: {
      type: Number,
      default: 0,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    lastRideAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Rider", RiderSchema);
