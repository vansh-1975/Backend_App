const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
      }
    ],
    isDeletedForEveryone: {
      type: Boolean,
      default: false
    },
    edited: {
      type: Boolean,
      default: false
    },
    seen: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
