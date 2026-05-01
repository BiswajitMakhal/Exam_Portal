const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/authController');
const validateRequest = require('../../middleware/validateRequest');
const { registerSchema, loginSchema, resetPasswordLinkSchema, resetPasswordSchema } = require('../../utils/authValidation');

// Page Routes 
router.get('/login', AuthController.renderLogin);
router.get('/logout', AuthController.handleLogout);
router.get('/forgot-password', AuthController.renderForgotPassword);
router.get('/reset-password/:id/:token', AuthController.renderResetPassword);
router.get('/register', AuthController.renderRegister);

router.post('/register', validateRequest(registerSchema), AuthController.handleRegister);
router.post('/login', validateRequest(loginSchema), AuthController.handleLogin);
router.post('/forgot-password', validateRequest(resetPasswordLinkSchema), AuthController.handleForgotPasswordLink);
router.post('/reset-password/:id/:token', validateRequest(resetPasswordSchema), AuthController.handleResetPassword);

module.exports = router;