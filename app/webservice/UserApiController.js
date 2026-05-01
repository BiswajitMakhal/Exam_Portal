const User = require("../models/User");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

class UserApiController {
  async getAllUsers(req, res) {
    try {
      const users = await User.find({ isDeleted: false }).select("-password");
      res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
      logger.error(`Error in getAllUsers API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async getUserById(req, res) {
    try {
      const user = await User.findOne({
        _id: req.params.id,
        isDeleted: false,
      }).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      logger.error(`Error in getUserById API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async createUser(req, res) {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
      });

      newUser.password = undefined;
      res
        .status(201)
        .json({
          success: true,
          data: newUser,
          message: "User created successfully",
        });
    } catch (error) {
      logger.error(`Error in createUser API: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { name, role } = req.body;
      const userId = req.params.id;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { name, role },
        { new: true, runValidators: true },
      ).select("-password");

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res
        .status(200)
        .json({
          success: true,
          data: updatedUser,
          message: "User updated successfully",
        });
    } catch (error) {
      logger.error(`Error in updateUser API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      const user = await User.findByIdAndUpdate(
        userId,
        { isDeleted: true },
        { new: true },
      );

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res
        .status(200)
        .json({
          success: true,
          message: "User deleted successfully (Soft Delete)",
        });
    } catch (error) {
      logger.error(`Error in deleteUser API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
}

module.exports = new UserApiController();
