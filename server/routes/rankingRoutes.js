const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getRanking } = require("../controllers/rankingController");

// Any logged-in user can view the leaderboard (it's a list of accounts that
// opted their own portfolio public) - not restricted to the account owners
// themselves.
router.get("/", authMiddleware, getRanking);

module.exports = router;
