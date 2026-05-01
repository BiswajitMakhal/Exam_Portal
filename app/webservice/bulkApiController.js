const User = require("../models/User");
const Question = require("../models/Question");
const Exam = require("../models/Exam");
const parseCSVBuffer = require("../utils/csvParser");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

class BulkApiController {
  async uploadBulkUsers(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Please upload a CSV file" });
      }

      const usersData = await parseCSVBuffer(req.file.buffer);

      if (usersData.length === 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "CSV file is empty or invalid format",
          });
      }

      const existingEmails = await User.find({ isDeleted: false }).distinct(
        "email",
      );
      const validUsersToInsert = [];

      const salt = await bcrypt.genSalt(10);
      const defaultPassword = await bcrypt.hash("Candidate@123", salt);

      for (let row of usersData) {
        if (row.email && !existingEmails.includes(row.email.toLowerCase())) {
          validUsersToInsert.push({
            name: row.name || "Unknown",
            email: row.email.toLowerCase(),
            password: row.password
              ? await bcrypt.hash(row.password, salt)
              : defaultPassword,
            role: "Candidate", 
          });
          existingEmails.push(row.email.toLowerCase());
        }
      }

      if (validUsersToInsert.length === 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "No new valid users found in CSV to insert",
          });
      }

      await User.insertMany(validUsersToInsert);

      res.status(201).json({
        success: true,
        message: `${validUsersToInsert.length} candidates uploaded successfully`,
        insertedCount: validUsersToInsert.length,
      });
    } catch (error) {
      logger.error(`Error in bulk upload users API: ${error.message}`);
      res
        .status(500)
        .json({ success: false, message: "Server Error during bulk upload" });
    }
  }

  async uploadBulkQuestions(req, res) {
    try {
      const examId = req.params.examId;

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Please upload a CSV file" });
      }

      const exam = await Exam.findOne({ _id: examId, isDeleted: false });
      if (!exam) {
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });
      }

      if (
        exam.examinerId.toString() !== req.user._id.toString() &&
        req.user.role !== "SuperAdmin"
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized for this exam" });
      }

      const questionsData = await parseCSVBuffer(req.file.buffer);
      const validQuestionsToInsert = [];

      for (let row of questionsData) {
        if (
          row.questionText &&
          row.option1 &&
          row.option2 &&
          row.correctOption
        ) {
          const options = [row.option1, row.option2];
          if (row.option3) options.push(row.option3);
          if (row.option4) options.push(row.option4);

          validQuestionsToInsert.push({
            examId: examId,
            questionText: row.questionText,
            options: options,
            correctOption: row.correctOption,
            marks: row.marks ? Number(row.marks) : 1,
          });
        }
      }

      if (validQuestionsToInsert.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No valid questions found in CSV" });
      }

      await Question.insertMany(validQuestionsToInsert);

      res.status(201).json({
        success: true,
        message: `${validQuestionsToInsert.length} questions uploaded successfully`,
        insertedCount: validQuestionsToInsert.length,
      });
    } catch (error) {
      logger.error(`Error in bulk upload questions API: ${error.message}`);
      res
        .status(500)
        .json({ success: false, message: "Server Error during bulk upload" });
    }
  }
}

module.exports = new BulkApiController();
