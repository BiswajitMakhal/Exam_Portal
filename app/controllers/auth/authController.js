const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../../utils/logger");
const sendEmail = require("../../utils/emailSender");

class AuthController {
  async renderRegister(req, res) {
    try {
      res.render("admin/auth/register", {
        title: "Create Account - Exam Portal",
        error: req.query.error,
        success: req.query.success,
      });
    } catch (error) {
      logger.error(`Render Register Error: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async handleRegister(req, res) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.redirect("/register?error=Passwords do not match");
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.redirect(
          "/register?error=Email already registered. Please login.",
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "Candidate",
      });

      res.redirect(
        "/login?success=Account created successfully. Please login.",
      );
    } catch (error) {
      logger.error(`Web Register Error: ${error.message}`);
      res.redirect("/register?error=Server Error occurred");
    }
  }
  async renderLogin(req, res) {
    try {
      res.render("admin/auth/login", {
        title: "Login - Exam Portal",
        error: req.query.error,
        success: req.query.success,
      });
    } catch (error) {
      logger.error(`Render Login Error: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async handleLogin(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email, isDeleted: false });
      if (!user) {
        return res.redirect("/login?error=Invalid Credentials");
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.redirect("/login?error=Invalid Credentials");
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "supersecretkey",
        {
          expiresIn: "1d",
        },
      );

      const options = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options);

      if (user.role === "SuperAdmin" || user.role === "Examiner") {
        res.redirect("/admin/dashboard");
      } else {
        res.redirect("/student/dashboard");
      }
    } catch (error) {
      logger.error(`Web Login Error: ${error.message}`);
      res.redirect("/login?error=Server Error");
    }
  }

  async handleLogout(req, res) {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.redirect("/login?success=Logged out successfully");
  }

  async renderForgotPassword(req, res) {
    try {
      res.render("admin/auth/forgot-password", {
        title: "Forgot Password",
        error: req.query.error,
        success: req.query.success,
      });
    } catch (error) {
      logger.error(`Render Forgot Password Error: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async handleForgotPasswordLink(req, res) {
    try {
      const { email } = req.body;
      if (!email)
        return res.redirect("/forgot-password?error=Email is required");

      const user = await User.findOne({ email, isDeleted: false });
      if (!user)
        return res.redirect("/forgot-password?error=Email does not exist");

      const secret = user._id + process.env.JWT_SECRET + user.password;
      const token = jwt.sign({ userID: user._id }, secret, {
        expiresIn: "20m",
      });

      const resetLink = `${req.protocol}://${req.get("host")}/reset-password/${user._id}/${token}`;

      await sendEmail({
        to: user.email,
        subject: "Password Reset Request - Exam Portal",
        html: `<p>Hello ${user.name},</p><p>Please <a href="${resetLink}">Click here</a> to reset your password. This link is valid for 20 minutes.</p>`,
      });

      res.redirect(
        "/forgot-password?success=Password reset link has been sent to your email.",
      );
    } catch (error) {
      logger.error(`Web Forgot Password Error: ${error.message}`);
      res.redirect("/forgot-password?error=Server Error occurred");
    }
  }

  async renderResetPassword(req, res) {
    try {
      const { id, token } = req.params;
      const user = await User.findOne({ _id: id, isDeleted: false });

      if (!user) return res.redirect("/login?error=User not found");

      const secret = user._id + process.env.JWT_SECRET + user.password;
      try {
        jwt.verify(token, secret);
      } catch (err) {
        return res.redirect("/login?error=Invalid or expired reset link");
      }

      res.render("admin/auth/reset-password", {
        title: "Reset Password",
        id,
        token,
        error: req.query.error,
      });
    } catch (error) {
      logger.error(`Render Reset Password Error: ${error.message}`);
      res.status(500).send("Server Error");
    }
  }

  async handleResetPassword(req, res) {
    try {
      const { password, confirmPassword } = req.body;
      const { id, token } = req.params;

      const user = await User.findOne({ _id: id, isDeleted: false });
      if (!user) return res.redirect("/login?error=User not found");

      const secret = user._id + process.env.JWT_SECRET + user.password;
      try {
        jwt.verify(token, secret);
      } catch (err) {
        return res.redirect("/login?error=Invalid or expired link");
      }

      if (!password || !confirmPassword || password !== confirmPassword) {
        return res.redirect(
          `/reset-password/${id}/${token}?error=Passwords do not match or are empty`,
        );
      }

      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);

      await User.findByIdAndUpdate(user._id, {
        $set: { password: newHashPassword },
      });

      res.redirect(
        "/login?success=Password has been reset successfully. Please log in.",
      );
    } catch (error) {
      logger.error(`Web Reset Password Error: ${error.message}`);
      res.redirect(
        `/reset-password/${req.params.id}/${req.params.token}?error=Server Error`,
      );
    }
  }
}

module.exports = new AuthController();
