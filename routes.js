const express = require("express");
const router = express.Router();
const userController = require("./src/controllers/userController")
const MW = require("./src/auth/auth")


router.post("/register/dean", userController.createDean);
router.post("/register/student", userController.createStudent);

router.post("/login", MW.loginUser)
router.get("/session", MW.authentication , userController.findAvailableSessionOfDean)
router.post("/book", MW.authentication, userController.bookSlot)
router.get("/bookedsession", MW.authentication, userController.checkBookedSession)
router.patch("/session", MW.authentication, userController.updateCompletedSession)


module.exports = router