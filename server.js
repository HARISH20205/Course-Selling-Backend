import { generateJwt, jwtAuthentication } from "./middleware/authmiddleware.js";
import { User, Admin, Course } from "./model/schemas.js";
import loadEnvConfigOfMongodb from "./config/dotenv.config.js";
import connectDB from "./config/db.js";
import express from "express";

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, username, password");
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Logging
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

loadEnvConfigOfMongodb();
connectDB();

app.use(express.json());
const SECRET_ADMIN_KEY = process.env.SECRET_ADMIN_KEY || "ADMIN";
const SECRET_USER_KEY = process.env.SECRET_USER_KEY || "USER";

// mongoose.connect(process.env.MONGO_URI);

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});
// Admin routes
app.post("/admin/signup", async (req, res) => {
  // logic to sign up admin

  console.log(req.headers);
  let username = req.headers.username;
  let password = req.headers.password;
  // console.log("hello");

  if (!username && !password) {
    return res.status(403).send("Insufficient Details");
  }

  const existingAdmin = await Admin.findOne({ username });
  if (existingAdmin) {
    return res.status(403).send("Admin already exists");
  } else {
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    const token = generateJwt(newAdmin, SECRET_ADMIN_KEY);
    return res.json({ message: "Created Successfully", token: token });
  }
});

app.post("/admin/login", async (req, res) => {
  // logic to log in admin
  let username = req.headers.username;
  let password = req.headers.password;

  const existingAdmin = await Admin.findOne({ username, password });
  if (existingAdmin) {
    const token = generateJwt(existingAdmin, SECRET_ADMIN_KEY);
    return res.json({ message: "Logged in  Successfully", token: token });
  }
  return res.status(403).json({ message: "Invalid Credentials" });
});

app.post("/admin/courses", jwtAuthentication, async (req, res) => {
  // logic to create a course
  const course = req.body;
  const courseId = Date.now();
  // console.log(courseId);

  const addCourse = new Course({ courseId, ...course });
  await addCourse.save();
  // COURSES.push({ id, ...course });
  // console.log(COURSES);
  return res
    .status(200)
    .json({ message: "Course created successfully", courseId: courseId });
});

app.put("/admin/courses/:courseId", jwtAuthentication, async (req, res) => {
  // logic to edit a course
  const courseId = req.params.courseId;
  const upCourse = req.body;
  // const courseIndex = COURSES.findIndex((e) => e.id == courseId);
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
    return res.status(500).json({
      message: "Error updating course",
      error: error.message,
    });
  }
});

app.get("/admin/courses", jwtAuthentication, async (req, res) => {
  // logic to get all courses
  const allCourses = await Course.find();
  // console.log(JSON.stringify(allCourses));

  return res.json(allCourses);
});

app.get("/admin/courses/:courseId", jwtAuthentication, async (req, res) => {
  const courseId = req.params.courseId;

  const getCourse = await Course.findOne({ courseId });
  if (getCourse) {
    return res.json(getCourse);
  } else {
    return res.json({ message: "course not found" });
  }
});
// User routes
app.post("/users/signup", async (req, res) => {
  // logic to sign up user
  let username = req.headers.username;
  let password = req.headers.password;

  if (!username || !password) {
    return res.status(403).send("Insufficicent Details");
  }
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(403).json({ message: "User already exists" });
  }
  const user = {
    username: username,
    password: password,
    coursePurchased: [],
  };
  const addUser = new User(user);
  await addUser.save();
  const token = generateJwt(addUser, SECRET_USER_KEY);
  return res.json({ message: "User Created Successfully", token: token });
});

app.post("/users/login", async (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;

  const user = await User.findOne({ username: username, password: password });
  if (user) {
    const token = generateJwt(user, SECRET_USER_KEY);
    return res.json({ message: "Logged in successfully", token });
  }
  return res.status(403).json({ message: "User authentication failed" });
});

app.get("/users/courses", jwtAuthentication, async (req, res) => {
  // logic to list all courses
  const allCourses = await Course.find();
  return res.json(allCourses);
});

app.post("/users/courses/:courseId", jwtAuthentication, async (req, res) => {
  const courseId = req.params.courseId;
  const username = req.user.username;

  const user = await User.findOne({ username });
  const course = await Course.findOne({ courseId });
  // console.log(user, course);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }
  if (user.coursePurchased.includes(courseId)) {
    return res.status(400).json({ message: "Course already purchased" });
  }

  // Add course to user's purchased courses
  user.coursePurchased.push(courseId);
  await user.save();

  return res.status(200).json({ message: "Course purchased successfully" });
});

app.get("/users/purchasedCourses", jwtAuthentication, async (req, res) => {
  const username = req.user.username;
  // console.log(username);

  const user = await User.findOne({ username: username });
  // console.log(user);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const purchasedCourseIds = user.coursePurchased;
  const purchasedCourses = await Course.find({
    courseId: { $in: purchasedCourseIds },
  });

  return res.status(200).json({ purchasedCourses });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
