const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
var fetchuser = require("../middleware/fetchuser");

const JWT_SECRET = "THISISTHEKEY";
//ROUTE 1: Create a user using:POST api/auth/createuser|dosen't require authentication
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Enter a valid password").isLength({ min: 5 }),
  ],
  async (req, res) => {
    //If there are errors , return bad request and the errors
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.send({ errors: result.array() });
    }
    //Check whether the user with this email exists already
    try {
      let user = await User.findOne({ email: req.body.email });
      console.log("existing email in DB--->", user);
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry this email already exists in DB" });
      }
      //Create a new user
      salt = await bcrypt.genSalt(10);
      secpassword = await bcrypt.hash(req.body.password, salt);
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secpassword,
      });

      const data = {
        user: {
          id: user.id,
        },
      };

      const authToken = jwt.sign(data, JWT_SECRET);
      console.log(authToken);
      res.json({ authToken });

      // .then((user) => {
      //   res.json(user);
      //   console.log("user create successfully");
      // })
      // .catch((err) => {
      //   console.log("error----->", err);
      //   res.json({ error: "Please enter a unique value for email" });
      // });
    } catch (error) {
      console.log(error);
      res.status(500).send("Some arror has occured");
    }
  }
);

//ROUTE 2: Authenticate a user using: POST api/auth/login
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "password cannot be blank").exists(),
  ],
  async (req, res) => {
    //If there are errors , return bad request and the errors
    const result = validationResult(req);
    try {
      if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
      }

      //comparing email & password
      const { email, password } = req.body;
      let user = await User.findOne({ email });
      if (!email) {
        return res
          .status(400)
          .json({ error: "Please enter the right credentials 1" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res
          .status(400)
          .json({ error: "Please enter the right credentials 2" });
      }
      const data = {
        user: {
          id: user.id,
        },
      };

      const authToken = jwt.sign(data, JWT_SECRET);
      console.log(authToken);
      res.json({ authToken });
    } catch (error) {
      console.log(error);
      res.status(500).send("Enternal server error");
    }
  }
);

//ROUTE 3: Get loggedin user details using : POST "api/auth/getuser". Login required

router.post("/getuser", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user);
  } catch (error) {
    console.log(error);
    res.status(500).send("Enternal server error");
  }
});
module.exports = router;
