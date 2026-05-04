const mongoose = require("mongoose");
const Exam = require("../../models/Exam");
const logger = require("../../utils/logger");

class ExamApiController {
  async getAllExams(req, res) {
    try {
      const exams = await Exam.aggregate([
        { $match: { isDeleted: false } },
        {
          $lookup: {
            from: "users",
            localField: "examinerId",
            foreignField: "_id",
            as: "examinerDetails",
          },
        },
        {
          $unwind: {
            path: "$examinerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            duration: 1,
            passingMarks: 1,
            status: 1,
            createdAt: 1,
            examinerId: 1,
            "examinerDetails.name": 1,
            "examinerDetails.email": 1,
          },
        },
      ]);

      res.status(200).json({ success: true, count: exams.length, data: exams });
    } catch (error) {
      logger.error(`Error in getAllExams API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async getExamById(req, res) {
    try {
      const examId = req.params.id;

      const exams = await Exam.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(examId),
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "examinerId",
            foreignField: "_id",
            as: "examinerDetails",
          },
        },
        {
          $unwind: {
            path: "$examinerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            duration: 1,
            passingMarks: 1,
            status: 1,
            createdAt: 1,
            examinerId: 1,
            "examinerDetails.name": 1,
            "examinerDetails.email": 1,
          },
        },
      ]);

      if (!exams || exams.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });
      }

      res.status(200).json({ success: true, data: exams[0] });
    } catch (error) {
      logger.error(`Error in getExamById API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async createExam(req, res) {
    try {
      const { title, description, duration, passingMarks, status } = req.body;

      const newExam = await Exam.create({
        title,
        description,
        duration,
        passingMarks,
        status,
        examinerId: req.user._id,
      });

      res.status(201).json({
        success: true,
        data: newExam,
        message: "Exam created successfully",
      });
    } catch (error) {
      logger.error(`Error in createExam API: ${error.message}`);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateExam(req, res) {
    try {
      const { title, description, duration, passingMarks, status } = req.body;
      const examId = req.params.id;

      let exam = await Exam.findOne({ _id: examId, isDeleted: false });
      if (!exam) {
        return res
          .status(404)
          .json({ success: false, message: "Exam not found" });
      }

      if (
        exam.examinerId.toString() !== req.user._id.toString() &&
        req.user.role !== "SuperAdmin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this exam",
        });
      }

      exam = await Exam.findByIdAndUpdate(
        examId,
        { title, description, duration, passingMarks, status },
        { new: true, runValidators: true },
      );

      res.status(200).json({
        success: true,
        data: exam,
        message: "Exam updated successfully",
      });
    } catch (error) {
      logger.error(`Error in updateExam API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }

  async deleteExam(req, res) {
    try {
      const examId = req.params.id;

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
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this exam",
        });
      }

      await Exam.findByIdAndUpdate(examId, { isDeleted: true }, { new: true });

      res.status(200).json({
        success: true,
        message: "Exam deleted successfully (Soft Delete)",
      });
    } catch (error) {
      logger.error(`Error in deleteExam API: ${error.message}`);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
}

module.exports = new ExamApiController();
