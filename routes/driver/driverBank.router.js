import express from "express";
import Driver from "../../models/driver.model.js";

const router = express.Router();

/**
 ADD or UPDATE Bank Details
*/

router.put("/:userId", async (req,res)=>{

try{

const {userId}=req.params;

const {

accountHolderName,
accountNumber,
ifscCode,
bankName,
upiId

}=req.body;

const driver=await Driver.findOne({userId});

if(!driver){

return res.status(404).json({

message:"Driver not found"

});

}

driver.bankDetails={

accountHolderName,
accountNumber,
ifscCode,
bankName,
upiId

};

await driver.save();

res.json({

message:"Bank details saved successfully",
bankDetails:driver.bankDetails

});

}

catch(err){

res.status(500).json({

message:"Server error",
error:err.message

});

}

});


/**
 GET Bank Details
*/

router.get("/:userId", async(req,res)=>{

try{

const driver=await Driver.findOne({

userId:req.params.userId

}).select("bankDetails");

if(!driver || !driver.bankDetails){

return res.status(404).json({

message:"Bank details not found"

});

}

res.json(driver.bankDetails);

}

catch(err){

res.status(500).json({

message:"Server error",
error:err.message

});

}

});


/**
 DELETE Bank Details
*/

router.delete("/:userId", async(req,res)=>{

try{

const driver=await Driver.findOne({

userId:req.params.userId

});

if(!driver){

return res.status(404).json({

message:"Driver not found"

});

}

driver.bankDetails=undefined;

await driver.save();

res.json({

message:"Bank details removed"

});

}

catch(err){

res.status(500).json({

message:"Server error",
error:err.message

});

}

});

export default router;