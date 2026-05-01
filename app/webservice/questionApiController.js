const Question = require("../models/Question");
const cloudinary = require("../config/cloudinary");
const uploadToCloudinary = require("../utils/cloudinaryUpload"); 
const logger = require("../utils/logger");

class QuestionApiController {
  async getQuestionsByExam(req, res) {
    try {
      const { examId } = req.params;
      const questions = await Question.find({ examId, isDeleted: false });
      res
        .status(200)
        .json({ success: true, count: questions.length, data: questions });
    } catch (error) {
      logger.error(`Error in getQuestionsByExam API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async createQuestion(req, res) {
    try {
      const { examId, questionText, options, correctOption, marks } = req.body;
      let imageUrl = null;
      let imagePublicId = null;

      if (req.file) {
        const result = await uploadToCloudinary(
          req.file.buffer,
          "exam_portal/questions",
        );
        imageUrl = result.secure_url;
        imagePublicId = result.public_id;
      }

      const newQuestion = await Question.create({
        examId,
        questionText,
        imageUrl,
        imagePublicId,
        options: JSON.parse(options),
        correctOption,
        marks,
      });

      res
        .status(201)
        .json({
          success: true,
          data: newQuestion,
          message: "Question created successfully",
        });
    } catch (error) {
      logger.error(`Error in createQuestion API: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateQuestion(req, res) {
    try {
      const questionId = req.params.id;
      const { questionText, options, correctOption, marks } = req.body;

      let question = await Question.findOne({
        _id: questionId,
        isDeleted: false,
      });
      if (!question) {
        return res
          .status(404)
          .json({ success: false, message: "Question not found" });
      }

      let updateData = {
        questionText,
        options: options ? JSON.parse(options) : question.options,
        correctOption,
        marks,
      };

      if (req.file) {
        if (question.imagePublicId) {
          await cloudinary.uploader.destroy(question.imagePublicId);
        }
        const result = await uploadToCloudinary(
          req.file.buffer,
          "exam_portal/questions",
        );
        updateData.imageUrl = result.secure_url;
        updateData.imagePublicId = result.public_id;
      }

      const updatedQuestion = await Question.findByIdAndUpdate(
        questionId,
        updateData,
        { new: true },
      );

      res
        .status(200)
        .json({
          success: true,
          data: updatedQuestion,
          message: "Question updated successfully",
        });
    } catch (error) {
      logger.error(`Error in updateQuestion API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async deleteQuestion(req, res) {
    try {
      const questionId = req.params.id;

      const question = await Question.findOne({
        _id: questionId,
        isDeleted: false,
      });
      if (!question) {
        return res
          .status(404)
          .json({ success: false, message: "Question not found" });
      }

      if (question.imagePublicId) {
        await cloudinary.uploader.destroy(question.imagePublicId);
      }

      await Question.findByIdAndUpdate(
        questionId,
        {
          isDeleted: true,
          imageUrl: null,
          imagePublicId: null,
        },
        { new: true },
      );

      res
        .status(200)
        .json({ success: true, message: "Question deleted successfully" });
    } catch (error) {
      logger.error(`Error in deleteQuestion API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
}

module.exports = new QuestionApiController();
