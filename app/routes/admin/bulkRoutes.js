const express = require('express');
const router = express.Router();
const BulkController = require('../../controllers/bulkController');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadCSV } = require('../../middleware/multerUpload');

router.use(protect);
router.use(authorize('SuperAdmin', 'Examiner'));

// Form Action Routes
router.post('/users', uploadCSV.single('file'), BulkController.handleBulkUsersForm);
router.post('/questions/:examId', uploadCSV.single('file'), BulkController.handleBulkQuestionsForm);

module.exports = router;