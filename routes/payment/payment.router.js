import express from "express";
import Payment from "../../models/payment.model.js";
import Driver from "../../models/driver.model.js";

const router = express.Router();

const PLATFORM_COMMISSION_PERCENT = 10;


/*
==================================================
CREATE PAYMENT
==================================================
*/

/**
 * @swagger
 * /api/payment:
 *   post:
 *     summary: Create Payment
 *     description: Initiates a distance-based payment calculation.
 *     tags:
 *       - Payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rideId:
 *                 type: string
 *               passengerId:
 *                 type: string
 *               driverId:
 *                 type: string
 *               boardingKm:
 *                 type: number
 *               dropKm:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created successfully
 */

router.post("/", async (req,res)=>{

try{

const {

rideId,
passengerId,
driverId,
boardingKm,
dropKm,
paymentMethod

} = req.body;


if(
!rideId ||
!passengerId ||
!driverId ||
boardingKm === undefined ||
dropKm === undefined ||
!paymentMethod
){

return res.status(400).json({

message:"Missing required fields"

});

}


if(dropKm <= boardingKm){

return res.status(400).json({

message:"Invalid journey distance"

});

}


/*
Example Ride Pricing
( later fetch from Ride Model )
*/

const rideDistance = 300;
const rideCost = 600;

const costPerKm = rideCost / rideDistance;

const travelledDistance =
dropKm - boardingKm;

const amount =
travelledDistance * costPerKm;

const commission =
(amount * PLATFORM_COMMISSION_PERCENT)/100;

const driverEarning =
amount - commission;


const payment =
await Payment.create({

rideId,
passengerId,
driverId,

boardingKm,
dropKm,

travelDistanceKm:
travelledDistance,

amount,

platformCommission:
commission,

driverEarning,

paymentMethod,

status:"pending",

isDriverCredited:false

});


res.status(201).json({

message:"Payment initiated",
payment

});

}

catch(err){

res.status(500).json({

message:"Server error",
error:err.message

});

}

});



/*
==================================================
UPDATE PAYMENT STATUS
==================================================
*/

/**
 * @swagger
 * /api/payment/{paymentId}/status:
 *   put:
 *     summary: Update Payment Status
 *     tags:
 *       - Payment
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment updated
 */

router.put("/:paymentId/status",

async(req,res)=>{

try{

const {paymentId}=req.params;

const{

status,
transactionId

}=req.body;


if(!status){

return res.status(400).json({

message:"Status required"

});

}


const payment =
await Payment.findById(paymentId);

if(!payment){

return res.status(404).json({

message:"Payment not found"

});

}



/*
SUCCESS PAYMENT
*/

if(
status==="success" &&
payment.isDriverCredited===false
){

const driver =
await Driver.findOne({

userId:payment.driverId

});


if(!driver){

return res.status(404).json({

message:"Driver not found"

});

}


/*
BANK VALIDATION
*/

if(!driver.bankDetails){

return res.status(400).json({

message:"Driver bank details missing"

});

}


if(
!driver.bankDetails.accountNumber &&
!driver.bankDetails.upiId
){

return res.status(400).json({

message:"Driver payout incomplete"

});

}


/*
SAFE EARNINGS FIX
*/

if(!driver.earnings){

driver.earnings={total:0};

}

if(typeof driver.earnings.total !== "number"){

driver.earnings.total=0;

}


/*
MONEY SPLIT
*/

const farePerKm =
payment.amount /
payment.travelDistanceKm;

const passengerDistance =
payment.dropKm -
payment.boardingKm;

const passengerFare =
farePerKm *
passengerDistance;


/*
CREDIT DRIVER
*/

driver.earnings.total +=
Number(passengerFare);

await driver.save();


payment.isDriverCredited=true;

}


/*
STATUS UPDATE
*/

payment.status=status;

if(transactionId){

payment.transactionId=
transactionId;

}

await payment.save();


res.json({

message:
"Payment Updated Successfully",

payment

});

}

catch(err){

console.log(err);

res.status(500).json({

message:"Server error",
error:err.message

});

}

});



/*
==================================================
GET PAYMENT BY ID
==================================================
*/

router.get("/:paymentId",

async(req,res)=>{

try{

const payment=
await Payment.findById(
req.params.paymentId
);

if(!payment){

return res.status(404).json({

message:"Payment not found"

});

}

res.json(payment);

}

catch(err){

res.status(500).json({

message:"Server error",
error:err.message

});

}

});



/*
==================================================
PASSENGER HISTORY
==================================================
*/

router.get(
"/passenger/:passengerId",

async(req,res)=>{

try{

const payments=
await Payment.find({

passengerId:
req.params.passengerId

}).sort({

createdAt:-1

});

res.json(payments);

}

catch(err){

res.status(500).json({

message:"Server error",
error:err.message

});

}

});

export default router;