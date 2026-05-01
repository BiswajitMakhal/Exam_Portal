const User = require("../models/User");
const Question = require("../models/Question");
const Exam = require("../models/Exam");
const parseCSVBuffer = require("../utils/csvParser");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

class BulkController {
  async handleBulkUsersForm(req, res) {
    try {
      if (!req.file) return res.redirect("/admin/users?error=NoFileUploaded");

      const usersData = await parseCSVBuffer(req.file.buffer);
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

      if (validUsersToInsert.length > 0) {
        await User.insertMany(validUsersToInsert);
        res.redirect(
          `/admin/users?success=${validUsersToInsert.length}UsersUploaded`,
        );
      } else {
        res.redirect("/admin/users?error=NoValidUsersFound");
      }
    } catch (error) {
      logger.error(`Bulk User Upload Error: ${error.message}`);
      res.redirect("/admin/users?error=ServerError");
    }
  }

  async handleBulkQuestionsForm(req, res) {
    try {
      const examId = req.params.examId;
      if (!req.file)
        return res.redirect(
          `/admin/questions/exam/${examId}?error=NoFileUploaded`,
        );

      const exam = await Exam.findOne({ _id: examId, isDeleted: false });
      if (
        !exam ||
        (exam.examinerId.toString() !== req.user._id.toString() &&
          req.user.role !== "SuperAdmin")
      ) {
        return res.redirect("/admin/exams?error=Unauthorized");
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

      if (validQuestionsToInsert.length > 0) {
        await Question.insertMany(validQuestionsToInsert);
        res.redirect(
          `/admin/questions/exam/${examId}?success=${validQuestionsToInsert.length}QuestionsUploaded`,
        );
      } else {
        res.redirect(
          `/admin/questions/exam/${examId}?error=NoValidQuestionsFound`,
        );
      }
    } catch (error) {
      logger.error(`Bulk Question Upload Error: ${error.message}`);
      res.redirect(
        `/admin/questions/exam/${req.params.examId}?error=ServerError`,
      );
    }
  }
}

module.exports = new BulkController();
