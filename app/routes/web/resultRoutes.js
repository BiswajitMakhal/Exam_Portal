const express = require("express");
const router = express.Router();
const ResultController = require("../../controllers/admin/resultController");
const { protect, authorize } = require("../../middleware/authMiddleware");

router.use(protect);
router.use(authorize("SuperAdmin", "Examiner"));

router.get("/", ResultController.renderExamsList);

router.get("/:examId", ResultController.renderScoreboard);

module.exports = router;
