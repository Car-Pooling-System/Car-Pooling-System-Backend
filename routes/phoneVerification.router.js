import express from "express";
import twilio from "twilio";

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

const isTwilioConfigured =
  accountSid && accountSid.startsWith("AC") && authToken && verifySid;
const client = isTwilioConfigured ? twilio(accountSid, authToken) : null;

// Send OTP to phone number
router.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Check if Twilio is configured
    if (
      !accountSid ||
      !authToken ||
      !verifySid ||
      accountSid === "your_account_sid"
    ) {
      console.log(`[MOCK OTP] Sending '123456' to ${phoneNumber}`);
      return res.json({
        message: "OTP sent successfully (MOCK)",
        status: "pending",
        mock: true,
      });
    }

    // Send OTP using Twilio Verify
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phoneNumber, channel: "sms" });

    res.json({
      message: "OTP sent successfully",
      status: verification.status,
    });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({
      message: "Failed to send OTP",
      error: err.message,
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res
        .status(400)
        .json({ message: "Phone number and code are required" });
    }

    // Check if Twilio is configured for mock verification
    if (
      !accountSid ||
      !authToken ||
      !verifySid ||
      accountSid === "your_account_sid"
    ) {
      if (code === "123456") {
        return res.json({
          message: "Phone number verified successfully (MOCK)",
          verified: true,
        });
      } else {
        return res.status(400).json({
          message: "Invalid OTP (MOCK)",
          verified: false,
        });
      }
    }

    // Verify OTP using Twilio Verify
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code });

    if (verificationCheck.status === "approved") {
      res.json({
        message: "Phone number verified successfully",
        verified: true,
      });
    } else {
      res.status(400).json({
        message: "Invalid OTP",
        verified: false,
      });
    }
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({
      message: "Failed to verify OTP",
      error: err.message,
    });
  }
});

export default router;
