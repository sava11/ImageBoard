const express = require("express");
const imageController = require("../controllers/advController");
const userController = require("../controllers/userController");
const router = express.Router();

router.post(
    "/upload",
    userController.isAuthenticated,
    imageController.uploadAdvImage,
    imageController.uploadAdvertisementImage
);

router.get(
    "/random",
    imageController.getRandomAdvertisementImage
);

router.get(
    "/:id",
    imageController.getAdvertisementImage
);


module.exports = router;
