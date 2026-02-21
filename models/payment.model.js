import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(

{

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

/* JOURNEY DETAILS */

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

/* MONEY */

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

/* PAYMENT STATUS */

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

paymentMethod: {

type: String,

enum: [

"upi",
"card",
"netbanking",
"wallet"

],

required: true,

},

transactionId: {

type: String,

default:null

},

/* IMPORTANT PROTECTION */

isDriverCredited: {

type:Boolean,
default:false

}

},

{

timestamps:true

}

);

export default mongoose.model("Payment", PaymentSchema);