import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    phoneNumber: {
      type: String,
      default: "",
    },

    vehicle: {
      type: {
        type: String,
      },

      brand: {
        type: String,
        trim: true,
      },

      model: {
        type: String,
        trim: true,
      },

      year: {
        type: Number,
      },

      color: {
        type: String,
        trim: true,
      },

      licensePlate: {
        type: String,
        trim: true,
      },

      images: [
        {
          type: String,
        },
      ],
    },

    documents: {
      drivingLicense: {
        type: String,
      },
      vehicleRegistration: {
        type: String,
      },
      insurance: {
        type: String,
      },
    },

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

    rides: {
      hosted: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Number,
        default: 0,
      },
      cancelled: {
        type: Number,
        default: 0,
      },
    },

    hoursDriven: {
      type: Number,
      default: 0,
    },

    distanceDrivenKm: {
      type: Number,
      default: 0,
    },

    earnings: {
      total: {
        type: Number,
        default: 0,
      },
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
      drivingLicenseVerified: {
        type: Boolean,
        default: false,
      },
      vehicleVerified: {
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

    lastRideHostedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Driver", DriverSchema);
