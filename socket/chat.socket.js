import { Message, Conversation } from "../models/chat.model.js";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

function normalizeConversationId(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return OBJECT_ID_RE.test(trimmed) ? trimmed : null;
}

/**
 * Attach Socket.IO event handlers.
 * Called once when the server boots.
 *
 * @param {import("socket.io").Server} io
 */
export default function registerChatSocket(io) {
  // Map userId → Set<socketId>  (a user may have multiple devices)
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // ── Track online presence ──────────────────────────
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    console.log(`[Chat] ${userId} connected (socket ${socket.id})`);

    // ── Join all conversation rooms the user belongs to ──
    socket.on("join-conversations", async () => {
      try {
        const convos = await Conversation.find(
          { "participants.userId": userId },
          { _id: 1, title: 1, type: 1 },
        ).lean();
        for (const c of convos) {
          socket.join(c._id.toString());
        }
        console.log(`[Chat] ${userId} auto-joined ${convos.length} conversation rooms`);
        socket.emit("joined-conversations", convos.map((c) => c._id.toString()));
      } catch (err) {
        console.error("[Chat] join-conversations error:", err);
      }
    });

    // ── Join a single room (after creating / opening a convo) ──
    socket.on("join-room", (conversationId) => {
      const normalizedConversationId = normalizeConversationId(conversationId);
      if (!normalizedConversationId) {
        console.warn(`[Chat] join-room rejected for ${userId} — invalid conversationId: ${conversationId}`);
        return;
      }
      console.log(`[Chat] ${userId} joined room ${normalizedConversationId}`);
      socket.join(normalizedConversationId);
    });

    // ── Send message ──────────────────────────────────
    socket.on("send-message", async (payload, ack) => {
      try {
        const { conversationId: rawConversationId, text, senderName, senderImage } = payload;
        const conversationId = normalizeConversationId(rawConversationId);
        console.log(`[Chat] send-message from ${senderName} (${userId}) → room ${conversationId}: "${(text || "").slice(0, 50)}"`);
        if (!conversationId || !text?.trim()) {
          console.warn(`[Chat] send-message rejected — missing conversationId or text`);
          if (typeof ack === "function") ack({ ok: false, error: "Missing conversationId or text" });
          return;
        }

        const msg = await Message.create({
          conversationId,
          senderId: userId,
          senderName: senderName || "",
          senderImage: senderImage || "",
          text: text.trim(),
          readBy: [userId],
        });

        // Update conversation.lastMessage
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            text: msg.text,
            senderId: userId,
            senderName: senderName || "",
            sentAt: msg.createdAt,
          },
        });

        const msgObj = msg.toObject();

        // Broadcast to everyone in the room (including sender's other devices)
        io.to(conversationId).emit("new-message", msgObj);
        console.log(`[Chat] ✓ message ${msg._id} saved & broadcast to room ${conversationId}`);

        // ACK back so the sender can mark "sent"
        if (typeof ack === "function") ack({ ok: true, message: msgObj });
      } catch (err) {
        console.error("[Chat] send-message error:", err);
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    // ── Typing indicators ─────────────────────────────
    socket.on("typing", ({ conversationId, senderName }) => {
      const normalizedConversationId = normalizeConversationId(conversationId);
      if (!normalizedConversationId) return;
      socket.to(normalizedConversationId).emit("user-typing", {
        userId,
        senderName,
        conversationId: normalizedConversationId,
      });
    });

    socket.on("stop-typing", ({ conversationId }) => {
      const normalizedConversationId = normalizeConversationId(conversationId);
      if (!normalizedConversationId) return;
      socket.to(normalizedConversationId).emit("user-stop-typing", {
        userId,
        conversationId: normalizedConversationId,
      });
    });

    // ── Mark messages as read ─────────────────────────
    socket.on("mark-read", async ({ conversationId: rawConversationId }) => {
      try {
        const conversationId = normalizeConversationId(rawConversationId);
        if (!conversationId) return;
        await Message.updateMany(
          { conversationId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } },
        );
        socket.to(conversationId).emit("messages-read", { conversationId, userId });
      } catch (err) {
        console.error("[Chat] mark-read error:", err);
      }
    });

    // ── Disconnect ────────────────────────────────────
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
      console.log(`[Chat] ${userId} disconnected (socket ${socket.id})`);
    });
  });
}
