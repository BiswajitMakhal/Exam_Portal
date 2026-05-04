const express = require("express");
const router = express.Router();
const ResultApiController = require("../../webservice/admin/resultApiController");
const { protect, authorize } = require("../../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Results & Analytics
 *   description: Exam results and leaderboard APIs
 */

/**
 * @swagger
 * /api/results/exam/{examId}:
 *   get:
 *     summary: Get leaderboard and results for a specific exam
 *     tags: [Results & Analytics]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         description: Exam ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leaderboard and results fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Only Admin/Examiner)
 *       404:
 *         description: Exam not found
 */
router.get(
  "/exam/:examId",
  protect,
  authorize("SuperAdmin", "Examiner"),
  ResultApiController.getExamResults,
);

module.exports = router;
