import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true
    }, 

    senderId: {
      type: String, 
      required: true
    }, 

    message: {
      type: String, 
      required: true
    }, 

    readBy: [
      {
        type: String
      }
    ]
  }, 
  { timestamps: true }
);

ChatSchema.index({ rideId: 1, createdAt: -1 });

export default mongoose.model("Chat", ChatSchema);
