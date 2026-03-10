import mongoose from "mongoose";

/* ── MESSAGE ── */
const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: { type: String, required: true },   // clerk userId
    senderName: { type: String, default: "" },
    senderImage: { type: String, default: "" },
    text: { type: String, required: true },
    readBy: [{ type: String }],                    // userIds who have read
  },
  { timestamps: true },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

/* ── CONVERSATION ── */
const ConversationSchema = new mongoose.Schema(
  {
    // "direct" = 1-1, "group" = ride group chat
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },

    // For group chats linked to a ride
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
      index: true,
    },

    // Human-readable title (auto-set for groups, optional for DMs)
    title: { type: String, default: "" },
    image: { type: String, default: "" },

    // Participants
    participants: [
      {
        userId: { type: String, required: true },
        name: { type: String, default: "" },
        profileImage: { type: String, default: "" },
        role: {
          type: String,
          enum: ["driver", "rider"],
          default: "rider",
        },
      },
    ],

    // Last message snapshot for list view
    lastMessage: {
      text: { type: String, default: "" },
      senderId: { type: String, default: "" },
      senderName: { type: String, default: "" },
      sentAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

// Quick look-up: "find all conversations for a user"
ConversationSchema.index({ "participants.userId": 1 });
// Unique constraint: one DM pair, one group per ride
ConversationSchema.index(
  { rideId: 1, type: 1 },
  { unique: true, partialFilterExpression: { rideId: { $ne: null } } },
);

export const Message = mongoose.model("Message", MessageSchema);
export const Conversation = mongoose.model("Conversation", ConversationSchema);
