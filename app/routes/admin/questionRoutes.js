const express = require('express');
const router = express.Router();
const QuestionController = require('../../controllers/questionController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadImage, uploadCSV } = require('../../middleware/multerUpload');

// Security
router.use(protect);
router.use(authorize('SuperAdmin', 'Examiner'));

// Routes
router.get('/exam/:examId', QuestionController.renderQuestionsList);

router.get('/create/:examId', QuestionController.renderCreateForm);

router.post('/create', uploadImage.single('image'), QuestionController.createQuestion);

router.get('/edit/:questionId', QuestionController.renderEditForm);

router.post('/edit/:questionId', uploadImage.single('image'), QuestionController.updateQuestion);

router.post('/delete/:questionId', QuestionController.deleteQuestion);

router.post('/bulk-upload/:examId', uploadCSV.single('csvFile'), QuestionController.bulkUploadQuestions);

module.exports = router;