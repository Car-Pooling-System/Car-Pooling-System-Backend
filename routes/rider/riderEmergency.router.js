import express from "express";
import Rider from "../../models/user.model.js";
import { sendSOSEmail } from "../../utils/mailer.utils.js";

const router = express.Router();

/* ══════════════════════════════════════════════════
   GET /emergency/:userId
   Fetch emergency contacts & whether SOS code is set
   ══════════════════════════════════════════════════ */
router.get("/:userId", async (req, res) => {
  try {
    const rider = await Rider.findOne({ userId: req.params.userId })
      .select("emergencyContacts sosSecretCode")
      .lean();

    if (!rider) {
      return res.json({ emergencyContacts: [], hasSosCode: false });
    }

    res.json({
      emergencyContacts: rider.emergencyContacts || [],
      hasSosCode: !!rider.sosSecretCode,
    });
  } catch (err) {
    console.error("[Emergency] get error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ══════════════════════════════════════════════════
   PUT /emergency/:userId/contacts
   Save up to 3 emergency contacts
   ══════════════════════════════════════════════════ */
router.put("/:userId/contacts", async (req, res) => {
  try {
    const { contacts } = req.body; // [{ name, email, phone }]

    if (!Array.isArray(contacts) || contacts.length > 3) {
      return res.status(400).json({ message: "Provide up to 3 contacts" });
    }

    // Validate each contact has at least an email
    for (const c of contacts) {
      if (!c.email || !c.email.includes("@")) {
        return res.status(400).json({ message: `Invalid email for contact "${c.name || "Unnamed"}"` });
      }
    }

    const rider = await Rider.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: { emergencyContacts: contacts } },
      { new: true, upsert: true },
    );

    res.json({
      message: "Emergency contacts saved",
      emergencyContacts: rider.emergencyContacts,
    });
  } catch (err) {
    console.error("[Emergency] save contacts error:", err);
    res.status(500).json({ message: "Failed to save contacts" });
  }
});

/* ══════════════════════════════════════════════════
   PUT /emergency/:userId/sos-code
   Save or update the SOS secret code
   ══════════════════════════════════════════════════ */
router.put("/:userId/sos-code", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.length < 4) {
      return res.status(400).json({ message: "Secret code must be at least 4 characters" });
    }

    await Rider.findOneAndUpdate(
      { userId: req.params.userId },
      { $set: { sosSecretCode: code } },
      { upsert: true },
    );

    res.json({ message: "SOS secret code saved" });
  } catch (err) {
    console.error("[Emergency] save sos code error:", err);
    res.status(500).json({ message: "Failed to save code" });
  }
});

/* ══════════════════════════════════════════════════
   POST /emergency/:userId/sos
   Trigger SOS — if enteredCode doesn't match secret,
   send email to all emergency contacts.
   ══════════════════════════════════════════════════ */
router.post("/:userId/sos", async (req, res) => {
  try {
    const { enteredCode, riderName, rideId, currentLocation } = req.body;
    const rider = await Rider.findOne({ userId: req.params.userId }).lean();

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // If secret code matches → SOS is cancelled (rider is safe)
    if (rider.sosSecretCode && enteredCode === rider.sosSecretCode) {
      return res.json({ message: "SOS cancelled — code verified", safe: true });
    }

    // Secret code doesn't match or not entered → SEND SOS EMAILS
    const contacts = rider.emergencyContacts || [];
    if (contacts.length === 0) {
      return res.status(400).json({ message: "No emergency contacts configured" });
    }

    const locationStr = currentLocation
      ? `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`
      : "Location unavailable";

    let sentCount = 0;
    for (const contact of contacts) {
      if (contact.email) {
        try {
          await sendSOSEmail({
            to: contact.email,
            contactName: contact.name || "Emergency Contact",
            riderName: riderName || "A rider",
            rideId: rideId || "",
            locationUrl: locationStr,
          });
          sentCount++;
        } catch (emailErr) {
          console.error(`[SOS] Failed to send to ${contact.email}:`, emailErr.message);
        }
      }
    }

    console.log(`[SOS] Alert sent for rider ${req.params.userId} to ${sentCount} contacts`);
    res.json({
      message: `SOS alert sent to ${sentCount} contact(s)`,
      safe: false,
      sentCount,
    });
  } catch (err) {
    console.error("[Emergency] SOS error:", err);
    res.status(500).json({ message: "Failed to trigger SOS" });
  }
});

export default router;
