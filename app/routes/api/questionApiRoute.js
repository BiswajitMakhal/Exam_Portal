const express = require('express');
const router = express.Router({ mergeParams: true });
const QuestionApiController = require('../../webservice/questionApiController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadImage } = require('../../middleware/multerUpload');

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question management APIs
 */

/**
 * @swagger
 * /api/questions/exam/{examId}:
 *   get:
 *     summary: Get all questions for a specific exam
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         description: Exam ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of questions
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Exam not found
 */
router.get('/exam/:examId', protect, QuestionApiController.getQuestionsByExam);

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question (supports image upload)
 *     tags: [Questions]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - examId
 *               - questionText
 *               - options
 *               - correctOption
 *             properties:
 *               examId:
 *                 type: string
 *               questionText:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctOption:
 *                 type: string
 *               marks:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Question created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  protect,
  authorize('SuperAdmin', 'Examiner'),
  uploadImage.single('image'),
  QuestionApiController.createQuestion
);

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update a question (supports image update)
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Question ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               questionText:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               correctOption:
 *                 type: string
 *               marks:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Question updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
router.put(
  '/:id',
  protect,
  authorize('SuperAdmin', 'Examiner'),
uploadImage.single('image'),
  QuestionApiController.updateQuestion
);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Soft delete a question and remove image from Cloudinary
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Question ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 */
router.delete(
  '/:id',
  protect,
  authorize('SuperAdmin', 'Examiner'),
  QuestionApiController.deleteQuestion
);

module.exports = router;