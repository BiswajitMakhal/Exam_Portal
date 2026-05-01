const express = require('express');
const router = express.Router();
const CandidateController = require('../../controllers/candidateController');
const { protect, authorize } = require('../../middleware/authMiddleware'); 

router.use(protect);
router.use(authorize('Candidate'));

router.get('/dashboard', CandidateController.renderDashboard);

router.get('/exam/live/:examId', CandidateController.renderLiveExam);
router.post('/exam/submit', CandidateController.submitExam);

router.get('/exam/success/:resultId', CandidateController.renderSuccess);

module.exports = router;