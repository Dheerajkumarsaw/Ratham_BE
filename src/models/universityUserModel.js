const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      enum: ["dean", "student"],
      required: true,
    },
    slots: [
      {
        day: {
          type: String,
          required: true,
        },
        time: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["booked", "available"],
          default: "available",
          required: true,
        },
        _id: false,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("universityUser", userSchema);
