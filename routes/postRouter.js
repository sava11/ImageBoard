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
router.get("/:id",
    postController.getPostById
);
router.get("/delete/:id",
    postController.deletePostById
);
router.get("/edit/:id",
    userController.isAuthenticated,
    postController.editPostById
);

module.exports = router;
