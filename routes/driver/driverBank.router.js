import express from "express";
import Driver from "../../models/driver.model.js";

const router = express.Router();


/*
==================================
ADD / UPDATE BANK DETAILS
==================================
*/

router.put("/:userId", async (req,res)=>{

try{

const { userId } = req.params;

const{

accountHolderName,
accountNumber,
ifscCode,
bankName,
upiId

}=req.body;


/*
VALIDATION
*/

if(!accountNumber && !upiId){

return res.status(400).json({

message:
"Either Account Number or UPI Id required"

});

}


/*
FIND DRIVER
*/

const driver =
await Driver.findOne({ userId });


if(!driver){

return res.status(404).json({

message:"Driver not found"

});

}


/*
SAVE BANK DETAILS
*/

driver.bankDetails={

accountHolderName:
accountHolderName || "",

accountNumber:
accountNumber || "",

ifscCode:
ifscCode || "",

bankName:
bankName || "",

upiId:
upiId || ""

};

await driver.save();


res.json({

message:
"Bank details saved successfully",

bankDetails:
driver.bankDetails

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
==================================
GET BANK DETAILS
==================================
*/

router.get("/:userId",

async(req,res)=>{

try{

const driver =
await Driver.findOne({

userId:req.params.userId

}).select("bankDetails");


if(!driver){

return res.status(404).json({

message:"Driver not found"

});

}


if(!driver.bankDetails){

return res.status(404).json({

message:"Bank details not found"

});

}


res.json({

bankDetails:
driver.bankDetails

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
==================================
DELETE BANK DETAILS
==================================
*/

router.delete("/:userId",

async(req,res)=>{

try{

const driver =
await Driver.findOne({

userId:req.params.userId

});


if(!driver){

return res.status(404).json({

message:"Driver not found"

});

}


/*
RESET BANK DETAILS
*/

driver.bankDetails={

accountHolderName:"",
accountNumber:"",
ifscCode:"",
bankName:"",
upiId:""

};

await driver.save();


res.json({

message:"Bank details removed successfully"

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


export default router;