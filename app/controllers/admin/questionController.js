const csv = require("csvtojson");
const Question = require("../../models/Question");
const Exam = require("../../models/Exam");
const logger = require("../../utils/logger");
const uploadToCloudinary = require("../../utils/cloudinaryUpload");

class QuestionController {
  async renderQuestionsList(req, res) {
    try {
      const examId = req.params.examId;
      const exam = await Exam.findById(examId);

      if (!exam) {
        return res.redirect("/admin/exams?error=Exam not found");
      }

      const questions = await Question.find({ examId });

      res.render("admin/questions/list", {
        title: "Manage Questions",
        exam,
        questions,
        success: req.query.success,
        error: req.query.error,
      });
    } catch (error) {
      logger.error(`Error loading questions list: ${error.message}`);
      res.redirect("/admin/exams?error=Internal Server Error");
    }
  }

  async renderCreateForm(req, res) {
    try {
      const examId = req.params.examId;
      res.render("admin/questions/create", { title: "Add Question", examId });
    } catch (error) {
      res.redirect(
        `/admin/questions/exam/${req.params.examId}?error=Error loading form`,
      );
    }
  }

  async createQuestion(req, res) {
    try {
      const { examId, questionText, options, correctOption, marks } = req.body;

      let imageUrl = null;

      if (req.file) {
        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer,
          "exam_questions",
        );
        imageUrl = cloudinaryResult.secure_url;
      }

      await Question.create({
        examId,
        questionText,
        options: Array.isArray(options) ? options : [options],
        correctOption,
        marks,
        imageUrl,
      });

      res.redirect(
        `/admin/questions/exam/${examId}?success=Question added successfully`,
      );
    } catch (error) {
      logger.error(`Error creating question: ${error.message}`);
      res.redirect(
        `/admin/questions/exam/${req.body.examId}?error=Failed to add question`,
      );
    }
  }

  async renderEditForm(req, res) {
    try {
      const questionId = req.params.questionId;
      const question = await Question.findById(questionId);

      if (!question) {
        return res.redirect("/admin/exams?error=Question not found");
      }

      res.render("admin/questions/edit", { title: "Edit Question", question });
    } catch (error) {
      res.redirect("/admin/exams?error=Error loading edit form");
    }
  }

  async updateQuestion(req, res) {
    try {
      const questionId = req.params.questionId;
      const { examId, questionText, options, correctOption, marks } = req.body;

      let updateData = {
        questionText,
        options: Array.isArray(options) ? options : [options],
        correctOption,
        marks,
      };

      if (req.file) {
        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer,
          "exam_questions",
        );
        updateData.imageUrl = cloudinaryResult.secure_url;
      }

      await Question.findByIdAndUpdate(questionId, updateData);

      res.redirect(
        `/admin/questions/exam/${examId}?success=Question updated successfully`,
      );
    } catch (error) {
      logger.error(`Error updating question: ${error.message}`);
      res.redirect(
        `/admin/questions/exam/${examId || req.body.examId}?error=Failed to update question`,
      );
    }
  }

  async deleteQuestion(req, res) {
    try {
      const questionId = req.params.questionId;
      const { examId } = req.body;

      await Question.findByIdAndDelete(questionId);
      res.redirect(
        `/admin/questions/exam/${examId}?success=Question deleted successfully`,
      );
    } catch (error) {
      logger.error(`Error deleting question: ${error.message}`);
      res.redirect("back");
    }
  }
  async bulkUploadQuestions(req, res) {
    try {
      const examId = req.params.examId;

      if (!req.file) {
        return res.redirect(
          `/admin/questions/exam/${examId}?error=Please upload a CSV file`,
        );
      }

      let csvString = req.file.buffer.toString("utf8");

      csvString = csvString.replace(/^"|"$/g, "");
      csvString = csvString.trim();

      const jsonArray = await csv().fromString(csvString);

      const questionsToInsert = jsonArray
        .filter((row) => row.questionText && row.questionText.trim() !== "")
        .map((row) => ({
          examId: examId,
          questionText: row.questionText.trim(),
          options: [row.option1, row.option2, row.option3, row.option4].filter(
            Boolean,
          ),
          correctOption: row.correctOption ? row.correctOption.trim() : "",
          marks: Number(row.marks) || 1,
        }));

      if (questionsToInsert.length === 0) {
        return res.redirect(
          `/admin/questions/exam/${examId}?error=CSV is empty or invalid format`,
        );
      }

      await Question.insertMany(questionsToInsert);

      res.redirect(
        `/admin/questions/exam/${examId}?success=${questionsToInsert.length} Questions added successfully via CSV!`,
      );
    } catch (error) {
      logger.error(`Error in bulk upload: ${error.message}`);
      res.redirect(
        `/admin/questions/exam/${req.params.examId}?error=Failed to process CSV file`,
      );
    }
  }
}

module.exports = new QuestionController();
