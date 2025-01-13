const express = require("express");
const imageController = require("../controllers/imageController");
const userController = require("../controllers/userController");
const router = express.Router();

router.get("/", imageController.getSimpleImages);
router.get("/from-user/:id", imageController.getSimpleUserImages);

router.get("/:id", imageController.getImageById);
router.post(
  "/upload",
  userController.isAuthenticated, // Проверка авторизации
  imageController.uploadImage,
  imageController.saveImageData
);

router.get('/tags/search', imageController.getTags);

module.exports = router;
