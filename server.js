import { generateJwt, jwtAuthentication } from "./middleware/authmiddleware.js";
import { User, Admin, Course } from "./model/schemas.js";
import connectDB from "./config/db.js";
import express from "express";
import cors from "cors";

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

const SECRET_ADMIN_KEY = process.env.SECRET_ADMIN_KEY || "ADMIN";
const SECRET_USER_KEY = process.env.SECRET_USER_KEY || "USER";
const PORT = process.env.PORT || 3000;

app.get("/ping", (req, res) => {
  console.log("Received /ping request at " + new Date().toISOString());
  try {
    res.status(200).send("pong");
  } catch (error) {
    console.error("Error in ping route:", error);
    res.status(500).send("Server error");
  }
});

app.use((req, res, next) => {
  console.log(`Received Request of ${req.path} at ${new Date().toISOString()}`);
  next();
});
// Admin routes
app.post("/admin/signup", async (req, res) => {
  // logic to sign up admin
  const username = req.headers.username;
  const password = req.headers.password;

  if (!username || !password) {
    return res.status(400).json({
      message:
        "Insufficient Details: username and password are required in the body.",
    });
  }

  const existingAdmin = await Admin.findOne({ username });
  if (existingAdmin) {
    return res.status(409).json({ message: "Admin already exists" }); // 409 Conflict
  } else {
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    const token = generateJwt(newAdmin, SECRET_ADMIN_KEY);
    return res
      .status(201)
      .json({ message: "Admin created successfully", token: token }); // 201 Created
  }
});

app.post("/admin/login", async (req, res) => {
  // logic to log in admin
  let username = req.body.username; // Prefer body for login
  let password = req.body.password; // Prefer body for login

  if (!username || !password) {
    return res.status(400).json({
      message:
        "Insufficient Details: username and password are required in the body.",
    });
  }

  const existingAdmin = await Admin.findOne({ username, password });
  if (existingAdmin) {
    const token = generateJwt(existingAdmin, SECRET_ADMIN_KEY);
    return res.json({ message: "Logged in successfully", token: token }); // Default 200 OK
  }
  return res.status(401).json({ message: "Invalid Credentials" }); // 401 Unauthorized
});

app.post("/admin/courses", jwtAuthentication, async (req, res) => {
  // logic to create a course
  const course = req.body;
  const courseId = String(Date.now());

  const addCourse = new Course({ ...course, courseId });
  await addCourse.save();
  return res
    .status(201) // 201 Created
    .json({ message: "Course created successfully", courseId: courseId });
});
app.get("/admin/courses", jwtAuthentication, async (req, res) => {
  const courses = await Course.find();
  return res.status(200).json({
    message: "Sccessfully Retrieved All COurse",
    courses: courses,
  });
});

app.put("/admin/courses/:courseId", jwtAuthentication, async (req, res) => {
  // logic to edit a course
  const courseId = req.params.courseId;
  const upCourse = req.body;
  try {
    const updatedCourse = await Course.findOneAndUpdate(
      { courseId: courseId },
      { $set: upCourse },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    return res.status(500).json({
      message: "Error updating course",
      error: error.message,
    });
  }
});

app.delete("/admin/courses/:courseId", jwtAuthentication, async (req, res) => {
  // logic to edit a course
  const courseId = req.params.courseId;
  const upCourse = req.body;
  try {
    const deletedCourse = await Course.deleteOne({ courseId: courseId });

    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not Found" });
    }

    return res.json({
      message: "Course Deleted Successfully",
      course: deletedCourse,
    });
  } catch (error) {
    console.error("Error Deleting Course:", error);
    return res.status(500).json({
      message: "Error Deleting Course",
      error: error.message,
    });
  }
});

app.get("/admin/courses/:courseId", jwtAuthentication, async (req, res) => {
  const courseId = req.params.courseId;
  const getCourse = await Course.findOne({ courseId });
  if (getCourse) {
    return res.json(getCourse);
  } else {
    return res.status(404).json({ message: "Course not found" }); // 404 for not found
  }
});

// User routes
app.post("/users/signup", async (req, res) => {
  // logic to sign up user
  let username = req.body.username;
  let password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      message:
        "Insufficient Details: username and password are required in the body.",
    });
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }
  const newUser = new User({ username, password });
  await newUser.save();
  const token = generateJwt(newUser, SECRET_USER_KEY);
  return res
    .status(201)
    .json({ message: "User created successfully", token: token });
});

app.post("/users/login", async (req, res) => {
  // logic to log in user
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message:
        "Insufficient Details: username and password are required in the body.",
    });
  }

  const user = await User.findOne({ username, password });
  if (user) {
    const token = generateJwt(user, SECRET_USER_KEY);
    return res.json({ message: "Logged in successfully", token });
  }
  return res.status(401).json({ message: "User authentication failed" });
});

app.get("/users/courses", jwtAuthentication, async (req, res) => {
  // logic to list all courses
  const allCourses = await Course.find({ published: true });
  return res.json(allCourses);
});

app.post("/users/courses/:courseId", jwtAuthentication, async (req, res) => {
  const courseId = req.params.courseId;
  const username = req.user.username;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const course = await Course.findOne({
      courseId: courseId,
      published: true,
    });
    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found or not available for purchase" });
    }

    if (user.coursePurchased.map(String).includes(String(courseId))) {
      return res.status(409).json({ message: "Course already purchased" });
    }

    user.coursePurchased.push(courseId);
    await user.save();

    return res.status(200).json({ message: "Course purchased successfully" });
  } catch (error) {
    console.error("Error purchasing course:", error);
    return res
      .status(500)
      .json({ message: "Error purchasing course", error: error.message });
  }
});

app.get("/users/purchasedCourses", jwtAuthentication, async (req, res) => {
  const username = req.user.username; // From jwtAuthentication
  try {
    const user = await User.findOne({ username }).populate({
      path: "coursePurchased",
      model: "course",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const purchasedCourseIds = user.coursePurchased;
    const purchasedCoursesDetails = await Course.find({
      courseId: { $in: purchasedCourseIds },
    });

    return res.status(200).json({ purchasedCourses: purchasedCoursesDetails });
  } catch (error) {
    console.error("Error fetching purchased courses:", error);
    return res.status(500).json({
      message: "Error fetching purchased courses",
      error: error.message,
    });
  }
});

const startServer = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`Server is now listening on port ${PORT}.`);
    });
    process.on("SIGINT", () => {
      console.log("\nGracefully shutting down...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Critical error during server startup:", error.message);
    process.exit(1);
  }
};
startServer();
