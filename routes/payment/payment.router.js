import express from "express";
import Payment from "../../models/payment.model.js";
import Driver from "../../models/driver.model.js";

const router = express.Router();

/*
Platform Commission %
Driver pays later monthly
*/

const PLATFORM_COMMISSION_PERCENT = 10;


/*
==================================================
CREATE PAYMENT
Passenger Pays Full Amount
==================================================
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
(fetch later from Ride Model)
*/

const rideDistance = 300;
const rideCost = 600;

const costPerKm = rideCost / rideDistance;

const travelledDistance =
dropKm - boardingKm;


/*
Passenger sees FULL fare
*/

const amount =
travelledDistance * costPerKm;


/*
Platform commission tracked separately
*/

const commission =
(amount * PLATFORM_COMMISSION_PERCENT)/100;


/*
Driver receives FULL money immediately
*/

const driverEarning = amount;


/*
CREATE PAYMENT
*/

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

console.log(err);

res.status(500).json({

message:"Server error",
error:err.message

});

}

});



/*
==================================================
UPDATE PAYMENT STATUS
Credit Driver + Add Commission Debt
==================================================
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
SAFE EARNINGS STRUCTURE
*/

if(!driver.earnings){

driver.earnings={
total:0,
commissionDue:0
};

}

if(typeof driver.earnings.total !== "number"){

driver.earnings.total=0;

}

if(typeof driver.earnings.commissionDue !== "number"){

driver.earnings.commissionDue=0;

}


/*
DRIVER GETS FULL MONEY
*/

driver.earnings.total +=
Number(payment.driverEarning);


/*
PLATFORM COMMISSION ADDED AS MONTHLY DEBT
*/

driver.earnings.commissionDue +=
Number(payment.platformCommission);


await driver.save();


/*
DOUBLE CREDIT PROTECTION
*/

payment.isDriverCredited=true;

}


/*
UPDATE STATUS
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