const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const sessionSchema = new mongoose.Schema(
  {
    deanId: {
      type: ObjectId,
      required: true,
      ref: "universityUser",
    },
    bookedBy: {
      type: String,
      require: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      required: true,
      default: "pending",
    },
    slot: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("session", sessionSchema);
