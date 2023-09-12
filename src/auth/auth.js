const validator = require("../validations/validate");
const userModel = require("../models/universityUserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginUser = async function (req, res) {
  try {
    const loginDetails = req.body;
    //  if body is empty
    if (Object.keys(loginDetails).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Enter Login Credentials" });
    }
    const { email, password } = loginDetails; // destructuring

    /** input validation */
    if (!validator.isValidBody(email) || !validator.isValidEmail(email)) {
      return res
        .status(400)
        .send({ status: false, message: "Email should be valid" });
    }
    if (!validator.isValidBody(password) || !validator.isValidPass(password)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter Password Should be valid" });
    }

    /** To check user registered or not */
    const isUserExist = await userModel.findOne({ email: email });
    if (!isUserExist) {
      return res.status(401).send({
        status: false,
        message: "Seems you are new to here, Register first",
      });
    }

    /** decoding for hashing password */
    const matchPass = await bcrypt.compare(password, isUserExist.password);
    if (!matchPass) {
      return res
        .status(400)
        .send({ status: false, message: "Entered wrong Email or Password " });
    }
    /** Token generation */
    const token = jwt.sign(
      {
        userId: isUserExist._id,
        department: isUserExist.department,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60,
      },
      process.env.TOKEN
    );
    res
      .status(200)
      .send({ status: true, message: "LoggedIn successfully", token: token });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const authentication = async function (req, res, next) {
  try {
    let token = req.headers.authorization;
    if (!token)
      return res.status(400).send({ status: false, message: "Login first" });
    token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, process.env.TOKEN, function (err, payload) {
      if (err) {
        return res
          .status(401)
          .send({ status: false, message: "Token Expired login again" });
      } else {
        req.loggedInUser = payload.userId;
        req.department = payload.department
        next();
      }
    });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { loginUser, authentication };
