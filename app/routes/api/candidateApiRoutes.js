const express = require('express');
const router = express.Router();
const CandidateApiController = require('../../webservice/candidateApiController');
const { protect, authorize } = require('../../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Candidate
 *   description: Candidate exam APIs
 */

/**
 * @swagger
 * /api/candidate/exams:
 *   get:
 *     summary: Get all available exams for a candidate
 *     tags: [Candidate]
 *     responses:
 *       200:
 *         description: List of available exams
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/exams',
  protect,
  authorize('Candidate'),
  CandidateApiController.getAvailableExams
);

/**
 * @swagger
 * /api/candidate/submit:
 *   post:
 *     summary: Submit exam answers and calculate score
 *     tags: [Candidate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examId
 *               - answers
 *             properties:
 *               examId:
 *                 type: string
 *                 example: 665f1c2a9b1e8c0012abcd34
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - selectedOption
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       example: 665f1c2a9b1e8c0012abcd99
 *                     selectedOption:
 *                       type: string
 *                       example: Option A
 *     responses:
 *       200:
 *         description: Exam submitted and score calculated
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/submit',
  protect,
  authorize('Candidate'),
  CandidateApiController.submitExam
);

module.exports = router;