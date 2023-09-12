const userModel = require("../models/universityUserModel");
const bcrypt = require("bcrypt");
const {
  isValidBody,
  isValidEmail,
  isValidObjectId,
  isValidPass,
  isValidPhone,
  isValidName,
} = require("../validations/validate");
const sessionModel = require("../models/sessionModel");
const moment = require("moment");

const createDean = async function (req, res) {
  try {
    const bodyData = req.body;

    /**  IF  BODY  IS   EMPTY */
    if (Object.keys(bodyData).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please fill input the details" });
    }

    /** DESTRUCTURING */
    const { name, email, phone, password } = bodyData;

    /** INPUT DATA VALIDATIONS */
    if (!isValidName(name)) {
      return res
        .status(400)
        .send({ status: false, message: "Name must be there" });
    }
    if (!isValidBody(email) || !isValidEmail(email)) {
      return res.status(400).send({
        status: false,
        message: "Please give a valid email",
      });
    }
    if (!isValidBody(phone) || !isValidPhone(phone)) {
      return res
        .status(400)
        .send({ status: false, message: "Please give a valid phone no" });
    }
    if (!isValidBody(password) || !isValidPass(password)) {
      return res.status(400).send({
        status: false,
        message: "Please give a valid password formate",
      });
    }

    /**  UNIQUENESS  VALIDATIONS  */
    const isUserExist = await userModel.findOne({
      $or: [{ email: email }, { phone: phone }],
    });
    if (isUserExist) {
      return res
        .status(400)
        .send({ status: false, message: "Use different Email or Phone no" });
    }

    /**  PASSWORD  HASHING SAVING IT */
    bodyData.password = await bcrypt.hash(password, 10);
    bodyData["department"] = "dean";
    const responseObj = new userModel();
    responseObj.name = name;
    responseObj.email = email;
    responseObj.password = password;
    responseObj.phone = phone;
    responseObj.slots = bodyData.slots;
    await userModel.create(bodyData);
    res.status(201).send({
      status: true,
      message: "Registered Successfully",
      data: responseObj,
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const bodyData = req.body;

    /**  IF  BODY  IS   EMPTY */
    if (Object.keys(bodyData).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Please fill input the details" });
    }

    /** DESTRUCTURING */
    const { name, email, phone, password } = bodyData;

    /** INPUT DATA VALIDATIONS */
    if (!isValidBody(name)) {
      return res
        .status(400)
        .send({ status: false, message: "Name must be there" });
    }
    if (!isValidBody(email) || !isValidEmail(email)) {
      return res.status(400).send({
        status: false,
        message: "Please give a valid email",
      });
    }
    if (!isValidBody(phone) || !isValidPhone(phone)) {
      return res
        .status(400)
        .send({ status: false, message: "Please give a valid phone no" });
    }
    if (!isValidBody(password) || !isValidPass(password)) {
      return res.status(400).send({
        status: false,
        message: "Please give a valid password formate",
      });
    }

    /**  UNIQUENESS  VALIDATIONS  */
    const isUserExist = await userModel.findOne({
      $or: [{ email: email }, { phone: phone }],
    });
    if (isUserExist) {
      return res
        .status(400)
        .send({ status: false, message: "Use different Email or Phone no" });
    }

    /**  PASSWORD  HASHING AND SAVING */
    bodyData.password = await bcrypt.hash(password, 10);
    bodyData["department"] = "student";

    const responseObj = {};
    responseObj["name"] = name;
    responseObj["email"] = email;
    responseObj["password"] = password;
    responseObj["phone"] = phone;

    await userModel.create(bodyData);
    res.status(201).send({
      status: true,
      message: "Registered Successfully",
      data: responseObj,
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const findAvailableSessionOfDean = async (req, res) => {
  try {
    /** Finding available slot */
    const result = await userModel.aggregate([
      {
        $unwind: "$slots",
      },
      {
        $match: {
          "slots.status": "available",
        },
      },
      {
        $group: {
          _id: "$_id",
          deanName: { $first: "$name" },
          slots: { $push: { slot: "$slots.slot", status: "$slots.status" } },
        },
      },
    ]);
    res
      .status(200)
      .send({ status: true, message: "Available slots", data: result });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const bookSlot = async (req, res) => {
  try {
    const bodyData = req.body;

    /** checking slot availability */
    const isSlotAvailable = await userModel.findOne({
      _id: bodyData.deanId,
      "slots.slot": bodyData.slot,
      "slots.status": "available",
    });
    if (!isSlotAvailable) {
      return res.status(400).send({
        status: false,
        message: "Slot not available or booked already, choose different slot",
      });
    }
    
    /** Booking session */
    const bookedSession = await sessionModel.create(bodyData);
    await userModel.findOneAndUpdate(
      {
        _id: bodyData.deanId,
        "slots.slot": bodyData.slot,
      },
      { $set: { "slots.$.status": "booked" } },
      { new: true }
    );
    res
      .status(201)
      .send({ status: true, message: "Session Booked", data: bookedSession });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const checkBookedSession = async (req, res) => {
  try {
    /** restriction for student */
    if (req.department == "student") {
      return res.status(400).send({
        status: false,
        message: "Students are not allowed to visit here ",
      });
    }
    /** finding booked slots */
    let bookedSession = await sessionModel.find(
      {
        deanId: req.loggedInUser,
        isDeleted: false,
        status: "pending",
      },
      { deanId: 1, bookedBy: 1, slot: 1, status: 1 }
    );
    /** filtering if slot time expired */
    const formate = "ddd h A";
    bookedSession = bookedSession.filter(
      (item) => moment(item.slot, formate).toDate() > new Date()
    );
    /** if slot not available  */
    if (bookedSession.length <= 0) {
      return res.status(200).send({
        status: true,
        message: "Seems you don't have any booked session",
      });
    }

    res.status(200).send({
      status: true,
      message: "All pending session",
      sessions: bookedSession,
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

const updateCompletedSession = async (req, res) => {
  try {
    const bodyData = req.body;
    const isDeanExist = await sessionModel.findById(bodyData.sessionId);
    if (isDeanExist.deanId != req.loggedInUser) {
      return res.status(401).send({
        status: false,
        message: "You are not allowed to update session",
      });
    }
    const update = await sessionModel.findOneAndUpdate(
      { _id: bodyData.sessionId, isDeleted: false },
      { status: "completed" },
      { new: true }
    );
    res.status(200).send({
      status: true,
      message: "Meeting updated successfully ",
      sessions: update,
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = {
  createDean,
  createStudent,
  findAvailableSessionOfDean,
  bookSlot,
  checkBookedSession,
  updateCompletedSession,
};
