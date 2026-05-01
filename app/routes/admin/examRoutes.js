const express = require('express');
const router = express.Router();
const ExamController = require('../../controllers/examController');
const { protect, authorize } = require('../../middleware/authMiddleware');

router.use(protect);
router.use(authorize('SuperAdmin', 'Examiner'));

router.get('/', ExamController.renderExamList);
router.get('/create', ExamController.renderCreateForm);
router.get('/edit/:id', ExamController.renderEditForm);

router.post('/create', ExamController.handleCreateExam);
router.post('/edit/:id', ExamController.handleUpdateExam);
router.post('/delete/:id', ExamController.handleDeleteExam);

module.exports = router;