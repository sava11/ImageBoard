const express = require("express");
const userController = require("../controllers/userController.js");
const router = express.Router();

router.get("/register", userController.registerForm);
router.post("/register", userController.register);

router.get("/login", userController.loginForm);
router.post("/login", userController.login);

router.get("/settings", userController.isAuthenticated, userController.userSettingsForm);
router.post("/settings", userController.isAuthenticated, userController.userSettings);

router.get("/:id", userController.user);
router.post("/edit", userController.isAuthenticated, userController.editUser);
router.post("/delete/:id", userController.isAuthenticated, userController.deleteUser);
router.post("/logout", userController.logout);


module.exports = router;
