require("dotenv").config();

const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const flash = require("connect-flash");

const usermodel = require("./models/user");
const postmodel = require("./models/post");
const upload = require("./config/multerconfig");

const app = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/index", (req, res) => {
  res.render("index");
});

app.post("/register", async (req, res) => {
  const existingUser = await usermodel.findOne({ email: req.body.email });
  if (existingUser) {
    req.flash("error", "User already registered. Please Login");
    return res.redirect("/login");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(req.body.password, salt);

  const createdUser = await usermodel.create({
    username: req.body.username,
    email: req.body.email,
    password: hash
  });

  const token = jwt.sign(
    { email: createdUser.email, userid: createdUser._id },
    process.env.JWT_SECRET
  );

  res.cookie("Token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  req.flash("success", "Account created successfully");
  res.redirect("/profile");
});

app.post("/login", async (req, res) => {
  const user = await usermodel.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  const result = await bcrypt.compare(req.body.password, user.password);
  if (!result) {
    req.flash("error", "Wrong password");
    return res.redirect("/login");
  }

  const token = jwt.sign(
    { email: user.email, userid: user._id },
    process.env.JWT_SECRET
  );

  res.cookie("Token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });

  req.flash("success", "Login successful");
  res.redirect("/profile");
});

app.get("/logout", (req, res) => {
  res.clearCookie("Token");
  req.flash("success", "Logged out successfully");
  res.redirect("/home");
});

app.get("/profile", isloggedin, async (req, res) => {
  const user = await usermodel
    .findOne({ email: req.user.email })
    .populate("posts");

  if (!user) {
    req.flash("error", "User not found. Please login again.");
    res.clearCookie("Token");
    return res.redirect("/login");
  }

  res.render("profile", { user });
});

app.get("/upload", isloggedin, (req, res) => {
  res.render("profileupload");
});

app.post("/upload", isloggedin, upload.single("image"), async (req, res) => {
  const user = await usermodel.findOne({ email: req.user.email });
  user.profilepic = req.file.filename;
  await user.save();
  req.flash("success", "Profile picture updated");
  res.redirect("/profile");
});

app.post("/post", isloggedin, async (req, res) => {
  const user = await usermodel.findOne({ email: req.user.email });
  const post = await postmodel.create({
    user: user._id,
    content: req.body.content
  });
  user.posts.push(post._id);
  await user.save();
  req.flash("success", "Post created");
  res.redirect("/profile");
});

app.get("/like/:id", isloggedin, async (req, res) => {
  const post = await postmodel.findById(req.params.id);
  const index = post.likes.indexOf(req.user.userid);

  if (index === -1) post.likes.push(req.user.userid);
  else post.likes.splice(index, 1);

  await post.save();
  res.redirect("/allUsers");
});

app.get("/edit/:id", isloggedin, async (req, res) => {
  const post = await postmodel.findById(req.params.id).populate("user");
  res.render("edit", { post });
});

app.post("/update/:id", isloggedin, async (req, res) => {
  await postmodel.findByIdAndUpdate(req.params.id, {
    content: req.body.content
  });
  req.flash("success", "Post updated");
  res.redirect("/profile");
});

app.get("/remove/:id", isloggedin, async (req, res) => {
  await postmodel.findByIdAndDelete(req.params.id);
  req.flash("success", "Post deleted");
  res.redirect("/profile");
});

app.get("/allUsers", isloggedin, async (req, res) => {
  const posts = await postmodel.find().populate("user").sort({ date: -1 });
  res.render("allUsers", {
    posts,
    loggedInUserId: req.user.userid
  });
});

app.get("/about",(req,res)=>{
    res.render("about");
})

app.get("/home",(req,res)=>{
    res.render("home");
})

app.get("/platform",(req,res)=>{
    res.render("platform");
})

function isloggedin(req, res, next) {
  if (!req.cookies.Token) {
    req.flash("error", "Please Login !!");
    return res.redirect("/login");
  }
  try {
    const data = jwt.verify(req.cookies.Token, process.env.JWT_SECRET);
    req.user = data;
    next();
  } catch (err) {
    req.flash("error", "Session expired. Please login !");
    res.clearCookie("Token");
    return res.redirect("/login");
  }
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
