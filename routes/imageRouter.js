const express = require("express");
const imageController = require("../controllers/imageController");
const router = express.Router();

router.get("/", imageController.getSimpleImages);
router.get("/from-user/:id", imageController.getSimpleUserImages);

router.get("/:id", imageController.getImageById);

router.get('/tags/search', imageController.getTags);

module.exports = router;
