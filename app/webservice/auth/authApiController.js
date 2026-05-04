const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../../utils/logger");
const sendEmail = require("../../utils/emailSender");

class AuthApiController {
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Please provide all fields" });
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "Candidate",
      });

      res.status(201).json({
        success: true,
        message: "Registration successful. Please log in.",
      });
    } catch (error) {
      logger.error(`API Register Error: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({
          success: false,
          message: "Please provide email and password",
        });

      const user = await User.findOne({ email, isDeleted: false });
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: "1d" },
      );
      res.status(200).json({ success: true, token, role: user.role });
    } catch (error) {
      logger.error(`API Login Error: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async logout(req, res) {
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }

  async resetPasswordLink(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email field is required" });
      }

      const user = await User.findOne({ email, isDeleted: false });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Email doesn't exist" });
      }

      // Secret = _id + JWT_SECRET + current password (single-use token)
      const secret = user._id + process.env.JWT_SECRET + user.password;
      const token = jwt.sign({ userID: user._id }, secret, {
        expiresIn: "20m",
      });

      const resetLink = `${process.env.FRONTEND_HOST}/account/reset-password-confirm/${user._id}/${token}`;

      // Clean utility function call
      await sendEmail({
        to: user.email,
        subject: "Password Reset Link - Exam Portal",
        html: `<p>Hello ${user.name},</p><p>Please <a href="${resetLink}">Click here</a> to reset your password. This link is valid for 20 minutes.</p>`,
      });

      res.status(200).json({
        success: true,
        message: "Password reset email sent. Please check your email.",
      });
    } catch (error) {
      logger.error(`Error in resetPasswordLink: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async resetPassword(req, res) {
    try {
      const { password, confirmPassword } = req.body;
      const { id, token } = req.params;

      const user = await User.findOne({ _id: id, isDeleted: false });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const secret = user._id + process.env.JWT_SECRET + user.password;

      try {
        jwt.verify(token, secret);
      } catch (err) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired link" });
      }

      if (!password || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "New Password and Confirm New Password are required",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "New Password and Confirm New Password don't match",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);

      await User.findByIdAndUpdate(user._id, {
        $set: { password: newHashPassword },
      });

      res
        .status(200)
        .json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      logger.error(`Error in resetPassword: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
}

module.exports = new AuthApiController();
