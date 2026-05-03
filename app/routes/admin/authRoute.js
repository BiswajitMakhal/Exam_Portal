const express = require('express');
const router = express.Router();
const rateLimit = require("express-rate-limit");

const AuthController = require('../../controllers/authController');
const validateRequest = require('../../middleware/validateRequest');
const { registerSchema, loginSchema, resetPasswordLinkSchema, resetPasswordSchema } = require('../../utils/authValidation');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: "Too many login attempts, please try again after 10 minutes.",
});

const forgotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Too many password reset requests, try again later.",
});

// Page Routes 
router.get('/', AuthController.renderLogin);
router.get('/login', AuthController.renderLogin);
router.get('/logout', AuthController.handleLogout);
router.get('/forgot-password', AuthController.renderForgotPassword);
router.get('/reset-password/:id/:token', AuthController.renderResetPassword);
router.get('/register', AuthController.renderRegister);

// Auth Actions
router.post('/register', validateRequest(registerSchema), AuthController.handleRegister);

router.post('/login',loginLimiter, validateRequest(loginSchema),AuthController.handleLogin);

router.post('/forgot-password',forgotLimiter, validateRequest(resetPasswordLinkSchema),AuthController.handleForgotPasswordLink);

router.post('/reset-password/:id/:token',validateRequest(resetPasswordSchema),AuthController.handleResetPassword);

module.exports = router;