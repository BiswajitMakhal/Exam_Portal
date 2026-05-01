const express = require('express');
const router = express.Router();
const BulkApiController = require('../../webservice/bulkApiController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadCSV } = require('../../middleware/multerUpload');

/**
 * @swagger
 * tags:
 *   name: Bulk Upload
 *   description: Bulk upload APIs for users and questions
 */

/**
 * @swagger
 * /api/bulk/users:
 *   post:
 *     summary: Bulk upload candidates via CSV
 *     tags: [Bulk Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Users uploaded successfully
 *       400:
 *         description: Invalid file or data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/users',
  protect,
  authorize('SuperAdmin', 'Examiner'),
  uploadCSV.single('file'),
  BulkApiController.uploadBulkUsers
);

/**
 * @swagger
 * /api/bulk/questions/{examId}:
 *   post:
 *     summary: Bulk upload questions for an exam via CSV
 *     tags: [Bulk Upload]
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         description: Exam ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Questions uploaded successfully
 *       400:
 *         description: Invalid file or data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Exam not found
 */
router.post(
  '/questions/:examId',
  protect,
  authorize('SuperAdmin', 'Examiner'),
  uploadCSV.single('file'),
  BulkApiController.uploadBulkQuestions
);

module.exports = router;