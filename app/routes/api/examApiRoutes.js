const express = require("express");
const router = express.Router();
const ExamApiController = require("../../webservice/admin/examApiController");
const { protect, authorize } = require("../../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Exams
 *   description: Exam management APIs
 */

/**
 * @swagger
 * /api/exams:
 *   get:
 *     summary: Get all exams
 *     tags: [Exams]
 *     responses:
 *       200:
 *         description: List of active exams
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, ExamApiController.getAllExams);

/**
 * @swagger
 * /api/exams/{id}:
 *   get:
 *     summary: Get exam by ID
 *     tags: [Exams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Exam ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam details
 *       404:
 *         description: Exam not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", protect, ExamApiController.getExamById);

/**
 * @swagger
 * /api/exams:
 *   post:
 *     summary: Create a new exam
 *     tags: [Exams]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *                 example: JavaScript Basics Test
 *               description:
 *                 type: string
 *                 example: Basic JS concepts exam
 *               duration:
 *                 type: number
 *                 example: 60
 *               passingMarks:
 *                 type: number
 *                 example: 40
 *               status:
 *                 type: string
 *                 enum: [Draft, Active, Completed]
 *                 example: Draft
 *     responses:
 *       201:
 *         description: Exam created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  protect,
  authorize("SuperAdmin", "Examiner"),
  ExamApiController.createExam,
);

/**
 * @swagger
 * /api/exams/{id}:
 *   put:
 *     summary: Update an exam
 *     tags: [Exams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Exam ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: number
 *               passingMarks:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Draft, Active, Completed]
 *     responses:
 *       200:
 *         description: Exam updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Exam not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/:id",
  protect,
  authorize("SuperAdmin", "Examiner"),
  ExamApiController.updateExam,
);

/**
 * @swagger
 * /api/exams/{id}:
 *   delete:
 *     summary: Soft delete an exam
 *     tags: [Exams]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Exam ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exam deleted successfully
 *       404:
 *         description: Exam not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:id",
  protect,
  authorize("SuperAdmin", "Examiner"),
  ExamApiController.deleteExam,
);

module.exports = router;
