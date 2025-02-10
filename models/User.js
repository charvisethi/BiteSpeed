const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  linkedId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  linkPrecedence: { type: String, enum: ["primary", "secondary"], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

const User = mongoose.model("User", userSchema);
module.exports = User;

