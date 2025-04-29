import mongoose from "mongoose";
// const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  coursePurchased: [{ type: mongoose.Schema.Types.String, ref: "Course" }],
});
const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const courseSchema = new mongoose.Schema({
  courseId: String,
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean,
});

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Course = mongoose.model("course", courseSchema);

export { User, Admin, Course };
