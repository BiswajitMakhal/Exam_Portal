const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/userController');
const { protect, authorize } = require('../../middleware/authMiddleware'); 

const { uploadCSV } = require('../../middleware/multerUpload');

router.use(protect);
router.use(authorize('SuperAdmin')); 

// Page Routes 
router.get('/', UserController.renderUserList);
router.get('/create', UserController.renderCreateForm);
router.get('/edit/:id', UserController.renderEditForm);

// Form Action 
router.post('/create', UserController.handleCreateUser);
router.post('/edit/:id', UserController.handleUpdateUser);
router.post('/delete/:id', UserController.handleDeleteUser); 
router.post('/bulk-upload', uploadCSV.single('csvFile'), UserController.bulkUploadUsers);

module.exports = router;