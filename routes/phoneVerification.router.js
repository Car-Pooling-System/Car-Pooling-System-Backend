import express from "express";
import twilio from "twilio";
import Driver from "../models/driver.model.js";
import Rider from "../models/user.model.js";

const router = express.Router();

// Helper: normalize phone to E.164 (+91 default)
const normalizePhone = (phoneNumber) => {
  const digits = phoneNumber.replace(/\D/g, "");
  if (phoneNumber.startsWith("+")) return phoneNumber;
  if (digits.length === 12) return `+${digits}`;
  return `+91${digits}`;
};

// Helper: get Twilio client lazily (reads env at request time, not module load)
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SID;
  const configured = accountSid && accountSid.startsWith("AC") && authToken && verifySid;
  return {
    accountSid,
    authToken,
    verifySid,
    configured,
    client: configured ? twilio(accountSid, authToken) : null,
  };
};

// Send OTP to phone number
router.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber, userId } = req.body;
    console.log(`[PhoneVerification] send-otp request — userId: ${userId}, phoneNumber: ${phoneNumber}`);

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    console.log(`[PhoneVerification] Normalized phone: ${normalizedPhone}`);

    const { configured, client, verifySid, accountSid, authToken } = getTwilioClient();
    console.log(`[PhoneVerification] Twilio configured: ${configured}, accountSid: ${accountSid ? accountSid.substring(0, 6) + '...' : 'MISSING'}`);

    if (!configured) {
      console.log(`[PhoneVerification] MOCK mode — sending '123456' to ${normalizedPhone}`);
      return res.json({
        message: "OTP sent successfully (MOCK)",
        status: "pending",
        mock: true,
      });
    }

    console.log(`[PhoneVerification] Calling Twilio Verify for ${normalizedPhone}, service: ${verifySid}`);
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: normalizedPhone, channel: "sms" });

    console.log(`[PhoneVerification] Twilio response status: ${verification.status}`);
    res.json({
      message: "OTP sent successfully",
      status: verification.status,
    });
  } catch (err) {
    console.error("[PhoneVerification] Error sending OTP:", err.message, err.code || "");
    res.status(500).json({
      message: "Failed to send OTP",
      error: err.message,
    });
  }
});

// Verify OTP and update both Driver and Rider records
router.post("/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, code, userId } = req.body;
    console.log(`[PhoneVerification] verify-otp request — userId: ${userId}, phoneNumber: ${phoneNumber}, code: ${code}`);

    if (!phoneNumber || !code) {
      return res
        .status(400)
        .json({ message: "Phone number and code are required" });
    }

    const normalizedPhone = normalizePhone(phoneNumber);
    console.log(`[PhoneVerification] Normalized phone: ${normalizedPhone}`);

    const { configured, client, verifySid } = getTwilioClient();
    let verified = false;

    if (!configured) {
      console.log("[PhoneVerification] MOCK mode — code must be '123456'");
      if (code === "123456") {
        verified = true;
      } else {
        return res.status(400).json({ message: "Invalid OTP (MOCK)", verified: false });
      }
    } else {
      console.log(`[PhoneVerification] Calling Twilio verificationChecks for ${normalizedPhone}`);
      const verificationCheck = await client.verify.v2
        .services(verifySid)
        .verificationChecks.create({ to: normalizedPhone, code });

      console.log(`[PhoneVerification] Twilio verificationCheck status: ${verificationCheck.status}`);
      if (verificationCheck.status !== "approved") {
        return res.status(400).json({ message: "Invalid OTP", verified: false });
      }
      verified = true;
    }

    // Update Driver record
    if (userId) {
      try {
        const driver = await Driver.findOne({ userId });
        if (driver) {
          driver.phoneNumber = normalizedPhone;
          driver.verification.phoneVerified = true;
          await driver.save();
          console.log(`[PhoneVerification] Driver record updated for userId: ${userId}`);
        } else {
          console.log(`[PhoneVerification] No Driver record found for userId: ${userId}`);
        }
      } catch (dbErr) {
        console.error("[PhoneVerification] Error updating Driver record:", dbErr.message);
      }

      // Update Rider record
      try {
        let rider = await Rider.findOne({ userId });
        if (rider) {
          rider.phoneNumber = normalizedPhone;
          rider.verification.phoneVerified = true;
          await rider.save();
          console.log(`[PhoneVerification] Rider record updated for userId: ${userId}`);
        } else {
          // Create minimal rider record with phone verified
          rider = new Rider({ userId, phoneNumber: normalizedPhone });
          rider.verification.phoneVerified = true;
          await rider.save();
          console.log(`[PhoneVerification] Rider record created and verified for userId: ${userId}`);
        }
      } catch (dbErr) {
        console.error("[PhoneVerification] Error updating Rider record:", dbErr.message);
      }
    } else {
      console.warn("[PhoneVerification] No userId in request — skipping DB update");
    }

    res.json({
      message: "Phone number verified successfully",
      verified: true,
    });
  } catch (err) {
    console.error("[PhoneVerification] Error verifying OTP:", err.message, err.code || "");
    res.status(500).json({
      message: "Failed to verify OTP",
      error: err.message,
    });
  }
});

export default router;
