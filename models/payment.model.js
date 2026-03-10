import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({

/* ================= RIDE ================= */

rideId: {
  type: String,
  required: true,
  index: true,
},

passengerId: {
  type: String,
  required: true,
},

driverId: {
  type: String,
  required: true,
},

/* ================= JOURNEY ================= */

boardingKm: {
  type: Number,
  required: true,
},

dropKm: {
  type: Number,
  required: true,
},

travelDistanceKm: {
  type: Number,
  required: true,
},

/* ================= MONEY ================= */

amount: {
  type: Number,
  required: true,
},

platformCommission: {
  type: Number,
  default: 0,
},

driverEarning: {
  type: Number,
  default: 0,
},

currency: {
  type: String,
  default: "INR",
},

/* ================= STATUS ================= */

status: {
  type: String,
  enum: [
    "pending",
    "success",
    "failed",
    "refunded"
  ],
  default: "pending",
},

/* ================= PAYMENT METHOD ================= */

paymentMethod: {
  type: String,
  enum: [
    "upi",
    "card",
    "netbanking",
    "wallet",
    "razorpay"
  ],
  required: true,
},

transactionId: {
  type: String,
  default: null,
},

/* ================= DRIVER CREDIT SAFETY ================= */

isDriverCredited: {
  type: Boolean,
  default: false,
}

},
{
  timestamps: true
});

export default mongoose.model("Payment", PaymentSchema);