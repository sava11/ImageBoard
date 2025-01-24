const express = require("express");
const postController = require("../controllers/postController");
const userController = require("../controllers/userController.js");
const router = express.Router();
router.post("/vote",
    userController.isAuthenticated,
    postController.vote
);
router.get("/upload",
    userController.isAuthenticated,
    postController.uploadPost
);

router.post(
    "/upload",
    userController.isAuthenticated, // Проверка авторизации
    postController.uploadImage,
    postController.savePostData
);

router.get("/:id",
    postController.getPostById
);
router.get("/delete/:id",
    userController.isAuthenticated,
    postController.deletePostById
);
router.get("/edit/:id",
    userController.isAuthenticated,
    postController.editPostById
);
router.get("/download/:id",
    userController.isAuthenticated,
    postController.download
);

module.exports = router;
