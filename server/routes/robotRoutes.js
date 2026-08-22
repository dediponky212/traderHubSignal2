const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    createRobot,
    listRobots,
    getRobot,
    updateRobot,
    deleteRobot,
} = require("../controllers/robotController");

router.post("/", authMiddleware, createRobot);
router.get("/", authMiddleware, listRobots);
router.get("/:id", authMiddleware, getRobot);
router.patch("/:id", authMiddleware, updateRobot);
router.delete("/:id", authMiddleware, deleteRobot);

module.exports = router;
