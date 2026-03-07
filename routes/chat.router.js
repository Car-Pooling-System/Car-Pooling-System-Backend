import express from "express";
import { Conversation, Message } from "../models/chat.model.js";
import Ride from "../models/ride.model.js";

const router = express.Router();
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function normalizeConversationId(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return OBJECT_ID_RE.test(trimmed) ? trimmed : null;
}

/* ────────────────────────────────────────────────
   GET /api/chat/conversations?userId=xxx
   Returns all conversations the user participates in,
   sorted by last message time (newest first).
   ──────────────────────────────────────────────── */
router.get("/conversations", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ "lastMessage.sentAt": -1, updatedAt: -1 })
      .lean();

    // Attach unread count per conversation
    const withUnread = await Promise.all(
      conversations.map(async (c) => {
        const unread = await Message.countDocuments({
          conversationId: c._id,
          readBy: { $ne: userId },
        });
        return { ...c, unreadCount: unread };
      }),
    );

    console.log(`[Chat] GET /conversations for ${userId} → ${withUnread.length} conversations`);
    res.json({ conversations: withUnread });
  } catch (err) {
    console.error("[Chat] GET /conversations error:", err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

/* ────────────────────────────────────────────────
   GET /api/chat/messages/:conversationId?page=1&limit=50
   Paginated message history, newest-first.
   ──────────────────────────────────────────────── */
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const conversationId = normalizeConversationId(req.params.conversationId);
    if (!conversationId) {
      return res.status(400).json({ message: "Invalid conversationId" });
    }
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({ conversationId });

    console.log(`[Chat] GET /messages for convo ${conversationId} — page ${page}, ${messages.length}/${total} msgs`);
    res.json({
      messages: messages.reverse(), // return in chronological order
      page,
      limit,
      total,
      hasMore: skip + messages.length < total,
    });
  } catch (err) {
    console.error("[Chat] GET /messages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

/* ────────────────────────────────────────────────
   POST /api/chat/conversations/direct
   Find-or-create a 1-1 conversation between two users.
   Body: { user1: { userId, name, profileImage, role },
           user2: { userId, name, profileImage, role } }
   ──────────────────────────────────────────────── */
router.post("/conversations/direct", async (req, res) => {
  try {
    // Accept both { participants: [a,b] } and { user1, user2 } formats
    let user1, user2;
    if (Array.isArray(req.body.participants) && req.body.participants.length >= 2) {
      [user1, user2] = req.body.participants;
    } else {
      ({ user1, user2 } = req.body);
    }
    if (!user1?.userId || !user2?.userId)
      return res.status(400).json({ message: "Both users required" });
    console.log(`[Chat] POST /conversations/direct  ${user1.name} ↔ ${user2.name}`);

    // Check if a DM already exists between these two
    let convo = await Conversation.findOne({
      type: "direct",
      "participants.userId": { $all: [user1.userId, user2.userId] },
      participants: { $size: 2 },
    });

    if (!convo) {
      convo = await Conversation.create({
        type: "direct",
        participants: [
          { userId: user1.userId, name: user1.name || "", profileImage: user1.profileImage || "", role: user1.role || "rider" },
          { userId: user2.userId, name: user2.name || "", profileImage: user2.profileImage || "", role: user2.role || "rider" },
        ],
      });
    }

    console.log(`[Chat] DM conversation ${convo._id} (${convo.participants.map(p => p.name).join(" ↔ ")})`);
    res.json(convo);
  } catch (err) {
    console.error("[Chat] POST /conversations/direct error:", err);
    res.status(500).json({ message: "Failed to create conversation" });
  }
});

/* ────────────────────────────────────────────────
   POST /api/chat/conversations/group
   Find-or-create the group chat for a ride.
   Body: { rideId, userId }
   Automatically pulls participants from the ride.
   ──────────────────────────────────────────────── */
router.post("/conversations/group", async (req, res) => {
  try {
    const { rideId, userId } = req.body;
    console.log(`[Chat] POST /conversations/group  rideId=${rideId}`);
    if (!rideId) return res.status(400).json({ message: "rideId required" });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    // Check if group already exists
    let convo = await Conversation.findOne({ rideId, type: "group" });

    // Build participant list from ride
    const participantMap = new Map();
    // Driver
    participantMap.set(ride.driver.userId, {
      userId: ride.driver.userId,
      name: ride.driver.name || "Driver",
      profileImage: ride.driver.profileImage || "",
      role: "driver",
    });
    // Confirmed + Requested passengers
    for (const p of ride.passengers) {
      if (p.status === "cancelled" || p.isGuest) continue;
      participantMap.set(p.userId, {
        userId: p.userId,
        name: p.name || "Rider",
        profileImage: p.profileImage || "",
        role: "rider",
      });
    }

    if (!convo) {
      convo = await Conversation.create({
        type: "group",
        rideId: ride._id,
        title: `${ride.route?.start?.name || "Start"} → ${ride.route?.end?.name || "End"}`,
        participants: Array.from(participantMap.values()),
      });
    } else {
      // Sync participants (add new ones who joined the ride)
      const existingIds = new Set(convo.participants.map((p) => p.userId));
      let changed = false;
      for (const [uid, pObj] of participantMap) {
        if (!existingIds.has(uid)) {
          convo.participants.push(pObj);
          changed = true;
        }
      }
      if (changed) await convo.save();
    }

    console.log(`[Chat] Group conversation ${convo._id} for ride ${rideId} — "${convo.title}" — ${convo.participants.length} participants`);
    res.json(convo);
  } catch (err) {
    console.error("[Chat] POST /conversations/group error:", err);
    res.status(500).json({ message: "Failed to create group conversation" });
  }
});

export default router;
